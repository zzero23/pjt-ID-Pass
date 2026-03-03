import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchSettings, saveSettings, fetchHealth } from '../api/settingsApi';

const HEALTH_POLL_INTERVAL = 5000;

// null/undefined → '' 변환 (input value에 null 들어가면 uncontrolled 경고)
const normalize = (settings) => ({
  excelPath:        settings.excelPath        ?? '',
  sheetName:        settings.sheetName        ?? '',
  watchFolder:      settings.watchFolder      ?? '',
  maskingEnabled:   settings.maskingEnabled   ?? settings.masking   ?? true,
  autoDeleteEnabled: settings.autoDeleteEnabled ?? settings.autoDelete ?? true,
});

export function useSystemSettings() {
  const [settings, setSettings] = useState({
    excelPath: '',
    sheetName: '',
    watchFolder: '',
    maskingEnabled: true,
    autoDeleteEnabled: true,
  });

  const [health, setHealth] = useState({
    watchServiceRunning: false,
    watchFolder: '',
    status: 'STOPPED',
  });

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // 최초 설정 로드
  useEffect(() => {
    fetchSettings()
      .then(res => setSettings(normalize(res.data)))
      .catch(err => console.error('설정 로드 실패:', err));
  }, []);

  // Health Check 폴링
  const pollRef = useRef(null);
  useEffect(() => {
    const poll = () => {
      fetchHealth()
        .then(res => setHealth(res.data))
        .catch(() => setHealth(prev => ({ ...prev, status: 'STOPPED', watchServiceRunning: false })));
    };
    poll();
    pollRef.current = setInterval(poll, HEALTH_POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, []);

  const handleChange = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await saveSettings(settings);
      setSettings(normalize(res.data));
      const healthRes = await fetchHealth();
      setHealth(healthRes.data);
    } catch (err) {
      console.error('설정 저장 실패:', err);
      setSaveError('설정 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  }, [settings]);

  return { settings, health, saving, saveError, handleChange, handleSave };
}