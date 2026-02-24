package io.github.zzero23.idpass.core.repository;

import io.github.zzero23.idpass.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    // [MEM01] 이메일로 기존 회원인지 찾는 기능 추가
    Optional<User> findByEmail(String email);
}
