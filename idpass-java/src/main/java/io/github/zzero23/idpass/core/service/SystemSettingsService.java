package io.github.zzero23.idpass.core.service;

import io.github.zzero23.idpass.api.dto.settings.SystemSettingsDto;
import io.github.zzero23.idpass.domain.entity.UserSetting;
import io.github.zzero23.idpass.core.repository.UserSettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SystemSettingsService {

    private static final Long DEFAULT_USER_ID = 1L;

    private final UserSettingRepository userSettingRepository;
    private final FolderWatchService folderWatchService;

    @Transactional(readOnly = true)
    public SystemSettingsDto getSettings() {
        return userSettingRepository.findByUserId(DEFAULT_USER_ID)
                .map(this::toDto)
                .orElseGet(() -> SystemSettingsDto.builder().build()); // 또는 defaultValue()
    }

    @Transactional
    public SystemSettingsDto updateSettings(SystemSettingsDto req) {
        UserSetting s = userSettingRepository.findByUserId(DEFAULT_USER_ID)
                .orElseGet(() -> new UserSetting(DEFAULT_USER_ID));

        boolean watchFolderChanged = false;
        boolean watchEnabledChanged = false;

        if (req.getExcelPath() != null)
            s.setExcelPath(req.getExcelPath().isBlank() ? null : req.getExcelPath());
        if (req.getExcelFileName() != null)
            s.setExcelFileName(req.getExcelFileName().isBlank() ? null : req.getExcelFileName());
        if (req.getSheetName() != null)
            s.setSheetName(req.getSheetName().isBlank() ? null : req.getSheetName());
        if (req.getMaskingEnabled() != null)
            s.setMasking(req.getMaskingEnabled());
        if (req.getAutoDeleteEnabled() != null)
            s.setAutoDelete(req.getAutoDeleteEnabled());

        // ✅ 감시 폴더 경로 변경 감지
        if (req.getWatchFolder() != null) {
            String newFolder = req.getWatchFolder().isBlank() ? null : req.getWatchFolder();
            if (!String.valueOf(newFolder).equals(String.valueOf(s.getWatchFolder()))) {
                s.setWatchFolder(newFolder);
                watchFolderChanged = true;
            }
        }

        // ✅ 감시 ON/OFF 토글 변경 감지
        if (req.getWatchEnabled() != null) {
            boolean newEnabled = req.getWatchEnabled();
            if (newEnabled != s.isWatchEnabled()) {
                s.setWatchEnabled(newEnabled);
                watchEnabledChanged = true;
            }
        }

        UserSetting saved = userSettingRepository.save(s);

        // ✅ 핵심: watchEnabled 기준으로 감시 제어
        if (saved.isWatchEnabled()) {
            // ON 상태면: 토글이 바뀌었거나 폴더가 바뀌었을 때 재시작
            if (watchEnabledChanged || watchFolderChanged) {
                folderWatchService.restartWatch(saved.getWatchFolder());
            }
        } else {
            // OFF 상태면: 토글이 꺼졌을 때 감시 중지
            if (watchEnabledChanged) {
                folderWatchService.stopWatch(); // stopWatch() 없으면 만들어야 함
            }
        }

        return toDto(saved);
    }

    public boolean isWatchServiceRunning() {
        return folderWatchService.isWatching();
    }

    public String getCurrentWatchFolder() {
        return folderWatchService.getCurrentFolder();
    }

    private UserSetting findOrCreate() {
        return userSettingRepository.findByUserId(DEFAULT_USER_ID)
                .orElseGet(() -> {
                    UserSetting s = new UserSetting(DEFAULT_USER_ID);
                    UserSetting saved = userSettingRepository.save(s);
                    folderWatchService.restartWatch(saved.getWatchFolder());
                    return saved;
                });
    }

    private SystemSettingsDto toDto(UserSetting s) {
        return SystemSettingsDto.builder()
                .excelPath(s.getExcelPath())
                .excelFileName(s.getExcelFileName())
                .sheetName(s.getSheetName())
                .watchFolder(s.getWatchFolder())
                .maskingEnabled(s.isMasking())
                .autoDeleteEnabled(s.isAutoDelete())
                .watchEnabled(s.isWatchEnabled())
                .build();
    }
}