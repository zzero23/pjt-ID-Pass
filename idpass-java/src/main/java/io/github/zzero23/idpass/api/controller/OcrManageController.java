package io.github.zzero23.idpass.api.controller;

import io.github.zzero23.idpass.api.dto.ocr.OcrUpdateRequestDto;
import io.github.zzero23.idpass.domain.entity.OcrItem;
import io.github.zzero23.idpass.core.service.OcrManageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/ocr/sessions/{sessionId}")
@RequiredArgsConstructor
public class OcrManageController {

    private final OcrManageService manageService;

    // ── 1. 세션 전체 아이템 조회 ──────────────────────────────────────────
    @GetMapping("/items")
    public ResponseEntity<List<OcrItem>> getItems(@PathVariable String sessionId) {
        return ResponseEntity.ok(manageService.getItems(sessionId));
    }

    // ── 2. 단건 수정 / 제외 처리 ──────────────────────────────────────────
    @PatchMapping("/items")
    public ResponseEntity<OcrItem> updateItem(
            @PathVariable String sessionId,
            @RequestBody OcrUpdateRequestDto req
    ) {
        try {
            return ResponseEntity.ok(manageService.updateItem(sessionId, req));
        } catch (IllegalArgumentException e) {
            log.warn("수정 실패: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    // ── 3. 엑셀 내보내기 ──────────────────────────────────────────────────
    // 서버 설정 경로에 직접 저장 (다운로드 없음)
    @PostMapping("/export")
    public ResponseEntity<Void> exportExcel(@PathVariable String sessionId) {
        try {
            manageService.exportToExcel(sessionId);
            return ResponseEntity.ok().build();
        } catch (IOException e) {
            log.error("[{}] 엑셀 생성 실패: {}", sessionId, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}