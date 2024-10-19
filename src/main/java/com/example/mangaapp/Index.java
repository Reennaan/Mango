package com.example.mangaapp;

public class Index {

    public String getHtml (){
        String htmlContent = """
<!DOCTYPE html>
<html lang="en">
<head>
    <link rel="stylesheet" href="src/main/resources/com/example/mangaapp/style/style.css">
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hacunecu</title>
</head>
<body>
<div id="body-container">

    <div id="combo-container">
        <p id="title">Explore sources</p>

        <div class="combobox-wrapper">
        <select id="sources-combobox">
        <option value="">Selecione uma opção </option>
            <option value="opcao1">Opção 1</option>
            <option value="opcao2">Opção 2</option>
            <option value="opcao3">Opção 3</option>
        </select>
        </div>

        <form action="#">
            <div class="search-wrapper">
                <input type="text" class="search-box" placeholder="Search for mangas">
                <img src="src/main/resources/com/example/mangaapp/img/search.png" class="search-icon" width="20px" height="20px">
            </div>
        </form>
        
        <div class="two-column-list">
            <div class="column">
                <ul>
                    <li>Item 1</li>
                    <li>Item 2</li>
                    <li>Item 3</li>
                    <li>Item 4</li>
                    <li>Item 5</li>
                    <li>Item 6</li>
                    <li>Item 7</li>
                    <li>Item 8</li>
                    <li>Item 9</li>
                    <li>Item 10</li>
                </ul>
            </div>
            <div class="divider"></div> <!-- Barra vertical -->
            <div class="column">
                <ul>
                    <li>Item 11</li>
                    <li>Item 12</li>
                    <li>Item 13</li>
                    <li>Item 14</li>
                    <li>Item 15</li>
                    <li>Item 16</li>
                    <li>Item 17</li>
                    <li>Item 18</li>
                    <li>Item 19</li>
                    <li>Item 20</li>
                </ul>
            </div>
        </div>

        <p id="manga-title">manga</p>  

        <div class="manga-img-wrapper">
            <img src="src/main/resources/com/example/mangaapp/img/v74_94.png" class="manga-img" width="170rem" height="230rem">
        </div>    

    </div>
    <div id="image-container">
        <img id="manga-img" src="src/main/resources/com/example/mangaapp/img/v74_96.png" >
    </div>
</div>
</body>
</html>
 """;
        return htmlContent;
    }

}
