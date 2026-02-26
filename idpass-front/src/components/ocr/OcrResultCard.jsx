import React, { useState, useMemo } from 'react';

const OcrResultCard = ({ items, onExcelSave }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('all');

  const filtered = useMemo(() => {
    return items.filter(item => {
      if (activeTab === 'high') return item.confidence >= 0.95;
      if (activeTab === 'low') return item.confidence < 0.95;
      return true;
    });
  }, [items, activeTab]);

  const current = filtered[currentIndex];

  const getTabTheme = () => {
    if (activeTab === 'low') return 'rgba(15, 240, 252, 0.1)'; 
    if (activeTab === 'high') return 'rgba(0, 0, 0, 0.05)';    
    return '#fff'; 
  };

  const currentBg = getTabTheme();

  return (
    <div style={styles.wrapper}>
      <div style={styles.tabBar}>
        {[
          ['전체', 'all'], 
          ['신뢰도 95% 초과', 'high'], 
          ['신뢰도 95% 이하', 'low']
        ].map(([label, key]) => {
          const isActive = activeTab === key;
          const btnBg = key === 'low' ? 'rgba(15, 240, 252, 0.1)' : 
                        key === 'high' ? 'rgba(0, 0, 0, 0.05)' : '#fff';

          return (
            <button
              key={key}
              onClick={() => { setActiveTab(key); setCurrentIndex(0); }}
              style={{ 
                ...styles.tab, 
                backgroundColor: isActive ? btnBg : '#f7f9fc',
                ...(isActive ? styles.activeTab : {}) 
              }}
              // ✅ 포커스 시 테두리 원천 차단
              onFocus={(e) => e.target.style.outline = 'none'}
            >
              {label} ({items.filter(i => (key==='all'?true:key==='high'?i.confidence>=0.95:i.confidence<0.95)).length})
            </button>
          );
        })}
      </div>

      <div 
        style={{ 
          ...styles.sliderContainer, 
          backgroundColor: currentBg,
          background: currentBg 
        }} 
      >
        <button 
          style={{...styles.arrow, visibility: currentIndex > 0 ? 'visible' : 'hidden'}} 
          onClick={() => setCurrentIndex(p => p - 1)}
          onFocus={(e) => e.target.style.outline = 'none'}
        >
          〈
        </button>
        
        <div style={styles.cardContent}>
          {!items.length ? (
            <div style={styles.empty}>분석할 이미지를 업로드해주세요.</div>
          ) : !current ? (
            <div style={styles.empty}>해당 탭에 데이터가 없습니다.</div>
          ) : (
            <div style={styles.cardInner}>
              <div style={styles.cardHeader}>
                <div style={styles.checkGroup}>
                  <label style={styles.checkLabel}>
                    <input type="checkbox" style={styles.checkbox}/> 제외
                  </label>
                  <label style={styles.checkLabel}>
                    <input type="checkbox" style={styles.checkbox}/> 저장
                  </label>
                </div>
              </div>

              <div style={styles.cardBody}>
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
                      <span style={styles.dataValue}>{current?.[key] || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                style={styles.saveBtn} 
                onClick={() => onExcelSave(current)}
                onFocus={(e) => e.target.style.outline = 'none'}
              >
                제외 건 외 엑셀 저장
              </button>
            </div>
          )}
        </div>

        <button 
          style={{...styles.arrow, visibility: currentIndex < filtered.length - 1 ? 'visible' : 'hidden'}} 
          onClick={() => setCurrentIndex(p => Math.min(filtered.length-1, p + 1))}
          onFocus={(e) => e.target.style.outline = 'none'}
        >
          〉
        </button>
      </div>
    </div>
  );
};

const styles = {
  wrapper: { flex: 1, display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box' },
  tabBar: { display: 'flex', gap: '0', position: 'relative', zIndex: 1, width: '100%' },
  tab: { 
    padding: '10px 24px', 
    border: '1px solid #e2e8f0', 
    borderBottom: 'none', 
    borderRadius: '12px 12px 0 0', 
    cursor: 'pointer', 
    fontSize: '13px', 
    color: '#333', 
    marginRight: '-1px', 
    marginBottom: '-1px', 
    outline: 'none',        // ✅ 호버/포커스 테두리 제거 [cite: 2026-02-26]
    boxShadow: 'none',      // ✅ 그림자 잔선 제거 [cite: 2026-02-26]
    textDecoration: 'none', 
    boxSizing: 'border-box', 
    transition: 'none',     // ✅ 애니메이션(전환 효과) 삭제 [cite: 2026-02-26]
    appearance: 'none',
    WebkitTapHighlightColor: 'transparent',
    userSelect: 'none'
  },
  activeTab: { 
    borderTop: '1px solid #e2e8f0', 
    fontWeight: 'bold', 
    borderLeft: '1px solid #e2e8f0', 
    borderRight: '1px solid #e2e8f0', 
    zIndex: 2,
    outline: 'none',
    boxShadow: 'none'
  },
  sliderContainer: { 
    flex: 1, width: '100%', border: '1px solid #e2e8f0', borderRadius: '0 20px 20px 20px', 
    display: 'flex', alignItems: 'center', padding: '15px 10px', boxShadow: '0 8px 30px rgba(0,0,0,0.05)', 
    boxSizing: 'border-box', overflow: 'hidden', 
    transition: 'none'      // ✅ 배경색 변경 시 애니메이션 삭제 [cite: 2026-02-26]
  },
  arrow: { 
    fontSize: '36px', border: 'none', background: 'none', cursor: 'pointer', 
    padding: '0 15px', outline: 'none', color: '#cbd5e0', boxShadow: 'none',
    transition: 'none'      // ✅ 화살표 호버 애니메이션 삭제 [cite: 2026-02-26]
  },
  cardContent: { flex: 1, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  cardInner: { display: 'flex', flexDirection: 'column', height: '100%', padding: '0 5px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexShrink: 0 },
  checkGroup: { display: 'flex', gap: '12px' },
  checkLabel: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#475569', cursor: 'pointer', outline: 'none' },
  checkbox: { width: '14px', height: '14px', cursor: 'pointer', accentColor: '#11DAE5', outline: 'none' },
  cardBody: { flex: 1, display: 'flex', gap: '25px', alignItems: 'center', minHeight: 0, width: '100%', overflow: 'hidden' },
  imgSection: { flex: '0 0 200px', height: '140px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  img: { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' },
  infoSection: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }, 
  dataRow: { display: 'flex', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' },
  dataLabel: { width: '75px', fontWeight: 'bold', color: '#94a3b8', fontSize: '12px', flexShrink: 0, marginTop: '2px' },
  dataValue: { flex: 1, color: '#1e293b', fontSize: '13px', fontWeight: '500', lineHeight: '1.4', wordBreak: 'break-all', overflowWrap: 'break-word', display: 'block' },
  saveBtn: { 
    marginTop: '12px', padding: '14px', background: '#11DAE5', color: '#fff', 
    border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', 
    cursor: 'pointer', boxShadow: 'none', outline: 'none', flexShrink: 0,
    transition: 'none'      // ✅ 저장 버튼 애니메이션 삭제 [cite: 2026-02-26]
  },
  empty: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#94a3b8', fontSize: '15px', textAlign: 'center' }
};

export default OcrResultCard;