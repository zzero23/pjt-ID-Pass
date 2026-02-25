package io.github.zzero23.idpass.api.controller;

import io.github.zzero23.idpass.api.dto.auth.AuthDto;
import io.github.zzero23.idpass.core.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth") // Nginx에서 /api/를 백엔드로 넘겨주기로 했지? [cite: 2026-02-24, 2026-02-25]
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthDto.Session> login(@RequestBody AuthDto.In input) throws Exception {
        // 서비스의 로그인 로직 호출 [cite: 2026-02-24]
        AuthDto.Session session = authService.login(input);
        return ResponseEntity.ok(session);
    }
}