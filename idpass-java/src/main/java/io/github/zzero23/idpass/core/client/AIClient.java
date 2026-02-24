package io.github.zzero23.idpass.core.client;

import io.github.zzero23.idpass.api.dto.OCRResponseDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import java.util.*;

@Component
public class AIClient {
    @Value("${naver.ocr.invoke-url}") private String invokeUrl;
    @Value("${naver.ocr.secret-key}") private String secretKey;

    public OCRResponseDto requestAnalysis(String base64Image) {
        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-OCR-SECRET", secretKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        body.put("version", "V2");
        body.put("requestId", UUID.randomUUID().toString());
        body.put("timestamp", System.currentTimeMillis());

        Map<String, String> image = new HashMap<>();
        image.put("format", "jpg");
        image.put("data", base64Image); // 메모리 내 처리 (Zero-Trace)
        image.put("name", "id_card");

        body.put("images", Collections.singletonList(image));

        return restTemplate.postForObject(invokeUrl, new HttpEntity<>(body, headers), OCRResponseDto.class);
    }
}