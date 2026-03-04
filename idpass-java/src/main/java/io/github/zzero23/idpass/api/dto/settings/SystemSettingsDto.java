package io.github.zzero23.idpass.api.dto.settings;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemSettingsDto {

    private String excelPath;
    private String excelFileName;
    private String sheetName;
    private String watchFolder;
    private Boolean maskingEnabled;
    private Boolean autoDeleteEnabled;
}