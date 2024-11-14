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
//const spinner = document.querySelector(".spinner-grow");



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
        li.classList.add("li-chapter");

        const imgdownload = document.createElement("div");
        imgdownload.classList.add("chapter-download");

        const cloudicon = document.createElement("i");
        cloudicon.classList.add("fa", "fa-cloud-arrow-down");

        const checkdownload = document.createElement("input");
        checkdownload.className = "form-check-input";
        checkdownload.type = "checkbox";



        const spinner = document.createElement('div');

        // Adicionar as classes ao spinner
        spinner.classList.add('spinner-grow', 'text-light');
        spinner.setAttribute('role', 'status');

        // Criar o elemento span
        const span = document.createElement('span');
        span.classList.add('sr-only');
        span.textContent = 'Loading...';
        spinner.style.display = "none";


    
        imgdownload.appendChild(cloudicon);




     
        imgdownload.onclick = async () => {
            cloudicon.style.display = "none"
            spinner.style.display = "inline-block"
            imgdownload.appendChild(spinner);
            imgdownload.offsetHeight;
            
    
            try {
                
                await window.Controller.downloadChapter(chapters[i].link, chapters[i].name.trim(), chapters[0].mangaName);
            
            } finally {
                log.innerHTML = "terminou"
             
                
            }
        };

        if(i == 0){
            img.src = chapters[0].img;
            mangatitle.innerHTML = chapters[0].mangaName;
            background.src = chapters[0].background;
        }

        const chapterText = `${chapters[i].name.trim()}`;
        const textNode = document.createTextNode(chapterText);

        li.appendChild(imgdownload);
    
        li.appendChild(checkdownload);
        li.appendChild(textNode);

        const div = chapters.length / 2;

        if (i < div) {
            ul1.appendChild(li);
        } else {
            ul2.appendChild(li);
        }
    }

}

function downloadComplete(){
    spinner.style.display = "none";
    cloudicon.style.display = "inline-block";
}



