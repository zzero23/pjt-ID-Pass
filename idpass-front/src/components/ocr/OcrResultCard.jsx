import React, { useState, useMemo } from 'react';
import { updateItem } from '../../api/ocrApi'; // ✅ 경로 확인: src/api/ocrApi.js 기준 [cite: 2026-02-27]

const OcrResultCard = ({ items, sessionId, onItemUpdate, onExcelSave }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('all');
  
  // ✅ 인라인 편집을 위한 로컬 상태 관리 [cite: 2026-02-27]
  const [editingField, setEditingField] = useState(null); 
  const [tempValue, setTempValue] = useState("");

  const filtered = useMemo(() => {
    return items.filter(item => {
      if (activeTab === 'high') return item.confidence >= 0.95;
      if (activeTab === 'low') return item.confidence < 0.95;
      return true;
    });
  }, [items, activeTab]);

  const current = filtered[currentIndex];

  // ── 1. 제외(Exclude) 체크박스 핸들러 ── [cite: 2026-02-27]
  const handleExcludeChange = async (e) => {
    e.stopPropagation(); // 부모 컨테이너 클릭 이벤트 방지 [cite: 2026-02-27]
    if (!current) return;
    
    const isExcluded = e.target.checked;
    try {
      const res = await updateItem(sessionId, { 
        fileName: current.fileName, 
        isExcluded 
      });
      if (res.status === 200) {
        onItemUpdate(res.data); // 서버 응답 데이터로 부모 상태 동기화 [cite: 2026-02-27]
      }
    } catch (err) {
      console.error("제외 처리 실패:", err);
    }
  };

  // ── 2. 인라인 수정 저장 핸들러 (엔터/포커스 아웃 시 호출) ── [cite: 2026-02-27]
  const saveEdit = async (key) => {
    // 값이 변하지 않았으면 서버 통신 없이 종료 [cite: 2026-02-27]
    if (!current || tempValue === current[key]) {
      setEditingField(null);
      return;
    }

    try {
      const res = await updateItem(sessionId, {
        fileName: current.fileName,
        [key]: tempValue // 수정한 필드만 전송 (Partial Update) [cite: 2026-02-27]
      });

      if (res.status === 200) {
        onItemUpdate(res.data); // 백엔드에서 'isEdited: true'가 반영된 최신 객체 수신 [cite: 2026-02-27]
      }
    } catch (err) {
      console.error("데이터 수정 실패:", err);
      alert("수정 내용 저장에 실패했습니다.");
    } finally {
      setEditingField(null); // 수정 모드 해제 [cite: 2026-02-27]
    }
  };

  const getTabTheme = () => {
    if (activeTab === 'low') return 'rgba(15, 240, 252, 0.1)'; 
    if (activeTab === 'high') return 'rgba(0, 0, 0, 0.05)';    
    return '#fff'; 
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.tabBar}>
        {[
          ['전체', 'all'], 
          ['신뢰도 95% 초과', 'high'], 
          ['신뢰도 95% 이하', 'low']
        ].map(([label, key]) => {
          const isActive = activeTab === key;
          const count = items.filter(i => (key==='all'?true:key==='high'?i.confidence>=0.95:i.confidence<0.95)).length;
          return (
            <button
              key={key}
              onClick={() => { setActiveTab(key); setCurrentIndex(0); }}
              style={{ ...styles.tab, backgroundColor: isActive ? (key==='low'?'rgba(15, 240, 252, 0.1)':key==='high'?'rgba(0, 0, 0, 0.05)':'#fff') : '#f7f9fc', ...(isActive ? styles.activeTab : {}) }}
              onFocus={(e) => e.target.style.outline = 'none'}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      <div style={{ ...styles.sliderContainer, backgroundColor: getTabTheme(), background: getTabTheme() }}>
        <button 
          style={{...styles.arrow, visibility: currentIndex > 0 ? 'visible' : 'hidden'}} 
          onClick={() => setCurrentIndex(p => p - 1)}
          onFocus={(e) => e.target.style.outline = 'none'}
        >〈</button>
        
        <div style={styles.cardContent}>
          {!current ? (
            <div style={styles.empty}>데이터가 없습니다.</div>
          ) : (
            <div style={styles.cardInner}>
              <div style={styles.cardHeader}>
                <div style={styles.checkGroup}>
                  <label style={styles.checkLabel} onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      style={styles.checkbox} 
                      checked={!!current.isExcluded} 
                      onChange={handleExcludeChange} 
                    /> 제외 [cite: 2026-02-27]
                  </label>
                  <label style={styles.checkLabel} onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" style={styles.checkbox} checked={!current.isExcluded} readOnly /> 저장
                  </label>
                </div>
              </div>

              <div style={{ ...styles.cardBody, opacity: current.isExcluded ? 0.5 : 1 }}>
                <div style={styles.imgSection}>
                  <img src={current._preview} style={styles.img} alt="ID" />
                </div>
                <div style={styles.infoSection}>
                  {[
                    ['성명', 'name'], ['생년월일', 'birthDate'], 
                    ['성별', 'gender'], ['주민번호', 'residentNumber'], ['주소', 'address']
                  ].map(([label, key]) => (
                    <div key={label} style={styles.dataRow}>
                      <span style={styles.dataLabel}>{label}</span>
                      {editingField === key ? (
                        <input 
                          autoFocus
                          style={styles.editInput}
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)} // 실시간 입력 반영 [cite: 2026-02-27]
                          onBlur={() => saveEdit(key)} // 바깥 클릭 시 저장 [cite: 2026-02-27]
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit(key)} // 엔터 키 저장 [cite: 2026-02-27]
                        />
                      ) : (
                        <span 
                          style={{ ...styles.dataValue, color: current.isEdited ? '#11DAE5' : '#1e293b' }} 
                          onClick={() => { setEditingField(key); setTempValue(current[key] || ""); }}
                        >
                          {current[key] || '—'} {current.isEdited && '✍️'} [cite: 2026-02-27]
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button style={styles.saveBtn} onClick={() => onExcelSave(current)}>
                제외 건 외 엑셀 저장 [cite: 2026-02-27]
              </button>
            </div>
          )}
        </div>

        <button 
          style={{...styles.arrow, visibility: currentIndex < filtered.length - 1 ? 'visible' : 'hidden'}} 
          onClick={() => setCurrentIndex(p => Math.min(filtered.length-1, p + 1))}
          onFocus={(e) => e.target.style.outline = 'none'}
        >〉</button>
      </div>
    </div>
  );
};

const styles = {
  wrapper: { flex: 1, display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box' },
  tabBar: { display: 'flex', gap: '0', position: 'relative', zIndex: 1, width: '100%' },
  tab: { padding: '10px 24px', border: '1px solid #e2e8f0', borderBottom: 'none', borderRadius: '12px 12px 0 0', cursor: 'pointer', fontSize: '13px', color: '#333', marginRight: '-1px', marginBottom: '-1px', outline: 'none', boxShadow: 'none', transition: 'none' },
  activeTab: { fontWeight: 'bold', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', zIndex: 2 },
  sliderContainer: { flex: 1, width: '100%', border: '1px solid #e2e8f0', borderRadius: '0 20px 20px 20px', display: 'flex', alignItems: 'center', padding: '15px 10px', boxShadow: '0 8px 30px rgba(0,0,0,0.05)', boxSizing: 'border-box', overflow: 'hidden' },
  arrow: { fontSize: '36px', border: 'none', background: 'none', cursor: 'pointer', padding: '0 15px', outline: 'none', color: '#cbd5e0' },
  cardContent: { flex: 1, height: '100%', display: 'flex', flexDirection: 'column' },
  cardInner: { display: 'flex', flexDirection: 'column', height: '100%', padding: '0 5px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  checkGroup: { display: 'flex', gap: '12px' },
  checkLabel: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#475569', cursor: 'pointer' },
  checkbox: { width: '14px', height: '14px', cursor: 'pointer', accentColor: '#11DAE5' },
  cardBody: { flex: 1, display: 'flex', gap: '25px', alignItems: 'center', minHeight: 0, width: '100%', transition: 'opacity 0.2s' },
  imgSection: { flex: '0 0 200px', height: '140px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  img: { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' },
  infoSection: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }, 
  dataRow: { display: 'flex', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px', minHeight: '32px' },
  dataLabel: { width: '75px', fontWeight: 'bold', color: '#94a3b8', fontSize: '12px' },
  dataValue: { flex: 1, color: '#1e293b', fontSize: '13px', fontWeight: '500', cursor: 'pointer', padding: '2px 4px' },
  editInput: { flex: 1, fontSize: '13px', padding: '2px 4px', border: '1px solid #11DAE5', borderRadius: '4px', outline: 'none' },
  saveBtn: { marginTop: '12px', padding: '14px', background: '#11DAE5', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' },
  empty: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#94a3b8' }
};

export default OcrResultCard;