package io.github.zzero23.idpass.api.dto;

import lombok.Data;
import java.util.List;

@Data
public class OCRResponseDto {
    private List<ImageResult> images;

    @Data
    public static class ImageResult {
        private String inferResult; // SUCCESS / FAILURE
        private List<Field> fields;
    }

    @Data
    public static class Field {
        private String inferText;      // 추출된 텍스트 (성명, 주민번호 등)
        private double inferConfidence; // 인식 신뢰도
    }
}