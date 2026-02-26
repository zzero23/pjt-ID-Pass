import React from 'react';
import homeLogo from '../../assets/home-logo.png'; 

const Header = () => (
  <header style={styles.header}>
    {/* ── 로고 영역: 텍스트 대신 이미지 적용 ── */}
    <div style={styles.logoWrapper}>
      <img src={homeLogo} alt="ID-Pass Logo" style={styles.logoImg} />
    </div>

    <div style={styles.statusGroup}>
      <span style={styles.statusDot}>●</span>
      <span style={styles.statusText}>SSAFY_14_주민등록증 폴더 감시 중</span>
      <button style={styles.settingsBtn}>⚙️</button>
    </div>
  </header>
);

const styles = {
  header: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: '12px 5%', 
    borderBottom: '1px solid #eee', 
    backgroundColor: '#fff', 
    width: '100%', 
    boxSizing: 'border-box' 
  },
  // ✅ 로고 이미지 스타일 조정
  logoWrapper: { 
    display: 'flex', 
    alignItems: 'center' 
  },
  logoImg: { 
    height: '32px', // 헤더 높이에 맞춰 적절히 조절해
    width: 'auto', 
    objectFit: 'contain' 
  },
  statusGroup: { display: 'flex', alignItems: 'center', gap: '10px' },
  statusDot: { color: '#48bb78', fontSize: '10px' },
  statusText: { fontSize: '14px', color: '#4a5568' },
  settingsBtn: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#cbd5e0' }
};

export default Header;