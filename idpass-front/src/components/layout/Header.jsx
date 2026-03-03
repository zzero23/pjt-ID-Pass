import React from 'react';
import { useNavigate } from 'react-router-dom';
import homeLogo from '../../assets/home-logo.png';

const Header = () => {
  const navigate = useNavigate();

  return (
    <header style={styles.header}>
      <div style={styles.logoWrapper}>
        <img src={homeLogo} alt="ID-Pass Logo" style={styles.logoImg} />
      </div>

      <div style={styles.statusGroup}>
        <span style={styles.statusDot}>●</span>
        <span style={styles.statusText}>SSAFY_14_주민등록증 폴더 감시 중</span>
        <button
          style={styles.settingsBtn}
          onClick={() => navigate('/settings')}
          title="설정"
        >
          ⚙️
        </button>
      </div>
    </header>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 5%',
    borderBottom: '1px solid #eee',
    backgroundColor: '#fff',
    width: '100%',
    boxSizing: 'border-box',
  },
  logoWrapper: { display: 'flex', alignItems: 'center' },
  logoImg: { height: '32px', width: 'auto', objectFit: 'contain' },
  statusGroup: { display: 'flex', alignItems: 'center', gap: '10px' },
  statusDot: { color: '#48bb78', fontSize: '10px' },
  statusText: { fontSize: '14px', color: '#4a5568' },
  settingsBtn: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#cbd5e0' },
};

export default Header;