package io.github.zzero23.idpass.api.dto.settings;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * 설정 조회·수정에 사용하는 DTO.
 * null 필드는 수정하지 않습니다 (Partial Update).
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemSettingsDto {

    private String excelPath;
    private String sheetName;
    private String watchFolder;
    private Boolean maskingEnabled;
    private Boolean autoDeleteEnabled;
}