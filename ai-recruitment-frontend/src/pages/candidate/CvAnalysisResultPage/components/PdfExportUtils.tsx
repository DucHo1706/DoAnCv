import React, { useRef, useState } from "react";
import { message, Button } from "antd";
import { DownloadOutlined } from "@ant-design/icons";

interface PdfExportUtilsProps {
  analysisData: any;
  meta: any;
  cvText: string;
  jobDescription: string;
  cvSkills: string[];
  jobTitle: string;
  companyName: string;
  candidateName: string;
  onUpdateAnalysisData?: (newData: any) => void;
}

const PdfExportUtils: React.FC<PdfExportUtilsProps> = ({
  analysisData,
  meta,
  cvText,
  jobDescription,
  cvSkills,
  jobTitle,
  companyName,
  candidateName,
  onUpdateAnalysisData,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const score = analysisData.score_analysis || {};
  const tips = analysisData.optimization_tips || [];
  const lang = analysisData.language_review || {};
  const interviewQuestions = analysisData.mock_interview || [];

  const matchedSkills = score.matched_skills || [];
  const missingSkills = score.missing_skills || [];
  const redFlags = score.red_flags || [];

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setDownloading(true);
    try {
      const isTipsMissing =
        !analysisData?.optimization_tips || analysisData.optimization_tips.length === 0;
      const isLangMissing =
        !analysisData?.language_review ||
        (analysisData.language_review.overall_language_score ?? 0) === 0;
      const isInterviewMissing =
        !analysisData?.mock_interview || analysisData.mock_interview.length === 0;

      if (isTipsMissing || isLangMissing || isInterviewMissing) {
        message.loading({ content: "Đang tải dữ liệu báo cáo chi tiết từ AI...", key: "pdf-load" });

        const payload = {
          cv_text: cvText || analysisData?.cv_text || "",
          jd_text: jobDescription || analysisData?.job_description || "",
          cv_skills: cvSkills || analysisData?.candidate_info?.extracted_skills || [],
          jd_skills: analysisData?.score_analysis?.missing_skills || [],
          job_title: jobTitle,
          company_name: companyName,
        };

        const promises: Promise<any>[] = [];

        if (isTipsMissing) {
          promises.push(
            fetch("http://127.0.0.1:8000/analyze-cv-star", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
              .then((res) => res.json())
              .then((data) => ({ type: "tips", data }))
          );
        }
        if (isLangMissing) {
          promises.push(
            fetch("http://127.0.0.1:8000/analyze-cv-language", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
              .then((res) => res.json())
              .then((data) => ({ type: "lang", data }))
          );
        }
        if (isInterviewMissing) {
          promises.push(
            fetch("http://127.0.0.1:8000/analyze-cv-interview", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
              .then((res) => res.json())
              .then((data) => ({ type: "interview", data }))
          );
        }

        const results = await Promise.all(promises);

        const updatedAnalysisData = { ...analysisData };
        results.forEach((res) => {
          if (res.data && res.data.status === "success" && res.data.data) {
            if (res.type === "tips") {
              updatedAnalysisData.optimization_tips = res.data.data;
            } else if (res.type === "lang") {
              updatedAnalysisData.language_review = res.data.data;
            } else if (res.type === "interview") {
              updatedAnalysisData.mock_interview = res.data.data;
            }
          }
        });

        if (onUpdateAnalysisData) {
          onUpdateAnalysisData(updatedAnalysisData);
        }

        message.success({
          content: "Đã tải xong dữ liệu AI! Đang tiến hành xuất PDF...",
          key: "pdf-load",
          duration: 2,
        });
      }

      const html2pdf = (await import("html2pdf.js")).default;
      const element = printRef.current;
      const opt = {
        margin: [12, 12] as [number, number],
        filename: `BaoCao_AI_Insights_Full_${candidateName}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
      };
      await html2pdf().set(opt).from(element).save();
      message.success("Tải báo cáo PDF đầy đủ thông tin thành công!");
    } catch (err) {
      console.error(err);
      message.error({ content: "Không thể xuất file PDF. Vui lòng thử lại.", key: "pdf-load" });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <Button
        type="primary"
        size="large"
        icon={<DownloadOutlined />}
        loading={downloading}
        onClick={handleDownloadPDF}
        style={{
          background: "#1E293B",
          border: "none",
          fontWeight: 700,
          borderRadius: 8,
          height: 46,
          paddingInline: 28,
          color: "#FFFFFF",
        }}
      >
        Tải báo cáo PDF
      </Button>

      {/* =====================================================================
          PHẦN THÔNG TIN ĐẦY ĐỦ ĐỂ XUẤT PDF (Bản in off-screen chứa đầy đủ 4 phần)
          ===================================================================== */}
      <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
        <div
          ref={printRef}
          style={{
            width: "800px",
            padding: "40px 50px",
            background: "#ffffff",
            color: "#000000",
            fontFamily: "Arial, sans-serif",
          }}
        >
          {/* Header Báo Cáo */}
          <div
            style={{
              borderBottom: "2px solid #2563EB",
              paddingBottom: "20px",
              marginBottom: "30px",
            }}
          >
            <h1
              style={{ color: "#0f172a", fontSize: "26px", margin: "0 0 10px", fontWeight: "bold" }}
            >
              BÁO CÁO PHÂN TÍCH CV AI INSIGHTS 2.0
            </h1>
            <p style={{ color: "#4b5563", fontSize: "14px", margin: "0" }}>
              Cung cấp bởi Hệ thống Tuyển Dụng AI & Đánh giá năng lực chéo ngành
            </p>
          </div>

          {/* Grid Thông tin ứng viên */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px" }}>
            <tbody>
              <tr>
                <td
                  style={{ width: "150px", padding: "8px 0", color: "#475569", fontWeight: "bold" }}
                >
                  Ứng viên:
                </td>
                <td style={{ padding: "8px 0", color: "#0f172a", fontWeight: "bold" }}>
                  {candidateName}
                </td>
                <td
                  style={{ width: "150px", padding: "8px 0", color: "#475569", fontWeight: "bold" }}
                >
                  Chấm điểm:
                </td>
                <td
                  style={{
                    padding: "8px 0",
                    color: "#10b981",
                    fontWeight: "bold",
                    fontSize: "18px",
                  }}
                >
                  {score.total_score ?? 0}/100 ({score.classification || ""})
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px 0", color: "#475569", fontWeight: "bold" }}>
                  Vị trí ứng tuyển:
                </td>
                <td style={{ padding: "8px 0", color: "#0f172a" }}>{jobTitle}</td>
                <td style={{ padding: "8px 0", color: "#475569", fontWeight: "bold" }}>
                  Tên tệp CV:
                </td>
                <td style={{ padding: "8px 0", color: "#0f172a" }}>{meta?.fileName}</td>
              </tr>
            </tbody>
          </table>

          {/* Nhận xét tổng quan */}
          <div
            style={{
              background: "#f8fafc",
              padding: "20px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              marginBottom: "40px",
            }}
          >
            <h3
              style={{ color: "#0f172a", margin: "0 0 10px", fontSize: "16px", fontWeight: "bold" }}
            >
              Nhận xét tổng quan từ AI
            </h3>
            <p style={{ color: "#334155", fontSize: "13px", lineHeight: "1.6", margin: "0" }}>
              {score.summary}
            </p>
          </div>

          <div style={{ pageBreakAfter: "always" }} />

          {/* This section will render the AiDetailedTabs for PDF export */}
          <div style={{ marginBottom: "40px" }}>
            <h2
              style={{
                color: "#2563EB",
                fontSize: "18px",
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: "8px",
                marginBottom: "15px",
              }}
            >
              1. ĐỐI CHIẾU NĂNG LỰC & CẢNH BÁO CV
            </h2>
            <div className="pdf-tab-content">
              {matchedSkills.map((s: string) => (
                <div key={s} style={{ fontSize: "12px", color: "#14532d", margin: "4px 0" }}>
                  • {s}
                </div>
              ))}
              {missingSkills.map((s: string) => (
                <div key={s} style={{ fontSize: "12px", color: "#78350f", margin: "4px 0" }}>
                  • {s}
                </div>
              ))}
              {redFlags.map((flag: any, idx: number) => (
                <div key={idx} style={{ fontSize: "12px", color: "#7f1d1d", margin: "4px 0" }}>
                  <strong>- {flag.title || "Cảnh báo"}:</strong> {flag.description}
                </div>
              ))}
            </div>
          </div>

          <div style={{ pageBreakAfter: "always" }} />

          <div style={{ marginBottom: "40px" }}>
            <h2
              style={{
                color: "#2563EB",
                fontSize: "18px",
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: "8px",
                marginBottom: "15px",
              }}
            >
              2. ĐỀ XUẤT TỐI ƯU HÓA NỘI DUNG (STAR)
            </h2>
            <div className="pdf-tab-content">
              {tips.map((tip: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    marginBottom: "20px",
                    paddingBottom: "15px",
                    borderBottom: "1px dashed #e2e8f0",
                  }}
                >
                  <h4 style={{ color: "#0f172a", margin: "0 0 5px", fontSize: "13px" }}>
                    {idx + 1}. {tip.title} ({tip.group})
                  </h4>
                  <p style={{ color: "#475569", fontSize: "12px", margin: "0 0 8px" }}>
                    {tip.detail}
                  </p>
                  {tip.star_guidance && (
                    <p
                      style={{
                        color: "#5b21b6",
                        fontSize: "11px",
                        margin: "0 0 8px",
                        background: "#f5f3ff",
                        padding: "6px",
                      }}
                    >
                      * Hướng dẫn STAR: {tip.star_guidance}
                    </p>
                  )}
                  {tip.example_before && (
                    <table style={{ width: "100%", fontSize: "11px" }}>
                      <tbody>
                        <tr>
                          <td
                            style={{
                              background: "#fff5f5",
                              padding: "6px",
                              width: "50%",
                              border: "1px solid #fee2e2",
                            }}
                          >
                            <span style={{ color: "#b91c1c" }}>Bản gốc:</span> {tip.example_before}
                          </td>
                          <td
                            style={{
                              background: "#f0fdf4",
                              padding: "6px",
                              width: "50%",
                              border: "1px solid #bbf7d0",
                            }}
                          >
                            <span style={{ color: "#15803d" }}>Gợi ý viết lại:</span>{" "}
                            {tip.example_after}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ pageBreakAfter: "always" }} />

          <div style={{ marginBottom: "40px" }}>
            <h2
              style={{
                color: "#2563EB",
                fontSize: "18px",
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: "8px",
                marginBottom: "15px",
              }}
            >
              3. PHÂN TÍCH CHẤT LƯỢNG NGÔN TỪ & CHÂN THỰC
            </h2>
            <div className="pdf-tab-content">
              <p style={{ fontSize: "13px", color: "#334155" }}>
                • Điểm chất lượng ngôn từ diễn đạt:{" "}
                <strong>{lang.overall_language_score ?? 0}/100</strong> ({lang.language_comment})
              </p>
              {lang.ai_generation_risk && (
                <div
                  style={{
                    background: lang.ai_generation_risk.detected ? "#fffbeb" : "#f0fdf4",
                    padding: "15px",
                    borderRadius: "6px",
                    border: lang.ai_generation_risk.detected
                      ? "1px solid #fde68a"
                      : "1px solid #bbf7d0",
                    marginTop: "15px",
                  }}
                >
                  <h4
                    style={{
                      color: lang.ai_generation_risk.detected ? "#d97706" : "#16a34a",
                      margin: "0 0 5px",
                    }}
                  >
                    {lang.ai_generation_risk.detected
                      ? `⚠️ Phát hiện mật độ AI viết tại: ${lang.ai_generation_risk.section || "Mục tiêu"} (${lang.ai_generation_risk.score ?? 0}%)`
                      : "✔️ Xác minh độ chân thực CV thành công"}
                  </h4>
                  <p style={{ fontSize: "12px", color: "#475569", margin: "0" }}>
                    {lang.ai_generation_risk.comment}
                  </p>
                </div>
              )}
              <div style={{ marginTop: "20px" }}>
                <h4 style={{ color: "#0f172a", margin: "0 0 10px" }}>Động từ mạnh đã dùng:</h4>
                <p style={{ fontSize: "12px", color: "#334155" }}>
                  {(lang.good_action_verbs || []).join(", ")}
                </p>
              </div>
            </div>
          </div>

          <div style={{ pageBreakAfter: "always" }} />

          <div style={{ marginBottom: "40px" }}>
            <h2
              style={{
                color: "#2563EB",
                fontSize: "18px",
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: "8px",
                marginBottom: "15px",
              }}
            >
              4. KỊCH BẢN CÂU HỎI PHỎNG VẤN DỰ KIẾN
            </h2>
            <div className="pdf-tab-content">
              {interviewQuestions.map((item: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    marginBottom: "25px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    padding: "15px",
                    background: "#f8fafc",
                  }}
                >
                  <h4 style={{ color: "#1e3a8a", margin: "0 0 10px", fontSize: "13px" }}>
                    Tình huống {idx + 1}: {item.question}
                  </h4>
                  <p style={{ fontSize: "12px", color: "#334155", margin: "4px 0" }}>
                    <strong>Ý đồ nhà tuyển dụng:</strong> {item.intention}
                  </p>
                  <p style={{ fontSize: "12px", color: "#5b21b6", margin: "4px 0" }}>
                    <strong>Chiến lược trả lời (STAR):</strong> {item.star_guide}
                  </p>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#14532d",
                      margin: "8px 0 0",
                      background: "#f0fdf4",
                      padding: "8px",
                      borderRadius: "4px",
                    }}
                  >
                    <strong>Câu trả lời mẫu xuất sắc:</strong> "{item.best_answer}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PdfExportUtils;
