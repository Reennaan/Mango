package com.example.mangaapp;

import com.gargoylesoftware.htmlunit.BrowserVersion;
import com.gargoylesoftware.htmlunit.WebClient;
import com.gargoylesoftware.htmlunit.html.HtmlElement;
import com.gargoylesoftware.htmlunit.html.HtmlPage;
import com.google.gson.Gson;
import io.github.bonigarcia.wdm.WebDriverManager;
import javafx.scene.web.WebEngine;
import org.json.JSONArray;
import org.json.JSONObject;
import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;


import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URL;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
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
        System.out.println(jsonArray);
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
                    webClient.waitForBackgroundJavaScript(5000);
                    Thread.sleep(1000);
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
