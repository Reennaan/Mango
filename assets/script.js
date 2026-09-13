
window.buildMangaInfo = buildMangaInfo;
window.showToast = showToast;
window.initSources = initSources;
window.addEventListener('pywebviewready', initSources);


let toastHideTimeout = null;
let currentProviderName = "";
let favoriteItems = [];
let customCollections = {};



window.addEventListener('pywebviewready', () => {
    initSources();
    loadRecents();
    loadFav();
    versionCheck();
});

async function initSources(){
    const sourceDropdown = document.querySelector(".dropdown-sources");
    if (!sourceDropdown) return;
    try {
        const raw = await window.pywebview.api.get_extensions_page_data();
        const { installed } = JSON.parse(raw);
        const names = Object.values(installed);
       sourceDropdown.innerHTML = names.length
        ? names.map(e => `<div class="dropdown-item" data-value="${e.name}" data-id="${e.id}">${e.name}</div>`).join('')
        : '<div class="dropdown-item" style="opacity:.4">no extensions installed</div>';
    } catch(e) {
        console.error("initSources:", e);
    }
}

async function versionCheck() {
    const newVersion = await window.pywebview.api.version_check();
    if(!newVersion)return
    const p = document.querySelector(".app-version")
    p.innerHTML = `
    <span class="update-link">
        a new version is available
        </span>
    `;
    document.querySelector(".update-link").addEventListener("click", () => {
    window.pywebview.api.open_external(newVersion);
});
    
}

function openExternal(url) {
    window.pywebview.api.open_external(url);
}


async function isinstaled(provider) {
    if (!provider) return false;

    try {
        const raw = await window.pywebview.api.get_extensions_page_data();
        const { installed } = JSON.parse(raw);

        return Object.values(installed || {}).some((ext) =>
            ext.name === provider || ext.id === provider
        );
    } catch (e) {
        console.error("isinstaled:", e);
        return false;
    }
}

async function loadRecents() {
    const container = document.getElementById('library-container');
    if (!container) return;

    try {
        const recents = await window.pywebview.api.getRecents();
        container.innerHTML = "";
        document.querySelector(".recent-info").style.display = "flex"
        


        changeShowText("Recents");

        if (!Array.isArray(recents)) return;
        
        recents.slice().reverse().forEach(async (manga) => {
            buildMangaInfo(manga);
        });
    } catch (e) {
        console.error("loadRecents:", e);
    }
}

async function loadFav() {
   
    try{
        await syncCollectionsState();
        renderFavoritePreview();

    }catch (e){
        console.log("deu merda no fav")
        console.error(`mensagem ${e.message}`)
        console.error(`onde ocorreu ${e.stack}`)
    
}

}

async function syncCollectionsState() {
    const raw = await window.pywebview.api.getCollectionsData();
    const data = JSON.parse(raw || "{}");

    favoriteItems = Array.isArray(data.favorites) ? data.favorites : [];
    customCollections = data.collections && typeof data.collections === "object"
        ? data.collections
        : {};

    return data;
}

function getCustomCollectionNames() {
    return Object.keys(customCollections);
}

function getCollectionItems(kind, name) {
    if (kind === "favorites") {
        return favoriteItems;
    }

    const items = customCollections[name];
    return Array.isArray(items) ? items : [];
}

function isLinkInFavorites(link) {
    return favoriteItems.some((item) => item.link === link);
}

function isLinkInCollection(name, link) {
    return getCollectionItems("custom", name).some((item) => item.link === link);
}

function isLinkInCustomCollections(link) {
    return getCustomCollectionNames().some((name) => isLinkInCollection(name, link));
}

function createFavoritePreviewImage(manga) {
    const img = document.createElement("img");
    img.classList = "folder-cover";
    img.dataset.link = manga.link || "";
    img.src = manga.cover;
    img.addEventListener("click", async () => {
        await window.pywebview.api.changeProvider(manga.currentSource);
        renderMangaDetails(manga);
    });
    return img;
}

function buildCollectionCard(name, items, kind) {
    const folder = document.createElement("div");
    folder.className = "fav-folder";

    const title = document.createElement("h2");
    title.className = "section-title folder-name";
    title.dataset.folderKind = kind;
    title.dataset.folderName = name;
    title.textContent = name;

    


    const grid = document.createElement("div");
    grid.className = "grid-cover";

    const preview = document.createElement("div");
    preview.className = "manga-item";


    

    if (items.length) {
        items.slice(0, 6).forEach((manga) => {
            preview.appendChild(createFavoritePreviewImage(manga));
        });
    } else {
        const empty = document.createElement("p");
        empty.className = "folder-preview-empty";
        //empty.textContent = kind === "favorites" ? "No favorites yet." : "No manga yet.";
        preview.appendChild(empty);
    }

    grid.appendChild(preview);
    folder.appendChild(title);
    folder.appendChild(grid);

    if(kind === "custom"){
        
        folder.insertAdjacentHTML('beforeend', `<div class="folder-edit-button">${editIcon}</div>`);
        const editFolderButton = folder.querySelector(".folder-edit-button")
        const editText = folder.querySelector(".folder-name")
        const oldName = editText.textContent
        if(editFolderButton){

            editFolderButton.addEventListener("click", async (e) =>{
                e.stopPropagation();
                editText.setAttribute('contentEditable', 'true')
                editText.focus();
            })

            editText.addEventListener("blur", () => {
                editText.contentEditable = "false";
                editText.classList.remove("editing");
                
                const newName = editText.textContent.trim();
                console.log("Salvar novo nome:", newName);
                window.pywebview.api.editCollection(oldName,newName)
            });

            editText.addEventListener("keydown", async (e) => {
            
                if (e.key === "Enter") {
                    e.preventDefault(); 
                    editText.blur();
                    await syncCollectionsState();
                    renderFavoritePreview();    
                }
              

        });

            
        }


        folder.insertAdjacentHTML('beforeend', `<div class="folder-delete-button">${trashIcon}</div>`);
        const deleteFolderButton = folder.querySelector(".folder-delete-button")
        if(deleteFolderButton){
            deleteFolderButton.addEventListener("click", async (e) => {
                e.stopImmediatePropagation();
                await deleteFolder(name)
            });

        }
      
    }

   


    
    return folder;
}

