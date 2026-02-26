import { useState, useCallback, useRef } from "react";
import axios from "axios";

export default function MainPage() {
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [excludes, setExcludes] = useState({});
  const [changes, setChanges]   = useState({});
  const inputRef = useRef(null);

  // ── (수정) 실시간 통계 계산 로직 ── [cite: 2026-02-26]
  const totalCount = results.length;
  // 현재 처리가 완료(pending이 아님)된 파일 수 계산
  const completedCount = results.filter(r => !r.pending).length;
  // 신뢰도가 낮은 항목 집계
  const lowConfidenceItems = results.filter(r => r.success && r.confidence < 0.95);
  // 진행률 (%)
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleFiles = useCallback(async (files) => {
    const fileArr = Array.from(files);
    if (!fileArr.length) return;

    setLoading(true);
    // 1. (추가) 업로드 시작 시 미리 파일 목록을 세팅하여 '진행률 바'를 노출 [cite: 2026-02-26]
    setResults(fileArr.map(f => ({ 
      fileName: f.name, 
      _preview: URL.createObjectURL(f), 
      pending: true 
    })));
    setExcludes({});
    setChanges({});

    // 2. (수정) 실시간 바 이동을 위해 한 장씩 순차 처리 [cite: 2026-02-26]
    for (let i = 0; i < fileArr.length; i++) {
      const file = fileArr[i];
      const formData = new FormData();
      formData.append("files", file);

      try {
        const res = await axios.post("/api/ocr/analyze", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        
        const dto = Array.isArray(res.data) ? res.data[0] : res.data;

        // 개별 응답이 올 때마다 해당 인덱스의 데이터만 업데이트하여 바를 움직임 [cite: 2026-02-26]
        setResults(prev => {
          const updated = [...prev];
          updated[i] = { ...dto, _preview: URL.createObjectURL(file), pending: false };
          return updated;
        });
      } catch (err) {
        setResults(prev => {
          const updated = [...prev];
          updated[i] = { 
            success: false, 
            fileName: file.name, 
            errorMessage: err.response?.data?.message || err.message || "서버 응답 오류",
            _preview: URL.createObjectURL(file),
            pending: false
          };
          return updated;
        });
      }
    }
    setLoading(false);
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleExcelSave = () => {
    const targets = results.filter((_, i) => !excludes[i]);
    console.log("엑셀 저장 대상:", targets);
  };

  const excludedCount = Object.values(excludes).filter(Boolean).length;

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      
      {/* ── (신규) 상단 실시간 진행률 영역 ── [cite: 2026-02-26] */}
      {totalCount > 0 && (
        <div style={{ 
          border: "1px solid #e2e8f0", 
          borderRadius: 16, 
          padding: "24px", 
          marginBottom: 24, 
          backgroundColor: "#fff",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontWeight: "bold", color: "#4a5568" }}>진행률</span>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ fontSize: 14, color: "#718096" }}>
                전체 {totalCount}장 중 {completedCount}장 완료 ({progress}%)
              </span>
              {lowConfidenceItems.length > 0 && (
                <span style={{ 
                  backgroundColor: "#fff5f5", 
                  color: "#e53e3e", 
                  padding: "4px 12px", 
                  borderRadius: 20, 
                  fontSize: 12, 
                  fontWeight: "bold",
                  border: "1px solid #feb2b2"
                }}>
                  신뢰도 95% 이하 {lowConfidenceItems.length}건
                </span>
              )}
            </div>
          </div>
          <div style={{ width: "100%", height: 8, backgroundColor: "#edf2f7", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ 
              width: `${progress}%`, 
              height: "100%", 
              backgroundColor: "#4fd1c5", 
              transition: "width 0.4s ease-in-out" 
            }} />
          </div>
        </div>
      )}

      {/* ── 드롭존 (기존 유지) ── */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        style={{
          border: "2px dashed #cbd5e0",
          borderRadius: 12,
          minHeight: 160,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          backgroundColor: "#f7fafc",
          marginBottom: 24,
          transition: "all 0.2s"
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,application/pdf"
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div style={{ textAlign: "center", color: "#718096" }}>
          <p style={{ fontSize: 18, marginBottom: 8 }}>📄</p>
          신분증 이미지를 드래그하거나 클릭하여 업로드
        </div>
      </div>

      {loading && <p style={{ textAlign: "center", color: "#4fd1c5", fontWeight: "bold" }}>분석 진행 중...</p>}

      {/* ── 결과 카드 (기존 유지 + 신뢰도 UI 추가) ── */}
      {results.map((r, i) => (
        <div
          key={i}
          style={{ 
            marginBottom: 24, 
            border: "1px solid #e2e8f0", 
            borderRadius: 10, 
            overflow: "hidden", 
            backgroundColor: "#fff",
            opacity: r.pending ? 0.6 : 1 // 분석 전인 카드는 반투명 처리 [cite: 2026-02-26]
          }}
        >
          <div style={{ display: "flex", gap: 28, padding: "12px 16px", borderBottom: "1px solid #edf2f7", background: "#f8fafc" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 14 }}>
              <input
                type="checkbox"
                checked={!!excludes[i]}
                onChange={(e) => setExcludes((p) => ({ ...p, [i]: e.target.checked }))}
              />
              해당 건 수 제외
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 14 }}>
              <input
                type="checkbox"
                checked={!!changes[i]}
                onChange={(e) => setChanges((p) => ({ ...p, [i]: e.target.checked }))}
              />
              변경 사항으로 저장
            </label>
            {/* 개별 카드에도 신뢰도 수치 표시 [cite: 2026-02-26] */}
            {r.success && !r.pending && (
              <span style={{ 
                marginLeft: "auto", 
                fontSize: 12, 
                color: r.confidence < 0.95 ? "#e53e3e" : "#48bb78", 
                fontWeight: "bold" 
              }}>
                {r.confidence < 0.95 && "⚠️ "}신뢰도 {Math.round(r.confidence * 100)}%
              </span>
            )}
          </div>

          <div style={{ display: "flex", gap: 32, padding: 20 }}>
            {r._preview && (
              <img
                src={r._preview}
                alt="신분증"
                style={{ width: 220, height: 150, objectFit: "cover", borderRadius: 8, border: "1px solid #edf2f7" }}
              />
            )}

            {r.pending ? (
              <div style={{ alignSelf: "center", color: "#718096" }}>분석 대기 중...</div>
            ) : r.success ? (
              <table style={{ borderCollapse: "collapse", fontSize: 15, flex: 1 }}>
                <tbody>
                  {[
                    ["성명",     r.name],
                    ["생년월일", r.birthDate],
                    ["성별",     r.gender],
                    ["주민번호", r.residentNumber],
                    ["주소",     r.address],
                  ].map(([label, value]) => (
                    <tr key={label}>
                      <td style={{ padding: "6px 24px 6px 0", fontWeight: "bold", color: "#4a5568", width: 100 }}>{label}</td>
                      <td style={{ padding: "6px 0", color: "#2d3748" }}>{value || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ alignSelf: "center", color: "#e53e3e" }}>
                <strong>분석 실패:</strong> {r.errorMessage}
              </div>
            )}
          </div>

          <div style={{ padding: "0 16px 16px" }}>
            <button
              onClick={handleExcelSave}
              style={{
                width: "100%",
                padding: "14px 0",
                background: "#4fd1c5",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 16,
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              제외 건 ({excludedCount}) 외 엑셀 저장
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}