package io.github.zzero23.idpass.api.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

public class AuthDto {
    @Getter
    @Setter // [MEM01_LOGIN01] 요청 바구니
    public static class In { private String idToken; }

    @Getter @AllArgsConstructor // 로그인 성공 후 세션 정보
    public static class Session {
        private Long userId;
        private String email;
    }
}
