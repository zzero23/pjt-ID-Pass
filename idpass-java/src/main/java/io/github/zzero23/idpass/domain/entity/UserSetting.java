package io.github.zzero23.idpass.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "UserSettings") @Getter
@Setter
@NoArgsConstructor
public class UserSetting {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long settingId;
    private Long userId;
    private String excelPath = "C:/IDPass/Results";
    private String sheetName = "Sheet1";
    private boolean isMasking = true;
    private boolean isAutoDelete = true;

    public UserSetting(Long userId) { this.userId = userId; }
}
