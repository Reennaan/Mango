import ctypes
import cloudscraper
from bs4 import BeautifulSoup
from plugins.base import BaseProvider
from pprint import pprint
import json
from pathlib import Path
import os
import re
import time
import sys
import img2pdf
from ebooklib import epub
import webbrowser
import logging
import random
import tempfile
import urllib.request
import importlib.util
from urllib.parse import parse_qsl, urlencode, urljoin, urlparse, urlunparse

if sys.platform.startswith("linux"):
    #Debug
    #os.environ["GDK_BACKEND"] = "x11"
    #os.environ["WEBKIT_DISABLE_COMPOSITING_MODE"] = "1"
    if not os.environ.get("QT_QPA_PLATFORM"):
        if os.environ.get("WAYLAND_DISPLAY") or os.environ.get("XDG_SESSION_TYPE") == "wayland":
            os.environ["QT_QPA_PLATFORM"] = "wayland"
        else:
            os.environ["QT_QPA_PLATFORM"] = "xcb"
    os.environ.setdefault("QT_QUICK_BACKEND", "software")
    os.environ.setdefault("QT_OPENGL", "software")
    os.environ.setdefault("LIBGL_ALWAYS_SOFTWARE", "1")
    os.environ.setdefault("QT_XCB_GL_INTEGRATION", "none")
    os.environ.setdefault("QTWEBENGINE_DISABLE_SANDBOX", "1")
    os.environ.setdefault("QTWEBENGINE_DISABLE_GPU", "1")
    os.environ.setdefault("QTWEBENGINE_DISABLE_GPU_COMPOSITING", "1")
    os.environ.setdefault(
        "QTWEBENGINE_CHROMIUM_FLAGS",
        "--no-sandbox --disable-gpu --disable-software-rasterizer --disable-gpu-compositing --disable-gpu-vsync",
    )

import webview
from fake_useragent import UserAgent
from packaging.version import InvalidVersion, Version
from platformdirs import user_data_dir
from webview2_runtime import ensure_webview2_runtime
from extension_manager import (
    load_all_providers,
    fetch_available_extensions,
    get_installed_extensions,
    install_extension,
    uninstall_extension,
    fetch_app_version
)

scraper = cloudscraper.create_scraper()

downloadFormat = "Download options"


IS_BUNDLED = "__compiled__" in globals() or getattr(sys, "frozen", False)

if "__compiled__" in globals():
    # Nuitka: o .exe fica dentro de mango2.dist/
    APP_BASE = Path(sys.executable).resolve().parent
    RESOURCE_BASE = APP_BASE
elif getattr(sys, "frozen", False):
    APP_BASE = Path(sys.executable).resolve().parent
    RESOURCE_BASE = Path(getattr(sys, "_MEIPASS", APP_BASE))
else:
    APP_BASE = Path(__file__).resolve().parent 
    RESOURCE_BASE = Path(__file__).resolve().parent.parent  



DATA_DIR = Path(user_data_dir("Mango"))
DATA_DIR.mkdir(parents=True, exist_ok=True)

currentFolder = str(DATA_DIR / "downloads")

log_file = DATA_DIR / "app.log"

logging.basicConfig(
    filename=log_file,
    level=logging.INFO,
    force=True
)
console = logging.StreamHandler(sys.stdout)
console.setLevel(logging.INFO)
logging.getLogger().addHandler(console)

recents = []
fav = []
collections = {}
currentVersion = "1.0.2"


def _normalize_version(value):
    return str(value or "").strip()


def _looks_like_installer_url(url):
    if not url:
        return False

    parsed = urlparse(str(url).strip())
    return parsed.scheme in {"http", "https"} and parsed.path.lower().endswith((".exe", ".msi"))


def _is_newer_version(candidate, current):
    candidate_text = _normalize_version(candidate)
    current_text = _normalize_version(current)

    if not candidate_text:
        return False

    try:
        return Version(candidate_text) > Version(current_text)
    except InvalidVersion:
        return candidate_text != current_text


