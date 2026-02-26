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
      {/* 헤더는 흰색 배경을 유지하기 위해 별도의 스타일이 적용됨 */}
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
  // ✅ 1. 페이지 전체에 격자 배경 적용
  page: { 
    height: '100vh', 
    width: '100vw', 
    display: 'flex', 
    flexDirection: 'column', 
    overflow: 'hidden',
    backgroundColor: '#fff', // 기본 바탕색
    backgroundImage: `
        linear-gradient(0deg, transparent 24%, rgba(234, 234, 234, .5) 25%, rgba(234, 234, 234, .5) 26%, transparent 27%, transparent 74%, rgba(234, 234, 234, .5) 75%, rgba(234, 234, 234, .5) 76%, transparent 77%, transparent),
        linear-gradient(90deg, transparent 24%, rgba(234, 234, 234, .5) 25%, rgba(234, 234, 234, .5) 26%, transparent 27%, transparent 74%, rgba(234, 234, 234, .5) 75%, rgba(234, 234, 234, .5) 76%, transparent 77%, transparent)
    `,
    backgroundSize: '50px 50px' // 격자 크기 [cite: 2026-02-26]
  },

  contentWrapper: { 
    flex: 1, 
    padding: '2vh 10vw 4vh', 
    boxSizing: 'border-box', 
    display: 'flex', 
    flexDirection: 'column' 
  },
  
  dogSection: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '35px', 
    marginBottom: '3vh',
    paddingLeft: '80px'
  },
  
  dog: { width: '140px', height: 'auto', transform: 'scaleX(-1)', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.05))' },
  
  // ✅ 말풍선 배경도 격자 위에서 잘 보이도록 흰색 유지 [cite: 2026-02-26]
  bubble: { 
    position: 'relative', 
    border: '1.5px solid #eee', 
    padding: '12px 35px', 
    borderRadius: '18px', 
    background: '#fff', 
    fontSize: '15px', 
    fontWeight: '500', 
    color: '#444',
    boxShadow: '0 4px 15px rgba(0,0,0,0.05)' // 가독성을 위한 미세한 그림자
  },

  bubbleTail: { position: 'absolute', left: '-12px', top: '50%', transform: 'translateY(-50%)', borderTop: '12px solid transparent', borderBottom: '12px solid transparent', borderRight: '12px solid #fff' },
  mainLayout: { flex: 1, display: 'flex', gap: '50px', alignItems: 'stretch', maxHeight: '60vh' },
  leftCol: { flex: '0 0 340px', display: 'flex' },
  dropzone: { flex: 1, border: '2px dashed #0FF0FC', borderRadius: '24px', backgroundColor: 'rgba(15, 240, 252, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' },
  dropText: { color: '#0FF0FC', fontWeight: 'bold', fontSize: '18px', textAlign: 'center', lineHeight: '1.5' },
  rightCol: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }
};