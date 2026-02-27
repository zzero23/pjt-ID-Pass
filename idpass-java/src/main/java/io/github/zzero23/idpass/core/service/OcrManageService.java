package io.github.zzero23.idpass.core.service;

import io.github.zzero23.idpass.api.dto.ocr.OcrUpdateRequestDto;
import io.github.zzero23.idpass.api.dto.ocr.OCRResponseDto;
import io.github.zzero23.idpass.domain.entity.OcrItem;
import io.github.zzero23.idpass.core.repository.OcrItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OcrManageService {

    private final OcrItemRepository ocrItemRepository;

    // ──────────────────────────────────────────────────────────────────────────
    // 1. OCR 분석 결과를 세션에 저장 (OCRService.analyzeAll() 호출 직후 연동)
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * 분석된 OCRResponseDto 목록을 OcrItem 으로 변환하여 세션에 저장합니다.
     *
     * @param sessionId 프론트가 부여한 세션 ID (UUID 권장)
     * @param dtos      OCRService.analyzeAll() 반환값
     */
    public void saveSession(String sessionId, List<OCRResponseDto> dtos) {
        List<OcrItem> items = dtos.stream()
                .map(OcrItem::from)
                .collect(Collectors.toList());
        ocrItemRepository.save(sessionId, items);
        log.info("[{}] 세션 저장 완료: {}건", sessionId, items.size());
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 2. 단건 수정 (PATCH /api/ocr/sessions/{sessionId}/items)
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * 사용자가 인라인 수정한 내용을 반영합니다.
     * null 필드는 변경하지 않습니다 (Partial Update).
     *
     * @return 수정 후 최신 OcrItem
     * @throws IllegalArgumentException 해당 세션/파일을 찾지 못한 경우
     */
    public OcrItem updateItem(String sessionId, OcrUpdateRequestDto req) {
        OcrItem item = ocrItemRepository.findOne(sessionId, req.getFileName())
                .orElseThrow(() -> new IllegalArgumentException(
                        "세션 또는 파일을 찾을 수 없습니다: " + req.getFileName()));

        boolean changed = false;

        if (req.getName() != null)           { item.setName(req.getName());                   changed = true; }
        if (req.getBirthDate() != null)      { item.setBirthDate(req.getBirthDate());          changed = true; }
        if (req.getGender() != null)         { item.setGender(req.getGender());               changed = true; }
        if (req.getResidentNumber() != null) { item.setResidentNumber(req.getResidentNumber()); changed = true; }
        if (req.getAddress() != null)        { item.setAddress(req.getAddress());              changed = true; }

        // 필드 수정이 하나라도 있으면 isEdited = true
        if (changed) {
            item.setEdited(true);
            log.debug("[{}][{}] 데이터 수정됨 (isEdited=true)", sessionId, req.getFileName());
        }

        // 제외 플래그 처리
        if (req.getIsExcluded() != null) {
            item.setExcluded(req.getIsExcluded());
            log.debug("[{}][{}] isExcluded={}", sessionId, req.getFileName(), req.getIsExcluded());
        }

        return item;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 3. 세션 전체 조회 (GET /api/ocr/sessions/{sessionId}/items)
    // ──────────────────────────────────────────────────────────────────────────

    public List<OcrItem> getItems(String sessionId) {
        return ocrItemRepository.findAll(sessionId);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 4. 엑셀 내보내기 (POST /api/ocr/sessions/{sessionId}/export)
    //    isExcluded == false 인 데이터만 시트에 기록합니다.
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * @return xlsx 파일의 바이트 배열 (Controller 에서 ResponseEntity<byte[]> 로 반환)
     */
    public byte[] exportToExcel(String sessionId) throws IOException {
        List<OcrItem> exportTargets = ocrItemRepository.findExportable(sessionId);
        log.info("[{}] 엑셀 내보내기: {}건 (제외 건 필터링 완료)", sessionId, exportTargets.size());

        try (Workbook wb = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = wb.createSheet("OCR 결과");

            // ── 헤더 ──────────────────────────────────────────
            CellStyle headerStyle = createHeaderStyle(wb);
            String[] headers = {"파일명", "성명", "생년월일", "성별", "주민등록번호", "주소", "신뢰도", "수정여부"};
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // ── 데이터 행 ─────────────────────────────────────
            int rowIdx = 1;
            for (OcrItem item : exportTargets) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(nvl(item.getFileName()));
                row.createCell(1).setCellValue(nvl(item.getName()));
                row.createCell(2).setCellValue(nvl(item.getBirthDate()));
                row.createCell(3).setCellValue(nvl(item.getGender()));
                row.createCell(4).setCellValue(nvl(item.getResidentNumber()));
                row.createCell(5).setCellValue(nvl(item.getAddress()));
                row.createCell(6).setCellValue(String.format("%.2f", item.getConfidence()));
                row.createCell(7).setCellValue(item.isEdited() ? "수정됨" : "-");
            }

            // 열 너비 자동 조정
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            wb.write(out);
            return out.toByteArray();
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // helpers
    // ──────────────────────────────────────────────────────────────────────────

    private CellStyle createHeaderStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        return style;
    }

    private String nvl(String s) {
        return s == null ? "" : s;
    }
}