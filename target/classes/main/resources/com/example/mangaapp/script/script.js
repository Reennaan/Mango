const search = document.querySelector('.search-box');
const matchList = document.getElementById("match-list")
const sources = document.querySelector("#sources-combobox")
const log = document.querySelector("#log")
const img = document.querySelector(".manga-img");
const column1 = document.querySelector(".column1");
const ul1 = document.querySelector("#ul1")
const ul2 = document.querySelector("#ul2")
const mangatitle = document.querySelector("#manga-title")
const background = document.querySelector("#manga-background")



document.addEventListener("DOMContentLoaded", function () {
    const list = [];
    sources.addEventListener("change", () => {
        const value = sources.value;

        if(value === "AnimeLife") {
            window.Controller.activateAnimeLife();
        }

        if(value === "MangaOnlineBiz"){
            window.Controller.activateMangaOnlineBiz();
        }


    });
        window.initializeMangaList = function (json) {
            json.forEach(data => {
                list.push(data.title);
            });




                $("#auto_check").autocomplete({
                    source: function (request, response) {
                        const results = $.ui.autocomplete.filter(list, request.term);
                        response(results.slice(0, 7));
                    },
                    minLength: 1,
                    select: function (event, ui) {
                        const selectedItem = ui.item.value;
                        const index = json.findIndex(item => item.title === selectedItem)



                        if (window.Controller && sources.value == "AnimeLife") {
                            try {
                                window.Controller.receiveItem(json[index].id);
                                //log.innerHTML = "Enviado para Java com sucesso: " + json[index].id+"<br>";
                            } catch (e) {
                                //log.innerHTML = log + "Erro ao enviar para Java: " + e + "<br>";
                            }
                        } else {
                            //log.innerHTML = log + "JavaController não está disponível." + "<br>";
                        }
                    }
                });

    };
});

function chapterList(chapters) {

    ul1.innerHTML = '';
    ul2.innerHTML = '';


   
    for (let i = 0; i < chapters.length; i++) {
        const li = document.createElement("li");
        li.classList.add("li-chapter")
        li.onclick = () =>{}

        const imgdownload = document.createElement("img");
        const checkdownload = document.createElement("input");
        checkdownload.className = "form-check-input"
        checkdownload.type = "checkbox"

        imgdownload.src = "../img/downloadcloud.png";
        
        const spinner = document.createElement("span");
        spinner.className = "loader";
        spinner.style.display = "none";
    


        imgdownload.classList.add("chapter-download");
        imgdownload.onclick = async () =>{
            imgdownload.style.display = "none";
            spinner.style.display = "inline-block";

            try{
              await window.Controller. downloadChapter(chapters[i].link, chapters[i].name.trim() ,chapters[0].mangaName);

            } finally{
                spinner.style.display = "none";
                imgdownload.style.display = "";
            }

        }

        

        if(i == 0){
            img.src = chapters[0].img
            mangatitle.innerHTML = chapters[0].mangaName;
            background.src = chapters[0].background;

        }



        const chapterText = `${chapters[i].name.trim()}`;
        const textNode = document.createTextNode(chapterText);

        li.appendChild(imgdownload);
        li.appendChild(spinner);
        li.appendChild(checkdownload);
        li.appendChild(textNode);

        div = chapters.length / 2;

        if (i < div) {
            ul1.appendChild(li);
        } else {
            ul2.appendChild(li);
        }
    }



}



async function fetchUI(request, injectionScript, timeout = 60000) {
    return new Promise((resolve, reject) => {
        const win = new this.browser({
            show: false,
            webPreferences: {
                show: false,
                webPreferences: {
                    nodeIntegration: false,
                    webSecurity: false,
                    images: images || false
                }
            }
        });

        // Configura um timeout para rejeitar a promise se a página não carregar a tempo
        const abortAction = setTimeout(() => {
            win.close(); // Fecha a janela se o timeout for atingido
            reject(new Error(`Timeout: "${request.url}" não carregou dentro de ${timeout / 1000} segundos!`));
        }, timeout);

        // Carrega a URL
        win.loadURL(request.url).then(() => {
            win.webContents.on('did-finish-load', async () => {
                try {
                    const result = await win.webContents.executeJavaScript(injectionScript); // Executa o script injetado
                    clearTimeout(abortAction); // Limpa o timeout
                    resolve(result); // Resolve a promise com o resultado
                } catch (error) {
                    reject(error); // Rejeita a promise em caso de erro ao executar o script
                }
            });
        }).catch(reject); // Rejeita a promise se houver erro ao carregar a URL
    });
}






// Exemplo de uso







async function getChapter(data) {
    const url = "https://manga4life.com"+data;

    const requestOptions = {
        method: 'GET',
        mode: 'cors',
        redirect: 'follow',
        credentials: 'same-origin',
        headers: new Headers()
    };
    requestOptions.headers.set('accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9');
    requestOptions.headers.set('x-cookie', 'FullPage=yes');
    requestOptions.headers.set('x-referer', url);


    let script = `
        new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    resolve([...document.querySelectorAll('div.ImageGallery div[ng-repeat] img')].map(img => img.src));
                } catch(error) {
                    reject(error);
                }
            }, 2500);
        });
    `;

    try {

        let res = await new Request(url,requestOptions)
        let data = await fetchUI(res,script)


        log.innerHTML = data;
        return data.map(element => this.createConnectorURI(this.getAbsolutePath(element, request.url)));
    } catch (erro) {
        log.innerHTML = "deu merda" + erro;

        throw new Error("Ocorreu um erro: " + erro);
    }








}