async function deleteFolder(name){
    try {
        const raw = await window.pywebview.api.deleteCollection(name);
            const result = JSON.parse(raw);
            showToast(result.message);

            if (result.ok) {
                await syncCollectionsState();
                renderFavoritePreview();
                
            }
        } catch (error) {
            console.error("failed to delete folder:", error);
            showToast("failed to delete folder");
        }
}

function renderFavoritePreview(favorites = favoriteItems) {
    favoriteItems = Array.isArray(favorites) ? favorites : favoriteItems;

    const favContainer = document.querySelector(".fav-container");
    const grid = document.querySelector(".collections-grid");
    if (!favContainer || !grid) return;

    grid.innerHTML = "";
    favContainer.style.display = "block";

    grid.appendChild(buildCollectionCard("Favorites", favoriteItems, "favorites"));

    getCustomCollectionNames().forEach((name) => {
        grid.appendChild(buildCollectionCard(name, getCollectionItems("custom", name), "custom"));
    });
}

function syncFavoriteButtonState(button, isFavorite) {
    if (!button) return;
    button.classList.toggle("fill", isFavorite);
    button.innerHTML = isFavorite ? bookmarkFilledSvg : bookmarkOutlineSvg;
}

function syncCollectionBookmarkState(button, isSaved) {
    if (!button) return;
    button.classList.toggle("fill-bookmark", isSaved);
    button.innerHTML = isSaved ? collectionBookmarkFilledSvg : collectionBookmarkOutlineSvg;
}

function closeCollectionPicker() {
    document.querySelector(".collection-picker-overlay")?.remove();
}

function closeCreateFolderDialog() {
    document.querySelector(".create-folder-overlay")?.remove();
}

function openCreateFolderDialog() {
    closeCreateFolderDialog();

    const overlay = document.createElement("div");
    overlay.className = "create-folder-overlay";

    const dialog = document.createElement("div");
    dialog.className = "create-folder-dialog";

    const title = document.createElement("h3");
    title.className = "create-folder-title";
    title.textContent = "Create folder";



    const form = document.createElement("form");
    form.className = "create-folder-form";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "create-folder-input input-field search-input";
    input.name = "folder-name";
    input.maxLength = 17;
    input.placeholder = "Folder name";
    input.autocomplete = "off";

    const helper = document.createElement("p");
    helper.className = "create-folder-helper";
    helper.textContent = "Up to 17 characters.";

    const actions = document.createElement("div");
    actions.className = "create-folder-actions";

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.className = "create-folder-button-secondary";
    cancelButton.textContent = "Cancel";
    cancelButton.addEventListener("click", closeCreateFolderDialog);

    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.className = "create-folder-button-primary";
    submitButton.textContent = "Create";

    actions.appendChild(cancelButton);
    actions.appendChild(submitButton);
    form.appendChild(input);
    form.appendChild(helper);
    form.appendChild(actions);

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const folderName = input.value.trim();

        if (!folderName) {
            helper.textContent = "Type a folder name.";
            helper.classList.add("is-error");
            input.focus();
            return;
        }

        submitButton.disabled = true;
        cancelButton.disabled = true;

        try {
            const raw = await window.pywebview.api.createCollection(folderName);
            const result = JSON.parse(raw);

            if (!result.ok) {
                helper.textContent = result.message;
                helper.classList.add("is-error");
                input.focus();
                input.select();
                return;
            }

            await syncCollectionsState();
            renderFavoritePreview();
            closeCreateFolderDialog();
            showToast(result.message);
        } catch (error) {
            console.error("failed to create folder:", error);
            helper.textContent = "Failed to create folder.";
            helper.classList.add("is-error");
        } finally {
            submitButton.disabled = false;
            cancelButton.disabled = false;
        }
    });

    input.addEventListener("input", () => {
        helper.textContent = "Up to 17 characters.";
        helper.classList.remove("is-error");
    });

    dialog.appendChild(title);
  
    dialog.appendChild(form);
    overlay.appendChild(dialog);

    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) {
            closeCreateFolderDialog();
        }
    });

    
    const left = document.querySelector(".left-pane")
    left.appendChild(overlay);
    input.focus();
}

