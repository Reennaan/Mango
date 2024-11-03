package com.example.mangaapp;

import com.gargoylesoftware.htmlunit.BrowserVersion;
import com.gargoylesoftware.htmlunit.WebClient;
import com.gargoylesoftware.htmlunit.html.HtmlElement;
import com.gargoylesoftware.htmlunit.html.HtmlPage;

import org.json.JSONArray;
import org.json.JSONObject;
import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;


import java.io.*;
import java.net.URI;
import java.net.URL;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
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
                    .timeout(10000)
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




    public List<Chapter> searchManga(String id) throws Exception {



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
                    chapter.setName(element.select("span.ng-binding").text());
                    chapter.setDate(element.select("span.float-right").text());
                    chapterList.add(chapter);
                });

                chapterList.get(0).setImg(img);
                chapterList.get(0).setMangaName(id);



            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        return chapterList;

    }


    public List<File> downloadChapter(String link , int num, String name) throws IOException {
        List<File> downloadedpages = new ArrayList<>();

        System.out.println("entrou aqui no download");
        Document doc = (Document) Jsoup.connect(link)
                .header("x-cookie", "FullPage=yes")
                .header("x-referer", "https://manga4life.com")
                .timeout(10000)
                .get();

        /*try {
            WebDriver driver = ChromeDriver.getDriver();
            driver.get(link);
            waitForPageLoad(driver);
            WebElement button = driver.findElement(By.cssSelector(".btn.btn-sm.btn-outline-secondary.ng-binding.ng-scope"));
            ((JavascriptExecutor) driver).executeScript("arguments[0].click();", button);

        }catch (Exception e){
            System.err.println("deu merda:" +e);
        }*/




      /*Elements capSize = doc.select("div.modal-body div.row div.col-md-2");
        System.out.println(capSize);
      int pages = capSize.size();
      System.out.print("tamanho das paginas:"+pages);*/

      for(int i = 1; i< 60;i++){
          try{
              String url = "https://scans.lastation.us/manga/"+name+"/000"+num+"-0"+(i <10 ? "0" +i : i )+".png";
              System.out.println("url:" +url);
              HttpClient client = HttpClient.newHttpClient();
              HttpRequest request = HttpRequest.newBuilder()
                      .uri(URI.create(url))
                      .GET().build();

              String downloadPath = System.getProperty("user.home")+"/Documents/Mango"+name;
              File folder = new File(downloadPath);
              Path path = Paths.get(downloadPath);

              if (!Files.exists(path)) {
                  Files.createDirectory(path);
              }





              String fileName = name + "_" + num + "_" +".png";
              File imageFile = new File(path + File.separator + fileName);


              HttpResponse<InputStream> response = client.send(request, HttpResponse.BodyHandlers.ofInputStream());
              if(response.statusCode() == 404){
                  break;
              }

              System.out.println(response);
              FileOutputStream fileOutputStream = new FileOutputStream(imageFile);
              response.body().transferTo(fileOutputStream);
              fileOutputStream.close();




              downloadedpages.add(imageFile);



          }catch (Exception e){
              System.out.println("Erro ao baixar imagem " + i + ": " + e.getMessage());
          }



      }

        System.out.println(downloadedpages);
        return downloadedpages;

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
