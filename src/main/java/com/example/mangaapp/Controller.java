package com.example.mangaapp;

import javafx.fxml.FXML;
import javafx.scene.control.Label;
import javafx.scene.web.WebEngine;
import javafx.scene.web.WebView;
import org.json.JSONArray;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;

import java.io.IOException;
import java.util.List;

public class Controller {
    @FXML
    private Label welcomeText;

    @FXML
    private WebView webView;

    WebEngine webEngine = webView.getEngine();

    @FXML
    protected void onHelloButtonClick() {
        welcomeText.setText("Welcome to JavaFX Application!");
    }
    MangaLife mangaLife = new MangaLife();
    public void onComboChange(String value) throws IOException {
        if ("AnimeLife".equals(value)) {
            

            JSONArray a = mangaLife.getAllManga();
            String script = "initializeMangaList("+a+");";
            webEngine.executeScript(script);
        }
    }

    public void sendItemToJava(String id) throws Exception {
        System.out.println("Item recebido do JavaScript: " + id);

        List<Chapter> chapters = mangaLife.searchManga(id);
        System.out.println(chapters);
        
    }

}