async function openCollectionPicker(bookmarkButton) {
    await syncCollectionsState();

    const folderNames = getCustomCollectionNames();
    if (!folderNames.length) {
        showToast("create a folder first");
        return;
    }

    const rawData = bookmarkButton.getAttribute("data-manga");
    if (!rawData) return;

    const manga = JSON.parse(rawData);
    const provider = bookmarkButton.getAttribute("data-provider") || manga.currentSource || currentProviderName;
    const payload = {
        ...manga,
        currentSource: provider,
    };

    closeCollectionPicker();

    const overlay = document.createElement("div");
    overlay.className = "collection-picker-overlay";

    const dialog = document.createElement("div");
    dialog.classList = "collection-picker-dialog custom-scrollbar";

    const header = document.createElement("div");
    header.className = "collection-picker-header";

    const copy = document.createElement("div");
    const title = document.createElement("h3");
    title.className = "collection-picker-title";
    title.textContent = "Save to folder";

    copy.appendChild(title);
    



    header.appendChild(copy);
    
    dialog.appendChild(header);

    const list = document.createElement("div");
    list.className = "collection-picker-list";

    folderNames.forEach((name) => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "collection-picker-item";

        const label = document.createElement("span");
        label.textContent = name;

        const status = document.createElement("span");
        status.className = "collection-picker-status";

        const syncItemState = () => {
            const active = isLinkInCollection(name, payload.link);
            item.classList.toggle("is-active", active);
            status.textContent = active ? "Added" : "Add";
            closeCollectionPicker();
        };

        syncItemState();
        item.appendChild(label);
        item.appendChild(status);

        item.addEventListener("click", async () => {
            item.disabled = true;

            try {
                const raw = isLinkInCollection(name, payload.link)
                    ? await window.pywebview.api.removeFromCollection(name, payload.link)
                    : await window.pywebview.api.addToCollection(name, JSON.stringify(payload));

                const result = JSON.parse(raw);
                showToast(result.message);

                if (result.ok) {
                    await syncCollectionsState();
                    renderFavoritePreview();
                    syncItemState();
                    syncCollectionBookmarkState(
                        bookmarkButton,
                        isLinkInCustomCollections(payload.link),
                    );
                }
            } catch (error) {
                console.error("failed to update collection:", error);
                showToast("failed to update folder");
            } finally {
                item.disabled = false;
            }
        });

        list.appendChild(item);
    });

    dialog.appendChild(list);
    overlay.appendChild(dialog);
    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) {
            closeCollectionPicker();
        }
    });
    const right = document.querySelector(".icon-list")
    right.appendChild(overlay);
}




function ensureToastElement() {
    let toast = document.getElementById('app-toast');
    if (toast) return toast;

    toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = 'app-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);

    return toast;
}

function showToast(message) {
    const toast = ensureToastElement();
    const safeMessage = typeof message === 'string' ? message.trim() : String(message ?? '').trim();

    if (!safeMessage) return;

    toast.textContent = safeMessage;
    toast.classList.remove('is-visible');
    void toast.offsetWidth;
    toast.classList.add('is-visible');

    if (toastHideTimeout) {
        clearTimeout(toastHideTimeout);
    }

    toastHideTimeout = setTimeout(() => {
        toast.classList.remove('is-visible');
    }, 2800);
}

function getExtensionButtonMarkup() {
    return `
        <button type="button" class="extensions-trigger" aria-label="Open extensions">
            <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 0 1-.657.643 48.39 48.39 0 0 1-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 0 1-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 0 0-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 0 1-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 0 0 .657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 0 1-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 0 0 5.427-.63 48.05 48.05 0 0 0 .582-4.717.532.532 0 0 0-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 0 0 .658-.663 48.422 48.422 0 0 0-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 0 1-.61-.58v0Z" />
            </svg>
        </button>
    `;
}

function getDefaultDetailMarkup(message = "Select a manga to view details") {
    return `${getExtensionButtonMarkup()}<div class="empty-state"><p>${message}</p></div>`;
}

function clearDetailView(message = "Select a manga to view details") {
    const detailView = document.getElementById("detail-view");
    if (!detailView) return;

    detailView.innerHTML = getDefaultDetailMarkup(message);
}

function closeExtensionPage() {
    const container = document.querySelector(".extensionContainer");
    if (!container) return;

    container.classList.remove("is-visible");
    container.innerHTML = "";
}

const defaultInstallButton = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>`
const uninstallButton = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"  width="16" height="16"><g id="SVGRepo_bgCarrier" stroke-width="2"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M4 6H20M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132 14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.477 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013 8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6M18 6V16.2C18 17.8802 18 18.7202 17.673 19.362C17.3854 19.9265 16.9265 20.3854 16.362 20.673C15.7202 21 14.8802 21 13.2 21H10.8C9.11984 21 8.27976 21 7.63803 20.673C7.07354 20.3854 6.6146 19.9265 6.32698 19.362C6 18.7202 6 17.8802 6 16.2V6M14 10V17M10 10V17" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>`

function renderExtensionCards(extensions) {
    if (!extensions || !extensions.length)
        return '<p style="color:var(--color-text-secondary);padding:24px">No extensions found</p>';

    return extensions.map((ext) => `
        <article class="extension-card">
            <div class="extension-card-main">
                <img 
                    src="${ext.icon || ''}" 
                    alt="${ext.name}" 
                    class="extension-icon"
                    onerror="this.style.display='none'"
                >
                <div class="extension-copy">
                    <div class="extension-name-row">
                        <h3>${ext.name}</h3>
                        ${ext.is_installed ? '<span class="extension-installed-badge badge">INSTALLED</span>' : ''}
                        <span class="language badge">${ext.language ? ext.language.toUpperCase()  : 'Extension'}</span>
                        ${ext.nsfw ? '<span class="extension-author badge nsfw">+18</span>' : ''}
                    </div>
                    
                    ${ext.description ? `<p class="extension-desc">${ext.description}</p>` : ''}
                </div>
            </div>
            <button type="button" class="extension-action"
                data-ext='${JSON.stringify(ext).replace(/'/g, "&#39;")}'
                data-installed="${ext.is_installed}">
                ${ext.is_installed ? uninstallButton : defaultInstallButton}
            </button>
        </article>
    `).join("");
}

