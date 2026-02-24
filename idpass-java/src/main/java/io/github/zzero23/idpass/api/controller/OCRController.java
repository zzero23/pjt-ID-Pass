package io.github.zzero23.idpass.api.controller;

import io.github.zzero23.idpass.core.client.AIClient;
import io.github.zzero23.idpass.api.dto.OCRResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Base64;

@RestController
@RequestMapping("/api/ocr")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173") // 리액트(Vite) 포트 허용
public class OCRController {
    private final AIClient aiClient;

    @PostMapping("/analyze")
    public ResponseEntity<OCRResponseDto> analyze(@RequestParam("file") MultipartFile file) throws Exception {
        // [MAIN07_SEC01] 보안을 위해 서버에 저장하지 않고 즉시 Base64 변환
        String base64 = Base64.getEncoder().encodeToString(file.getBytes());

        // [MAIN04_OCR01] 네이버 AI 호출 및 결과 반환
        return ResponseEntity.ok(aiClient.requestAnalysis(base64));
    }
}