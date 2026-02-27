package io.github.zzero23.idpass.core.repository;

import io.github.zzero23.idpass.domain.entity.OcrItem;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * OcrItemRepository 의 인메모리 구현체.
 * DB 연동 시 JpaOcrItemRepository implements OcrItemRepository 로 교체하면 됩니다.
 */
@Repository
public class InMemoryOcrItemRepository implements OcrItemRepository {

    private final Map<String, List<OcrItem>> store = new ConcurrentHashMap<>();

    @Override
    public void save(String sessionId, List<OcrItem> items) {
        store.put(sessionId, new ArrayList<>(items));
    }

    @Override
    public Optional<OcrItem> findOne(String sessionId, String fileName) {
        return findAll(sessionId).stream()
                .filter(item -> item.getFileName().equals(fileName))
                .findFirst();
    }

    @Override
    public List<OcrItem> findAll(String sessionId) {
        return store.getOrDefault(sessionId, List.of());
    }

    @Override
    public List<OcrItem> findExportable(String sessionId) {
        return findAll(sessionId).stream()
                .filter(item -> !item.isExcluded())
                .collect(Collectors.toList());
    }

    @Override
    public void deleteBySessionId(String sessionId) {
        store.remove(sessionId);
    }
}