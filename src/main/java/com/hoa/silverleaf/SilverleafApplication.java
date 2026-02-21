package com.hoa.silverleaf;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class SilverleafApplication {

    public static void main(String[] args) {
        SpringApplication.run(SilverleafApplication.class, args);
    }

}
