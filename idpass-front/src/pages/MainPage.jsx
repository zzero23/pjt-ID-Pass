import React from 'react';

const MainPage = () => {
    // 로컬 스토리지에서 유저 정보를 꺼내와
    const user = JSON.parse(localStorage.getItem('user'));

    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <h1>메인 페이지</h1>
            {user ? (
                <p>{user.email}님, 로그인을 환영합니다! 🚀</p>
            ) : (
                <p>로그인 정보가 없습니다.</p>
            )}
            <button onClick={() => {
                localStorage.removeItem('user');
                window.location.href = '/';
            }}>로그아웃</button>
        </div>
    );
};

export default MainPage;