const log = document.querySelector("#log")
const img = document.querySelector(".manga-img");
const column1 = document.querySelector(".column1");
const ul1 = document.querySelector("#ul1")
const ul2 = document.querySelector("#ul2")
const mangatitle = document.querySelector("#manga-title")
const description = document.querySelector("#description")
const author = document.querySelector("#author")
const background = document.querySelector("#manga-background")
const dropdownItems = document.querySelectorAll("#dropdownItem")
const dropdownButton = document.querySelector('#dropdownMenuButton');
const formatDropdown = document.querySelector(".format-dropdown-container");
const formatdropdownButton = document.querySelector(".format");
const formatItemDropdown = document.querySelectorAll(".format-item");
const chapterText = document.querySelector(".chapter-text");
const bodyContainer = document.querySelector("#body-container");



formatItemDropdown.forEach(item =>{
    item.addEventListener("click", ()=>{
        const value = item.textContent;
        formatdropdownButton.textContent = value.toString();
    })
})


document.addEventListener("DOMContentLoaded", function () {
    const list = [];
    dropdownItems.forEach(item => {
        item.addEventListener("click", () => {
            const value = item.textContent;

            dropdownButton.textContent = value.toString();

            if (value === "MangaLife") {
                window.Controller.activateAnimeLife();
                dropdownButton.textContent = "MangaLife";
            }

            if (value === "MangaOnlineBiz") {
                window.Controller.activateMangaOnlineBiz();
                dropdownButton.textContent = "MangaOnlineBiz";
            }
        });
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

    formatDropdown.style.display = "block";
    chapterText.style.display = "block";


    const downloadAllbutton = document.createElement("i")
    downloadAllbutton.classList.add("downloadAll","fa-solid","fa-download");

    const selectAll = document.createElement("i");
    selectAll.classList.add("fa-solid","fa-list-check");
    selectAll.addEventListener("click", () =>{
        selectAllChapters();
    });


    bodyContainer.appendChild(downloadAllbutton);
    bodyContainer.appendChild(selectAll);



    for (let i = 0; i < chapters.length; i++) {
        const li = document.createElement("li");
        li.classList.add("li-chapter");
        li.setAttribute("id",i)


        const imgdownload = document.createElement("div");
        imgdownload.classList.add("chapter-download");

        const cloudicon = document.createElement("i");
        cloudicon.classList.add("fa", "fa-cloud-arrow-down");
        cloudicon.style.fontSize = "20px"

        const checkdownload = document.createElement("input");
        checkdownload.className = "form-check-input";
        checkdownload.type = "checkbox";



        const spinner = document.createElement('div');

       
        spinner.classList.add('spinner-grow', 'text-light');
        spinner.setAttribute('role', 'status');

      
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
            await window.Controller.downloadChapter(chapters[i].link, chapters[i].name.trim(), chapters[0].mangaName, li.id.toString(), formatdropdownButton.textContent.toString());
            
           
        };

        if(i == 0){
            img.src = chapters[0].img;
            mangatitle.innerHTML = chapters[0].mangaName;
            background.src = chapters[0].background;
            description.innerHTML = chapters[0].desc;
            author.innerHTML = chapters[0].author;
            
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

function downloadComplete(id){
    //o downloadComplete ja está sendo chamado, mas agora precisa do indice
    const li = document.getElementById(id)
    const spinner = li.querySelector(".spinner-grow");
    const cloudicon = li.querySelector(".fa")

    if (spinner) {
        spinner.style.display = "none";
    }
    if (cloudicon) {
        cloudicon.style.display = "inline-block"; 
    }
    
}


function selectAllChapters(){
    let allChecked = true;

   
    checkboxes.forEach(checkbox => {
        if (!checkbox.checked) {
            allChecked = false;
        }
    });

    
    checkboxes.forEach(checkbox => {
        checkbox.checked = !allChecked;
    });
}