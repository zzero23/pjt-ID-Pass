import { useState, useCallback, useRef } from "react";
import axios from "axios";

export default function MainPage() {
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [excludes, setExcludes] = useState({});
  const [changes, setChanges]   = useState({});
  const inputRef = useRef(null);

  // ── 로직 파트: 통계 계산 [cite: 2026-02-26] ──
  const totalCount = results.length;
  const completedCount = results.filter(r => !r.pending).length;
  const lowConfidenceItems = results.filter(r => r.success && r.confidence < 0.95);
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleFiles = useCallback(async (files) => {
    const fileArr = Array.from(files);
    if (!fileArr.length) return;

    setLoading(true);
    setResults(fileArr.map(f => ({ fileName: f.name, _preview: URL.createObjectURL(f), pending: true })));
    setExcludes({});
    setChanges({});

    for (let i = 0; i < fileArr.length; i++) {
      const file = fileArr[i];
      const formData = new FormData();
      formData.append("files", file);

      try {
        const res = await axios.post("/api/ocr/analyze", formData);
        const dto = Array.isArray(res.data) ? res.data[0] : res.data;

        setResults(prev => {
          const updated = [...prev];
          updated[i] = { ...dto, _preview: URL.createObjectURL(file), pending: false };
          return updated;
        });
      } catch (err) {
        setResults(prev => {
          const updated = [...prev];
          updated[i] = { success: false, fileName: file.name, pending: false, errorMessage: "분석 실패" };
          return updated;
        });
      }
    }
    setLoading(false);
  }, []);

  const excludedCount = Object.values(excludes).filter(Boolean).length;

  // ── 뷰 파트: HTML 구조 ──
  return (
    <div style={styles.container}>
      {/* 1. 실시간 진행률 영역 [cite: 2026-02-26] */}
      {totalCount > 0 && (
        <div style={styles.statusBox}>
          <div style={styles.statusHeader}>
            <span style={styles.boldText}>진행률</span>
            <div style={styles.progressInfo}>
              전체 {totalCount}장 중 {completedCount}장 완료 ({progress}%)
              {lowConfidenceItems.length > 0 && (
                <span style={styles.lowConfidenceBadge}>
                  신뢰도 95% 이하 {lowConfidenceItems.length}건
                </span>
              )}
            </div>
          </div>
          <div style={styles.progressBarBg}>
            <div style={{ ...styles.progressBarFill, width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* 2. 드롭존 업로드 [cite: 2026-02-26] */}
      <div 
        style={styles.dropzone} 
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" multiple style={{ display: "none" }} onChange={(e) => handleFiles(e.target.files)} />
        <p style={{ fontSize: 24, margin: 0 }}>📄</p>
        <span>신분증 이미지를 드래그하거나 클릭하여 업로드</span>
      </div>

      {/* 3. 결과 리스트 [cite: 2026-02-26] */}
      {results.map((r, i) => (
        <div key={i} style={{ ...styles.resultCard, opacity: r.pending ? 0.6 : 1 }}>
          <div style={styles.cardHeader}>
            <label style={styles.checkboxLabel}><input type="checkbox" checked={!!excludes[i]} onChange={(e) => setExcludes(p => ({ ...p, [i]: e.target.checked }))} /> 해당 건 수 제외</label>
            <label style={styles.checkboxLabel}><input type="checkbox" checked={!!changes[i]} onChange={(e) => setChanges(p => ({ ...p, [i]: e.target.checked }))} /> 변경 사항으로 저장</label>
            {r.success && !r.pending && (
              <span style={{ ...styles.confidenceText, color: r.confidence < 0.95 ? "#e53e3e" : "#48bb78" }}>
                {r.confidence < 0.95 && "⚠️ "}신뢰도 {Math.round(r.confidence * 100)}%
              </span>
            )}
          </div>

          <div style={styles.cardContent}>
            <img src={r._preview} alt="ID" style={styles.idPreview} />
            {r.pending ? <div style={styles.pendingText}>분석 대기 중...</div> :
             r.success ? (
              <table style={styles.dataTable}>
                <tbody>
                  {[["성명", r.name], ["생년월일", r.birthDate], ["성별", r.gender], ["주민번호", r.residentNumber], ["주소", r.address]]
                    .map(([label, val]) => (
                      <tr key={label}>
                        <td style={styles.labelCell}>{label}</td>
                        <td style={styles.valueCell}>{val || "—"}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            ) : <div style={styles.errorText}>분석 실패: {r.errorMessage}</div>}
          </div>

          <div style={{ padding: "0 16px 16px" }}>
            <button style={styles.saveBtn} onClick={() => console.log("저장")}>
              제외 건 ({excludedCount}) 외 엑셀 저장
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── 스타일 파트: CSS 객체 분리 ── [cite: 2026-02-26]
const styles = {
  container: { padding: 24, maxWidth: 800, margin: "0 auto", fontFamily: "sans-serif" },
  statusBox: { border: "1px solid #e2e8f0", borderRadius: 16, padding: 24, marginBottom: 24, backgroundColor: "#fff", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" },
  statusHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  boldText: { fontWeight: "bold", color: "#4a5568" },
  progressInfo: { fontSize: 14, color: "#718096" },
  lowConfidenceBadge: { backgroundColor: "#fff5f5", color: "#e53e3e", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: "bold", border: "1px solid #feb2b2", marginLeft: 12 },
  progressBarBg: { width: "100%", height: 8, backgroundColor: "#edf2f7", borderRadius: 4, overflow: "hidden" },
  progressBarFill: { height: "100%", backgroundColor: "#4fd1c5", transition: "width 0.4s ease-in-out" },
  dropzone: { border: "2px dashed #cbd5e0", borderRadius: 12, minHeight: 160, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", backgroundColor: "#f7fafc", marginBottom: 24, color: "#718096" },
  resultCard: { marginBottom: 24, border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden", backgroundColor: "#fff" },
  cardHeader: { display: "flex", gap: 28, padding: "12px 16px", borderBottom: "1px solid #edf2f7", background: "#f8fafc" },
  checkboxLabel: { display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 14 },
  confidenceText: { marginLeft: "auto", fontSize: 12, fontWeight: "bold" },
  cardContent: { display: "flex", gap: 32, padding: 20 },
  idPreview: { width: 220, height: 150, objectFit: "cover", borderRadius: 8, border: "1px solid #edf2f7" },
  pendingText: { alignSelf: "center", color: "#718096" },
  dataTable: { borderCollapse: "collapse", fontSize: 15, flex: 1 },
  labelCell: { padding: "6px 24px 6px 0", fontWeight: "bold", color: "#4a5568", width: 100 },
  valueCell: { padding: "6px 0", color: "#2d3748" },
  errorText: { alignSelf: "center", color: "#e53e3e", fontWeight: "bold" },
  saveBtn: { width: "100%", padding: "14px 0", background: "#4fd1c5", color: "#fff", border: "none", borderRadius: 8, fontSize: 16, fontWeight: "bold", cursor: "pointer" }
};