function syncExtensionCardState(providerButton, installed) {
    const extensionCard = providerButton.closest(".extension-card");
    const extensionNameRow = extensionCard?.querySelector(".extension-name-row");
    if (!extensionNameRow) return;

    const existingBadge = extensionNameRow.querySelector(".extension-installed-badge");

    if (installed) {
        if (!existingBadge) {
            const badge = document.createElement("span");
            badge.className = "extension-installed-badge badge";
            badge.textContent = "INSTALED";
            extensionNameRow.appendChild(badge);
        }
    } else if (existingBadge) {
        existingBadge.remove();
    }

    providerButton.dataset.installed = String(installed);
    providerButton.innerHTML = installed ? uninstallButton : defaultInstallButton;
}



const spinner = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1em' height='1em' viewBox='0 0 24 24'%3E%3C!-- Icon from SVG Spinners by Utkarsh Verma - https://github.com/n3r4zzurr0/svg-spinners/blob/main/LICENSE --%3E%3Cpath fill='%23fff' stroke='%23fff' d='M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z'%3E%3CanimateTransform attributeName='transform' dur='0.75s' repeatCount='indefinite' type='rotate' values='0 12 12;360 12 12'/%3E%3C/path%3E%3C/svg%3E";


document.addEventListener("click", async function(event) {
    const extensionTrigger = event.target.closest(".extensions-trigger");
    if (extensionTrigger) {
        event.preventDefault();
        renderExtension();
        return;
    }

    const closeButton = event.target.closest(".extensions-close");
    if (closeButton) {
        event.preventDefault();
        closeExtensionPage();
        return;
    }

    const sourcesTrigger = event.target.closest(".dropdown-sources");
    if(sourcesTrigger) {
        event.preventDefault();
       
        
    }

    const providerButton = event.target.closest(".extension-action[data-ext]");
    if (!providerButton || providerButton.disabled) return;

    const ext = JSON.parse(providerButton.dataset.ext);
    const isInstalled = providerButton.dataset.installed === "true";
    providerButton.disabled = true;
    providerButton.innerHTML = `<img src="${spinner}" alt="downloading"  style="width:14px;height:14px;display:block;">`;


    try {
        let raw;
        if (isInstalled) {
            raw = await window.pywebview.api.uninstall_extension(ext.id);
        } else {
            raw = await window.pywebview.api.install_extension(JSON.stringify(ext));
        }
        const res = JSON.parse(raw);
        showToast(res.message);
        if (res.ok) {
            syncExtensionCardState(providerButton, !isInstalled);
            initSources();
        } else {
            providerButton.innerHTML = isInstalled ? uninstallButton : defaultInstallButton;
        }
    } catch(e) {
        showToast("Erro inesperado.");
        providerButton.textContent = isInstalled ? uninstallButton : defaultInstallButton;
    } finally {
        providerButton.disabled = false;
    }


    if (!providerButton || providerButton.disabled) return;

    
  
    
});






document.addEventListener("click", (e)=>{
    if(!e.target.closest(".dropdown")){
        
    }
})



async function renderExtension() {
    const container = document.querySelector(".extensionContainer");
    if (!container) return;

    // mostra loading imediatamente
    container.innerHTML = extensionShell('<p style="color:var(--color-text-secondary);padding:24px">Carregando...</p>');
    container.classList.add("is-visible");

    try {
        const raw = await window.pywebview.api.get_extensions_page_data();
        const data = JSON.parse(raw);
        container.querySelector(".extension-grid").innerHTML = renderExtensionCards(data.available);
    } catch(e) {
        container.querySelector(".extension-grid").innerHTML =
            '<p style="color:var(--color-text-danger);padding:24px">Fail on load extensions</p>';
    }
}

function extensionShell(gridContent) {
    return `
        <div class="extension-page custom-scrollbar">
            <div class="extension-shell">
                <div class="extension-header">
                    <div><h1 class="extension-title">Extensions</h1>
                    <p class="extension-subtitle">Manage and install new manga sources.</p></div>
                    <button type="button" class="extensions-close" aria-label="Close extensions">✕</button>
                </div>
                <div class="extension-grid">${gridContent}</div>
            </div>
        </div>`;
}






const header = document.getElementById("dropdown-header")
const list = document.getElementById("dropdown-list")

header.addEventListener("click", function () {

    if(list.style.display === "block"){
        list.style.display = "none"
    }else{
        list.style.display = "block"
    }

})

function changeShowText(text){
    document.querySelector(".popular-recents").innerHTML = text
}


async function setActiveProvider(source, fetchHome = true) {
    if (!source) return;

    currentProviderName = source;
    header.textContent = source;
    list.style.display = "none";
    document.querySelector(".recent-info").style.display = "none"
    changeShowText(`Popular on: ${source}`);
    if(fetchHome){
        document.getElementById("library-container").innerHTML = "";
    }

    //document.getElementById("library-container").innerHTML = "";
    clearDetailView();

    await window.pywebview.api.changeProvider(source);
    if (fetchHome) {
        await window.pywebview.api.genericFetch();
    }
}

