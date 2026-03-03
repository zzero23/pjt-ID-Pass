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

  // 제외 건 수
  const excludedCount = items.filter(i => i.isExcluded).length;

  // ── 1. 제외 체크박스 ──
  const handleExcludeChange = async (e) => {
    e.stopPropagation();
    if (!current) return;
    const isExcluded = e.target.checked;
    onItemUpdate({ fileName: current.fileName, isExcluded });
    try {
      const res = await updateItem(sessionId, { fileName: current.fileName, isExcluded });
      if (res.status === 200) {
        onItemUpdate({
          fileName: current.fileName,
          ...res.data,
          isExcluded: res.data.isExcluded ?? res.data.excluded ?? isExcluded,
          isEdited: res.data.isEdited ?? res.data.edited ?? current.isEdited,
        });
      }
    } catch (err) {
      console.error('제외 처리 실패:', err);
      onItemUpdate({ fileName: current.fileName, isExcluded: !isExcluded });
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
      if (res.status === 200) onItemUpdate({
        ...current,
        ...res.data,
        isExcluded: res.data.isExcluded ?? res.data.excluded ?? current.isExcluded,
        isEdited: res.data.isEdited ?? res.data.edited ?? true,
      });
    } catch (err) {
      console.error('데이터 수정 실패:', err);
      onItemUpdate({ ...current });
    } finally {
      setSaving(false);
    }
  };

  const getTabTheme = () => {
    if (activeTab === 'low') return 'rgba(15, 240, 252, 0.08)';
    if (activeTab === 'high') return 'rgba(0, 0, 0, 0.03)';
    return '#fff';
  };

  // 화살표: 항상 공간 차지, 양 끝일 때 투명하게만
  const prevVisible = currentIndex > 0;
  const nextVisible = currentIndex < filtered.length - 1;

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
                  ? (key === 'low' ? 'rgba(15,240,252,0.08)' : key === 'high' ? 'rgba(0,0,0,0.03)' : '#fff')
                  : '#f7f9fc',
                ...(isActive ? styles.activeTab : {}),
              }}
            >{label} ({count})</button>
          );
        })}
      </div>

      {/* 슬라이더 컨테이너 */}
      <div style={{ ...styles.sliderContainer, backgroundColor: getTabTheme() }}>

        {/* 왼쪽 화살표 — 항상 자리 차지, opacity로 숨김 */}
        <button
          style={{ ...styles.arrow, opacity: prevVisible ? 1 : 0, pointerEvents: prevVisible ? 'auto' : 'none' }}
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
                <label style={styles.checkLabel} onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    style={styles.checkbox}
                    checked={!!current.isExcluded}
                    onChange={handleExcludeChange}
                  />
                  <span>제외</span>
                </label>
                <div style={styles.headerRight}>
                  {saving && <span style={styles.savingText}>저장 중...</span>}
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
                </div>
              </div>

              {/* 카드 바디 — 세로 가운데 정렬 */}
              <div style={{ ...styles.cardBody, opacity: current.isExcluded ? 0.4 : 1 }}>
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
                          style={{ ...styles.dataValue, cursor: current.isExcluded ? 'default' : 'pointer' }}
                          onClick={() => {
                            if (!current.isExcluded) { setEditingField(key); setTempValue(current[key] || ''); }
                          }}
                        >
                          {current[key] || '—'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 엑셀 저장 버튼 — 제외 건 수 표시 */}
              <button style={styles.saveBtn} onClick={onExcelSave}>
                {excludedCount > 0
                  ? `제외 ${excludedCount}건 제외하고 엑셀 저장`
                  : '제외 건 외 엑셀 저장'}
              </button>
            </div>
          )}
        </div>

        {/* 오른쪽 화살표 */}
        <button
          style={{ ...styles.arrow, opacity: nextVisible ? 1 : 0, pointerEvents: nextVisible ? 'auto' : 'none' }}
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
    minHeight: 0,
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
    fontSize: '12px',
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
    alignItems: 'center',   // 화살표 세로 중앙
    padding: '16px 4px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.05)',
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  arrow: {
    fontSize: '26px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    padding: '0 10px',
    outline: 'none',
    color: '#94a3b8',
    flexShrink: 0,
    transition: 'opacity 0.2s',
    alignSelf: 'center',
  },
  cardContent: {
    flex: 1,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    overflow: 'hidden',
  },
  cardInner: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '0 6px',
    justifyContent: 'space-between', // 헤더·바디·버튼을 균등 배치
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
    paddingBottom: '8px',
    borderBottom: '1px solid #f1f5f9',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
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
  pageIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'background-color 0.2s',
  },
  cardBody: {
    flex: 1,
    display: 'flex',
    gap: '20px',
    alignItems: 'center',   // 이미지·데이터 세로 가운데
    justifyContent: 'center',
    minHeight: 0,
    padding: '12px 0',
    transition: 'opacity 0.2s',
  },
  imgSection: {
    flex: '0 0 170px',
    height: '130px',
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
    gap: '4px',
    minWidth: 0,
    justifyContent: 'center',
  },
  dataRow: {
    display: 'flex',
    alignItems: 'center',
    borderBottom: '1px solid #f1f5f9',
    padding: '3px 0',
    minHeight: '24px',
  },
  dataLabel: {
    width: '62px',
    flexShrink: 0,
    fontWeight: '600',
    color: '#94a3b8',
    fontSize: '11px',
  },
  dataValue: {
    flex: 1,
    fontSize: '12px',
    fontWeight: '500',
    color: '#1e293b',
    padding: '1px 4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    borderRadius: '3px',
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
  saveBtn: {
    flexShrink: 0,
    padding: '11px 16px',
    background: '#11DAE5',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: 'bold',
    fontSize: '14px',
    cursor: 'pointer',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
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