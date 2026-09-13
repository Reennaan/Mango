from __future__ import annotations

import ctypes
import logging
import os
import subprocess
import tempfile
import time
import urllib.request
import webbrowser
from pathlib import Path


LOGGER = logging.getLogger(__name__)

BOOTSTRAPPER_URL = "https://go.microsoft.com/fwlink/p/?LinkId=2124703"
MANUAL_DOWNLOAD_URL = "https://developer.microsoft.com/en-us/microsoft-edge/webview2/consumer/"
INSTALL_TIMEOUT_SECONDS = 300
POST_INSTALL_WAIT_SECONDS = 30


def ensure_webview2_runtime() -> None:
    if os.name != "nt":
        return

    version = get_webview2_version()
    if version:
        LOGGER.info("WebView2 detectado: %s", version)
        return

    LOGGER.warning("WebView2 nao detectado; iniciando instalacao automatica")
    _show_message(
        "Mango",
        (
            "Mango precisa do Microsoft Edge WebView2 Runtime para abrir a interface.\n\n"
            "O instalador oficial da Microsoft sera baixado e executado agora."
        ),
        icon="info",
    )

    installer_path = _download_bootstrapper()

    try:
        _run_bootstrapper(installer_path)
        version = _wait_for_runtime()
        LOGGER.info("WebView2 instalado com sucesso: %s", version)
    except Exception as exc:
        LOGGER.exception("Falha ao instalar o WebView2 Runtime")
        _show_message(
            "Mango",
            (
                "Nao foi possivel instalar o Microsoft Edge WebView2 Runtime automaticamente.\n\n"
                "A pagina oficial de download sera aberta para concluir a instalacao manualmente."
            ),
            icon="error",
        )
        try:
            webbrowser.open(MANUAL_DOWNLOAD_URL)
        except Exception:
            LOGGER.exception("Falha ao abrir a pagina oficial do WebView2")
        raise RuntimeError("WebView2 Runtime installation failed") from exc
    finally:
        _delete_file(installer_path)


def has_webview2_runtime() -> bool:
    return bool(get_webview2_version())


def get_webview2_version() -> str | None:
    if os.name != "nt":
        return "non-windows"

    try:
        import clr
        from webview.util import interop_dll_path

        for runtime_name in ("win-arm64", "win-x64", "win-x86"):
            try:
                runtime_dir = interop_dll_path(runtime_name)
            except FileNotFoundError:
                continue

            if runtime_dir not in os.environ.get("Path", ""):
                os.environ["Path"] = os.environ.get("Path", "") + ";" + runtime_dir

        clr.AddReference(interop_dll_path("Microsoft.Web.WebView2.Core.dll"))

        from Microsoft.Web.WebView2.Core import CoreWebView2Environment

        version = CoreWebView2Environment.GetAvailableBrowserVersionString()
        return str(version) if version else None
    except Exception as exc:
        LOGGER.info("Sonda oficial do WebView2 falhou: %s", exc)
        return None


def _download_bootstrapper() -> Path:
    destination = Path(tempfile.gettempdir()) / "Mango-WebView2-Setup.exe"
    LOGGER.info("Baixando bootstrapper do WebView2 para %s", destination)

    request = urllib.request.Request(
        BOOTSTRAPPER_URL,
        headers={"User-Agent": "Mango2 WebView2 Bootstrapper"},
    )

    with urllib.request.urlopen(request, timeout=60) as response:
        destination.write_bytes(response.read())

    return destination


def _run_bootstrapper(installer_path: Path) -> None:
    LOGGER.info("Executando bootstrapper do WebView2: %s", installer_path)
    creationflags = getattr(subprocess, "CREATE_NO_WINDOW", 0)
    completed = subprocess.run(
        [str(installer_path), "/silent", "/install"],
        check=False,
        timeout=INSTALL_TIMEOUT_SECONDS,
        creationflags=creationflags,
    )
    LOGGER.info("Bootstrapper finalizado com codigo %s", completed.returncode)

    if completed.returncode != 0:
        raise RuntimeError(f"Bootstrapper returned exit code {completed.returncode}")


def _wait_for_runtime() -> str:
    for _ in range(POST_INSTALL_WAIT_SECONDS):
        version = get_webview2_version()
        if version:
            return version
        time.sleep(1)

    raise RuntimeError("WebView2 Runtime was not detected after installation")


def _show_message(title: str, message: str, icon: str = "info") -> None:
    icons = {
        "info": 0x40,
        "error": 0x10,
    }
    ctypes.windll.user32.MessageBoxW(None, message, title, 0x0 | icons.get(icon, 0x40))


def _delete_file(path: Path) -> None:
    try:
        path.unlink(missing_ok=True)
    except OSError:
        LOGGER.warning("Nao foi possivel remover o bootstrapper temporario: %s", path)
