package io.github.zzero23.idpass.core.service;

import org.springframework.stereotype.Service;

/**
 * 사용자가 입력한 Windows 경로를 컨테이너 내부 경로로 자동 변환합니다.
 *
 * docker-compose.yml:
 *   C:/Users  →  /app/local_users
 *
 * 예시:
 *   C:\Users\SSAFY\Desktop\IDPass  →  /app/local_users/SSAFY/Desktop/IDPass
 *   C:/Users/SSAFY/Desktop         →  /app/local_users/SSAFY/Desktop
 */
@Service
public class PathMappingService {

    private static final String LOCAL_PREFIX  = "C:/Users";
    private static final String CONTAINER_PREFIX = "/app/local_users";

    /** 사용자 입력(Windows) → 컨테이너 경로 */
    public String toContainerPath(String userInput) {
        if (userInput == null || userInput.isBlank()) return userInput;

        // 백슬래시 통일
        String normalized = userInput.replace("\\", "/").trim();

        // C:/Users/... → /app/local_users/...
        if (normalized.toUpperCase().startsWith("C:/USERS")) {
            return CONTAINER_PREFIX + normalized.substring("C:/Users".length());
        }

        // 이미 컨테이너 경로거나 알 수 없는 경로는 그대로
        return normalized;
    }

    /** 컨테이너 경로 → UI 표시용 Windows 경로 */
    public String toLocalPath(String containerPath) {
        if (containerPath == null || containerPath.isBlank()) return containerPath;

        if (containerPath.startsWith(CONTAINER_PREFIX)) {
            return "C:\\Users" + containerPath
                    .substring(CONTAINER_PREFIX.length())
                    .replace("/", "\\");
        }
        return containerPath;
    }
}