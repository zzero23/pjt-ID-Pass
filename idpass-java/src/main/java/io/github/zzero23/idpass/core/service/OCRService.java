package io.github.zzero23.idpass.core.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.zzero23.idpass.api.dto.ocr.OCRResponseDto;
import io.github.zzero23.idpass.core.client.NaverOCRClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class OCRService {

    private final NaverOCRClient naverOCRClient;
    private final ObjectMapper objectMapper;

    private static final Pattern RRN_PATTERN = Pattern.compile("(\\d{6})\\s*-\\s*(\\d{1,7})?");
    private static final Pattern KOREAN_ONLY = Pattern.compile("[가-힣]+");
    // '특별시' 제거됨 (주소 잘림 방지) [cite: 2026-02-26]
    private static final Pattern ISSUER_PATTERN = Pattern.compile("(구청장|시청장|군수|읍장|면장|시장인|고양시장|서울시장)");

    public List<OCRResponseDto> analyzeAll(List<MultipartFile> files) {
        List<OCRResponseDto> results = new ArrayList<>();
        for (MultipartFile file : files) {
            results.add(analyzeSingle(file));
        }
        return results;
    }

    private OCRResponseDto analyzeSingle(MultipartFile file) {
        String fileName = file.getOriginalFilename();
        try {
            String rawJson = naverOCRClient.callOCR(file);
            return parseFromFields(fileName, rawJson);
        } catch (Exception e) {
            log.error("[{}] OCR 처리 실패: {}", fileName, e.getMessage(), e);
            return OCRResponseDto.builder()
                    .fileName(fileName)
                    .success(false)
                    .errorMessage("OCR 처리 중 오류 발생")
                    .build();
        }
    }

    private OCRResponseDto parseFromFields(String fileName, String rawJson) throws Exception {
        JsonNode root = objectMapper.readTree(rawJson);
        JsonNode fields = root.path("images").get(0).path("fields");

        List<String> texts = new ArrayList<>();
        for (JsonNode field : fields) {
            String text = field.path("inferText").asText("").trim();
            if (!text.isEmpty()) texts.add(text);
        }

        int rrnIndex = -1;
        String rawFront = "";
        String rawBack = "";

        for (int i = 0; i < texts.size(); i++) {
            Matcher m = RRN_PATTERN.matcher(texts.get(i));
            if (m.find()) {
                rrnIndex = i;
                rawFront = m.group(1);
                rawBack = m.group(2) != null ? m.group(2) : "";
                break;
            }
        }

        return OCRResponseDto.builder()
                .fileName(fileName)
                .name(extractName(texts, rrnIndex))
                .birthDate(parseBirthDate(rawFront, rawBack)) // 메서드 호출 [cite: 2026-02-26]
                .gender(parseGender(rawBack))               // 메서드 호출 [cite: 2026-02-26]
                .residentNumber(rawFront.isEmpty() ? "인식 실패" : rawFront + "-*******")
                .address(extractAddress(texts, rrnIndex))
                .success(true)
                .build();
    }

    // ✅ 생년월일 계산 로직 (추가됨) [cite: 2026-02-26]
    private String parseBirthDate(String front, String back) {
        if (front.length() < 6) return "—";
        try {
            String yy = front.substring(0, 2);
            String mm = front.substring(2, 4);
            String dd = front.substring(4, 6);
            String century = "19";

            if (!back.isEmpty()) {
                char genderCode = back.charAt(0);
                if (genderCode == '3' || genderCode == '4') century = "20";
                else if (genderCode == '9' || genderCode == '0') century = "18";
            }
            return century + yy + "-" + mm + "-" + dd;
        } catch (Exception e) {
            return "—";
        }
    }

    // ✅ 성별 판별 로직 (추가됨) [cite: 2026-02-26]
    private String parseGender(String back) {
        if (back.isEmpty()) return "—";
        char code = back.charAt(0);
        if (code == '1' || code == '3' || code == '9') return "남";
        if (code == '2' || code == '4' || code == '0') return "여";
        return "—";
    }

    private String extractName(List<String> texts, int rrnIndex) {
        if (rrnIndex <= 0) return "인식 실패";
        for (int i = rrnIndex - 1; i >= 0; i--) {
            String text = texts.get(i).replaceAll("[^가-힣]", "");
            if (text.length() >= 2 && text.length() <= 4 && !text.contains("등록증")) {
                return text;
            }
        }
        return "인식 실패";
    }

    private String extractAddress(List<String> texts, int rrnIndex) {
        if (rrnIndex == -1) return "인식 실패";
        List<String> addressParts = new ArrayList<>();
        for (int i = rrnIndex + 1; i < texts.size(); i++) {
            String text = texts.get(i);
            if (text.matches(".*\\d{4}\\.\\d{2}\\.\\d{2}.*") || ISSUER_PATTERN.matcher(text).find()) break;
            String cleaned = text.replaceAll("[\\(\\)\\[\\],]", "").trim();
            if (cleaned.length() > 1) addressParts.add(cleaned);
        }
        return addressParts.isEmpty() ? "인식 실패" : String.join(" ", addressParts);
    }
}