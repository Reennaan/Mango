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
        
        if (value === "AnimeLife") {
            window.Controller.activateSource();
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



                        if (window.Controller) {
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
        const imgdownload = document.createElement("img");
        const imgpreview = document.createElement("img");

        imgdownload.src = "../img/downloadcloud.png";
        imgpreview.src = "../img/previeweye.png";


        imgdownload.classList.add("chapter-download");
        imgpreview.classList.add("chapter-preview");

        if(i == 0){
            img.src = chapters[0].img
            mangatitle.innerHTML = chapters[0].mangaName;
        }

        background.src = chapters[0].background;

        const chapterText = `${chapters[i].name.trim()}`;
        const textNode = document.createTextNode(chapterText);

        li.appendChild(imgdownload);
        li.appendChild(imgpreview);
        li.appendChild(textNode);

        div = chapters.length / 2;

        if (i < div) {
            ul1.appendChild(li);
        } else {
            ul2.appendChild(li);
        }
    }
    
    

}







