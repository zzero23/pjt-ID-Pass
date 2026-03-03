import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import homeLogo from '../assets/home-logo.png';
import characterDog from '../assets/character-dog.png';

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
                    { theme: "outline", size: "large", text: "signin_with", width: "300" }
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
            {/* 좌측 섹션: 로고 크기 키우고 설명 줄이기 */}
            <div style={leftSectionStyle}>
                <div style={logoWrapperStyle}>
                    <img 
                        src={homeLogo}
                        alt="ID-Pass Logo" 
                        style={logoImageStyle} 
                    />
                    <p style={descriptionStyle}>
                        주민등록증 사진을 업로드하면<br/>
                        바로 시트에 정리돼요!
                    </p>
                </div>
            </div>

            {/* 우측 섹션: 버튼 높이 90px 및 위치 조정 */}
            <div style={rightSectionStyle}>
                <div id="googleBtn" style={googleBtnWrapperStyle}></div>
            </div>

            {/* 캐릭터 섹션: 현재 위치(image_3052bc) 유지 */}
            <div style={characterSectionStyle}>
                <div style={bubbleWrapperStyle}>
                    <div style={bubbleTextStyle}>와 인사 업무 너무 편하다!</div>
                    <div style={bubbleTailBorderStyle}></div> {/* 테두리용 꼬리 */}
                    <div style={bubbleTailBackgroundStyle}></div> {/* 배경색용 꼬리 */}
                </div>
                <img 
                    src={characterDog}
                    alt="Dog Character" 
                    style={dogImageStyle} 
                />
            </div>
        </div>
    );
};

// --- 레이아웃 스타일 정의 (요청 사항 반영) ---
const containerStyle = {
    display: 'flex',
    width: '100vw',
    height: '100vh',
    position: 'relative',
    overflow: 'hidden',
    margin: 0,
    padding: 0,
    backgroundColor: '#fff',
    backgroundImage: `
        linear-gradient(0deg, transparent 24%, rgba(234, 234, 234, .5) 25%, rgba(234, 234, 234, .5) 26%, transparent 27%, transparent 74%, rgba(234, 234, 234, .5) 75%, rgba(234, 234, 234, .5) 76%, transparent 77%, transparent),
        linear-gradient(90deg, transparent 24%, rgba(234, 234, 234, .5) 25%, rgba(234, 234, 234, .5) 26%, transparent 27%, transparent 74%, rgba(234, 234, 234, .5) 75%, rgba(234, 234, 234, .5) 76%, transparent 77%, transparent)
    `,
    backgroundSize: '50px 50px'
};

const leftSectionStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: '50px' // ✅ 로고와 버튼 사이 간격을 더 넓힘 (기존 80px -> 120px)
};

const logoWrapperStyle = {
    textAlign: 'left',
    width: '400px'
};

const logoImageStyle = {
    width: '400px', // ✅ IDPASS 로고 크기 대폭 키움 (기존 320px)
    marginBottom: '15px'
};

const descriptionStyle = {
    fontSize: '1.1rem', // ✅ 글자 크기 줄임 (기존 1.4rem)
    color: '#333',
    lineHeight: '1.5',
    fontWeight: 'normal',
    margin: 0,
    width: '400px', // 로고 너비와 맞춰서 정렬
    paddingLeft: '30px'
};

const rightSectionStyle = {
    flex: 1,
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingLeft: '50px' // ✅ 로고와 버튼 사이 간격을 더 넓힘
};

const googleBtnWrapperStyle = {
    minWidth: '350px',
    height: '90px',      // ✅ 버튼 영역 높이 90px 설정
    display: 'flex',
    alignItems: 'center', // 세로 중앙 정렬
    justifyContent: 'center', // ✅ 강아지 위치와 맞추기 위해 왼쪽 정렬
    transform: 'scale(1.55)', 
    transformOrigin: 'left center'
};

const characterSectionStyle = {
    position: 'absolute',
    bottom: '60px',
    right: '150px', // ✅ image_3052bc의 완벽한 위치 유지
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10
};

const bubbleWrapperStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    marginRight: '20px', // ✅ 강아지와 말풍선 사이의 간격 (10px 전 지점 조절) [cite: 2026-02-25]
};

const bubbleTextStyle = {
    backgroundColor: '#fff',
    border: '1.5px solid #EAEAEA',
    padding: '12px 24px',
    borderRadius: '12px',
    fontSize: '1rem',
    color: '#333',
    boxShadow: '0 4px 10px rgba(0,0,0,0.05)', // 본체 그림자 [cite: 2026-02-25]
    whiteSpace: 'nowrap',
    fontWeight: '500',
    position: 'relative',
    zIndex: 2 // 꼬리보다 위에 오게 설정
};

// ✅ 말풍선 꼬리 테두리 (연결 지점 완벽 제거 버전)
const bubbleTailBorderStyle = {
    position: 'absolute',
    right: '-10px', 
    top: '50%',
    transform: 'translateY(-50%)',
    width: 0,
    height: 0,
    borderTop: '10px solid transparent',
    borderBottom: '10px solid transparent',
    borderLeft: '10px solid #EAEAEA', // 테두리 선 [cite: 2026-02-25]
    zIndex: 1
};

// ✅ 말풍선 꼬리 배경 (본체 테두리를 1px 덮어서 선을 지워줌)
const bubbleTailBackgroundStyle = {
    position: 'absolute',
    right: '-8.5px', // 👈 본체 테두리 1.5px를 정확히 가리도록 조정 [cite: 2026-02-25]
    top: '50%',
    transform: 'translateY(-50%)',
    width: 0,
    height: 0,
    borderTop: '8.5px solid transparent',
    borderBottom: '8.5px solid transparent',
    borderLeft: '8.5px solid #fff', // 본체와 같은 흰색 [cite: 2026-02-25]
    zIndex: 3 // 가장 위에서 테두리 겹침을 지워버림
};

const dogImageStyle = {
    width: '150px'
};

export default LoginPage;