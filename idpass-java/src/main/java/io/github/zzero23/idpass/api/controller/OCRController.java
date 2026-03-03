package io.github.zzero23.idpass.api.controller;

import io.github.zzero23.idpass.api.dto.ocr.OCRResponseDto;
import io.github.zzero23.idpass.core.service.OCRService;
import io.github.zzero23.idpass.core.service.OcrManageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/ocr")
@RequiredArgsConstructor
public class OCRController {

    private final OCRService ocrService;
    private final OcrManageService ocrManageService;

    /**
     * POST /api/ocr/analyze
     *
     * 복수의 신분증 이미지 파일을 수신하여 OCR 분석 결과를 반환합니다.
     *
     * 프론트엔드 전송 형식:
     *   Content-Type: multipart/form-data
     *   파라미터명: "files" (복수 파일 허용)
     *
     * 응답 형식:
     *   [
     *     { "fileName": "id1.jpg", "name": "홍길동", "residentNumber": "900101-*******", "address": "서울...", "success": true },
     *     { "fileName": "id2.png", "success": false, "errorMessage": "..." }
     *   ]
     */
    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<OCRResponseDto>> analyze(
            @RequestPart("files") List<MultipartFile> files,
            @RequestParam("sessionId") String sessionId
    ) {
        log.info("OCR 분석 요청: 총 {}개 파일", files.size());

        // 파일 유효성 검사
        if (files.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        // 서비스 위임
        List<OCRResponseDto> results = ocrService.analyzeAll(files);

        ocrManageService.saveSession(sessionId, results);

        log.info("OCR 분석 완료: {}개 처리됨", results.size());
        return ResponseEntity.ok(results);
    }
}