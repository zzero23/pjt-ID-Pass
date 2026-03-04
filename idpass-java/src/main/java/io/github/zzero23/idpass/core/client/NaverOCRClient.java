package io.github.zzero23.idpass.core.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

/**
 * Naver CLOVA OCR API 호출 클라이언트
 * 공식 문서: https://api.ncloud-docs.com/docs/ai-application-service-ocr-general
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NaverOCRClient {

    @Value("${naver.ocr.invoke-url}")
    private String apiUrl;

    @Value("${naver.ocr.secret-key}")
    private String secretKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    /**
     * 이미지 파일을 Naver OCR API로 전송하고 원본 JSON 응답을 반환합니다.
     *
     * @param file 분석할 이미지 파일
     * @return Naver OCR API의 전체 응답 JSON 문자열
     */
    public String callOCR(MultipartFile file) throws Exception {
        // 1. 요청 메타 JSON 구성 (message 파라미터)
        String messageJson = buildMessageJson(file.getOriginalFilename());

        // 2. MultipartBody 구성: message(JSON) + file(binary)
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("message", messageJson);
        body.add("file", file.getResource());

        // 3. 헤더 설정 (Secret Key는 X-OCR-SECRET 헤더로 전달)
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.set("X-OCR-SECRET", secretKey);

        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

        // 4. API 호출
        ResponseEntity<String> response = restTemplate.exchange(
                apiUrl,
                HttpMethod.POST,
                request,
                String.class
        );

        log.debug("Naver OCR 응답 상태: {}", response.getStatusCode());
        return response.getBody();
    }

    public String callOCR(byte[] fileBytes, String originalFilename) throws Exception {
        // 1. 요청 메타 JSON 구성
        String messageJson = buildMessageJson(originalFilename);

        // 2. MultipartBody 구성: byte[]를 ByteArrayResource로 감싸서 전달
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("message", messageJson);

        // 중요: 파일 이름과 함께 바이트 데이터를 리소스로 추가
        org.springframework.core.io.Resource resource = new org.springframework.core.io.ByteArrayResource(fileBytes) {
            @Override
            public String getFilename() {
                return originalFilename;
            }
        };
        body.add("file", resource);

        // 3. 헤더 설정
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.set("X-OCR-SECRET", secretKey);

        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

        // 4. API 호출
        ResponseEntity<String> response = restTemplate.exchange(
                apiUrl,
                HttpMethod.POST,
                request,
                String.class
        );

        return response.getBody();
    }

    /**
     * Naver OCR API 요청에 필요한 message 파라미터 JSON을 생성합니다.
     */
    private String buildMessageJson(String originalFilename) throws Exception {
        // 파일 확장자 추출 (jpg, png, pdf 등)
        String ext = "jpg";
        if (originalFilename != null && originalFilename.contains(".")) {
            ext = originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase();
        }

        // Naver OCR API message 포맷
        var messageNode = objectMapper.createObjectNode();
        messageNode.put("version", "V2");
        messageNode.put("requestId", UUID.randomUUID().toString());
        messageNode.put("timestamp", System.currentTimeMillis());

        var imageNode = objectMapper.createObjectNode();
        imageNode.put("format", ext);
        imageNode.put("name", originalFilename != null ? originalFilename : "image");

        messageNode.set("images", objectMapper.createArrayNode().add(imageNode));

        return objectMapper.writeValueAsString(messageNode);
    }
}