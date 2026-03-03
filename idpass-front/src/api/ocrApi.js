import axios from 'axios';

const BASE = '/api/ocr';

/**
 * OCR 분석 요청
 * @param {File[]} files
 * @param {string} sessionId
 */
export const analyzeFiles = (files, sessionId) => {
  const formData = new FormData();
  files.forEach(f => formData.append('files', f));
  return axios.post(`${BASE}/analyze?sessionId=${sessionId}`, formData);
};

/**
 * 세션 아이템 전체 조회
 * @param {string} sessionId
 */
export const getItems = (sessionId) =>
  axios.get(`${BASE}/sessions/${sessionId}/items`);

/**
 * 단건 수정 (성명, 주소 등) 또는 제외 처리
 * @param {string} sessionId
 * @param {{ fileName: string, name?: string, birthDate?: string, gender?: string, address?: string, isExcluded?: boolean }} payload
 */
export const updateItem = (sessionId, payload) =>
  axios.patch(`${BASE}/sessions/${sessionId}/items`, payload);

/**
 * 엑셀 내보내기 (isExcluded=false 인 건만)
 * @param {string} sessionId
 */
export const exportExcel = async (sessionId) => {
  const res = await axios.post(
    `${BASE}/sessions/${sessionId}/export`,
    {},
    { responseType: 'blob' }
  );

  // 브라우저 다운로드 트리거
  const url = URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'ocr_result.xlsx';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};