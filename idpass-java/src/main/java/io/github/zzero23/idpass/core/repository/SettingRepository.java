package io.github.zzero23.idpass.core.repository;

import io.github.zzero23.idpass.domain.entity.UserSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SettingRepository extends JpaRepository<UserSetting, Long> {
    // [MAIN01] 사용자 ID로 설정값을 찾는 기능 추가
    Optional<UserSetting> findByUserId(Long userId);
}