def _build_update_info():
    payload = fetch_app_version()
    if not isinstance(payload, dict):
        return None

    latest_version = _normalize_version(payload.get("version"))
    if not _is_newer_version(latest_version, currentVersion):
        return None

    page_url = str(payload.get("url") or payload.get("page_url") or "").strip()
    download_url = str(payload.get("download_url") or "").strip()
    if not download_url and _looks_like_installer_url(page_url):
        download_url = page_url

    return {
        "version": latest_version,
        "url": page_url or download_url,
        "download_url": download_url,
        "auto_update": bool(os.name == "nt" and download_url),
    }


def _download_update_installer(url, version):
    safe_version = re.sub(r"[^0-9A-Za-z._-]+", "-", _normalize_version(version) or "latest")
    suffix = Path(urlparse(url).path).suffix or ".exe"
    destination = Path(tempfile.gettempdir()) / f"Mango-Setup-{safe_version}{suffix}"
    logging.info("downloading app update from %s to %s", url, destination)

    request = urllib.request.Request(
        url,
        headers={"User-Agent": f"Mango/{currentVersion} updater"},
    )

    with urllib.request.urlopen(request, timeout=120) as response:
        with destination.open("wb") as installer_file:
            while True:
                chunk = response.read(1024 * 256)
                if not chunk:
                    break
                installer_file.write(chunk)

    return destination


def _validate_downloaded_installer(installer_path):
    if not installer_path.exists():
        raise RuntimeError("installer file was not created")

    file_size = installer_path.stat().st_size
    logging.info("downloaded installer size: %s bytes", file_size)
    if file_size < 1024:
        raise RuntimeError("downloaded installer is too small")

    with installer_path.open("rb") as installer_file:
        header = installer_file.read(8)

    suffix = installer_path.suffix.lower()
    if suffix == ".exe" and not header.startswith(b"MZ"):
        raise RuntimeError("downloaded file is not a valid Windows executable")

    if suffix == ".msi" and header != b"\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1":
        raise RuntimeError("downloaded file is not a valid MSI installer")


def _launch_update_installer(installer_path):
    suffix = installer_path.suffix.lower()
    logging.info("launching update installer: %s", installer_path)

    if suffix == ".msi":
        file_path = "msiexec"
        parameters = f'/i "{installer_path}"'
    else:
        file_path = str(installer_path)
        parameters = None

    result = ctypes.windll.shell32.ShellExecuteW(
        None,
        "open",
        file_path,
        parameters,
        None,
        1,
    )
    if result <= 32:
        raise RuntimeError(f"failed to launch installer (ShellExecute code {result})")
    logging.info("installer launch accepted by ShellExecute with code %s", result)