list.addEventListener("click", function(e){
    const item = e.target
    if(!item.classList.contains("dropdown-item")) return
    const source = item.dataset.value

    if(source !== "Select the source"){
        setActiveProvider(source)
    }

})


function toggleDropdown(){
    const list = document.getElementById("dropdown-list");

    if(list.style.display === "block"){
        list.style.display = "none";
    }else{
        list.style.display = "block";
    }
}

async function initDownloadOptionsDropdown(root) {
    const dropdown = root.querySelector('.download-dropdown');
    if (!dropdown) return;




    

    const header = dropdown.querySelector('.download-dropdown-header');
    const list = dropdown.querySelector('.download-dropdown-list');
    if (!header || !list) return;

    header.addEventListener('click', function () {
        list.style.display = list.style.display === 'block' ? 'none' : 'block';
    });

    const currentDownloadFormat = await window.pywebview.api.getFormat();
    if(currentDownloadFormat && currentDownloadFormat != "Download options"){
        window.pywebview.api.changeFormat(currentDownloadFormat);
        header.textContent = currentDownloadFormat;
        list.style.display = 'none';

    }else{
        header.textContent = "Download options"
    } 
        
    
    list.addEventListener('click', function (e) {
        const item = e.target.closest('.dropdown-item');
        if (!item) return;

        const selectedFormat = item.dataset.format;
        if (!selectedFormat) return;

        header.textContent = selectedFormat;
        list.style.display = 'none';
        window.pywebview.api.changeFormat(selectedFormat);
    });

}

document.addEventListener("click", (e)=>{
    if(!e.target.closest(".dropdown")){
        document.querySelectorAll(".dropdown-list").forEach((dropdownList) => {
            dropdownList.style.display = "none";
        });
    }
})



document.addEventListener('click', async function (event) {
    const folderButton = event.target.closest('.folder-button');
    if (!folderButton) return;

    //console.log("foi");
    try {
        const selected = await window.pywebview.api.selectFolder();
        //console.log(selected);
    } catch (error) {
        console.error('erro ao selecionar pasta:', error);
        showToast('erro ao selecionar pasta:', error)
    }
});

document.addEventListener('click', async function (event) {
    const createFolderButton = event.target.closest('.createfolder-button');
    if (!createFolderButton) return;

    openCreateFolderDialog();
});

document.addEventListener('click', async function (event) {
    const folderName = event.target.closest('.folder-name');
    if (!folderName) return;

    await openFolder(folderName);
});

document.addEventListener('click', async function (event) {
    const favButton = event.target.closest('.favButton');
    if (!favButton) return;

    const saved = await saveFavorite(favButton);
    syncFavoriteButtonState(
        favButton,
        saved || isLinkInFavorites(JSON.parse(favButton.getAttribute('data-manga')).link),
    );
});

document.addEventListener('click', async function (event) {
    const bookmarkButton = event.target.closest('.bookmark');
    if (!bookmarkButton) return;

    try {
        await openCollectionPicker(bookmarkButton);
    } catch (error) {
        console.error('failed to open collection picker:', error);
        showToast('failed to open folder picker');
    }
});



const svgAsc = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:all;cursor:pointer"><path d="M13 12H21M13 8H21M13 16H21M6 7V17M6 7L3 10M6 7L9 10"></path></svg>`;

const svgDesc = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:all;cursor:pointer"><path d="M13 12H21M13 8H21M13 16H21M6 7V17M6 17L3 14M6 17L9 14"></path></svg>`;

document.addEventListener('click', async function (event) {
    const alignButton = event.target.closest('.align-button');
    if (!alignButton) return;

    const container = document.querySelector(".chapters-grid");
    if (!container) return;

    const items = Array.from(container.querySelectorAll(".chapter-item"));
    if (!items.length) return;

    const isAsc = alignButton.dataset.order !== 'asc';
    alignButton.dataset.order = isAsc ? 'asc' : 'desc';
    alignButton.innerHTML = isAsc ? svgAsc : svgDesc;

    items.sort((a, b) => {
        const numA = parseFloat(a.querySelector(".chapter-name")?.textContent.replace(/[^0-9.]/g, '') ?? 0);
        const numB = parseFloat(b.querySelector(".chapter-name")?.textContent.replace(/[^0-9.]/g, '') ?? 0);
        return isAsc ? numA - numB : numB - numA;
    });

    items.forEach(item => container.appendChild(item));
});


document.addEventListener('click', async function(event){
    const searchBtn = event.target.closest(".search-icon");
    if (!searchBtn) return;

    const inputValue = document.querySelector(".search-input").value
    console.log(inputValue)
    if(inputValue != ""){
        const searchedMango = await window.pywebview.api.search_mango(inputValue);
    }
})


document.addEventListener("keydown", async function(event) {
    if (event.key === "Escape") {
        closeExtensionPage();
    }
    
    if(event.key !== "Enter") return;
        
    const inputValue = document.querySelector(".search-input").value
    console.log(inputValue)
    if(inputValue != ""){
        const searchedMango = await window.pywebview.api.search_mango(inputValue);
    }


});




