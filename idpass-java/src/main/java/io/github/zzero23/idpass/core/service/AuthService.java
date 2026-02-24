package io.github.zzero23.idpass.core.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import io.github.zzero23.idpass.api.dto.auth.AuthDto;
import io.github.zzero23.idpass.core.repository.SettingRepository;
import io.github.zzero23.idpass.core.repository.UserRepository;
import io.github.zzero23.idpass.domain.entity.User;
import io.github.zzero23.idpass.domain.entity.UserSetting;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final SettingRepository settingRepository;

    @Value("${google.client-id}") private String googleClientId;

    @Transactional
    public AuthDto.Session login(AuthDto.In input) throws Exception {
        // 1. 구글 토큰 검증 및 이메일 추출
        String email = verifyToken(input.getIdToken());

        // 2. 기존 유저 확인 혹은 신규 가입
        User user = userRepository.findByEmail(email)
                .orElseGet(() -> signUp(email));

        return new AuthDto.Session(user.getUserId(), user.getEmail());
    }

    private User signUp(String email) {
        // [MEM01] 회원 등록 [cite: 2026-02-24]
        User newUser = userRepository.save(new User(email));
        // [ERD] 기본 설정값 동시 생성 [cite: 2026-02-24]
        settingRepository.save(new UserSetting(newUser.getUserId()));
        return newUser;
    }

    private String verifyToken(String idToken) throws Exception {
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                .setAudience(Collections.singletonList(googleClientId))
                .build();

        GoogleIdToken token = verifier.verify(idToken);
        if (token == null) throw new RuntimeException("유효하지 않은 구글 토큰입니다.");

        return token.getPayload().getEmail();
    }
}
