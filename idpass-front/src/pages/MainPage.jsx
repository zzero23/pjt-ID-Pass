import React, { useState, useCallback, useRef } from 'react';
import axios from 'axios';
import Header from '../components/layout/Header';
import OcrStatusBar from '../components/ocr/OcrStatusBar';
import OcrResultCard from '../components/ocr/OcrResultCard';
import dogImg from '../assets/character-dog.png'; 

export default function MainPage() {
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);

  const handleUpload = useCallback(async (files) => {
    const fileArr = Array.from(files);
    setResults(fileArr.map(f => ({ fileName: f.name, _preview: URL.createObjectURL(f), pending: true, confidence: 1 })));
    for (let i = 0; i < fileArr.length; i++) {
      const formData = new FormData();
      formData.append("files", fileArr[i]);
      try {
        const res = await axios.post("/api/ocr/analyze", formData);
        const dto = Array.isArray(res.data) ? res.data[0] : res.data;
        setResults(prev => {
          const updated = [...prev];
          updated[i] = { ...dto, _preview: URL.createObjectURL(fileArr[i]), pending: false };
          return updated;
        });
      } catch (err) { console.error(err); }
    }
  }, []);

  return (
    <div style={styles.page}>
      <Header />
      <div style={styles.contentWrapper}>
        {/* 🐕 강아지 섹션: 위치를 오른쪽으로 밀어내기 위해 padding 추가 [cite: 2026-02-26] */}
        <div style={styles.dogSection}>
          <img src={dogImg} alt="dog" style={styles.dog} />
          <div style={styles.bubble}>
            주민등록증 전면 전체가 빛번짐 없이 찍힌 사진을 준비해주세요!
            <div style={styles.bubbleTail} />
          </div>
        </div>

        <div style={styles.mainLayout}>
          <div style={styles.leftCol}>
            <div style={styles.dropzone} onClick={() => inputRef.current.click()}
                 onDrop={(e) => { e.preventDefault(); handleUpload(e.dataTransfer.files); }} 
                 onDragOver={(e) => e.preventDefault()}>
              <input ref={inputRef} type="file" multiple style={{ display: 'none' }} onChange={(e) => handleUpload(e.target.files)} />
              <div style={styles.dropText}>이미지를<br/>드래그해주세요.</div>
            </div>
          </div>
          <div style={styles.rightCol}>
            <OcrStatusBar total={results.length} completed={results.filter(r => !r.pending).length} 
                          lowConfidenceCount={results.filter(r => !r.pending && r.confidence < 0.95).length} />
            <OcrResultCard items={results} onExcelSave={i => console.log(i)} />
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { background: '#fcfcfc', height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  contentWrapper: { flex: 1, padding: '2vh 10vw 4vh', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' },
  
  // ✅ 강아지 섹션 조정 포인트 [cite: 2026-02-26]
  dogSection: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '35px', 
    marginBottom: '3vh',
    paddingLeft: '80px' // 이 값을 조절해서 오른쪽으로 더 밀거나 당김
  },
  
  dog: { width: '140px', height: 'auto', transform: 'scaleX(-1)', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.05))' },
  bubble: { position: 'relative', border: '1.5px solid #eee', padding: '12px 40px', borderRadius: '18px', background: '#fff', fontSize: '15px', fontWeight: '500', color: '#444' },
  bubbleTail: { position: 'absolute', left: '-12px', top: '50%', transform: 'translateY(-50%)', borderTop: '12px solid transparent', borderBottom: '12px solid transparent', borderRight: '12px solid #fff' },
  mainLayout: { flex: 1, display: 'flex', gap: '50px', alignItems: 'stretch', maxHeight: '60vh' },
  leftCol: { flex: '0 0 340px', display: 'flex' },
  dropzone: { flex: 1, border: '2px dashed #0FF0FC', borderRadius: '24px', backgroundColor: 'rgba(15, 240, 252, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' },
  dropText: { color: '#0FF0FC', fontWeight: 'bold', fontSize: '18px', textAlign: 'center', lineHeight: '1.5' },
  rightCol: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }
};