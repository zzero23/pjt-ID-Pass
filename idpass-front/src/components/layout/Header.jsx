import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import homeLogo from '../../assets/home-logo.png';
import { useSystemSettings } from '../../hooks/useSystemSettings';

function deriveStatus({ settings, health }) {
  const enabled = !!settings.watchEnabled;

  if (!enabled) {
    return {
      dot: 'bg-gray-400',
      text: '탐지 안하는중',
      folder: settings.watchFolder || health.watchFolder || '',
    };
  }

  const running = !!health.watchServiceRunning || health.status === 'RUNNING';
  return {
    dot: running ? 'bg-green-500' : 'bg-red-500',
    text: running ? '감시 중' : 'STOPPED',
    folder: settings.watchFolder || health.watchFolder || '',
  };
}


const Header = () => {
  const navigate = useNavigate();
  const { settings, health } = useSystemSettings();
  const status = useMemo(() => deriveStatus({ settings, health }), [settings, health]);

  return (
    <header style={styles.header}>
      <div style={styles.logoWrapper}>
        <img src={homeLogo} alt="ID-Pass Logo" style={styles.logoImg} />
      </div>

      <div style={styles.statusGroup}>
        <span style={styles.statusDot}>{status.folder ? `${status.folder} ` : ''}</span>
        <span style={styles.statusText}>{status.text}</span>
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