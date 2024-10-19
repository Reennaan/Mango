package com.example.mangaapp;

import javafx.application.Application;
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

import java.io.IOException;
import java.net.URL;
import java.util.List;
import java.util.Objects;

public class Main extends Application {

    @FXML
    private WebView webView;

    @Override
    public void start(Stage stage) throws IOException {
        webView = new WebView();
        WebEngine webEngine = webView.getEngine();
        System.setProperty("prism.order", "hw"); // ou "hw"
        System.setProperty("prism.text", "lcd");

        MangaLife mangaLife = new MangaLife();
        //List<Mangas> a = mangaLife.getAllManga();
        //System.out.println(a);


        URL url = getClass().getResource("/com/example/mangaapp/html/index.html");

        if (url != null) {
            webEngine.load(url.toExternalForm());
        } else {
            System.err.println("Arquivo HTML não encontrado!");
        }

        StackPane root = new StackPane(webView);
        root.setBackground(new Background(new BackgroundFill(Color.web("#161616"), CornerRadii.EMPTY, Insets.EMPTY)));
        int x = 1440;
        int y = 1024;
        Scene scene = new Scene(root, x, y);
        ComboBox<String> comboBox = new ComboBox<>();
        
        
        stage.setTitle("Mango");
        stage.setScene(scene);
        stage.setResizable(false); // Desativa redimensionamento da janela
        stage.getIcons().add(new Image(Objects.requireNonNull(getClass().getResourceAsStream("/com/example/mangaapp/img/icon.jpg"))));
        stage.show();
    }

    public static void main(String[] args) {
        launch();
    }
}
