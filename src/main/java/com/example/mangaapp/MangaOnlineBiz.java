package com.example.mangaapp;

import org.json.JSONArray;
import org.json.JSONObject;
import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.select.Elements;

import java.io.IOException;
import java.net.CookieHandler;
import java.net.CookieManager;
import java.net.CookiePolicy;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.ConsoleHandler;
import java.util.logging.Level;
import java.util.logging.Logger;

public class MangaOnlineBiz{

    String img;
    String title;
    String link;

    public MangaOnlineBiz(String img, String title, String link) {
        this.img = img;
        this.title = title;
        this.link = link;

    }

    public MangaOnlineBiz(){


    }

    public String getImg() {
        return img;
    }

    public String getTitle() {
        return title;
    }

    public String getLink() {
        return link;
    }


    public void setImg(String img) {
        this.img = img;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setLink(String link) {
        this.link = link;
    }



    public JSONArray getAllMangaBiz() throws IOException {
        JSONArray listOfMangas = new JSONArray();

        Logger logger = Logger.getLogger("java.net");
        ConsoleHandler handler = new ConsoleHandler();
        handler.setLevel(Level.SEVERE);
        logger.addHandler(handler);
        logger.setLevel(Level.SEVERE);
        logger.setLevel(Level.OFF);



        for(int i = 1; i <= 8; i++) {
            String url = "https://mangaonline.biz/manga/page/" + i;
            try {
                Document doc = Jsoup.connect(url)
                        .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.70 Safari/537.36")
                        .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8")
                        .header("Accept-Language", "en-US,en;q=0.5")
                        .header("Referer", "https://mangaonline.biz")
                        .timeout(10000)
                        .get();

                Elements mangas = doc.select("article.item");

                mangas.stream().forEach(element -> {
                    JSONObject manga = new JSONObject();
                    manga.put("link", element.select("article div.poster a").attr("href"));
                    manga.put("img", element.select("article div.poster a img").attr("src"));
                    manga.put("title", element.select("article div.poster a img").attr("alt"));
                    listOfMangas.put(manga);
                });

                System.out.println("Página " + i + " processada. Total de mangás até agora: " + listOfMangas.length());

            } catch (IOException e) {
                System.err.println("Erro ao processar página " + i + ": " + e.getMessage());
            }
        }


        return listOfMangas;
    }

}
