// src/pages/MainPage.jsx
import { useState, useCallback, useRef } from "react";
import axios from "axios";

export default function MainPage() {
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [excludes, setExcludes] = useState({});  // 해당 건 수 제외 체크박스
  const [changes, setChanges]   = useState({});  // 변경 사항으로 저장 체크박스
  const inputRef = useRef(null);

  const handleFiles = useCallback(async (files) => {
    const fileArr = Array.from(files);
    if (!fileArr.length) return;

    setLoading(true);
    setResults([]);
    setExcludes({});
    setChanges({});

    // ✅ 모든 파일을 하나의 FormData에 담아 한 번에 전송
    const formData = new FormData();
    fileArr.forEach((file) => formData.append("files", file));

        try {
            const res = await axios.post("/api/ocr/analyze", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const responses = res.data.map((dto, i) => ({
                ...dto,
                _preview: URL.createObjectURL(fileArr[i]),
            }));
            setResults(responses);
        } catch (err) {
            setResults(fileArr.map((file) => ({
                success: false,
                fileName: file.name,
                errorMessage: err.response?.data?.message || err.message || "서버 응답 오류",
                _preview: URL.createObjectURL(file),
            })));
        }

        setLoading(false);
    }, []);

  const onDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  // 엑셀 저장 (제외 체크된 건 빼고)
  const handleExcelSave = () => {
    const targets = results.filter((_, i) => !excludes[i]);
    console.log("엑셀 저장 대상:", targets);
    // TODO: 백엔드 엑셀 다운로드 API 연동
  };

  const excludedCount = Object.values(excludes).filter(Boolean).length;

  return (
    <div style={{ padding: 24 }}>

      {/* ── 드롭존 ── */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        style={{
          border: "2px dashed #999",
          borderRadius: 8,
          minHeight: 160,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          userSelect: "none",
          marginBottom: 24,
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
        신분증 이미지를 드래그하거나 클릭하여 업로드
      </div>

      {loading && <p>분석 중...</p>}

      {/* ── 결과 카드 ── */}
      {results.map((r, i) => (
        <div
          key={i}
          style={{ marginBottom: 24, border: "1px solid #ddd", borderRadius: 10, overflow: "hidden" }}
        >
          {/* 체크박스 헤더 */}
          <div style={{ display: "flex", gap: 28, padding: "10px 16px", borderBottom: "1px solid #eee", background: "#fafafa" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={!!excludes[i]}
                onChange={(e) => setExcludes((p) => ({ ...p, [i]: e.target.checked }))}
              />
              해당 건 수 제외
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={!!changes[i]}
                onChange={(e) => setChanges((p) => ({ ...p, [i]: e.target.checked }))}
              />
              변경 사항으로 저장
            </label>
          </div>

          {/* 이미지 + 결과 */}
          <div style={{ display: "flex", gap: 32, padding: 20 }}>
            {/* 신분증 미리보기 */}
            {r._preview && (
              <img
                src={r._preview}
                alt="신분증"
                style={{ width: 220, height: 150, objectFit: "cover", borderRadius: 8, flexShrink: 0, border: "1px solid #eee" }}
              />
            )}

            {/* 파싱 결과 */}
            {r.success ? (
              <table style={{ borderCollapse: "collapse", fontSize: 15, alignSelf: "center" }}>
                <tbody>
                  {[
                    ["성명",     r.name],
                    ["생년월일", r.birthDate],
                    ["성별",     r.gender],
                    ["주민번호", r.residentNumber],
                    ["주소",     r.address],
                  ].map(([label, value]) => (
                    <tr key={label}>
                      <td style={{ padding: "6px 32px 6px 0", fontWeight: "bold", whiteSpace: "nowrap", color: "#333" }}>
                        {label}
                      </td>
                      <td style={{ padding: "6px 0", color: "#111" }}>{value || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: "red", alignSelf: "center" }}>오류: {r.errorMessage}</p>
            )}
          </div>

          {/* 엑셀 저장 버튼 */}
          <div style={{ padding: "0 16px 16px" }}>
            <button
              onClick={handleExcelSave}
              style={{
                width: "100%",
                padding: "14px 0",
                background: "#7dd3e8",
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