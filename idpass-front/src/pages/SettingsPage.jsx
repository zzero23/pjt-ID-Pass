import React from 'react';
import { useSystemSettings } from '../hooks/useSystemSettings';

/**
 * 설정 페이지 — 디자인 없이 로직만 작성된 예시입니다.
 * 실제 UI는 이 훅을 가져다 원하는 컴포넌트에 붙이면 됩니다.
 */
export default function SettingsPage() {
  const { settings, health, saving, saveError, handleChange, handleSave } = useSystemSettings();

  return (
    <div>
      {/* ── 엑셀 경로 ── */}
      <label>엑셀 저장 경로
        <input
          type="text"
          value={settings.excelPath}
          onChange={e => handleChange('excelPath', e.target.value)}
        />
      </label>

      {/* ── 시트명 ── */}
      <label>시트명
        <input
          type="text"
          value={settings.sheetName}
          onChange={e => handleChange('sheetName', e.target.value)}
        />
      </label>

      {/* ── 감시 폴더 ── */}
      <label>감시 폴더 경로
        <input
          type="text"
          value={settings.watchFolder}
          onChange={e => handleChange('watchFolder', e.target.value)}
        />
      </label>

      {/* ── 보안 옵션 ── */}
      <label>
        <input
          type="checkbox"
          checked={settings.maskingEnabled}
          onChange={e => handleChange('maskingEnabled', e.target.checked)}
        />
        주민번호 마스킹
      </label>

      <label>
        <input
          type="checkbox"
          checked={settings.autoDeleteEnabled}
          onChange={e => handleChange('autoDeleteEnabled', e.target.checked)}
        />
        자동 삭제
      </label>

      {/* ── 저장 버튼 ── */}
      {saveError && <p style={{ color: 'red' }}>{saveError}</p>}
      <button onClick={handleSave} disabled={saving}>
        {saving ? '저장 중...' : '저장'}
      </button>

      {/* ── Health Check 상태 표시 ── */}
      <div>
        <strong>감시 폴더 상태:</strong>{' '}
        <span style={{ color: health.watchServiceRunning ? 'green' : 'gray' }}>
          {health.status}
        </span>
        {health.watchFolder && <span> ({health.watchFolder})</span>}
      </div>
    </div>
  );
}