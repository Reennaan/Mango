package com.example.mangaapp;

public class Mangas {
    String id;
    String title;

    public Mangas(String id, String title) {
        this.id = id;
        this.title = title;
    }

    @Override
    public String toString() {
        return "ID: " + id + ", Title: " + title;
    }

    public String getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public void setId(String id) {
        this.id = id;
    }

    public void setTitle(String title) {
        this.title = title;
    }
}
