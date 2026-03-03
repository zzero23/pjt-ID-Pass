import axios from 'axios';

const BASE = '/api/settings';

/**
 * 현재 설정 조회
 * → GET /api/settings
 */
export const fetchSettings = () =>
  axios.get(BASE);

/**
 * 설정 저장 (저장 버튼 클릭 시 호출)
 * → PATCH /api/settings
 * @param {Object} payload - 변경할 필드만 포함 (Partial Update)
 *   { excelPath, sheetName, watchFolder, maskingEnabled, autoDeleteEnabled }
 */
export const saveSettings = (payload) =>
  axios.patch(BASE, payload);

/**
 * WatchService 상태 조회 (Health Check)
 * → GET /api/settings/health
 * @returns {{ watchServiceRunning: boolean, watchFolder: string, status: string }}
 */
export const fetchHealth = () =>
  axios.get(`${BASE}/health`);