package io.github.zzero23.idpass.core.service;

import io.github.zzero23.idpass.api.dto.ocr.OcrUpdateRequestDto;
import io.github.zzero23.idpass.api.dto.ocr.OCRResponseDto;
import io.github.zzero23.idpass.domain.entity.OcrItem;
import io.github.zzero23.idpass.core.repository.OcrItemRepository;
import io.github.zzero23.idpass.core.repository.UserSettingRepository;
import io.github.zzero23.idpass.domain.entity.UserSetting;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.*;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OcrManageService {

    private final OcrItemRepository ocrItemRepository;
    private final UserSettingRepository userSettingRepository;

    // ── 1. 세션 저장 ─────────────────────────────────────────────────────────
    public void saveSession(String sessionId, List<OCRResponseDto> dtos) {
        List<OcrItem> items = dtos.stream()
                .map(OcrItem::from)
                .collect(Collectors.toList());
        ocrItemRepository.save(sessionId, items);
        log.info("[{}] 세션 저장 완료: {}건", sessionId, items.size());
    }

    // ── 2. 단건 수정 ─────────────────────────────────────────────────────────
    public OcrItem updateItem(String sessionId, OcrUpdateRequestDto req) {
        OcrItem item = ocrItemRepository.findOne(sessionId, req.getFileName())
                .orElseThrow(() -> new IllegalArgumentException(
                        "세션 또는 파일을 찾을 수 없습니다: " + req.getFileName()));

        boolean changed = false;
        if (req.getName() != null)           { item.setName(req.getName());                    changed = true; }
        if (req.getBirthDate() != null)      { item.setBirthDate(req.getBirthDate());           changed = true; }
        if (req.getGender() != null)         { item.setGender(req.getGender());                changed = true; }
        if (req.getResidentNumber() != null) { item.setResidentNumber(req.getResidentNumber()); changed = true; }
        if (req.getAddress() != null)        { item.setAddress(req.getAddress());               changed = true; }
        if (changed) item.setEdited(true);

        if (req.getIsExcluded() != null) item.setExcluded(req.getIsExcluded());

        return item;
    }

    // ── 3. 세션 전체 조회 ────────────────────────────────────────────────────
    public List<OcrItem> getItems(String sessionId) {
        return ocrItemRepository.findAll(sessionId);
    }

    // ── 4. 엑셀 내보내기 ─────────────────────────────────────────────────────
    /**
     * 설정에 따라 파일/시트를 처리합니다.
     *
     * - 파일 없음              → 새 파일 + 새 시트 생성
     * - 파일 있음, 시트 없음   → 기존 파일에 새 시트 추가
     * - 파일 있음, 시트 있음   → 마지막 데이터 행 다음에 append
     */
    public void exportToExcel(String sessionId) throws IOException {
        List<OcrItem> targets = ocrItemRepository.findExportable(sessionId);
        log.info("[{}] 엑셀 내보내기: {}건", sessionId, targets.size());

        // ── 설정 로드 ──────────────────────────────────────────────────────
        UserSetting setting = userSettingRepository.findByUserId(1L).orElse(null);

        String folderPath = (setting != null && setting.getExcelPath() != null && !setting.getExcelPath().isBlank())
                ? setting.getExcelPath()
                : "/app/output";

        String fileName = (setting != null && setting.getExcelFileName() != null && !setting.getExcelFileName().isBlank())
                ? setting.getExcelFileName()
                : "ocr_result.xlsx";

        if (!fileName.endsWith(".xlsx")) fileName += ".xlsx";

        String sheetName = (setting != null && setting.getSheetName() != null && !setting.getSheetName().isBlank())
                ? setting.getSheetName()
                : "Sheet1";

        // ── 파일 경로 준비 ─────────────────────────────────────────────────
        Path dir = Paths.get(folderPath);
        Files.createDirectories(dir);
        Path filePath = dir.resolve(fileName);

        // ── 워크북 로드 or 생성 ────────────────────────────────────────────
        Workbook wb;
        boolean isNewFile = !Files.exists(filePath);

        if (isNewFile) {
            wb = new XSSFWorkbook();
            log.info("새 엑셀 파일 생성: {}", filePath);
        } else {
            try (InputStream is = new FileInputStream(filePath.toFile())) {
                wb = new XSSFWorkbook(is);
                log.info("기존 엑셀 파일 로드: {}", filePath);
            }
        }

        // ── 시트 로드 or 생성 ──────────────────────────────────────────────
        Sheet sheet = wb.getSheet(sheetName);
        boolean isNewSheet = (sheet == null);

        if (isNewSheet) {
            sheet = wb.createSheet(sheetName);
            log.info("새 시트 생성: {}", sheetName);
            // 헤더 행 작성
            writeHeader(wb, sheet);
        }

        // ── 다음 작성 행 결정 (기존 데이터 다음) ──────────────────────────
        int nextRow = sheet.getLastRowNum() + 1;
        if (nextRow == 1 && sheet.getRow(0) == null) nextRow = 0; // 완전히 빈 시트

        // 시트는 있지만 헤더가 없는 경우 (이상 케이스) 헤더 추가
        if (nextRow == 0) {
            writeHeader(wb, sheet);
            nextRow = 1;
        }

        // ── 데이터 행 작성 ─────────────────────────────────────────────────
        for (OcrItem item : targets) {
            Row row = sheet.createRow(nextRow++);
            row.createCell(0).setCellValue(nvl(item.getFileName()));
            row.createCell(1).setCellValue(nvl(item.getName()));
            row.createCell(2).setCellValue(nvl(item.getBirthDate()));
            row.createCell(3).setCellValue(nvl(item.getGender()));
            row.createCell(4).setCellValue(nvl(item.getResidentNumber()));
            row.createCell(5).setCellValue(nvl(item.getAddress()));
            row.createCell(6).setCellValue(String.format("%.2f", item.getConfidence()));
            row.createCell(7).setCellValue(item.isEdited() ? "수정됨" : "-");
        }

        for (int i = 0; i < 8; i++) sheet.autoSizeColumn(i);

        // ── 파일 저장 ──────────────────────────────────────────────────────
        try (FileOutputStream fos = new FileOutputStream(filePath.toFile())) {
            wb.write(fos);
        }
        wb.close();

        log.info("[{}] 엑셀 저장 완료: {} / {}", sessionId, filePath, sheetName);
    }

    // ── helpers ───────────────────────────────────────────────────────────────
    private void writeHeader(Workbook wb, Sheet sheet) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);

        String[] headers = {"파일명", "성명", "생년월일", "성별", "주민등록번호", "주소", "신뢰도", "수정여부"};
        Row row = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = row.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(style);
        }
    }

    private String nvl(String s) { return s == null ? "" : s; }
}