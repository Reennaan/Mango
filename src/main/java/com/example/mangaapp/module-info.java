module com.example.mangaapp {
    requires javafx.controls;
    requires javafx.fxml;
    requires javafx.web;
    requires org.jsoup;
    requires org.json;

    opens com.example.mangaapp to javafx.fxml;
    exports com.example.mangaapp;
}