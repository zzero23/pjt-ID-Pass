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

    // ✅ 도커 컴포즈에서 설정한 바탕화면 마운트 포인트
    private static final String DOCKER_MONITOR_ROOT = "/app/monitor_root";
    private static final String WINDOWS_DESKTOP_PATH = "C:/Users/SSAFY/Desktop";

    private final UserSettingRepository userSettingRepository;
    private final FolderWatchService folderWatchService;

    /**
     * 사용자가 입력한 윈도우 경로를 도커 컨테이너 내부 경로로 변환합니다.
     */
    private String normalizeWatchFolder(String raw) {
        if (raw == null || raw.isBlank()) return null;

        // 1. 역슬래시(\)를 슬래시(/)로 통일
        String path = raw.replace("\\", "/");

        // 2. 바탕화면 경로가 포함되어 있다면 컨테이너 경로로 치환
        // 예: "C:/Users/SSAFY/Desktop/MyFolder" -> "/app/monitor_root/MyFolder"
        if (path.contains(WINDOWS_DESKTOP_PATH)) {
            String normalized = path.replace(WINDOWS_DESKTOP_PATH, DOCKER_MONITOR_ROOT);
            log.info("[Path mapping] Windows: {} -> Docker: {}", path, normalized);
            return normalized;
        }

        return path;
    }

    @Transactional(readOnly = true)
    public SystemSettingsDto getSettings() {
        return userSettingRepository.findByUserId(DEFAULT_USER_ID)
                .map(this::toDto)
                .orElseGet(() -> SystemSettingsDto.builder().build());
    }

    @Transactional
    public SystemSettingsDto updateSettings(SystemSettingsDto req) {
        UserSetting s = userSettingRepository.findByUserId(DEFAULT_USER_ID)
                .orElseGet(() -> new UserSetting(DEFAULT_USER_ID));

        // 기본 설정 업데이트
        if (req.getExcelPath() != null) s.setExcelPath(req.getExcelPath());
        if (req.getExcelFileName() != null) s.setExcelFileName(req.getExcelFileName());
        if (req.getSheetName() != null) s.setSheetName(req.getSheetName());
        if (req.getMaskingEnabled() != null) s.setMasking(req.getMaskingEnabled());
        if (req.getAutoDeleteEnabled() != null) s.setAutoDelete(req.getAutoDeleteEnabled());

        // ✅ 감시 폴더 경로 업데이트 (치환 로직 적용)
        if (req.getWatchFolder() != null) {
            String newFolder = req.getWatchFolder().isBlank() ? null : normalizeWatchFolder(req.getWatchFolder());
            s.setWatchFolder(newFolder);
        }

        // ✅ 감시 사용 여부 업데이트
        if (req.getWatchEnabled() != null) {
            s.setWatchEnabled(req.getWatchEnabled());
        }

        UserSetting saved = userSettingRepository.save(s);
        log.info("설정 업데이트 완료: watchFolder={}, enabled={}", saved.getWatchFolder(), saved.isWatchEnabled());

        // ✅ 수정된 폴링 방식의 FolderWatchService 제어
        if (saved.isWatchEnabled() && saved.getWatchFolder() != null) {
            folderWatchService.restartWatch(saved.getWatchFolder());
        } else {
            folderWatchService.stopWatch();
        }

        return toDto(saved);
    }

    public boolean isWatchServiceRunning() {
        return folderWatchService.isWatching();
    }

    public String getCurrentWatchFolder() {
        return folderWatchService.getCurrentFolder();
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