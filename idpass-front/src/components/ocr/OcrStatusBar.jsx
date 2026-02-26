import React from 'react';

const OcrStatusBar = ({ total, completed, lowConfidenceCount = 0 }) => {
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return (
    <div style={styles.container}>
      <div style={styles.topRow}>
        {/* 진행률 바 섹션 */}
        <div style={styles.leftGroup}>
          <span style={styles.label}>진행률</span>
          <div style={styles.progressBg}>
            <div style={{ ...styles.progressFill, width: `${progress}%` }} />
          </div>
        </div>
        
        {/* 전체 완료 현황 */}
        <div style={styles.centerText}>
          전체 {total}장 중 {completed}장 완료 ({progress}%)
        </div>

        {/* ✅ 배지 스타일로 수정: 배경색과 패딩 추가 [cite: 2026-02-26] */}
        <div style={styles.rightGroup}>
          {lowConfidenceCount > 0 ? (
            <div style={styles.warningBadge}>
              신뢰도 95% 이하 <span style={{ fontWeight: '800' }}>{lowConfidenceCount}건</span>
            </div>
          ) : (
            <div style={styles.successBadge}>
              신뢰도 95% 이하 없음
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { 
    border: '1.5px solid #333', 
    borderRadius: '15px', 
    padding: '20px 30px', 
    backgroundColor: '#fff', 
    marginBottom: '20px',
    boxSizing: 'border-box',
    width: '100%'
  },
  topRow: { 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    gap: '20px'
  },
  leftGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    flex: '1.2'
  },
  label: { 
    fontWeight: 'bold', 
    fontSize: '15px', 
    color: '#333',
    whiteSpace: 'nowrap'
  },
  progressBg: { 
    flex: '1',
    height: '12px', 
    backgroundColor: '#eee', 
    borderRadius: '10px', 
    overflow: 'hidden' 
  },
  progressFill: { 
    height: '100%', 
    backgroundColor: '#11DAE5', // 민트색 바 [cite: 2026-02-26]
    transition: 'width 0.5s ease',
    borderRadius: '10px' 
  },
  centerText: { 
    fontSize: '14px', 
    color: '#4a5568',
    whiteSpace: 'nowrap',
    fontWeight: '500'
  },
  rightGroup: {
    minWidth: '180px', // 배지 너비 확보 [cite: 2026-02-26]
    display: 'flex',
    justifyContent: 'flex-end',
  },
  // ✅ 사진 속 분홍색 배지 디자인 [cite: 2026-02-26]
  warningBadge: {
    backgroundColor: '#FDE8E8', // 연한 분홍 배경 [cite: 2026-02-26]
    color: '#E53E3E',         // 진한 빨강 글씨 [cite: 2026-02-26]
    padding: '8px 16px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600',
    textAlign: 'center',
    whiteSpace: 'nowrap'
  },
  // ✅ 사진 속 초록색 배지 디자인 [cite: 2026-02-26]
  successBadge: {
    backgroundColor: '#E6FFFA', // 연한 민트/초록 배경 [cite: 2026-02-26]
    color: '#38B2AC',         // 진한 청록 글씨 [cite: 2026-02-26]
    padding: '8px 16px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '600',
    textAlign: 'center',
    whiteSpace: 'nowrap'
  }
};

export default OcrStatusBar;