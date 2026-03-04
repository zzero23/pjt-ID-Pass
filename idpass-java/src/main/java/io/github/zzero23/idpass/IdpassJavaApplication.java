package io.github.zzero23.idpass;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling // ✅ 이거 꼭 추가!
@SpringBootApplication
public class IdpassJavaApplication {

	public static void main(String[] args) {
		SpringApplication.run(IdpassJavaApplication.class, args);
	}

}
