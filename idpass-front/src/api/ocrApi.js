import axios from 'axios';

const BASE = '/api/ocr';

export const analyzeFiles = (files, sessionId) => {
  const formData = new FormData();
  files.forEach(f => formData.append('files', f));
  return axios.post(`${BASE}/analyze?sessionId=${sessionId}`, formData);
};

export const getItems = (sessionId) =>
  axios.get(`${BASE}/sessions/${sessionId}/items`);

export const updateItem = (sessionId, payload) =>
  axios.patch(`${BASE}/sessions/${sessionId}/items`, payload);

/**
 * 엑셀 내보내기 — 서버 설정 경로에 파일로 저장됩니다.
 * (브라우저 다운로드 없음)
 */
export const exportExcel = (sessionId) =>
  axios.post(`${BASE}/sessions/${sessionId}/export`);