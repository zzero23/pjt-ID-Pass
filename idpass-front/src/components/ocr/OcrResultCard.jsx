import React, { useState, useMemo } from 'react';
import { updateItem } from '../../api/ocrApi';

const OcrResultCard = ({ items, sessionId, onItemUpdate, onExcelSave }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('all');
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    return items.filter(item => {
      if (activeTab === 'high') return item.confidence >= 0.95;
      if (activeTab === 'low') return item.confidence < 0.95;
      return true;
    });
  }, [items, activeTab]);

  const current = filtered[currentIndex];

  // ── 1. 제외 체크박스 ──
  const handleExcludeChange = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!current) return;
    const isExcluded = e.target.checked;
    onItemUpdate({ ...current, isExcluded });
    try {
      const res = await updateItem(sessionId, { fileName: current.fileName, isExcluded });
      if (res.status === 200) onItemUpdate({ ...current, ...res.data });
    } catch (err) {
      console.error('제외 처리 실패:', err);
      onItemUpdate({ ...current, isExcluded: !isExcluded });
    }
  };

  // ── 2. 인라인 수정 자동 저장 ──
  const saveEdit = async (key) => {
    if (!current) { setEditingField(null); return; }
    if (tempValue === (current[key] || '')) { setEditingField(null); return; }
    setSaving(true);
    onItemUpdate({ ...current, [key]: tempValue, isEdited: true });
    setEditingField(null);
    try {
      const res = await updateItem(sessionId, { fileName: current.fileName, [key]: tempValue });
      if (res.status === 200) onItemUpdate({ ...current, ...res.data });
    } catch (err) {
      console.error('데이터 수정 실패:', err);
      onItemUpdate({ ...current });
    } finally {
      setSaving(false);
    }
  };

  const getTabTheme = () => {
    if (activeTab === 'low') return 'rgba(15, 240, 252, 0.1)';
    if (activeTab === 'high') return 'rgba(0, 0, 0, 0.05)';
    return '#fff';
  };

  return (
    <div style={styles.wrapper}>
      {/* 탭 바 */}
      <div style={styles.tabBar}>
        {[['전체', 'all'], ['신뢰도 95% 초과', 'high'], ['신뢰도 95% 이하', 'low']].map(([label, key]) => {
          const isActive = activeTab === key;
          const count = items.filter(i =>
            key === 'all' ? true : key === 'high' ? i.confidence >= 0.95 : i.confidence < 0.95
          ).length;
          return (
            <button key={key}
              onClick={() => { setActiveTab(key); setCurrentIndex(0); setEditingField(null); }}
              style={{
                ...styles.tab,
                backgroundColor: isActive
                  ? (key === 'low' ? 'rgba(15,240,252,0.1)' : key === 'high' ? 'rgba(0,0,0,0.05)' : '#fff')
                  : '#f7f9fc',
                ...(isActive ? styles.activeTab : {}),
              }}
            >{label} ({count})</button>
          );
        })}
      </div>

      {/* 슬라이더 컨테이너 */}
      <div style={{ ...styles.sliderContainer, backgroundColor: getTabTheme() }}>

        {/* 왼쪽 화살표 — 카드 영역과 겹치지 않도록 alignSelf: stretch 제거 */}
        <button
          style={{ ...styles.arrow, visibility: currentIndex > 0 ? 'visible' : 'hidden' }}
          onClick={() => { setCurrentIndex(p => p - 1); setEditingField(null); }}
        >〈</button>

        {/* 카드 본문 */}
        <div style={styles.cardContent}>
          {!current ? (
            <div style={styles.empty}>데이터가 없습니다.</div>
          ) : (
            <div style={styles.cardInner}>

              {/* 헤더: 제외 체크박스 */}
              <div style={styles.cardHeader}>
                {/* pointer-events: all 로 클릭 보장 */}
                <label
                  style={styles.checkLabel}
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    style={styles.checkbox}
                    checked={!!current.isExcluded}
                    onChange={handleExcludeChange}
                  />
                  <span>제외</span>
                </label>
                {saving && <span style={styles.savingText}>저장 중...</span>}
              </div>

              {/* 카드 바디 */}
              <div style={{ ...styles.cardBody, opacity: current.isExcluded ? 0.45 : 1 }}>
                {/* 이미지 */}
                <div style={styles.imgSection}>
                  <img src={current._preview} style={styles.img} alt="ID" />
                </div>

                {/* 데이터 필드 */}
                <div style={styles.infoSection}>
                  {[
                    ['성명', 'name'],
                    ['생년월일', 'birthDate'],
                    ['성별', 'gender'],
                    ['주민번호', 'residentNumber'],
                    ['주소', 'address'],
                  ].map(([label, key]) => (
                    <div key={key} style={styles.dataRow}>
                      <span style={styles.dataLabel}>{label}</span>
                      {editingField === key ? (
                        <input
                          autoFocus
                          style={styles.editInput}
                          value={tempValue}
                          onChange={e => setTempValue(e.target.value)}
                          onBlur={() => saveEdit(key)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveEdit(key);
                            if (e.key === 'Escape') setEditingField(null);
                          }}
                        />
                      ) : (
                        <span
                          style={{
                            ...styles.dataValue,
                            color: current.isEdited ? '#11DAE5' : '#1e293b',
                            cursor: current.isExcluded ? 'default' : 'pointer',
                          }}
                          onClick={() => {
                            if (!current.isExcluded) {
                              setEditingField(key);
                              setTempValue(current[key] || '');
                            }
                          }}
                        >
                          {current[key] || '—'}{current.isEdited && ' ✍️'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 페이지 인디케이터 */}
              {filtered.length > 1 && (
                <div style={styles.pageIndicator}>
                  {filtered.map((_, i) => (
                    <span key={i}
                      style={{ ...styles.dot, backgroundColor: i === currentIndex ? '#11DAE5' : '#e2e8f0' }}
                      onClick={() => { setCurrentIndex(i); setEditingField(null); }}
                    />
                  ))}
                </div>
              )}

              {/* 엑셀 저장 버튼 */}
              <button style={styles.saveBtn} onClick={onExcelSave}>
                제외 건 외 엑셀 저장
              </button>
            </div>
          )}
        </div>

        {/* 오른쪽 화살표 */}
        <button
          style={{ ...styles.arrow, visibility: currentIndex < filtered.length - 1 ? 'visible' : 'hidden' }}
          onClick={() => { setCurrentIndex(p => Math.min(filtered.length - 1, p + 1)); setEditingField(null); }}
        >〉</button>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    minHeight: 0,          // flex 자식이 넘치지 않도록
    boxSizing: 'border-box',
  },
  tabBar: {
    display: 'flex',
    flexShrink: 0,
    position: 'relative',
    zIndex: 1,
  },
  tab: {
    padding: '8px 18px',
    border: '1px solid #e2e8f0',
    borderBottom: 'none',
    borderRadius: '12px 12px 0 0',
    cursor: 'pointer',
    fontSize: '12px',      // 살짝 줄여서 탭이 넘치지 않도록
    color: '#333',
    marginRight: '-1px',
    marginBottom: '-1px',
    outline: 'none',
    boxShadow: 'none',
    transition: 'none',
    whiteSpace: 'nowrap',
  },
  activeTab: { fontWeight: 'bold', zIndex: 2 },
  sliderContainer: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    border: '1px solid #e2e8f0',
    borderRadius: '0 20px 20px 20px',
    display: 'flex',
    alignItems: 'flex-start', // ← center → flex-start: 화살표가 체크박스 위로 안 올라옴
    padding: '14px 6px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.05)',
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  arrow: {
    fontSize: '28px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    padding: '0 8px',
    outline: 'none',
    color: '#cbd5e0',
    flexShrink: 0,
    alignSelf: 'center',
    position: 'relative',
    zIndex: 1,
  },
  cardContent: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  cardInner: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    padding: '0 4px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    flexShrink: 0,
    position: 'relative',
    zIndex: 10,            // 화살표보다 위
    pointerEvents: 'all',
  },
  checkLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#475569',
    cursor: 'pointer',
    userSelect: 'none',
    position: 'relative',
    zIndex: 10,
    pointerEvents: 'all',
  },
  checkbox: {
    width: '15px',
    height: '15px',
    cursor: 'pointer',
    accentColor: '#11DAE5',
    pointerEvents: 'all',
  },
  savingText: { fontSize: '11px', color: '#94a3b8' },
  cardBody: {
    flex: 1,
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    minHeight: 0,
    overflow: 'hidden',
    transition: 'opacity 0.2s',
  },
  imgSection: {
    flex: '0 0 160px',     // 이미지 너비 줄임
    height: '120px',       // 높이 줄임
    background: '#f8fafc',
    borderRadius: '10px',
    border: '1px solid #f1f5f9',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  img: { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' },
  infoSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
    overflow: 'hidden',
  },
  dataRow: {
    display: 'flex',
    alignItems: 'center',
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: '2px',
    minHeight: '26px',
  },
  dataLabel: {
    width: '62px',
    flexShrink: 0,
    fontWeight: 'bold',
    color: '#94a3b8',
    fontSize: '11px',      // 줄임
  },
  dataValue: {
    flex: 1,
    fontSize: '12px',      // 줄임
    fontWeight: '500',
    padding: '1px 4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  editInput: {
    flex: 1,
    fontSize: '12px',
    padding: '1px 4px',
    border: 'none',
    borderBottom: '2px solid #11DAE5',
    borderRadius: '0',
    background: 'transparent',
    outline: 'none',
    minWidth: 0,
  },
  pageIndicator: {
    display: 'flex',
    justifyContent: 'center',
    gap: '6px',
    marginTop: '6px',
    flexShrink: 0,
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  saveBtn: {
    marginTop: '8px',
    padding: '11px',
    background: '#11DAE5',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: 'bold',
    fontSize: '14px',
    cursor: 'pointer',
    flexShrink: 0,
    width: '100%',
  },
  empty: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#94a3b8',
  },
};

export default OcrResultCard;