async function buildMangaInfo(manga) {
    

    const container = document.getElementById('library-container');
    if (!container) return;
    try{
        const cover = manga.cover
        const title = manga.title
        const link = manga.link
        //console.log(cover, title,link)

        let installed = true;

        if(manga.currentSource){
            installed = await isinstaled(manga.currentSource);
            console.log(installed)
        }


        const card = document.createElement('div');
        card.className = 'mangaCard';
        card.innerHTML = `
            <img src="${cover}" class="cardImg ${installed? "" : "not-installed"}" alt="${title}" referrerPolicy="no-referrer">
            <h3 class="titleCard">${title}</h3>
        `;

        card.onclick = async () => {
             if (card.querySelector(".cardImg")?.classList.contains("not-installed")) {
                showToast(`${manga.currentSource} not found. Make sure that the source is installed`)
                
            }else{
                
                if (manga.currentSource) {
                    await setActiveProvider(manga.currentSource, false);
                }
                renderMangaDetails(manga);
            }


            
            document.querySelectorAll('.mangaCard').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
           
            
        };

        container.appendChild(card);
    }catch (error){
        console.error("erro ao baixar capitulo:", error);
        showToast("failed to download chapter:", error)
    }
   
}

const chapterDefaultIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" x2="12" y1="15" y2="3"/>
</svg>
`;

const chapterLoadingIconDataUrl = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1em' height='1em' viewBox='0 0 24 24'%3E%3C!-- Icon from SVG Spinners by Utkarsh Verma - https://github.com/n3r4zzurr0/svg-spinners/blob/main/LICENSE --%3E%3Cpath fill='%23fff' stroke='%23fff' d='M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z'%3E%3CanimateTransform attributeName='transform' dur='0.75s' repeatCount='indefinite' type='rotate' values='0 12 12;360 12 12'/%3E%3C/path%3E%3C/svg%3E";
const bookmarkOutlineSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 21-1.45-1.32C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.18z"></path></svg>`;
const bookmarkFilledSvg = `<svg xmlns="http://www.w3.org/2000/svg"class="fill" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="m12 21-1.45-1.32C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.18z"></path></svg>`;
const collectionBookmarkOutlineSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16" stroke="currentColor"><path d="M12 13V7M9 10H15M19 21V7.8C19 6.11984 19 5.27976 18.673 4.63803C18.3854 4.07354 17.9265 3.6146 17.362 3.32698C16.7202 3 15.8802 3 14.2 3H9.8C8.11984 3 7.27976 3 6.63803 3.32698C6.07354 3.6146 5.6146 4.07354 5.32698 4.63803C5 5.27976 5 6.11984 5 7.8V21L12 17L19 21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
const collectionBookmarkFilledSvg = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"><path d="M19 21 12 17 5 21V7.8c0-1.68 0-2.52.327-3.162A3 3 0 0 1 6.638 3.327C7.28 3 8.12 3 9.8 3h4.4c1.68 0 2.52 0 3.162.327a3 3 0 0 1 1.311 1.311C19 5.28 19 6.12 19 7.8V21Z"></path></svg>`;

function setChapterDownloadIcon(chapterIndex, isLoading) {
    const iconContainer = document.querySelector(`.chapter-item[data-chapter-index="${chapterIndex}"] .chapter-download-icon`);
    if (!iconContainer) return;

    if (isLoading) {
        iconContainer.innerHTML = `<img src="${chapterLoadingIconDataUrl}" alt="downloading"  style="width:14px;height:14px;display:block;">`;
        return;
    }
    const poing = new Audio('audio/poing.mp3')
    poing.play();
    iconContainer.innerHTML = chapterDefaultIconSvg;
}

window.mangaDownloadPage = async function( ch, chaptersLinks , title,  chapterIndex) {
    //if (!downloadLink || Array.isArray(downloadLink)) return "";
    //console.log(downloadLink, chapters, title)
    // chapters, downloadLink , title
    //const urlStr = downloadLink.toString();
    //const parts = urlStr.split("/");

    //let slug = parts.slice(2).join("/").split("/")[0];
    //let chapter = parts[4];
   

    manga = {
        "chapters": ch,
        "chaptersLinks": chaptersLinks,
        "title": title,
        
    }

    console.log(manga)

    setChapterDownloadIcon(chapterIndex, true);
    try {
        //console.log(downloadLink, chapters, title)

    
        await window.pywebview.api.genericDownload(manga, chapterIndex);
        

        
        //await window.pywebview.api.downloadFile(slug, chapter);
    } catch (error) {
        console.error("erro ao baixar capitulo:", error);
        showToast("failed to download chapter:", error)
    } finally {
        setChapterDownloadIcon(chapterIndex, false);
        showToast(`${manga.title} ${ch} is avaliable now`)
    }

    return "";
}



