module com.example.mangaapp {
    requires javafx.controls;
    requires javafx.fxml;
    requires javafx.web;
    requires org.jsoup;
    requires org.json;
    requires com.google.gson;
    requires org.apache.commons.lang3;


    opens com.example.mangaapp to javafx.fxml,com.google.gson;
    exports com.example.mangaapp;
}