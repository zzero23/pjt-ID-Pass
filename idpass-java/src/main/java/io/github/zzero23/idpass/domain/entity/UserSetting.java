package io.github.zzero23.idpass.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "UserSettings")
@Getter
@Setter
@NoArgsConstructor
public class UserSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long settingId;
    private Long userId;
    private String excelPath;
    private String excelFileName;
    private String sheetName;
    private String watchFolder;
    private boolean masking = true;
    private boolean autoDelete = true;

    public UserSetting(Long userId) {
        this.userId = userId;
    }
}