class Api:
    def __init__(self):
        self.pending_download = None
        self.currentFolder = currentFolder
        self.downloadFormat = downloadFormat
        self.mangadex_language = "en"
        self.recents = recents
        self.fav = fav
        self.collections = collections
        self._update_in_progress = False
        self._scraper = cloudscraper.create_scraper()  
        self._settings_file = APP_BASE / ".settings.json"
        self.providers ={
            p.name: p for p in load_all_providers()
        }
        frist = next(iter(self.providers.values()),None)
        self.currentProvider = frist

        self._load_settings()



    def _load_settings(self):
        if not self._settings_file.exists():
            return
        try: 
            data = json.loads(self._settings_file.read_text(encoding="utf-8"))
            saved_folder = data.get("currentFolder")
            if isinstance(saved_folder, str) and saved_folder.strip():
                self.currentFolder = saved_folder
            saved_format = data.get("downloadFormat")
            if isinstance(saved_format, str) and saved_format.strip():
                self.downloadFormat = saved_format
                #print(f"current format: {self.downloadFormat}")
                logging.info(f"current format: {self.downloadFormat}")
            saved_mangadex_language = data.get("mangadexLanguage")
            if isinstance(saved_mangadex_language, str) and saved_mangadex_language.strip():
                self.mangadex_language = saved_mangadex_language.strip()
            saved_recents = data.get("recents")
            if isinstance(saved_recents, list) and len(saved_recents) > 0:
                #print("aparentemente salvou os recents")                
                self.recents = saved_recents

            fav = data.get("fav")
            if isinstance(fav, list) and len(fav) > 0:
                print("fav salvo")                
                self.fav = fav

            saved_collections = data.get("collections")
            if isinstance(saved_collections, dict):
                normalized_collections = {}
                for name, items in saved_collections.items():
                    if not isinstance(name, str):
                        continue

                    normalized_name = self._normalize_collection_name(name)
                    if not normalized_name:
                        continue

                    normalized_collections[normalized_name] = (
                        items if isinstance(items, list) else []
                    )

                self.collections = normalized_collections

        except Exception as e:
            print(f"failed to load settings: {e}")
            logging.error(f"failed to load settings: {e}")
            window.evaluate_js(f"showToast('ailed to load settings: {e}')")

    def _save_settings(self):
        try:
            data = {
            "currentFolder": self.currentFolder,
            "downloadFormat": self.downloadFormat,
            "mangadexLanguage": self.mangadex_language,
            "recents": self.recents,
            "fav":self.fav,
            "collections": self.collections
            }
            
          
            self._settings_file.write_text(
                json.dumps(data, ensure_ascii=False, indent=2),
                encoding="utf-8"
            )



        except Exception as e:
            print(f"failed to save settings: {e}")
            logging.error(f"failed to save settings: {e}")
            window.evaluate_js(f"showToast('failed to save settings: {e}')")

    


    def changeProvider(self, name):
        print(f"changeProvider chamado com: '{name}'")
        print(f"providers disponíveis: {list(self.providers.keys())}")
        logging.info(f"changeProvider chamado com: '{name}'")
        logging.info(f"providers disponíveis: {list(self.providers.keys())}")
        
        if name in self.providers:
            self.currentProvider = self.providers[name]
            self._apply_mangadex_language_to_provider(self.currentProvider)
            print(f"trocado para: {self.currentProvider}") 
            return
        
        for key, provider in self.providers.items():
            if key.lower() == name.lower() or getattr(provider, 'id', '').lower() == name.lower():
                self.currentProvider = provider
                self._apply_mangadex_language_to_provider(self.currentProvider)
                print(f"trocado para (fallback): {self.currentProvider}")
                return
        print(f"[changeProvider] provider '{name}' não encontrado. Disponíveis: {list(self.providers.keys())}")
        logging.info(f"[changeProvider] provider '{name}' não encontrado. Disponíveis: {list(self.providers.keys())}")
        window.evaluate_js(f"showToast('{name} Not found. Make sure that the source is installed')")

    def changeFormat(self,name):
        self.downloadFormat = name

    def set_mangadex_language(self, language):
        if not isinstance(language, str) or not language.strip():
            return False

        self.mangadex_language = language.strip().lower()
        self._apply_mangadex_language_to_provider(self.providers.get("MangaDex"))
        self._save_settings()
        return True

    def _apply_mangadex_language_to_provider(self, provider):
        if not provider or getattr(provider, "name", "") != "MangaDex":
            return

        try:
            provider.language = self.mangadex_language
        except Exception:
            pprint("[APPLY MANGADEX LANGUAGE] was not possible set language to mangadex")
            pass

    def _apply_mangadex_language_to_url(self, url):
        if not isinstance(url, str) or "mangadex.org" not in url:
            return url

        parsed = urlparse(url)
        query_items = [(key, value) for key, value in parse_qsl(parsed.query, keep_blank_values=True) if key != "translatedLanguage[]"]
        query_items.append(("translatedLanguage[]", self.mangadex_language))
        return urlunparse(parsed._replace(query=urlencode(query_items, doseq=True)))

    def _apply_mangadex_language_to_results(self, mangas):
        if getattr(self.currentProvider, "name", "") != "MangaDex":
            return mangas

        if not isinstance(mangas, list):
            return mangas

        normalized_results = []
        for manga in mangas:
            if isinstance(manga, dict):
                manga_copy = dict(manga)
                manga_copy["link"] = self._apply_mangadex_language_to_url(manga_copy.get("link"))
                normalized_results.append(manga_copy)
            else:
                normalized_results.append(manga)

        return normalized_results

    def getFormat(self):
        return self.downloadFormat 

    def getRecents(self):
        return self.recents
    
    def getFav(self):
        return self.fav

    def getCollectionsData(self):
        return json.dumps(
            {
                "favorites": self.fav,
                "collections": self.collections,
            },
            ensure_ascii=False,
        )

    def createCollection(self, name):
        normalized_name = self._normalize_collection_name(name)
        if not normalized_name:
            return json.dumps({"ok": False, "message": "invalid folder name"})

        if normalized_name.casefold() == "favorites":
            return json.dumps({"ok": False, "message": "Favorites already exists"})

        existing_name = self._find_collection_name(normalized_name)
        if existing_name:
            return json.dumps({"ok": False, "message": "folder already exists"})

        self.collections[normalized_name] = []
        self._save_settings()
        return json.dumps(
            {"ok": True, "message": f"{normalized_name} created", "name": normalized_name},
            ensure_ascii=False,
        )
    
    def editCollection(self, name, newName):
        old_normalized = self._normalize_collection_name(name)
        new_normalized = self._normalize_collection_name(newName)

        if not new_normalized:
            return json.dumps({"ok": False, "message": "Invalid folder name"})
        
        if new_normalized.casefold() == "favorites":
            return json.dumps({"ok": False, "message": "Cannot rename to Favorites"})

        if old_normalized not in self.collections:
            return json.dumps({"ok": False, "message": "Folder not found"})

    
        if new_normalized != old_normalized and self._find_collection_name(new_normalized):
            return json.dumps({"ok": False, "message": "New folder name already exists"})

      
        items = self.collections.pop(old_normalized)
        self.collections[new_normalized] = items

        
        self._save_settings()

        return json.dumps(
            {"ok": True, "message": "Folder renamed", "name": new_normalized},
            ensure_ascii=False,
        )

    def deleteCollection(self, name):
        existing_name = self._find_collection_name(name)
        if not existing_name:
            return json.dumps({"ok": False, "message": "folder not found"})

        self.collections.pop(existing_name, None)
        self._save_settings()
        return json.dumps(
            {"ok": True, "message": f"{existing_name} deleted"},
            ensure_ascii=False,
        )

    def addToCollection(self, name, manga):
        existing_name = self._find_collection_name(name)
        if not existing_name:
            return json.dumps({"ok": False, "message": "folder not found"})

        parsed_manga = self._parse_manga_payload(manga)
        if not parsed_manga:
            return json.dumps({"ok": False, "message": "invalid manga"})

        collection = self.collections.setdefault(existing_name, [])
        if any(item.get("link") == parsed_manga.get("link") for item in collection):
            return json.dumps(
                {"ok": False, "message": f"{parsed_manga.get('title', 'Manga')} is already in {existing_name}"},
                ensure_ascii=False,
            )

        collection.append(self._enrich_manga_with_icon(parsed_manga))
        self._save_settings()
        return json.dumps(
            {"ok": True, "message": f"{parsed_manga.get('title', 'Manga')} added to {existing_name}"},
            ensure_ascii=False,
        )

    def removeFromCollection(self, name, manga_link):
        existing_name = self._find_collection_name(name)
        if not existing_name:
            return json.dumps({"ok": False, "message": "folder not found"})

        if not isinstance(manga_link, str) or not manga_link.strip():
            return json.dumps({"ok": False, "message": "invalid manga"})

        collection = self.collections.setdefault(existing_name, [])
        initial_size = len(collection)
        self.collections[existing_name] = [
            item for item in collection if item.get("link") != manga_link
        ]

        if len(self.collections[existing_name]) == initial_size:
            return json.dumps({"ok": False, "message": "manga not found"})

        self._save_settings()
        return json.dumps(
            {"ok": True, "message": f"removed from {existing_name}"},
            ensure_ascii=False,
        )

    def _normalize_collection_name(self, name):
        if not isinstance(name, str):
            return ""

        normalized = re.sub(r"\s+", " ", name).strip()
        return normalized[:40]

    def _find_collection_name(self, name):
        normalized_name = self._normalize_collection_name(name)
        if not normalized_name:
            return None

        for existing_name in self.collections.keys():
            if existing_name.casefold() == normalized_name.casefold():
                return existing_name

        return None

    def _parse_manga_payload(self, payload):
        if isinstance(payload, dict):
            return payload

        if isinstance(payload, str):
            try:
                parsed = json.loads(payload)
                return parsed if isinstance(parsed, dict) else None
            except json.JSONDecodeError:
                return None

        return None

    def _enrich_manga_with_icon(self, manga):
        manga_copy = dict(manga)
        ext = fetch_available_extensions()
        icon = ""
        for item in ext:
            if item["name"] == manga_copy.get("currentSource"):
                icon = item["icon"]
                break

        manga_copy["icon"] = icon
        return manga_copy

    def version_check(self):
        update_info = _build_update_info()
        if not update_info:
            return ""

        return json.dumps(update_info, ensure_ascii=False)

    def start_app_update(self):
        if self._update_in_progress:
            return json.dumps(
                {"ok": False, "message": "update already in progress"},
                ensure_ascii=False,
            )

        update_info = _build_update_info()
        if not update_info:
            return json.dumps(
                {"ok": False, "message": "you already have the latest version"},
                ensure_ascii=False,
            )

        fallback_url = update_info.get("url")
        download_url = update_info.get("download_url")

        if os.name != "nt" or not download_url:
            if fallback_url:
                webbrowser.open(fallback_url)
            return json.dumps(
                {
                    "ok": False,
                    "message": "automatic update is not available for this release",
                    "url": fallback_url,
                },
                ensure_ascii=False,
            )

        try:
            self._update_in_progress = True
            installer_path = _download_update_installer(download_url, update_info.get("version"))
            _validate_downloaded_installer(installer_path)
            _launch_update_installer(installer_path)
            return json.dumps(
                {
                    "ok": True,
                    "message": f"installer opened for v{update_info['version']}",
                    "close_app": True,
                },
                ensure_ascii=False,
            )
        except Exception as exc:
            logging.exception("failed to start automatic update")
            self._update_in_progress = False

            if fallback_url and fallback_url != download_url:
                try:
                    webbrowser.open(fallback_url)
                except Exception:
                    logging.exception("failed to open manual update page")

            return json.dumps(
                {
                    "ok": False,
                    "message": f"failed to start automatic update: {exc}",
                    "url": fallback_url,
                },
                ensure_ascii=False,
            )
        
    def open_external(self, url):
        webbrowser.open(url)       

    def close_app(self):
        window.destroy()
        return True
        

    def genericFetch(self):
        pprint(self.currentProvider)
        if self.currentProvider == "Select the source":
            with open('.settings.json','r',encoding="utf-8") as f:
                manga = json.load(f)
                for mangas in manga:
                    jsCall = f"window.buildMangaInfo({json.dumps(manga)})"
                    window.evaluate_js(jsCall)
        else:
            self._apply_mangadex_language_to_provider(self.currentProvider)
            mangas = self._apply_mangadex_language_to_results(self.currentProvider.fetch_home())
            for i in range(0,10):
                jsCall = f"window.buildMangaInfo({json.dumps(mangas[i])})"
                window.evaluate_js(jsCall)

    def search_mango(self,name):
        self._apply_mangadex_language_to_provider(self.currentProvider)
        mangas = self._apply_mangadex_language_to_results(self.currentProvider.search_mango(name))


        #print(len(mangas))

        #print(mangas)
        window.evaluate_js("document.getElementById('library-container').innerHTML = '';")
        window.evaluate_js("changeShowText('Results:');")


        for manga in mangas: 
            jsCall = f"window.buildMangaInfo({json.dumps(manga)})"  
            
            window.evaluate_js(jsCall)

        #window.evaluate_js("showToast('aqui')")
        

    def genericGetDetails(self, manga):
        provider_name = getattr(self.currentProvider, "name", self.currentProvider.__class__.__name__)
        manga_title = manga.get("title", "") if isinstance(manga, dict) else ""
        logging.info("[chapters] loading title=%r provider=%s", manga_title, provider_name)

        try:
            if self.currentProvider.__class__.__name__ == "MangaDex":
                details = self.currentProvider.get_details(manga)
            else:
                manga_url = urljoin(
                    getattr(self.currentProvider, "baseUrl", ""),
                    manga.get("link", ""),
                )
                details = self.currentProvider.get_details(manga_url)
        except Exception as exc:
            logging.exception("[chapters] provider failed title=%r provider=%s", manga_title, provider_name)
            print(f"[genericGetDetails] error: {exc}")
            return False

        if isinstance(details, list):
            chapter_data = details[0] if details else {}
        elif isinstance(details, dict):
            chapter_data = details
        else:
            logging.error("[chapters] invalid provider response type=%s provider=%s", type(details).__name__, provider_name)
            return False

        chapter_links = chapter_data.get("chaptersLinks", [])
        provider_base_url = getattr(self.currentProvider, "baseUrl", "")
        if isinstance(chapter_links, list):
            chapter_links = [urljoin(provider_base_url, link) for link in chapter_links]

        self.pending_download = {
            "chapters": chapter_data.get("chapters", []),
            "img": manga.get("cover"),
            "title": manga.get("title"),
            "author": chapter_data.get("author", ""),
            "chaptersLinks": chapter_links,
            "desc": chapter_data.get("desc", [])

        }
        logging.info(
            "[chapters] loaded title=%r provider=%s count=%d links=%d",
            manga_title,
            provider_name,
            len(self.pending_download["chapters"]),
            len(self.pending_download["chaptersLinks"]),
        )
        return True
    

    def genericDownload(self, manga, chapterIndex):
        
        pprint(manga["chaptersLinks"])

        pageList = self.currentProvider.get_pages(manga["chaptersLinks"])
        
        logging.error("[GenericDownload] páginas encontrada:  %s", pageList)
        ua = UserAgent()
        fakeUa = ua.random


        if self.currentProvider.__class__.__name__ == "AnimePlanet":
            referer = "https://www.anime-planet.com/"
            session_cookies = scraper.cookies.get_dict()
        
            # esta linha monta o cookie do dominio anterior (anime-planet) para cnd (cnd.anime-planet) pois é necessário aplicar o cookie manualmente
            cookie_header = "; ".join([f"{k}={v}" for k, v in session_cookies.items()])
            # o scraper conseguia esse cookie no dominio principal mas não o enviava ao CDN por serem subdomínios diferentes.
            headers = {
                "Referer": referer,
                "User-Agent": fakeUa,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
                "sec-ch-ua": '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": '"Windows"',
                "sec-fetch-dest": "document",
                "sec-fetch-mode": "navigate",
                "sec-fetch-site": "none",
                "sec-fetch-user": "?1",
                "upgrade-insecure-requests": "1",
                "Cookie": cookie_header,  # aqui eu injetei cf_clearance no cdn
            }
            
        else:
            referer = manga["chaptersLinks"]
            headers = {
                "Referer": referer, 
                "User-Agent": fakeUa,
                "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Connection": "keep-alive"
            }

        #local_scraper = cloudscraper.create_scraper()

        filterChar = r'[<>:"/\\|?*]'
        filteredName = re.sub(filterChar, "_", manga["title"])
        filteredChapter = re.sub(filterChar, "_", str(manga["chapters"]))


        basePath = self.currentFolder
        folderName = f"{filteredName}"
        fullPath = os.path.join(basePath,folderName,filteredChapter)

        os.makedirs(fullPath, exist_ok=True)

        if self.downloadFormat == "PDF":
            self.downloadPDF(headers,folderName,fullPath,pageList)
        elif self.downloadFormat == "EPUB":
            self.downloadEPUB(headers,folderName,fullPath,pageList)
        else:
            for i, item in enumerate(pageList):
                print(f"baixando pagina {i}")
                images = self._scraper.get(item, headers=headers)
                filePath = os.path.join(fullPath,f"{i+1}.jpg")
                time.sleep(1)
                with open(filePath, "wb") as f:
                    f.write(images.content)
                
            return ""
    


    def downloadPDF(self, headers,folderName, fullPath, pageList):
        local_scraper = cloudscraper.create_scraper()
        imageBytes = []

        if not pageList:
            logging.error("Nenhuma página encontrada para %s", pageList)
            return "erro: sem páginas"

        for i, item in enumerate(pageList):
            print(f"baixando pagina {i} PDF")
            images = local_scraper.get(item, headers=headers)
            time.sleep(1)
            imageBytes.append(images.content)

        with open(os.path.join(fullPath,f"{folderName}.pdf"), "wb") as f:
            f.write(img2pdf.convert(*imageBytes))
            time.sleep(random.uniform(1.5,3))

        return "baixei em pdf"



    def downloadEPUB(self, headers, folderName, fullPath, pageList):
        local_scraper = cloudscraper.create_scraper()

        book = epub.EpubBook()
        book.set_identifier(folderName)
        book.set_title(folderName)
        book.set_language("pt-BR")
        chapter = epub.EpubHtml(title=folderName, file_name="chapter.xhtml", lang="pt-BR")
        chapterContent = [f"<h1>{folderName}</h1>"]

        for i, item in enumerate(pageList):
            print(f"baixando pagina {i} EPUB")
            images = local_scraper.get(item, headers=headers)
            imgName = f"image_{i+1}.jpg"
            img = epub.EpubItem(
                uid=f"img_{i+1}",
                file_name=imgName,
                media_type="image/jpeg",
                content=images.content
            )
            book.add_item(img)
            chapterContent.append(f'<p><img src="{imgName}" alt="page {i+1}" /></p>')
            time.sleep(random.uniform(1.5,3))

        chapter.content = "".join(chapterContent)
        book.add_item(chapter)
        book.toc = (epub.Link("chapter.xhtml", folderName, "chapter"),)
        book.add_item(epub.EpubNcx())
        book.add_item(epub.EpubNav())
        book.spine = ["nav", chapter]

        epub.write_epub(os.path.join(fullPath, f"{folderName}.epub"), book, {})

        return "baixei em EPUB"    


    def getPendingDownloadData(self):
        return self.pending_download
        
    
 

    def selectFolder(self):
        
        folder = window.create_file_dialog(webview.FileDialog.FOLDER)
        if folder:
            self.currentFolder = folder[0] if isinstance(folder, (list, tuple)) else folder
            self._save_settings()
            print(f"current folder: {self.currentFolder}")
            return self.currentFolder
        return None     
    




    def backgroundManga(self,name):
        query = """
        query ($search: String) {
        Page(page: 1, perPage: 1) {
            media(search: $search, type: MANGA) {
            title {
                romaji
            }
            coverImage {
                extraLarge
            }
            bannerImage
            }
        }
        }
        """

        try:
            response = self._scraper.post(
                "https://graphql.anilist.co",
                json={
                    "query": query,
                    "variables": {"search": name}
                },
                timeout=15,
            )
            response.raise_for_status()
            payload = response.json()
        except Exception as exc:
            logging.warning("[background] AniList request failed title=%r: %s", name, exc)
            return None

        media = ((payload.get("data") or {}).get("Page") or {}).get("media") or []
        if payload.get("errors"):
            logging.warning("[background] AniList returned errors title=%r: %s", name, payload["errors"])

        if not media:
            logging.info("[background] no AniList result title=%r", name)
            return None

        cover = media[0]["coverImage"]["extraLarge"]
        banner = media[0]["bannerImage"]

        return cover



    def get_extensions_page_data(self):
        available  = fetch_available_extensions()
        installed  = get_installed_extensions()
        for ext in available:
            ext["is_installed"] = ext["id"] in installed
        return json.dumps({"available": available, "installed": installed})



    def install_extension(self, ext_json):
        ext = json.loads(ext_json)
        ok, msg = install_extension(ext)
        if ok:
            p = load_all_providers()
            self.providers = {x.name: x for x in p}
        return json.dumps({"ok": ok, "message": msg})





    def uninstall_extension(self, ext_id):
        ok, msg = uninstall_extension(ext_id)
        if ok:
            self.providers.pop(
                next((k for k,v in self.providers.items()
                      if getattr(v,"id",None)==ext_id), None), None)
        return json.dumps({"ok": ok, "message": msg})




    def saveRecentCache(self,manga):

        if not self._settings_file.exists():
           data = {
               "currentFolder": "",
               "downloadFormat": "",
               "recents": [],
               "fav":[],
               "collections": {}
           }
           self._settings_file.write_text(
                   json.dumps(data,ensure_ascii=False, indent=2),
                   encoding="utf-8"
               )


        if any(item["link"] == manga["link"] for item in self.recents):
            return
        
        ext = fetch_available_extensions()
        icon = ""
        for item in ext:
            if item["name"] == manga["currentSource"]:
                icon = item["icon"]

        manga["icon"] = icon
        recent = manga
        self.recents.append(recent)

        if len(self.recents) > 10:
            self.recents.pop(0)
       
                
        self._save_settings()
       
        
    def saveFav(self, data):

        if hasattr(data, 'get') and not isinstance(data, dict):
        # Equivalente ao data.getAttribute('data-manga')
            raw_data = data.get('data-manga')
            manga = json.loads(raw_data) # Equivalente ao JSON.parse
        else:
            manga = data


        if any(item["link"] == manga["link"] for item in self.fav):
            #safe_title = manga['title'].replace("'", "\\'")
            #window.evaluate_js(f"showToast('{safe_title} its already in your favorites')")
            return

        fav = self._enrich_manga_with_icon(manga)
        self.fav.append(fav)

        if len(self.fav) > 30:
            self.fav.pop(0)
       
                 
        self._save_settings()

    def removeFav(self, manga_link):
        if not isinstance(manga_link, str) or not manga_link.strip():
            return json.dumps({"ok": False, "message": "invalid favorite"})

        initial_size = len(self.fav)
        self.fav[:] = [item for item in self.fav if item.get("link") != manga_link]

        if len(self.fav) == initial_size:
            return json.dumps({"ok": False, "message": "favorite not found"})

        self._save_settings()
        return json.dumps({"ok": True, "message": "removed from favorites"})





