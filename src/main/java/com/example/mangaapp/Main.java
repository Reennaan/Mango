package com.example.mangaapp;

import com.google.gson.Gson;
import io.github.bonigarcia.wdm.WebDriverManager;
import javafx.application.Application;
import javafx.concurrent.Worker;
import javafx.fxml.FXML;
import javafx.geometry.Insets;
import javafx.scene.Scene;
import javafx.scene.image.Image;
import javafx.scene.layout.*;
import javafx.scene.paint.Color;
import javafx.scene.web.WebEngine;
import javafx.scene.web.WebView;
import javafx.stage.Stage;
import netscape.javascript.JSObject;
import org.json.JSONArray;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;

import java.awt.*;
import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import javafx.scene.control.Button;


public class Main extends Application {

    @FXML
    private WebView webView;
    public  WebEngine webEngine;
    public MangaLife mangaLife = new MangaLife();
    public MangaOnlineBiz mangaOnlineBiz = new MangaOnlineBiz();



    @Override
    public void start(Stage stage) throws IOException {

        webView = new WebView();
        webEngine = webView.getEngine();
        webEngine.setOnStatusChanged(event -> {
            System.out.println("Status changed: " + event.getData());
        });

        //SALVE ISSOOO@!@!!!!!
        webEngine.getLoadWorker().stateProperty().addListener((obs, oldState, newState) -> {
            if (newState == Worker.State.SUCCEEDED) {
                JSObject window = (JSObject) webEngine.executeScript("window");
                window.setMember("Controller", this); // Adiciona a instância da classe Main
                System.out.println("Controller registrado com sucesso.");
            }
        });




        webEngine.getLoadWorker().stateProperty().addListener((obs, oldState, newState) -> {
            if (newState == Worker.State.FAILED) {
                System.err.println("Failed to load: " + webEngine.getLocation());
            }
        });










        System.setProperty("prism.order", "hw");
        System.setProperty("prism.text", "lcd");
        System.setProperty("prism.lcdtext", "false");
        System.setProperty("prism.text", "t2k");
        System.setProperty("glass.win.uiScale", "125%");

        URL url = getClass().getResource("/com/example/mangaapp/html/index.html");
        if (url != null) {
            webEngine.load(url.toExternalForm());
        } else {
            System.err.println("Arquivo HTML não encontrado!");
        }
        webView.getEngine().getLoadWorker().exceptionProperty().addListener((observable, oldValue, newValue) -> {
            if (newValue != null) {
                System.out.println("JavaScript Error: " + newValue.getMessage());
            }
        });

        StackPane root = new StackPane(webView);
        root.setBackground(new Background(new BackgroundFill(Color.web("#161616"), CornerRadii.EMPTY, Insets.EMPTY)));
        int x = 1440;
        int y = 1024;
        Scene scene = new Scene(root, x, y);

        stage.setOnCloseRequest(event -> WebDriverManager.chromedriver().clearDriverCache().setup());
        stage.setTitle("Mango");
        stage.setScene(scene);
        stage.setResizable(false);
        stage.getIcons().add(new Image(Objects.requireNonNull(getClass().getResourceAsStream("/com/example/mangaapp/img/icon.jpg"))));
        stage.show();

    }


    public static void main(String[] args) {
        launch();
    }

    public void receiveItem(String item) throws Exception {
        System.out.println("ta passando aqui?????: " + item);
        MangaLife mangaLife = new MangaLife();
        WebEngine webEngine = webView.getEngine();
        List<Chapter> chapters = mangaLife.searchManga2(item);
        System.out.println(item);
        //Thread.sleep(2000);
        Gson gson = new Gson();
        String jsonChapters = gson.toJson(chapters);
        String script = "chapterList(" + jsonChapters + ")";
        webEngine.executeScript(script);

    }
    public void activateAnimeLife() throws IOException {
        System.out.println("passou aqui");
        WebEngine webEngine = webView.getEngine();
        JSONArray a = mangaLife.getAllManga();
        String script = "initializeMangaList("+a+");";
        webEngine.executeScript(script);

    }

    public void activateMangaOnlineBiz() throws IOException {
        System.out.println("passou no manga biz");
        WebEngine webEngine = webView.getEngine();
        JSONArray a = mangaOnlineBiz.getAllMangaBiz();
        String script = "initializeMangaList("+a+");";
        webEngine.executeScript(script);

    }

    public void downloadChapter(String link, String chapternum, String name,String id,String format) throws IOException {
        System.out.println("antes:"+chapternum);
        String result = chapternum.replaceAll("[a-zA-Z]", "");
        result = result.replaceAll("\\.","").trim();
        result = result.replaceAll("#", "").trim();
        System.out.println("depois:"+result);
        MangaLife mangaLife = new MangaLife();
        String fixedlink = link.substring(0,link.length() -6);
        System.out.println(link);
        this.webEngine = webView.getEngine();
        if(format.trim().equals("Png")){
            mangaLife.downloadMangalifeChapterAsync(fixedlink,result,name,webEngine,id);
        } else if (format.trim().equals("Pdf")) {
            mangaLife.downloadMangalifeChapterPdfAsync(fixedlink,result,name,webEngine,id);
        }else {
            mangaLife.downloadMangalifeChapterAsync(fixedlink,result,name,webEngine,id);
        }




    }

    public WebEngine getWebEngine(){
        WebEngine webEngine = webView.getEngine();
        return webEngine;
    }


}