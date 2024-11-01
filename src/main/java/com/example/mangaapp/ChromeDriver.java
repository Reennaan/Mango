package com.example.mangaapp;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeOptions;

public class ChromeDriver {

    public static  WebDriver getDriver(){
        System.setProperty("webdriver.chrome.driver", "D:/drivers/chromedriver/win64/130.0.6723.91");
        WebDriverManager.chromedriver().driverVersion("130.0.6723.91").forceDownload().cachePath("/drivers").clearDriverCache().setup();
        System.setProperty("webdriver.chrome.verboseLogging", "true");
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless");
        options.addArguments("--disable-gpu");
        options.addArguments("--disable-dev-shm-usage");
        options.addArguments("--no-sandbox");
        options.addArguments("--disable-blink-features=AutomationControlled");
        options.addArguments("--verbose");
        options.addArguments("--window-size=1920,1080");


        return new org.openqa.selenium.chrome.ChromeDriver(options);
    }

}
