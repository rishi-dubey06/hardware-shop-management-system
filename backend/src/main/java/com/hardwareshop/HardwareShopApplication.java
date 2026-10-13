package com.hardwareshop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class HardwareShopApplication {

    public static void main(String[] args) {
        SpringApplication.run(HardwareShopApplication.class, args);
    }
}
