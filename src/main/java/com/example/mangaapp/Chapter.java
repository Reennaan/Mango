package com.example.mangaapp;

public class Chapter {
    private String id;
    private String link;
    private String name;
    private String mangaName;
    private String date;
    private String img;
    private String author;
    private String desc;
    private String background;

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

    public Chapter(String id,String link, String name, String date,String img,String mangaName,String author, String desc,String background ) {
        this.link = link;
        this.name = name;
        this.date = date;
        this.img = img;
        this.mangaName = mangaName;
        this.author = author;
        this.desc = desc;
        this.background = background;
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

    public void setMangaName(String mangaName) {
        this.mangaName = mangaName;
    }

    public void setAuthor(String author) {
        this.author = author;
    }

    public void setDesc(String desc) {
        this.desc = desc;
    }

    public String getMangaName() {
        return mangaName;
    }

    public String getImg() {
        return img;
    }

    public String getAuthor() {
        return author;
    }

    public String getDesc() {
        return desc;
    }

    public void setBackground(String background) {
        this.background = background;
    }

    public String getBackground() {
        return background;
    }
}
