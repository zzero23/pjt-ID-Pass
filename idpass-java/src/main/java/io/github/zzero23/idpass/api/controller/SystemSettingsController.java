package io.github.zzero23.idpass.api.controller;

import io.github.zzero23.idpass.api.dto.settings.SystemSettingsDto;
import io.github.zzero23.idpass.core.service.SystemSettingsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 시스템 설정 API
 *
 * GET    /api/settings          → 현재 설정 조회
 * PATCH  /api/settings          → 설정 부분 수정 + WatchService 즉시 반영
 * GET    /api/settings/health   → WatchService 상태 확인 (Health Check)
 */
@Slf4j
@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SystemSettingsController {

    private final SystemSettingsService settingsService;

    // ── 1. 설정 조회 ─────────────────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<SystemSettingsDto> getSettings() {
        return ResponseEntity.ok(settingsService.getSettings());
    }

    // ── 2. 설정 수정 (저장 버튼 클릭 시 호출) ────────────────────────────────
    @PatchMapping
    public ResponseEntity<SystemSettingsDto> updateSettings(
            @RequestBody SystemSettingsDto req) {
        SystemSettingsDto updated = settingsService.updateSettings(req);
        log.info("설정 업데이트 완료: watchFolder={}", updated.getWatchFolder());
        return ResponseEntity.ok(updated);
    }

    // ── 3. Health Check ───────────────────────────────────────────────────────
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        boolean watching = settingsService.isWatchServiceRunning();
        String folder = settingsService.getCurrentWatchFolder();

        return ResponseEntity.ok(Map.of(
                "watchServiceRunning", watching,
                "watchFolder", folder != null ? folder : "",
                "status", watching ? "MONITORING" : "STOPPED"
        ));
    }
}