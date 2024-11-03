package com.example.mangaapp;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeOptions;

public class ChromeDriver {

    public static  WebDriver getDriver(){
        WebDriverManager.chromedriver().setup();

        ChromeOptions options = new ChromeOptions();
        options.addArguments("--disable-blink-features=AutomationControlled");
        options.addArguments("--verbose");
        options.addArguments("--window-size=1920,1080");
        options.addArguments("--headless");


        return new org.openqa.selenium.chrome.ChromeDriver(options);
    }

}
