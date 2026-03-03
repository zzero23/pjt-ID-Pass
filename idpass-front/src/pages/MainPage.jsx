import React, { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Header from '../components/layout/Header';
import OcrStatusBar from '../components/ocr/OcrStatusBar';
import OcrResultCard from '../components/ocr/OcrResultCard';
import { analyzeFiles, exportExcel } from '../api/ocrApi';
import dogImg from '../assets/character-dog.png';

export default function MainPage() {
  const [results, setResults] = useState([]);
  const [sessionId] = useState(() => uuidv4());
  const inputRef = useRef(null);

  const handleUpload = useCallback(async (files) => {
    const fileArr = Array.from(files);

    // 로딩 상태로 초기화 (preview URL은 여기서 1회만 생성)
    const previews = fileArr.map(f => URL.createObjectURL(f));
    setResults(fileArr.map((f, i) => ({
      fileName: f.name,
      _preview: previews[i],
      pending: true,
      confidence: 1,
    })));

    // 파일별 순차 분석 — 백엔드 save()가 merge 방식이므로 sessionId에 누적됨
    for (let i = 0; i < fileArr.length; i++) {
      try {
        const res = await analyzeFiles([fileArr[i]], sessionId);
        const dto = Array.isArray(res.data) ? res.data[0] : res.data;
        setResults(prev => {
          const updated = [...prev];
          updated[i] = {
            ...dto,
            _preview: previews[i],   // 기존 preview 재사용 (새 URL 생성 X)
            pending: false,
            isExcluded: dto.isExcluded ?? false,
            isEdited: dto.isEdited ?? false,
          };
          return updated;
        });
      } catch (err) {
        console.error(`[${fileArr[i].name}] 분석 실패`, err);
        setResults(prev => {
          const updated = [...prev];
          updated[i] = {
            ...prev[i],
            pending: false,
            success: false,
            confidence: 0,
            isExcluded: false,
          };
          return updated;
        });
      }
    }
  }, [sessionId]);

  // OcrResultCard 에서 제외/수정 후 로컬 상태 동기화
  const handleItemUpdate = useCallback((updatedItem) => {
    setResults(prev =>
      prev.map(r => r.fileName === updatedItem.fileName ? { ...r, ...updatedItem } : r)
    );
  }, []);

  // 엑셀 저장 버튼
  const handleExcelSave = useCallback(async () => {
    try {
      await exportExcel(sessionId);
    } catch (err) {
      console.error('엑셀 저장 실패', err);
      alert('엑셀 저장에 실패했습니다.');
    }
  }, [sessionId]);

  return (
    <div style={styles.page}>
      <Header />

      <div style={styles.contentWrapper}>
        <div style={styles.dogSection}>
          <img src={dogImg} alt="dog" style={styles.dog} />
          <div style={styles.bubble}>
            주민등록증 전면 전체가 빛번짐 없이 찍힌 사진을 준비해주세요!
            <div style={styles.bubbleTail} />
          </div>
        </div>

        <div style={styles.mainLayout}>
          <div style={styles.leftCol}>
            <div
              style={styles.dropzone}
              onClick={() => inputRef.current.click()}
              onDrop={(e) => { e.preventDefault(); handleUpload(e.dataTransfer.files); }}
              onDragOver={(e) => e.preventDefault()}
            >
              <input
                ref={inputRef}
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => handleUpload(e.target.files)}
              />
              <div style={styles.dropText}>이미지를<br />드래그해주세요.</div>
            </div>
          </div>

          <div style={styles.rightCol}>
            <OcrStatusBar
              total={results.length}
              completed={results.filter(r => !r.pending).length}
              lowConfidenceCount={results.filter(r => !r.pending && r.confidence < 0.95).length}
            />
            <OcrResultCard
              items={results}
              sessionId={sessionId}
              onItemUpdate={handleItemUpdate}
              onExcelSave={handleExcelSave}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    height: '100vh',
    width: '100vw',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: '#fff',
    backgroundImage: `
      linear-gradient(0deg, transparent 24%, rgba(234,234,234,.5) 25%, rgba(234,234,234,.5) 26%, transparent 27%, transparent 74%, rgba(234,234,234,.5) 75%, rgba(234,234,234,.5) 76%, transparent 77%, transparent),
      linear-gradient(90deg, transparent 24%, rgba(234,234,234,.5) 25%, rgba(234,234,234,.5) 26%, transparent 27%, transparent 74%, rgba(234,234,234,.5) 75%, rgba(234,234,234,.5) 76%, transparent 77%, transparent)
    `,
    backgroundSize: '50px 50px',
  },
  contentWrapper: { flex: 1, padding: '2vh 10vw 4vh', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' },
  dogSection: { display: 'flex', alignItems: 'center', gap: '35px', marginBottom: '3vh', paddingLeft: '60px' },
  dog: { width: '140px', height: 'auto', transform: 'scaleX(-1)', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.05))' },
  bubble: { position: 'relative', border: '1.5px solid #eee', padding: '12px 35px', borderRadius: '18px', background: '#fff', fontSize: '15px', fontWeight: '500', color: '#444', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' },
  bubbleTail: { position: 'absolute', left: '-12px', top: '50%', transform: 'translateY(-50%)', borderTop: '12px solid transparent', borderBottom: '12px solid transparent', borderRight: '12px solid #fff' },
  mainLayout: { flex: 1, display: 'flex', gap: '50px', alignItems: 'stretch', minHeight: 0, overflow: 'hidden' },
  leftCol: { flex: '0 0 340px', display: 'flex' },
  dropzone: { flex: 1, border: '2px dashed #0FF0FC', borderRadius: '24px', backgroundColor: 'rgba(15,240,252,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' },
  dropText: { color: '#0FF0FC', fontWeight: 'bold', fontSize: '18px', textAlign: 'center', lineHeight: '1.5' },
  rightCol: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
};