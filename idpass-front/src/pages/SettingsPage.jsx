import React from 'react';
import { useSystemSettings } from '../hooks/useSystemSettings';

export default function SettingsPage() {
  const { settings, health, saving, saveError, handleChange, handleSave } = useSystemSettings();

  return (
    <div>
      <label>엑셀 저장 경로
        <input type="text" value={settings.excelPath}
          placeholder="비워두면 바탕화면에 저장"
          onChange={e => handleChange('excelPath', e.target.value)} />
      </label>

      <label>파일명
        <input type="text" value={settings.excelFileName}
          placeholder="비워두면 ocr_result.xlsx"
          onChange={e => handleChange('excelFileName', e.target.value)} />
      </label>

      <label>시트명
        <input type="text" value={settings.sheetName}
          placeholder="비워두면 Sheet1"
          onChange={e => handleChange('sheetName', e.target.value)} />
      </label>

      <label>감시 폴더 경로
        <input type="text" value={settings.watchFolder}
          onChange={e => handleChange('watchFolder', e.target.value)} />
      </label>

      <label>
        <input type="checkbox" checked={settings.maskingEnabled}
          onChange={e => handleChange('maskingEnabled', e.target.checked)} />
        주민번호 마스킹
      </label>

      <label>
        <input type="checkbox" checked={settings.autoDeleteEnabled}
          onChange={e => handleChange('autoDeleteEnabled', e.target.checked)} />
        자동 삭제
      </label>

      {saveError && <p style={{ color: 'red' }}>{saveError}</p>}
      <button onClick={handleSave} disabled={saving}>
        {saving ? '저장 중...' : '저장'}
      </button>

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