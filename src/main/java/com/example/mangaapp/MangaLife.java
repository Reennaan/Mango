package com.example.mangaapp;

import com.google.gson.Gson;
import io.github.bonigarcia.wdm.WebDriverManager;
import org.json.JSONArray;
import org.json.JSONObject;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;


import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URL;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class MangaLife {
    String url = "https://manga4life.com";

    public JSONArray getAllManga() throws IOException {
        JSONArray jsonArray = new JSONArray();
        try {
            // Fazer a requisição e obter a resposta HTML
            Document document = (Document) Jsoup.connect("https://manga4life.com/directory/")
                    .header("x-cookie", "FullPage=yes")
                    .header("x-referer", "https://manga4life.com")
                    .timeout(10000)
                    .get();

            // Extrair o conteúdo HTML da resposta
            String html = document.html();

            // Usar expressão regular para capturar o objeto FullDirectory
            Pattern pattern = Pattern.compile("vm\\.FullDirectory\\s*=\\s*(\\{.+\\})\\s*;");
            Matcher matcher = pattern.matcher(html);

            if (matcher.find()) {
                // Extrair o JSON encontrado
                String jsonText = matcher.group(1);
                JSONObject fullDirectory = new JSONObject(jsonText);

                // Processar os dados do JSON
                JSONArray directory = fullDirectory.getJSONArray("Directory");
                for (int i = 0; i < directory.length(); i++) {
                    JSONObject manga = directory.getJSONObject(i);

                    // Resolver entidades HTML (exemplo para título)
                    String title = Jsoup.parse(manga.getString("s")).text();
                    String id = manga.getString("i");
                    JSONObject json = new JSONObject();
                    json.put("id",id);
                    json.put("title",title);


                    jsonArray.put(json);

                }
            } else {
                System.out.println("Não foi possível encontrar o FullDirectory.");
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        return jsonArray;
    }

    public List<Chapter> searchManga(String id) throws Exception {

        WebDriverManager.chromedriver().setup();
        System.setProperty("webdriver.chrome.verboseLogging", "true");
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless");
        options.addArguments("--disable-gpu");
        options.addArguments("--disable-dev-shm-usage");
        options.addArguments("--no-sandbox");
        options.addArguments("--disable-blink-features=AutomationControlled");
        options.addArguments("--verbose");
        options.addArguments("--window-size=1920,1080");
        WebDriver driver = new ChromeDriver(options);





        List<Chapter> chaptersList = new ArrayList<>();
        String url = "https://manga4life.com/manga/"+id;

        driver.get(url);
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        driver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(10));

        JavascriptExecutor js = (JavascriptExecutor) driver;
        js.executeScript(
                "var scope = angular.element(document.querySelector('.ShowAllChapters')).scope();" +
                        "scope.vm.LimitChapter = scope.vm.Chapters.length;" +
                        "scope.$apply();"
        );


        List<WebElement> chapterElements = wait.until(ExpectedConditions.visibilityOfAllElementsLocatedBy(By.cssSelector("div.list-group > a")));
        WebElement img = driver.findElement(By.xpath("//img[contains(@class, 'img-fluid bottom-5')]"));
        WebElement manganame = driver.findElement(By.xpath("//li[contains(@class, 'list-group-item d-none d-sm-block')]/h1"));
        WebElement author = driver.findElement(By.xpath("//li[@class='list-group-item d-none d-md-block' and ./span[@class='mlabel' and text()='Author(s):']]"));
        //WebElement desc = driver.findElement(By.cssSelector("div.col-md-9.col-sm-8.top-5 li:nth-child(10) div"));

        //Espera a página carregar completamente
        waitForPageLoad(driver);

        for (int i = 0; i< chapterElements.size(); i++) {
            Chapter chapter = new Chapter();
            String chapterId = chapterElements.get(i).getAttribute("href");
            if(i == 0){
                chapter.setImg(img.getAttribute("src"));
                chapter.setMangaName(manganame.getText());
                chapter.setAuthor(author.getText());
                //chapter.setDesc(desc.getText());
            }

            List<WebElement> title = driver.findElements(By.xpath("//div[@class='list-group top-10 bottom-5 ng-scope']/a[contains(@class, 'ChapterLink')]/span[@class='ng-binding' and contains(@style, 'font-weight:600')]"));
            List<WebElement>  data = driver.findElements(By.xpath("//div[@class='list-group top-10 bottom-5 ng-scope']/a[contains(@class, 'ChapterLink')]/span[contains(@class, 'float-right')]"));

            chapter.setId(chapterId);
            chapter.setName(title.get(i).getText());
            chapter.setDate(data.get(i).getText());

            chaptersList.add(chapter);

        }



        /*String urlal ="https://www.anime-planet.com/manga/"+chaptersList.get(0).getMangaName();

        try{
            driver.get(urlal);
            WebElement backgroundlink = wait.until(ExpectedConditions.presenceOfElementLocated(By.xpath("//img[@itemprop='image' and contains(@class, 'screenshots')]")));
            String imgsrc = backgroundlink.getAttribute("src");
            chaptersList.get(0).setBackground(imgsrc);
            System.out.println(backgroundlink);

        }catch(Exception e){
            throw new Exception(e);
        }*/



        driver.quit();



        return chaptersList;


    }





    // Método auxiliar para esperar o carregamento da página
    private void waitForPageLoad(WebDriver driver) {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(30));

        // Espera o estado da página
        wait.until(webDriver -> ((JavascriptExecutor) webDriver)
                .executeScript("return document.readyState").equals("complete"));

        // Espera adicional para elementos Angular (se necessário)
        try {
            JavascriptExecutor js = (JavascriptExecutor) driver;
            wait.until(webDriver -> {
                try {
                    return Boolean.TRUE.equals(js.executeScript(
                            "return window.getAllAngularTestabilities().every(function(t) { return t.isStable(); })"
                    ));
                } catch (Exception e) {
                    return true; // Retorna true se não for uma página Angular
                }
            });
        } catch (Exception e) {
            // Ignora se não for uma página Angular
        }
    }


}
