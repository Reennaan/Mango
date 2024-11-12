package com.example.mangaapp;

import javafx.fxml.FXML;
import javafx.scene.web.WebEngine;
import javafx.scene.web.WebView;
import org.json.JSONArray;
import org.json.JSONObject;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;

import org.openqa.selenium.*;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;


import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import java.io.*;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class MangaLife {
    String url = "https://manga4life.com";




    public JSONArray getAllManga() throws IOException {
        JSONArray jsonArray = new JSONArray();
        try {

            Document document = (Document) Jsoup.connect("https://manga4life.com/directory/")
                    .header("x-cookie", "FullPage=yes")
                    .header("x-referer", "https://manga4life.com")
                    .timeout(20000)
                    .get();


            String html = document.html();


            Pattern pattern = Pattern.compile("vm\\.FullDirectory\\s*=\\s*(\\{.+\\})\\s*;");
            Matcher matcher = pattern.matcher(html);

            if (matcher.find()) {

                String jsonText = matcher.group(1);
                JSONObject fullDirectory = new JSONObject(jsonText);


                JSONArray directory = fullDirectory.getJSONArray("Directory");
                for (int i = 0; i < directory.length(); i++) {
                    JSONObject manga = directory.getJSONObject(i);


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
        //System.out.println(jsonArray);
        return jsonArray;
    }

    public List<Chapter> searchManga2(String id) throws IOException {
        WebDriver driver = ChromeDriver.getDriver();
        String url = "https://manga4life.com/manga/" + id;
        driver.get(url);

        List<Chapter> chapterList = new ArrayList<>();

        try {

            WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
            WebElement showAllButton = wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector(".ShowAllChapters")));
            showAllButton.click();
            String img = driver.findElement(By.cssSelector("img.img-fluid")).getAttribute("src");
            List<WebElement> chapterElements = driver.findElements(By.cssSelector(".list-group-item.ChapterLink"));

            for (WebElement element : chapterElements) {
                Chapter chapter = new Chapter();
                chapter.setLink(element.getAttribute("href"));
                chapter.setName(element.findElement(By.cssSelector("span.ng-binding:nth-of-type(1)")).getText());
                //implementar data depois

                chapterList.add(chapter);
            }




            if (!chapterList.isEmpty()) {
                chapterList.get(0).setImg(img);
                chapterList.get(0).setMangaName(id);
            }

        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            driver.quit();
        }


        chapterList.get(0).setBackground(getBackgroundImg(id));


        return chapterList;
    }

    public String getBackgroundImg(String name) {
        WebDriver driver = ChromeDriver.getDriver();
        driver.get("https://mangadex.org/search?q="+name);

        try {
            WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(20));
            wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("img.rounded")));

            WebElement firstImage = wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector("img.rounded")));


            String imageUrl = firstImage.getAttribute("src");
            System.out.println("URL da primeira imagem: " + imageUrl);
            return imageUrl;
        } catch (TimeoutException e) {
            System.out.println("Imagem não encontrada: o tempo de espera foi excedido.");
        } catch (Exception e) {
            e.printStackTrace();
        } finally {

            driver.quit();
        }
        return "";
    }


    public void searchManga2Async(String id) {
        new Thread(() -> {
            try {
                searchManga2(id);
            } catch (IOException e) {
                e.printStackTrace();
            }
        }).start();
    }





    /*public List<Chapter> searchManga(String id) throws Exception {

        String url = "https://manga4life.com/manga/"+id;


        List<Chapter> chapterList = new ArrayList<>();

        try (final WebClient webClient = new WebClient(BrowserVersion.CHROME)) {
            webClient.getOptions().setJavaScriptEnabled(true);
            webClient.getOptions().setCssEnabled(false);
            webClient.getOptions().setThrowExceptionOnScriptError(false);
            webClient.getOptions().setThrowExceptionOnFailingStatusCode(false);
            HtmlPage page = webClient.getPage(url);

            try {

                HtmlElement botao = page.querySelector(".ShowAllChapters");
                    page = botao.click();
                    webClient.waitForBackgroundJavaScript(1000);
                    String pageSource = page.asXml();
                    Document doc = Jsoup.parse(pageSource);
                    String img = doc.select("img.img-fluid").attr("src");
                Elements fulldoc = doc.select("a.list-group-item");

                fulldoc.stream().forEach(element -> {
                    Chapter chapter = new Chapter();
                    chapter.setLink(element.attr("href"));
                    chapter.setName(element.select("span.ng-binding:nth-of-type(1)").text());
                    chapter.setDate(element.select("span.float-right:nth-of-type(2)").text());
                    chapterList.add(chapter);
                });

                chapterList.get(0).setImg(img);
                chapterList.get(0).setMangaName(id);



            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        return chapterList;

    }*/

    public void downloadMangalifeChapterAsync(String link,String cap,String name) {
        new Thread(() -> {
            try {
                downloadMangalifeChapter(link,cap,name);
            } catch (IOException e) {
                e.printStackTrace();
            }
        }).start();
    }








    public List<File> downloadMangalifeChapter(String link,String cap,String name) throws IOException {
        List<File> downloadedpages = new ArrayList<>();
        WebDriver driver = ChromeDriver.getDriver();


        for (int i = 1; i< 60;i++){
            String url = link+i+".html";

            driver.get(url);

            WebElement pageimg = driver.findElement(By.cssSelector("img.img-fluid"));
            String imgurl = pageimg.getAttribute("ng-src");
            String[] title = driver.findElement(By.cssSelector("meta[property='og:title']")).getAttribute("content").split(" ");


            if(imgurl.isEmpty()){
                break;

            }

            String downloadPath = System.getProperty("user.home")+"/Documents/Mango/"+name.replaceAll("[^a-zA-Z0-9 _\\-\\.]","")+"/Chapter_"+cap;

            try{
                Files.createDirectories(Paths.get(downloadPath));
                HttpClient client = HttpClient.newHttpClient();
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(imgurl))
                        .GET().build();
                HttpResponse<InputStream> response = client.send(request, HttpResponse.BodyHandlers.ofInputStream());
                if(response.statusCode() == 404){

                    break;
                }
                File imageFile = new File(downloadPath, name.replaceAll(" ","-")+cap+ "_Page_"+ i +".png");
                try(FileOutputStream out = new FileOutputStream(imageFile)){
                    response.body().transferTo(out);
                    downloadedpages.add(imageFile);
                }


            }catch (Exception e){
                e.printStackTrace();
            }

        }
        driver.quit();

        return downloadedpages;

    }



    public List<File> downloadChapter(String link , String num, String name) throws IOException {
        List<File> downloadedpages = new ArrayList<>();

        System.out.println("chegou assim:"+ num);
        StringBuilder s = new StringBuilder(num);
        while(s.length() < 4){
            s.insert(0,"0");
            if(s.length() == 4){
                break;
            }
        }
        String downloadPath = System.getProperty("user.home")+"/Documents/Mango/"+name+"/chapter_"+s;

        for(int i = 1; i< 60;i++){
            try{

                String url = "https://scans.lastation.us/manga/"+name+"/"+s+"-0"+(i <10 ? "0" +i : i )+".png";
                String urlhot = "https://scans-hot.leanbox.us/manga/"+name+"/"+s+"-0"+(i <10 ? "0" +i : i )+".png";
                String lowee = "https://official.lowee.us/manga/"+name+"/"+s+"-0"+(i <10 ? "0" +i : i )+".png";
                String lean = "https://hot.leanbox.us/manga/"+name+"/"+s+"-0"+(i <10 ? "0" +i : i )+".png";
                String part = "https://hot.leanbox.us/manga/"+name+"/Part1/"+s+"-0"+(i <10 ? "0" +i : i )+".png";
                if(!isUrlWorking(url)) {
                    url = urlhot;
                }else
                if (!isUrlWorking(urlhot)){
                    url = lowee;
                }else
                if(!isUrlWorking(lowee)){
                    url = lean;
                }else
                if(!isUrlWorking(lean)){
                    url = part;
                }




                Files.createDirectories(Paths.get(downloadPath));
                System.out.println("url:" +url);

                HttpClient client = HttpClient.newHttpClient();
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .GET().build();
                HttpResponse<InputStream> response = client.send(request, HttpResponse.BodyHandlers.ofInputStream());

                if(response.statusCode() == 404){
                    break;
                }

                File imageFile = new File(downloadPath, name + "_" + num + "_"+ i +".png");
                try(FileOutputStream out = new FileOutputStream(imageFile)){
                    response.body().transferTo(out);
                    downloadedpages.add(imageFile);
                }

            }catch (Exception e){
                System.out.println("Erro ao baixar imagem " + i + ": " + e.getMessage());
            }

        }


        return downloadedpages;

    }

    private boolean isUrlWorking(String url) {
        try {
            HttpResponse<Void> response = HttpClient.newHttpClient()
                    .send(HttpRequest.newBuilder(URI.create(url))
                                    .method("HEAD", HttpRequest.BodyPublishers.noBody())
                                    .build(),
                            HttpResponse.BodyHandlers.discarding());
            return response.statusCode() == 200;
        } catch (Exception e) {
            return false;
        }
    }




    private void waitForPageLoad(WebDriver driver) {
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(30));

        wait.until(webDriver -> ((JavascriptExecutor) webDriver)
                .executeScript("return document.readyState").equals("complete"));

        try {
            JavascriptExecutor js = (JavascriptExecutor) driver;
            wait.until(webDriver -> {
                try {
                    return Boolean.TRUE.equals(js.executeScript(
                            "return window.getAllAngularTestabilities().every(function(t) { return t.isStable(); })"
                    ));
                } catch (Exception e) {
                    return true;
                }
            });
        } catch (Exception e) {

        }
    }




}