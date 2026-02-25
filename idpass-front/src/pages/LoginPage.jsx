import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * LoginPage 컴포넌트
 * 구글 인증 SDK를 로드하고, 로그인 성공 시 백엔드와 통신하여 유저 정보를 저장합니다.
 */
const LoginPage = () => {
    
    useEffect(() => {
        console.log("체크된 Client ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);
        
        // 1. 구글 SDK 로드
        const script = document.createElement('script');
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
            if (window.google) {
                // 2. 구글 계정 서비스 초기화
                window.google.accounts.id.initialize({
                    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                    callback: handleCredentialResponse
                });
                
                // 3. 구글 표준 로그인 버튼 생성
                window.google.accounts.id.renderButton(
                    document.getElementById("googleBtn"),
                    { theme: "outline", size: "large", text: "signin_with" }
                );
            }
        };
        document.head.appendChild(script);
    }, []);

    /**
     * 구글 로그인 성공 시 실행되는 콜백 함수
     */

    const navigate = useNavigate();
    const handleCredentialResponse = (response) => {
        // Nginx 프록시(/api/)를 통해 백엔드에 로그인 요청
        fetch(`/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: response.credential })
        })
        .then(res => {
            if (!res.ok) throw new Error('백엔드 응답 실패');
            return res.json();
        })
        .then(data => {
            console.log("로그인 성공 데이터:", data);

            // ✅ [데이터 저장] 브라우저 로컬 스토리지에 유저 객체 저장
            // 이를 통해 새로고침해도 로그인 상태를 확인할 수 있게 됨
            localStorage.setItem('user', JSON.stringify(data));

            alert(`${data.email}님 환영합니다!`);

            // ✅ [페이지 이동] 로그인 성공 후 메인 대시보드로 리다이렉트
            navigate('/main');
        })
        .catch(err => {
            console.error("로그인 처리 중 에러 발생:", err);
            alert("로그인 처리 중 문제가 발생했습니다.");
        });
    };

    return (
        <div style={containerStyle}>
            {/* 왼쪽: 서비스 소개 섹션 */}
            <div style={infoSectionStyle}>
                <h1 style={{ color: '#00B4D8', fontSize: '3.5rem' }}>ID-Pass</h1>
                <p style={{ fontSize: '1.25rem', lineHeight: '1.6' }}>
                    주민등록증 사진을 업로드하면<br/>
                    바로 시트에 정리돼요!
                </p>
            </div>

            {/* 오른쪽: 로그인 버튼 섹션 */}
            <div style={loginSectionStyle}>
                <div id="googleBtn"></div>
            </div>
        </div>
    );
};

// --- 레이아웃 스타일 정의 ---
const containerStyle = {
    display: 'flex',
    height: '100vh',
    alignItems: 'center',
    padding: '0 12%',
    backgroundColor: '#fff'
};

const infoSectionStyle = {
    flex: 1.2
};

const loginSectionStyle = {
    flex: 0.8,
    display: 'flex',
    justifyContent: 'center'
};

export default LoginPage;