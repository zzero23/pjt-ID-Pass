package io.github.zzero23.idpass.core.service;

import io.github.zzero23.idpass.core.repository.UserSettingRepository;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.atomic.AtomicBoolean;

@Slf4j
@Service
@RequiredArgsConstructor
public class FolderWatchService {

    private final OCRService ocrService;
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

    // ✅ 5초마다 폴더를 직접 스캔함 (도커 마운트 이슈 완벽 해결)
    @Scheduled(fixedDelay = 5000)
    public void scanFolder() {
        if (!running.get() || currentFolder.isEmpty()) return;

        File folder = new File(currentFolder);
        if (!folder.exists() || !folder.isDirectory()) return;

        File[] files = folder.listFiles();
        if (files == null) return;

        for (File file : files) {
            Path filePath = file.toPath();
            if (file.isFile() && isImage(filePath)) {
                try {
                    log.info("🎯 새 이미지 발견: {}", file.getName());
                    ocrService.processFile(filePath);

                    // ✅ 처리 완료 후 파일 삭제 (또는 완료 폴더로 이동)
                    // 삭제 안 하면 5초마다 계속 읽게 됨!
                    Files.delete(filePath);
                    log.info("🗑️ 처리 완료된 파일 삭제됨: {}", file.getName());

                } catch (Exception e) {
                    log.error("❌ OCR 처리 중 오류: {}", file.getName(), e);
                }
            }
        }
    }

    private boolean isImage(Path p) {
        String name = p.getFileName().toString().toLowerCase();
        return name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png");
    }

    /**
     * 현재 감시(폴링) 서비스가 활성화되어 있는지 확인
     */
    public boolean isWatching() {
        return running.get();
    }

    /**
     * 현재 설정된 감시 폴더 경로 반환
     */
    public String getCurrentFolder() {
        return currentFolder;
    }

    @PreDestroy
    public void destroy() {
        stopWatch();
    }
}