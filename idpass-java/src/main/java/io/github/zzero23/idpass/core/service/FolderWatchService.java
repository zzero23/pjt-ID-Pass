package io.github.zzero23.idpass.core.service;

import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * 감시 폴더를 Java NIO WatchService 로 모니터링합니다.
 * 설정이 변경되면 restartWatch() 를 호출해 즉시 새 폴더로 전환합니다.
 */
@Slf4j
@Service
public class FolderWatchService {

    private WatchService watchService;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final AtomicBoolean running = new AtomicBoolean(false);
    private String currentFolder = "";

    /**
     * 현재 감시 중인지 여부
     */
    public boolean isWatching() {
        return running.get();
    }

    /**
     * 현재 감시 폴더 경로
     */
    public String getCurrentFolder() {
        return currentFolder;
    }

    /**
     * 감시 폴더를 변경하거나 최초 시작합니다.
     * 이미 실행 중이면 기존 감시를 중단하고 새 폴더로 재시작합니다.
     */
    public synchronized void restartWatch(String folderPath) {
        stopWatch();

        if (folderPath == null || folderPath.isBlank()) {
            log.warn("감시 폴더 경로가 비어있어 시작하지 않습니다.");
            return;
        }

        Path path = Path.of(folderPath);
        if (!Files.isDirectory(path)) {
            try {
                Files.createDirectories(path);
                log.info("감시 폴더 생성: {}", folderPath);
            } catch (IOException e) {
                log.error("감시 폴더 생성 실패: {}", folderPath, e);
                return;
            }
        }

        try {
            watchService = FileSystems.getDefault().newWatchService();
            path.register(watchService,
                    StandardWatchEventKinds.ENTRY_CREATE,
                    StandardWatchEventKinds.ENTRY_MODIFY);

            currentFolder = folderPath;
            running.set(true);

            executor.submit(() -> {
                log.info("폴더 감시 시작: {}", folderPath);
                try {
                    while (running.get()) {
                        WatchKey key = watchService.poll(1, java.util.concurrent.TimeUnit.SECONDS);
                        if (key == null) continue;

                        for (WatchEvent<?> event : key.pollEvents()) {
                            Path changed = path.resolve((Path) event.context());
                            log.info("[WatchService] 변경 감지: {} - {}", event.kind().name(), changed);
                            // TODO: 감지된 파일에 대한 OCR 자동 분석 로직 연결 가능
                        }
                        if (!key.reset()) break;
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } catch (ClosedWatchServiceException e) {
                    log.info("WatchService 종료됨: {}", folderPath);
                }
                running.set(false);
                log.info("폴더 감시 중단: {}", folderPath);
            });

        } catch (IOException e) {
            log.error("WatchService 시작 실패: {}", folderPath, e);
            running.set(false);
        }
    }

    /**
     * 감시를 중단합니다.
     */
    public synchronized void stopWatch() {
        running.set(false);
        if (watchService != null) {
            try {
                watchService.close();
            } catch (IOException e) {
                log.warn("WatchService 종료 중 오류", e);
            }
            watchService = null;
        }
    }

    @PreDestroy
    public void destroy() {
        stopWatch();
        executor.shutdownNow();
    }
}