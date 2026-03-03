package io.github.zzero23.idpass.core.repository;

import io.github.zzero23.idpass.domain.entity.OcrItem;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Repository
public class InMemoryOcrItemRepository implements OcrItemRepository {

    private final Map<String, List<OcrItem>> store = new ConcurrentHashMap<>();

    /**
     * 세션에 아이템을 추가합니다.
     * 같은 fileName 이 이미 존재하면 덮어쓰고, 없으면 새로 추가합니다.
     * → 여러 장을 순차 분석할 때 이전 결과가 사라지지 않습니다.
     */
    @Override
    public void save(String sessionId, List<OcrItem> items) {
        store.compute(sessionId, (key, existing) -> {
            List<OcrItem> list = (existing != null) ? existing : new ArrayList<>();
            for (OcrItem newItem : items) {
                list.removeIf(e -> e.getFileName().equals(newItem.getFileName()));
                list.add(newItem);
            }
            return list;
        });
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