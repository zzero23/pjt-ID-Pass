package io.github.zzero23.idpass.core.service;

import io.github.zzero23.idpass.api.dto.settings.SystemSettingsDto;
import io.github.zzero23.idpass.domain.entity.UserSetting;
import io.github.zzero23.idpass.core.repository.UserSettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.annotation.PostConstruct;

@Slf4j
@Service
@RequiredArgsConstructor
public class SystemSettingsService {

    private static final Long DEFAULT_USER_ID = 1L;

    private final UserSettingRepository userSettingRepository;
    private final FolderWatchService folderWatchService;
    private final PathMappingService pathMappingService;

    /** 서버 시작 시 DB에 저장된 감시 폴더로 자동 시작 */
    @PostConstruct
    public void init() {
        UserSetting s = findOrCreate();
        if (s.getWatchFolder() != null && !s.getWatchFolder().isBlank()) {
            log.info("서버 시작 - 저장된 감시 폴더로 자동 시작: {}", s.getWatchFolder());
            folderWatchService.restartWatch(s.getWatchFolder());
        }
    }

    @Transactional(readOnly = true)
    public SystemSettingsDto getSettings() {
        UserSetting s = findOrCreate();
        // DB에는 컨테이너 경로 저장, UI에는 로컬 경로로 변환해서 반환
        return toDto(s, true);
    }

    @Transactional
    public SystemSettingsDto updateSettings(SystemSettingsDto req) {
        UserSetting s = findOrCreate();
        boolean watchFolderChanged = false;

        if (req.getExcelPath() != null) {
            // 사용자 입력(로컬 경로) → 컨테이너 경로로 변환해서 저장
            String containerPath = req.getExcelPath().isBlank()
                    ? null : pathMappingService.toContainerPath(req.getExcelPath());
            s.setExcelPath(containerPath);
        }
        if (req.getExcelFileName() != null)
            s.setExcelFileName(req.getExcelFileName().isBlank() ? null : req.getExcelFileName());
        if (req.getSheetName() != null)
            s.setSheetName(req.getSheetName().isBlank() ? null : req.getSheetName());
        if (req.getMaskingEnabled() != null)
            s.setMasking(req.getMaskingEnabled());
        if (req.getAutoDeleteEnabled() != null)
            s.setAutoDelete(req.getAutoDeleteEnabled());

        if (req.getWatchFolder() != null) {
            String containerPath = req.getWatchFolder().isBlank()
                    ? null : pathMappingService.toContainerPath(req.getWatchFolder());
            s.setWatchFolder(containerPath);
            watchFolderChanged = true; // 항상 재시작 (같은 값이어도 확실히 반영)
        }

        userSettingRepository.save(s);
        log.info("설정 저장 완료 - 엑셀경로: {}, 감시폴더: {}", s.getExcelPath(), s.getWatchFolder());

        if (watchFolderChanged && s.getWatchFolder() != null) {
            folderWatchService.restartWatch(s.getWatchFolder());
        }

        return toDto(s, true);
    }

    public boolean isWatchServiceRunning() {
        return folderWatchService.isWatching();
    }

    public String getCurrentWatchFolder() {
        // 헤더 표시용 - 로컬 경로로 변환
        String containerFolder = folderWatchService.getCurrentFolder();
        return pathMappingService.toLocalPath(containerFolder);
    }

    private UserSetting findOrCreate() {
        return userSettingRepository.findByUserId(DEFAULT_USER_ID)
                .orElseGet(() -> {
                    UserSetting s = new UserSetting(DEFAULT_USER_ID);
                    return userSettingRepository.save(s);
                });
    }

    private SystemSettingsDto toDto(UserSetting s, boolean toLocal) {
        // UI에 보여줄 때는 로컬 경로로 변환
        String excelPath = toLocal ? pathMappingService.toLocalPath(s.getExcelPath()) : s.getExcelPath();
        String watchFolder = toLocal ? pathMappingService.toLocalPath(s.getWatchFolder()) : s.getWatchFolder();

        return SystemSettingsDto.builder()
                .excelPath(excelPath)
                .excelFileName(s.getExcelFileName())
                .sheetName(s.getSheetName())
                .watchFolder(watchFolder)
                .maskingEnabled(s.isMasking())
                .autoDeleteEnabled(s.isAutoDelete())
                .build();
    }
}