package io.github.zzero23.idpass.api.controller;

import io.github.zzero23.idpass.api.dto.ocr.OcrUpdateRequestDto;
import io.github.zzero23.idpass.domain.entity.OcrItem;
import io.github.zzero23.idpass.core.service.OcrManageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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

    // ── 1. 세션 전체 아이템 조회 ─────────────────────────────────────────
    @GetMapping("/items")
    public ResponseEntity<List<OcrItem>> getItems(@PathVariable String sessionId) {
        return ResponseEntity.ok(manageService.getItems(sessionId));
    }

    // ── 2. 단건 수정 / 제외 처리 ─────────────────────────────────────────
    @PatchMapping("/items")
    public ResponseEntity<OcrItem> updateItem(
            @PathVariable String sessionId,
            @RequestBody OcrUpdateRequestDto req
    ) {
        try {
            OcrItem updated = manageService.updateItem(sessionId, req);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            log.warn("수정 실패: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    // ── 3. 엑셀 내보내기 ─────────────────────────────────────────────────
    @PostMapping("/export")
    public ResponseEntity<byte[]> exportExcel(@PathVariable String sessionId) {
        try {
            byte[] excelBytes = manageService.exportToExcel(sessionId);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            // UTF-8 인코딩 없이 ASCII 파일명만 사용 → 브라우저 호환성 최대화
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"ocr_result.xlsx\"");

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(excelBytes);

        } catch (IOException e) {
            log.error("[{}] 엑셀 생성 실패: {}", sessionId, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}