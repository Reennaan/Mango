package com.example.mangaapp;

public class Chapter {
    private String id;
    private String link;
    private String name;
    private String date;
    private String img;

    public Chapter() {

    }


    public void Chapter (){

    }

    @Override
    public String toString() {
        return "Chapter{" +
                "id='" + id + '\'' +
                ", name='" + name + '\'' +
                '}';
    }

    public Chapter(String id,String link, String name, String date,String img) {
        this.link = link;
        this.name = name;
        this.date = date;
        this.img = img;
    }


    public String getLink() {
        return link;
    }

    public String getName() {
        return name;
    }

    public String getDate() {
        return date;
    }

    public void setLink(String link) {
        this.link = link;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public void setImg(String img) {
        this.img = img;
    }
}
