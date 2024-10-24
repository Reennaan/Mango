 const search = document.querySelector('.search-box');
 const matchList = document.getElementById("match-list")
 const sources = document.querySelector("#sources-combobox")
 const log = document.querySelector("#log")
 const img = document.querySelector(".manga-img");
 const column1 = document.querySelector(".column1");


    document.addEventListener("DOMContentLoaded", function() {
        const list = [];
        
        window.initializeMangaList = function(json) {
            json.forEach(data => {
                list.push(data.title);
            });
            sources.addEventListener('change', function() {
                if(this.value === "AnimeLife")
                    $("#auto_check").autocomplete({
                        source: function(request, response) {
                            const results = $.ui.autocomplete.filter(list, request.term);
                            response(results.slice(0, 7));
                        },
                        minLength: 1,
                        select: function(event, ui) {
                            const selectedItem = ui.item.value;
                            const index = json.findIndex(item => item.title === selectedItem)
                            

                              
                                if (window.Controller) {
                                    try {
                                        window.Controller.receiveItem(json[index].id); 
                                        //log.innerHTML = "Enviado para Java com sucesso: " + json[index].id+"<br>";
                                    } catch (e) {
                                        log.innerHTML =  log + "Erro ao enviar para Java: " + e+"<br>";
                                    }
                                } else {
                                    log.innerHTML =  log +"JavaController não está disponível."+"<br>"; 
                                }     
                        }
                    });
            });
        };
    });

 function chapterList(chapters){
    img.src = chapters[0].img.toString();
    /*for(let i = 0; i< chapters.length; i++){
        if()
        const li = document.createElement("li");
        li.onclick = function(){

        }
        li.innerHTML = chapters[i].name  
    }*/
 }    
    



        
        

     