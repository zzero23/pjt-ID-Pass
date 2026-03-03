package io.github.zzero23.idpass.api.dto.ocr;

import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 프론트엔드에서 사용자가 인라인 수정한 OCR 데이터를 전달받는 DTO.
 * isExcluded = true 이면 엑셀 저장 대상에서 제외됩니다.
 */
@Getter
@NoArgsConstructor
public class OcrUpdateRequestDto {

    private String sessionId;       // 세션/배치 식별자 (프론트에서 부여)
    private String fileName;        // 원본 파일명 (PK 역할)

    // 사용자가 수정 가능한 필드 (null 이면 변경하지 않음)
    private String name;
    private String birthDate;
    private String gender;
    private String residentNumber;
    private String address;

    private Boolean isExcluded;     // true → 엑셀 저장 제외
}