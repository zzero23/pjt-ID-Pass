package io.github.zzero23.idpass.core.repository;

import io.github.zzero23.idpass.domain.entity.OcrItem;

import java.util.List;
import java.util.Optional;

public interface OcrItemRepository {

    void save(String sessionId, List<OcrItem> items);

    Optional<OcrItem> findOne(String sessionId, String fileName);

    List<OcrItem> findAll(String sessionId);

    /** isExcluded == false 인 아이템만 반환 (엑셀 저장 대상) */
    List<OcrItem> findExportable(String sessionId);

    void deleteBySessionId(String sessionId);
}