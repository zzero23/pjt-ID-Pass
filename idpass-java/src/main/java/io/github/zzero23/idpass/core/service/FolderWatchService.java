package io.github.zzero23.idpass.core.service;

import io.github.zzero23.idpass.api.dto.ocr.OCRResponseDto;
import io.github.zzero23.idpass.core.repository.UserSettingRepository;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;

@Slf4j
@Service
@RequiredArgsConstructor
public class FolderWatchService {

    private final OCRService ocrService;
    private final OcrManageService ocrManageService;
    private final UserSettingRepository userSettingRepository;

    private final AtomicBoolean running = new AtomicBoolean(false);
    private String currentFolder = "";

    public void restartWatch(String folderPath) {
        if (folderPath == null || folderPath.isBlank()) {
            log.warn("감시 폴더 경로가 비어있습니다.");
            return;
        }
        this.currentFolder = folderPath;
        this.running.set(true);
        log.info("🚀 [폴링 모드] 감시 시작: {}", folderPath);
    }

    public void stopWatch() {
        this.running.set(false);
        log.info("⏹️ 감시 중단");
    }

    @Scheduled(fixedDelay = 5000)
    public void scanFolder() {
        if (!running.get() || currentFolder.isEmpty()) return;

        File folder = new File(currentFolder);
        if (!folder.exists() || !folder.isDirectory()) return;

        File[] files = folder.listFiles();
        if (files == null) return;

        for (File file : files) {
            Path filePath = file.toPath();
            if (!file.isFile() || !isImage(filePath)) continue;

            try {
                log.info("🎯 새 이미지 발견: {}", file.getName());

                // 1. OCR 분석
                OCRResponseDto result = ocrService.processFile(filePath);

                // 2. 엑셀에 바로 저장 (세션 ID는 파일명 기반으로 생성)
                String sessionId = "watch-" + UUID.randomUUID();
                ocrManageService.saveSession(sessionId, List.of(result));
                ocrManageService.exportToExcel(sessionId);

                log.info("✅ OCR + 엑셀 저장 완료: {}", file.getName());

                // 3. 처리 완료 후 파일 삭제
                Files.delete(filePath);
                log.info("🗑️ 처리 완료된 파일 삭제됨: {}", file.getName());

            } catch (Exception e) {
                log.error("❌ OCR 처리 중 오류: {}", file.getName(), e);
            }
        }
    }

    private boolean isImage(Path p) {
        String name = p.getFileName().toString().toLowerCase();
        return name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png");
    }

    public boolean isWatching() {
        return running.get();
    }

    public String getCurrentFolder() {
        return currentFolder;
    }

    @PreDestroy
    public void destroy() {
        stopWatch();
    }
}