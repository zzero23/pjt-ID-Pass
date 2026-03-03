package io.github.zzero23.idpass.core.service;

import io.github.zzero23.idpass.api.dto.settings.SystemSettingsDto;
import io.github.zzero23.idpass.domain.entity.UserSetting;
import io.github.zzero23.idpass.core.repository.UserSettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 시스템 설정 조회·수정 서비스.
 *
 * - userId = 1L 을 단일 설정 레코드로 사용합니다.
 *   (멀티 유저 확장 시 userId 파라미터를 받도록 수정)
 * - 설정 저장 시 FolderWatchService 에 즉시 반영합니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SystemSettingsService {

    private static final Long DEFAULT_USER_ID = 1L;

    private final UserSettingRepository userSettingRepository;
    private final FolderWatchService folderWatchService;

    // ── 조회 ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SystemSettingsDto getSettings() {
        UserSetting s = findOrCreate();
        return toDto(s);
    }

    // ── 수정 (Partial Update) ───────────────────────────────────────────────

    @Transactional
    public SystemSettingsDto updateSettings(SystemSettingsDto req) {
        UserSetting s = findOrCreate();

        boolean watchFolderChanged = false;

        if (req.getExcelPath() != null)       s.setExcelPath(req.getExcelPath());
        if (req.getSheetName() != null)       s.setSheetName(req.getSheetName());
        if (req.getMaskingEnabled() != null)  s.setMasking(req.getMaskingEnabled());
        if (req.getAutoDeleteEnabled() != null) s.setAutoDelete(req.getAutoDeleteEnabled());

        if (req.getWatchFolder() != null && !req.getWatchFolder().equals(s.getWatchFolder())) {
            s.setWatchFolder(req.getWatchFolder());
            watchFolderChanged = true;
        }

        userSettingRepository.save(s);
        log.info("설정 저장 완료: userId={}", DEFAULT_USER_ID);

        // 감시 폴더가 바뀌었으면 WatchService 즉시 재시작
        if (watchFolderChanged) {
            folderWatchService.restartWatch(s.getWatchFolder());
        }

        return toDto(s);
    }

    // ── Health Check 용 상태 조회 ───────────────────────────────────────────

    public boolean isWatchServiceRunning() {
        return folderWatchService.isWatching();
    }

    public String getCurrentWatchFolder() {
        return folderWatchService.getCurrentFolder();
    }

    // ── helpers ─────────────────────────────────────────────────────────────

    private UserSetting findOrCreate() {
        return userSettingRepository.findByUserId(DEFAULT_USER_ID)
                .orElseGet(() -> {
                    UserSetting newSetting = new UserSetting(DEFAULT_USER_ID);
                    UserSetting saved = userSettingRepository.save(newSetting);
                    // 최초 생성 시 기본 감시 폴더로 WatchService 시작
                    folderWatchService.restartWatch(saved.getWatchFolder());
                    return saved;
                });
    }

    private SystemSettingsDto toDto(UserSetting s) {
        return SystemSettingsDto.builder()
                .excelPath(s.getExcelPath())
                .sheetName(s.getSheetName())
                .watchFolder(s.getWatchFolder())
                .maskingEnabled(s.isMasking())
                .autoDeleteEnabled(s.isAutoDelete())
                .build();
    }
}