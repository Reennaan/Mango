package com.example.mangaapp;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import javafx.application.Application;
import javafx.concurrent.Worker;
import javafx.fxml.FXML;
import javafx.geometry.Insets;
import javafx.scene.Scene;
import javafx.scene.control.ComboBox;
import javafx.scene.image.Image;
import javafx.scene.layout.Background;
import javafx.scene.layout.BackgroundFill;
import javafx.scene.layout.CornerRadii;
import javafx.scene.layout.StackPane;
import javafx.scene.paint.Color;
import javafx.scene.web.WebEngine;
import javafx.scene.web.WebView;
import javafx.stage.Stage;
import org.apache.commons.lang3.StringEscapeUtils;
import org.json.JSONArray;
import javafx.stage.Screen;
import java.io.IOException;
import java.lang.reflect.Type;
import java.net.URL;
import java.util.List;
import java.util.Objects;

public class Main extends Application {

    @FXML
    private WebView webView;
    public String value;
    public MangaLife mangaLife = new MangaLife();



    @Override
    public void start(Stage stage) throws IOException {
        webView = new WebView();
        WebEngine webEngine = webView.getEngine();
        webEngine.setOnStatusChanged(event -> {
            System.out.println("Status changed: " + event.getData());
        });

        webEngine.getLoadWorker().stateProperty().addListener((obs, oldState, newState) -> {
            if (newState == Worker.State.FAILED) {
                System.err.println("Failed to load: " + webEngine.getLocation());
            }
        });

        System.setProperty("prism.order", "hw");
        System.setProperty("prism.text", "lcd");
        URL url = getClass().getResource("/com/example/mangaapp/html/index.html");
        if (url != null) {
            webEngine.load(url.toExternalForm());
        } else {
            System.err.println("Arquivo HTML não encontrado!");
        }


        JSONArray a = mangaLife.getAllManga();
        webEngine.getLoadWorker().stateProperty().addListener((observable, oldValue, newValue) -> {
            if (newValue == javafx.concurrent.Worker.State.SUCCEEDED) {
                String script = "initializeMangaList("+a+");";
                webEngine.executeScript(script);
            }
        });


        StackPane root = new StackPane(webView);
        root.setBackground(new Background(new BackgroundFill(Color.web("#161616"), CornerRadii.EMPTY, Insets.EMPTY)));
        int x = 1440;
        int y = 1024;
        Scene scene = new Scene(root, x, y);
        ComboBox<String> comboBox = new ComboBox<>();
        Screen screen = Screen.getPrimary();



        stage.setTitle("Mango");
        stage.setScene(scene);
        stage.setResizable(false); // Desativa redimensionamento da janela
        stage.getIcons().add(new Image(Objects.requireNonNull(getClass().getResourceAsStream("/com/example/mangaapp/img/icon.jpg"))));
        stage.show();
    }

    public void callSource(String source){

    }


    public static void main(String[] args) {
        launch();
    }
}
