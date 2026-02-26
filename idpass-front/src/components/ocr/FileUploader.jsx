import React from 'react';
import dogImg from '../../assets/character-dog.png'; 

const FileUploader = ({ onUpload, inputRef }) => (
  <div style={styles.container}>
    <div style={styles.guideRow}>
      <img src={dogImg} alt="dog" style={styles.dog} />
      <div style={styles.bubble}>주민등록증 전면 전체가 빛번짐 없이 찍힌 사진을 준비해주세요!</div>
    </div>
    <div 
      style={styles.dropzone}
      onClick={() => inputRef.current.click()}
      onDrop={(e) => { e.preventDefault(); onUpload(e.dataTransfer.files); }}
      onDragOver={(e) => e.preventDefault()}
    >
      <input ref={inputRef} type="file" multiple style={{ display: 'none' }} onChange={(e) => onUpload(e.target.files)} />
      <div style={styles.dropText}>이미지를<br/>드래그해주세요.</div>
    </div>
  </div>
);

const styles = {
  container: { flex: '0 0 320px', display: 'flex', flexDirection: 'column', gap: '20px' },
  guideRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  dog: { width: '80px' },
  bubble: { flex: 1, border: '1px solid #eee', padding: '12px', borderRadius: '10px', fontSize: '12px', backgroundColor: '#fff' },
  dropzone: { flex: 1, minHeight: '400px', border: '2px dashed #11DAE5', brderRadius: '20px', backgroundColor: 'rgba(15, 240, 252, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' },
  dropText: { color: '#11DAE5', fontWeight: 'bold', textAlign: 'center', fontSize: '16px' }
};

export default FileUploader;