api = Api()



# --- DETECÇÃO DE AMBIENTE ---
if getattr(sys, 'frozen', False):
   
    RESOURCE_BASE = Path(sys._MEIPASS)
    APP_BASE = Path(sys.executable).parent
else:
   
    APP_BASE = Path(__file__).resolve().parent
    RESOURCE_BASE = APP_BASE.parent


index_file = RESOURCE_BASE / "assets" / "index.html"
icon_file = RESOURCE_BASE / "img" / ("icon.ico" if os.name == "nt" else "icon.png")

print(f"RESOURCE_BASE: {RESOURCE_BASE}")
print(f"index_file: {index_file}")
print(f"index existe: {index_file.exists()}")
logging.info(f"RESOURCE_BASE: {RESOURCE_BASE}")
logging.info(f"index_file: {index_file}")
logging.info(f"index existe: {index_file.exists()}")

if os.name == "nt":
    ensure_webview2_runtime()

window = webview.create_window("Mango", url=str(index_file), js_api=api, width=1280, height=720)


def _has_module(name: str) -> bool:
    return importlib.util.find_spec(name) is not None

def _get_gui_backend() -> str | None:
    if os.name == "nt":
        return "edgechromium"

    if sys.platform == "darwin":
        return "cocoa"

    if sys.platform.startswith("linux"):
        if _has_module("gi"):
            return "gtk"
        if _has_module("qtpy") and (_has_module("PySide6") or _has_module("PyQt6") or _has_module("PyQt5")):
            return "qt"

    return None


def _get_webview_config() -> dict:
    config = {
        "http_server": True,
        "icon": str(icon_file),
    }

    if sys.platform.startswith("linux"):
        gui_backend = _get_gui_backend()
        if gui_backend:
            config["gui"] = gui_backend
        config["debug"] = False
        return config

    gui_backend = _get_gui_backend()
    if gui_backend:
        config["gui"] = gui_backend

    return config

config = _get_webview_config()

gui_backend = _get_gui_backend()

try:
    if gui_backend is None:
        raise RuntimeError(
            "Nenhum backend de GUI disponível. Instale PySide6 e qtpy ou GTK (python3-gi) para usar o Mango.")
    webview.start(**config)
except Exception as exc:
    logging.exception("Falha ao iniciar a interface: %s", exc)
    raise
