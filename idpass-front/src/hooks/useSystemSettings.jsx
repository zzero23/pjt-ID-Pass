import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { fetchSettings, saveSettings, fetchHealth } from '../api/settingsApi';

const HEALTH_POLL_INTERVAL = 5000;

const normalize = (s) => ({
  excelPath:         s.excelPath         ?? '',
  excelFileName:     s.excelFileName     ?? '',
  sheetName:         s.sheetName         ?? '',
  watchFolder:       s.watchFolder       ?? '',
  watchEnabled:      s.watchEnabled      ?? true,
  maskingEnabled:    s.maskingEnabled    ?? s.masking    ?? true,
  autoDeleteEnabled: s.autoDeleteEnabled ?? s.autoDelete ?? true,
});

const SystemSettingsContext = createContext(null);

function useSystemSettingsInternal() {
  const [settings, setSettings] = useState({
    excelPath: '',
    excelFileName: '',
    sheetName: '',
    watchFolder: '',
    watchEnabled: true,
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

  // 초기 설정 로드
  useEffect(() => {
    fetchSettings()
      .then((res) => setSettings(normalize(res.data)))
      .catch((err) => console.error('설정 로드 실패:', err));
  }, []);

  // 상태 폴링
  const pollRef = useRef(null);
  useEffect(() => {
    const poll = () => {
      fetchHealth()
        .then((res) => setHealth(res.data))
        .catch(() =>
          setHealth((prev) => ({ ...prev, status: 'STOPPED', watchServiceRunning: false }))
        );
    };
    poll();
    pollRef.current = setInterval(poll, HEALTH_POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, []);

  // 입력 변경 (저장 전에도 Header에 즉시 반영됨)
  const handleChange = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await saveSettings(settings);
      setSettings(normalize(res.data));

      // 저장 후 health도 한 번 갱신
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

export function SystemSettingsProvider({ children }) {
  const value = useSystemSettingsInternal();
  const memo = useMemo(() => value, [
    value.settings,
    value.health,
    value.saving,
    value.saveError,
    value.handleChange,
    value.handleSave,
  ]);

  return (
    <SystemSettingsContext.Provider value={memo}>
      {children}
    </SystemSettingsContext.Provider>
  );
}

export function useSystemSettings() {
  const ctx = useContext(SystemSettingsContext);
  if (!ctx) throw new Error('useSystemSettings must be used within a <SystemSettingsProvider>.');
  return ctx;
}