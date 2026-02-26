package io.github.zzero23.idpass.api.dto.ocr;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class OCRResponseDto {

    private String fileName;        // 원본 파일명
    private String name;            // 성명
    private String birthDate;       // 생년월일 (예: 2002-04-06)
    private String gender;          // 성별 (남 / 여)
    private String residentNumber;  // 주민등록번호 (뒷자리 마스킹)
    private String address;         // 주소
    private boolean success;        // 처리 성공 여부
    private String errorMessage;    // 실패 시 오류 메시지
}