async function renderMangaDetails(manga) {
    const detailView = document.getElementById('detail-view');
    if (!detailView) return;
    //vem como title, cover, link

    //console.log(manga.link)

    const extensionMarkup = getExtensionButtonMarkup();


   
    detailView.innerHTML = `${extensionMarkup}<div class="empty-state"><p>Loading chapters...</p></div>`;

    let chaptersData = null;
    try {
        
        const withTimeout = (promise, timeoutMs, message) => Promise.race([
            promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error(message)), timeoutMs))
        ]);

        await withTimeout(
            //title, cover, link ainda
            
            window.pywebview.api.genericGetDetails(manga),
            15000,
            "Timeout while loading chapters."
        );

        //desc
        //author
        //chapters
        //chaptersLinks
        chaptersData = await withTimeout(
            window.pywebview.api.getPendingDownloadData(),
            5000,
            "Timeout while reading chapters data."
        );
        

        backgroundImg = await window.pywebview.api.backgroundManga(manga.title)
        if (typeof backgroundImg !== 'string')
            backgroundImg = ""
    
    } catch (e) {
        detailView.innerHTML = `${extensionMarkup}<div class="empty-state"><p>error when searching for chapters</p></div>`;
        console.error("erro ao buscar capítulos:", e);
        showToast("failure when searching for chapters", e)
    }

    if (!chaptersData) {
        detailView.innerHTML = `${extensionMarkup}<div class="empty-state"><p>Failed to load chapters.</p></div>`;
        return;
    }

    const {
        chapters = [],
        img = "",
        title = "",
        chaptersLinks = [],
        desc = "",
        author = ""
    } = chaptersData || {};
    if(author === "null" || author === "not avaliable"){
        authorText = " "
    }else{
        authorText = author
    }
        
    
        
    const descText = Array.isArray(desc) ? desc.join(" ") : (desc || "Description not available.");
    const descClass = descText.length > 550 ? "manga-desc custom-scrollbar has-scroll" : "manga-desc";
    const titleText = typeof title === "string" && title.length > 45 ? `${title.slice(0, 45)}...` : title;
    const providerName = manga.currentSource || currentProviderName;
    const mangaDataAttr = JSON.stringify(manga).replace(/'/g, "&apos;");
    const isFavorite = isLinkInFavorites(manga.link);
    const isInCustomFolder = isLinkInCustomCollections(manga.link);

    saveRecent(manga, providerName)


    detailView.innerHTML = `
        ${extensionMarkup}
        ${backgroundImg ? `
            <div class="backgorund-manga">
                    <img class="manga-img" src ="${backgroundImg}">
            </div>
            
            `: ''}
          

        <div class="detail-bg">
            <img src="${img}" alt="" referrerPolicy="no-referrer" onerror="this.style.display='none';">
            <div class="detail-gradient"></div>
        </div>

        <div class="detail-content custom-scrollbar">
            <div class="manga-header">
                <div class="manga-cover-large">
                    <img src="${img}" alt="${title}" referrerPolicy="no-referrer">
                </div>
                <div class="manga-info">
                        
                    <h1 class="manga-title-large">${titleText}</h1>
                    ${authorText ? ` 
                         <div class="text-4xl font-bold mb-8 text-white/80 author-name">${authorText}</div>
                        
                        `: ''}
                   
                    <p class="${descClass}">
                        ${descText}
                    </p>
                </div>
              
            </div>

            <div class="chapters-section">
                <div class="section-header">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <h3 class="chapters-title-page">Chapters</h3>
                        <div class="icon-list" style="display: flex; gap: 0.5rem; color: rgba(255,255,255,0.2);">
                            <div class="favButton ${isFavorite ? "fill" : ""}" data-manga='${mangaDataAttr}' data-provider='${providerName}'>
                                ${isFavorite ? bookmarkFilledSvg : bookmarkOutlineSvg}
                            </div>

                            <div class="align-button">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: all; cursor: pointer; ><g id="SVGRepo_bgCarrier"  ></g><g id="SVGRepo_tracerCarrier" ></g><g id="SVGRepo_iconCarrier"> <path d="M13 12H21M13 8H21M13 16H21M6 7V17M6 17L3 14M6 17L9 14" ></path> </g></svg>
                            </div>
                            <div class="folder-button">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-folder" style="pointer-events: all; cursor: pointer;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                            </div>
                            <div class="bookmark ${isInCustomFolder ? "fill-bookmark" : ""}" data-manga='${mangaDataAttr}' data-provider='${providerName}'>
                                ${isInCustomFolder ? collectionBookmarkFilledSvg : collectionBookmarkOutlineSvg}
                            </div>
                        </div>
                    </div>
                    <div class="dropdown download-dropdown download-options">
                        <div class="dropdown-header download-dropdown-header">
                            Download options
                        </div>
                        <div class="dropdown-list download-dropdown-list">
                            <div class="dropdown-item" data-format="PDF">PDF</div>
                            <div class="dropdown-item" data-format="JPG">JPG</div>
                            <div class="dropdown-item" data-format="EPUB">EPUB</div>
                        </div>
                        <div class="select-arrow">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                    </div>
                </div>

                <div class="chapters-grid custom-scrollbar">
                    ${chapters.map((ch, i) => `
                        <div class="chapter-item" data-chapter-index="${i}" onclick='mangaDownloadPage(${JSON.stringify(ch)}, ${JSON.stringify(chaptersData.chaptersLinks[i])}, ${JSON.stringify(chaptersData.title).replace(/'/g, "&apos;")} , ${i})'>
                            <div class="chapter-left">
                                <div class="chapter-icons">
                                    <span class="chapter-download-icon">${chapterDefaultIconSvg}</span>
                                </div>
                                <span class="chapter-name">${ch}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
        </div>
    `;

    initDownloadOptionsDropdown(detailView);

}


function saveRecent(manga,currentSource){
    // manga = title, cover, link
    //console.log(manga, currentSource)
    
    const recentList = {
        ...manga,
        "currentSource":currentSource
    }
  
    window.pywebview.api.saveRecentCache(recentList)

}

async function saveFavorite(data){
    let manga
    let provider
    
    if (data && typeof data.getAttribute === 'function') {
        const rawData = data.getAttribute('data-manga');
        manga = JSON.parse(rawData);
        provider = data.getAttribute('data-provider')
    }else{
        manga = data
        provider = data.currentSource

    } 


    try {
        await syncCollectionsState();

        if (isLinkInFavorites(manga.link)) {
            showToast(`${manga.title} is already in favorites`);
            renderFavoritePreview();
            return false;
        }

        if (favoriteItems.length >= 30) {
            showToast("you have reached the favorites limit");
            return false;
        }

        const fav = {
            ...manga,
            "currentSource": provider,
            "favorite":true
        };

        await window.pywebview.api.saveFav(fav);
        await syncCollectionsState();
        renderFavoritePreview();
        showToast(`${manga.title} added to favorites`);
        return true;
    } catch (error) {
        console.error("fail to save favorite:", error);
        showToast("failed to save favorite");
        return false;
    }

}
const returnIcon = `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M12.9998 8L6 14L12.9998 21" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M6 14H28.9938C35.8768 14 41.7221 19.6204 41.9904 26.5C42.2739 33.7696 36.2671 40 28.9938 40H11.9984" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>`
const trashIcon = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M10 12L14 16M14 12L10 16M4 6H20M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132 14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.477 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013 8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6M18 6V16.2C18 17.8802 18 18.7202 17.673 19.362C17.3854 19.9265 16.9265 20.3854 16.362 20.673C15.7202 21 14.8802 21 13.2 21H10.8C9.11984 21 8.27976 21 7.63803 20.673C7.07354 20.3854 6.6146 19.9265 6.32698 19.362C6 18.7202 6 17.8802 6 16.2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>`
const editIcon = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#000000" width="20" height="20"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title></title> <g id="Complete"> <g id="edit"> <g> <path d="M20,16v4a2,2,0,0,1-2,2H4a2,2,0,0,1-2-2V6A2,2,0,0,1,4,4H8" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path> <polygon fill="none" points="12.5 15.8 22 6.2 17.8 2 8.3 11.5 8 16 12.5 15.8" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></polygon> </g> </g> </g> </g></svg>`

