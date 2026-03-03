package io.github.zzero23.idpass.domain.entity;

import io.github.zzero23.idpass.api.dto.ocr.OCRResponseDto;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

/**
 * OCR 분석 결과 + 검수 상태를 관리하는 인메모리 모델.
 *
 * edited   : 사용자가 하나 이상의 필드를 수정했을 때 true → 프론트 강조 표시용
 * excluded : 엑셀 저장 대상에서 제외된 경우 true
 */
@Getter
@Setter
@Builder
public class OcrItem {

    private String fileName;
    private String name;
    private String birthDate;
    private String gender;
    private String residentNumber;
    private String address;
    private boolean success;
    private String errorMessage;
    private double confidence;

    // ── 검수 상태 플래그 ─────────────────────────────
    // ※ 'isEdited', 'isExcluded' 로 쓰면 Lombok이 getter를 isIsEdited() 로 만들어
    //    JSON 직렬화/역직렬화 및 setter 호출이 꼬임 → 접두사 없이 선언
    @Builder.Default
    private boolean edited = false;

    @Builder.Default
    private boolean excluded = false;

    // ── 팩토리 ──────────────────────────────────────
    public static OcrItem from(OCRResponseDto dto) {
        return OcrItem.builder()
                .fileName(dto.getFileName())
                .name(dto.getName())
                .birthDate(dto.getBirthDate())
                .gender(dto.getGender())
                .residentNumber(dto.getResidentNumber())
                .address(dto.getAddress())
                .success(dto.isSuccess())
                .errorMessage(dto.getErrorMessage())
                .confidence(dto.getConfidence())
                .build();
    }
}