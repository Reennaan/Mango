package com.example.mangaapp;

import com.google.gson.Gson;
import org.json.JSONArray;
import org.json.JSONObject;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;


import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
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

    public String searchManga(String id) throws IOException {
        Document document = (Document) Jsoup.connect(url+"/manga/"+id).header("x-cookie", "FullPage=yes")
                .header("x-referer", "https://manga4life.com")
                .get();
        return document.toString();
    }


}