async function openFolder(folder){
    const detailView = document.getElementById('detail-view');
    if (!detailView) return;
    await syncCollectionsState();

    const folderName = folder?.dataset?.folderName || folder?.textContent?.trim() || "Favorites";
    const folderKind = folder?.dataset?.folderKind || (folderName === "Favorites" ? "favorites" : "custom");
    


    const folderItems = [...getCollectionItems(folderKind, folderName)];

    const folderScreen = `
        <div class="open-folder-container custom-scrollbar">
            <div class="folder-options">  
                <div class="return-button">${returnIcon}</div>
                <div class="trash-button">${trashIcon}</div>
                <h2 class="section-title" id="folder-page-name"></h2>
            </div>
            
             
            <div class=grid-folder-page>
                <div class="mangaCardFolder">
                    
                </div>
            </div>
        </div>
    `
    detailView.innerHTML = `${folderScreen}`
    document.getElementById("folder-page-name").textContent = folderName
    const card = document.querySelector(".mangaCardFolder")
    const trashButton = document.querySelector(".trash-button")
    
    const renderEmptyFolderState = () => {
        if (card.childElementCount > 0) return;
        card.classList.remove("is-delete-mode");
        trashButton.classList.remove("is-active");
        card.innerHTML = `<p class="folder-empty">${folderKind === "favorites" ? "" : ""}</p>`;
    };
    document.querySelector(".return-button").addEventListener("click", () =>{ clearDetailView()})
    trashButton.addEventListener("click", () => {
        card.classList.toggle("is-delete-mode")
        trashButton.classList.toggle("is-active")
    })


    
    if (!folderItems.length) {
        renderEmptyFolderState()
        return
    }

    folderItems.forEach(async (manga) =>{
        let installed = true;
        if(manga.currentSource){
            installed = await isinstaled(manga.currentSource);
            //console.log(installed)
        }
        
        const folderCard = document.createElement("div")
        folderCard.className = "folder-card-item"

        const img  = document.createElement("img")
        img.classList = `card-folder-cover ${installed? "" : "not-installed"}`
        img.src = manga.cover 

        const deleteOption = document.createElement("button")
        deleteOption.type = "button"
        deleteOption.className = "folder-card-delete"
        deleteOption.innerHTML = trashIcon
        deleteOption.addEventListener("click", async (event) => {
            event.stopPropagation()
            deleteOption.disabled = true
            try {
                const raw = folderKind === "favorites"
                    ? await window.pywebview.api.removeFav(manga.link)
                    : await window.pywebview.api.removeFromCollection(folderName, manga.link)
                const result = JSON.parse(raw)
                showToast(result.message)
                if (!result.ok) return

                folderCard.remove()
                await syncCollectionsState()
                renderFavoritePreview()
                renderEmptyFolderState()
            } catch (error) {
                console.error("fail to delete favorite:", error)
                showToast("failed to remove favorite")
            } finally {
                deleteOption.disabled = false
            }

        })

        if(manga.currentSource){
            installed = await isinstaled(manga.currentSource);
            
        }
        img.addEventListener('click', async () => {
            
            
            if(img.classList.contains("not-installed")){
                showToast(`${manga.currentSource} not found. Make sure that the source is installed`)                
            }else{
                await window.pywebview.api.changeProvider(manga.currentSource);
                renderMangaDetails(manga);
            
            }
        
            
        })
        folderCard.appendChild(img)
        folderCard.appendChild(deleteOption)
        card.appendChild(folderCard)
        
    });

    
}
