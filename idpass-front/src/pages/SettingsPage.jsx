import React from 'react';
import { useSystemSettings } from '../hooks/useSystemSettings';

export default function SettingsPage() {
  const { settings, health, saving, saveError, handleChange, handleSave } = useSystemSettings();

  const statusText = !settings.watchEnabled
    ? '탐지 안하는중'
    : (health.watchServiceRunning || health.status === 'RUNNING')
      ? '감시 중'
      : 'STOPPED';

  return (
    <div>
      <label>엑셀 저장 경로
        <input
          type="text"
          value={settings.excelPath}
          placeholder="비워두면 바탕화면에 저장"
          onChange={(e) => handleChange('excelPath', e.target.value)}
        />
      </label>

      <label>파일명
        <input
          type="text"
          value={settings.excelFileName}
          placeholder="비워두면 ocr_result.xlsx"
          onChange={(e) => handleChange('excelFileName', e.target.value)}
        />
      </label>

      <label>시트명
        <input
          type="text"
          value={settings.sheetName}
          placeholder="비워두면 Sheet1"
          onChange={(e) => handleChange('sheetName', e.target.value)}
        />
      </label>

      <label>감시 폴더 경로
        <input
          type="text"
          value={settings.watchFolder}
          placeholder="예) C:/Users/SSAFY/Desktop/IDPass"
          onChange={(e) => handleChange('watchFolder', e.target.value)}
        />
      </label>

      {/* ✅ 감시 토글 */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="checkbox"
          checked={!!settings.watchEnabled}
          onChange={(e) => handleChange('watchEnabled', e.target.checked)}
        />
        폴더 감시 사용
      </label>

      <label>
        <input
          type="checkbox"
          checked={!!settings.maskingEnabled}
          onChange={(e) => handleChange('maskingEnabled', e.target.checked)}
        />
        주민번호 마스킹
      </label>

      <label>
        <input
          type="checkbox"
          checked={!!settings.autoDeleteEnabled}
          onChange={(e) => handleChange('autoDeleteEnabled', e.target.checked)}
        />
        자동 삭제
      </label>

      {saveError && <p style={{ color: 'red' }}>{saveError}</p>}
      <button onClick={handleSave} disabled={saving}>
        {saving ? '저장 중...' : '저장'}
      </button>

      <div style={{ marginTop: 12 }}>
        <strong>감시 폴더 상태:</strong>{' '}
        <span style={{ color: statusText === '감시 중' ? 'green' : 'gray' }}>{statusText}</span>
        {(settings.watchFolder || health.watchFolder) && (
          <span> ({settings.watchFolder || health.watchFolder})</span>
        )}
      </div>
    </div>
  );
}