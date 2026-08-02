import React, { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Button, message } from "antd";
import { DownloadOutlined } from "@ant-design/icons";

const getAiApiUrl = (endpoint: string) => {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  if (import.meta.env.VITE_AI_API_URL) return `${import.meta.env.VITE_AI_API_URL}${cleanEndpoint}`;
  if (typeof window !== "undefined" && !["localhost", "127.0.0.1"].includes(window.location.hostname)) {
    return `/ai-api${cleanEndpoint}`;
  }
  return `http://127.0.0.1:8000${cleanEndpoint}`;
};

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

const safeList = (value: unknown): any[] => (Array.isArray(value) ? value : []);

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
  const [reportData, setReportData] = useState(analysisData);

  useEffect(() => setReportData(analysisData), [analysisData]);

  const ensureDetailedData = async () => {
    const nextData = { ...analysisData };
    const payload = {
      cv_text: cvText || analysisData?.cv_text || "",
      jd_text: jobDescription || analysisData?.job_description || "",
      cv_skills: cvSkills || analysisData?.candidate_info?.extracted_skills || [],
      jd_skills: analysisData?.score_analysis?.missing_skills || [],
      job_title: jobTitle,
      company_name: companyName,
    };

    const requests: Array<Promise<{ field: string; data: any }>> = [];
    if (safeList(nextData.optimization_tips).length === 0) {
      requests.push(fetch(getAiApiUrl("/analyze-cv-star"), {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      }).then((response) => response.json()).then((data) => ({ field: "optimization_tips", data })));
    }
    if (!nextData.language_review || nextData.language_review.insufficient_data) {
      requests.push(fetch(getAiApiUrl("/analyze-cv-language"), {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      }).then((response) => response.json()).then((data) => ({ field: "language_review", data })));
    }
    if (safeList(nextData.mock_interview).length === 0) {
      requests.push(fetch(getAiApiUrl("/analyze-cv-interview"), {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      }).then((response) => response.json()).then((data) => ({ field: "mock_interview", data })));
    }

    if (requests.length > 0) {
      message.loading({ content: "Đang hoàn thiện dữ liệu báo cáo...", key: "pdf-load", duration: 0 });
      const results = await Promise.allSettled(requests);
      results.forEach((result) => {
        if (result.status === "fulfilled" && result.value.data?.status === "success") {
          nextData[result.value.field] = result.value.data.data;
        }
      });
    }

    flushSync(() => setReportData(nextData));
    onUpdateAnalysisData?.(nextData);
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    return nextData;
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current || downloading) return;
    setDownloading(true);
    try {
      await ensureDetailedData();
      const html2pdf = (await import("html2pdf.js")).default;
      const cleanName = (candidateName || "Ung_vien").replace(/[\\/:*?"<>|]/g, "_");
      const pdfOptions: any = {
        margin: [9, 9, 10, 9] as [number, number, number, number],
        filename: `Bao_cao_phan_tich_CV_${cleanName}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, backgroundColor: "#ffffff" },
        jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
        pagebreak: { mode: ["css", "legacy"], before: ".pdf-page-break", avoid: [".pdf-keep"] },
      };
      await html2pdf().set(pdfOptions).from(printRef.current).save();
      message.success({ content: "Đã tải báo cáo PDF đầy đủ.", key: "pdf-load" });
    } catch (error) {
      console.error(error);
      message.error({ content: "Không thể xuất báo cáo PDF. Vui lòng thử lại.", key: "pdf-load" });
    } finally {
      setDownloading(false);
    }
  };

  const score = reportData?.score_analysis || {};
  const strengths = safeList(score.strengths);
  const weaknesses = safeList(score.weaknesses);
  const matchedSkills = safeList(score.matched_skills);
  const missingSkills = safeList(score.missing_skills);
  const criteria = safeList(reportData?.criteria_results);
  const redFlags = safeList(score.red_flags);
  const tips = safeList(reportData?.optimization_tips);
  const language = reportData?.language_review || {};
  const learningPath = safeList(reportData?.mock_interview);
  const generatedDate = new Intl.DateTimeFormat("vi-VN", { dateStyle: "long", timeStyle: "short" }).format(new Date());

  const Empty = ({ children }: { children: React.ReactNode }) => (
    <div className="pdf-empty">{children}</div>
  );

  return (
    <>
      <Button type="default" size="large" icon={<DownloadOutlined />} loading={downloading} onClick={handleDownloadPDF}
        style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", color: "#0F172A", fontWeight: 650, borderRadius: 8, height: 46, paddingInline: 24 }}>
        Tải báo cáo PDF
      </Button>

      <div aria-hidden="true" style={{ position: "fixed", left: "-12000px", top: 0, width: 794 }}>
        <article ref={printRef} className="pdf-report">
          <style>{`
            .pdf-report{width:794px;padding:44px 48px;background:#fff;color:#0f172a;font-family:Arial,"Helvetica Neue",sans-serif;font-size:12px;line-height:1.55;box-sizing:border-box}
            .pdf-report *{box-sizing:border-box}.pdf-report h1,.pdf-report h2,.pdf-report h3,.pdf-report p{margin-top:0}
            .pdf-kicker{font-size:10px;letter-spacing:1.6px;text-transform:uppercase;color:#2563eb;font-weight:700;margin-bottom:10px}
            .pdf-title{font-size:29px;line-height:1.08;letter-spacing:-.6px;margin-bottom:12px;max-width:560px}
            .pdf-subtitle{color:#64748b;font-size:12px;max-width:570px}.pdf-rule{height:3px;background:#2563eb;margin:26px 0 24px}
            .pdf-hero-grid{display:grid;grid-template-columns:1fr 142px;gap:28px;align-items:start}.pdf-score{border-left:1px solid #cbd5e1;padding-left:22px}
            .pdf-score strong{display:block;font-size:36px;line-height:1;color:#2563eb;font-variant-numeric:tabular-nums}.pdf-score span{display:block;color:#475569;margin-top:8px;font-weight:700}
            .pdf-meta{display:grid;grid-template-columns:1fr 1fr;gap:12px 28px;margin-top:24px}.pdf-meta div{border-top:1px solid #e2e8f0;padding-top:8px}
            .pdf-label{display:block;color:#64748b;font-size:9px;letter-spacing:.7px;text-transform:uppercase;margin-bottom:3px}.pdf-value{font-weight:700;color:#0f172a;word-break:break-word}
            .pdf-section{margin-top:30px}.pdf-section-head{display:flex;align-items:baseline;gap:12px;border-bottom:1px solid #cbd5e1;padding-bottom:8px;margin-bottom:16px}
            .pdf-index{color:#2563eb;font-weight:800;font-size:11px}.pdf-section h2{font-size:18px;letter-spacing:-.2px;margin:0}.pdf-section h3{font-size:13px;margin-bottom:8px}
            .pdf-summary{background:#f8fafc;border-left:3px solid #2563eb;padding:16px 18px;color:#334155;margin:18px 0}
            .pdf-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:14px}.pdf-panel{border:1px solid #e2e8f0;padding:14px;background:#fff}.pdf-panel h3{margin-bottom:9px}
            .pdf-list{margin:0;padding-left:17px}.pdf-list li{margin:5px 0}.pdf-tags{display:flex;flex-wrap:wrap;gap:6px}.pdf-tag{background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;padding:3px 7px;border-radius:4px}
            .pdf-tag.missing{background:#fff7ed;color:#9a3412;border-color:#fed7aa}.pdf-table{width:100%;border-collapse:collapse}.pdf-table th{background:#f1f5f9;color:#475569;text-align:left;font-size:10px;padding:8px;border:1px solid #e2e8f0}.pdf-table td{padding:8px;border:1px solid #e2e8f0;vertical-align:top}
            .pdf-card{border:1px solid #dbe3ee;border-radius:7px;padding:15px 16px;margin-bottom:12px;background:#fff;break-inside:avoid;page-break-inside:avoid}.pdf-card-title{font-size:13px;font-weight:800;margin-bottom:8px}.pdf-note{background:#f8fafc;padding:10px 12px;margin-top:9px;color:#334155;border-left:2px solid #94a3b8}
            .pdf-before-after{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:10px}.pdf-before,.pdf-after{padding:10px;border:1px solid #e2e8f0}.pdf-before{background:#fff7ed}.pdf-after{background:#f0fdf4}
            .pdf-empty{padding:14px;border:1px dashed #cbd5e1;background:#f8fafc;color:#64748b}.pdf-page-break{page-break-before:always;break-before:page}.pdf-keep{break-inside:avoid;page-break-inside:avoid}
            .pdf-footer{margin-top:34px;padding-top:12px;border-top:1px solid #e2e8f0;color:#64748b;font-size:9px;display:flex;justify-content:space-between}
          `}</style>

          <header>
            <div className="pdf-kicker">RecruitInsight AI · Báo cáo ứng viên</div>
            <div className="pdf-hero-grid">
              <div><h1 className="pdf-title">Phân tích mức độ phù hợp giữa CV và vị trí tuyển dụng</h1><p className="pdf-subtitle">Báo cáo hỗ trợ tham khảo. Nhà tuyển dụng và ứng viên cần kiểm chứng thông tin trước khi đưa ra quyết định.</p></div>
              <div className="pdf-score"><strong>{score.total_score ?? 0}%</strong><span>{score.classification || "Chưa phân loại"}</span></div>
            </div>
            <div className="pdf-rule" />
            <div className="pdf-meta">
              <div><span className="pdf-label">Ứng viên</span><span className="pdf-value">{candidateName}</span></div>
              <div><span className="pdf-label">Vị trí ứng tuyển</span><span className="pdf-value">{jobTitle || "Chưa xác định"}</span></div>
              <div><span className="pdf-label">Doanh nghiệp</span><span className="pdf-value">{companyName || "Chưa xác định"}</span></div>
              <div><span className="pdf-label">Tệp CV</span><span className="pdf-value">{meta?.fileName || "Chưa xác định"}</span></div>
              <div><span className="pdf-label">Whitebox</span><span className="pdf-value">{score.whitebox_score ?? 0}%</span></div>
              <div><span className="pdf-label">Blackbox</span><span className="pdf-value">{score.blackbox_score ?? 0}%</span></div>
            </div>
          </header>

          <section className="pdf-section">
            <div className="pdf-section-head"><span className="pdf-index">01</span><h2>Tổng quan đánh giá</h2></div>
            <div className="pdf-summary">{score.summary || "Chưa có nhận xét tổng quan từ AI."}</div>
            <div className="pdf-grid-2">
              <div className="pdf-panel"><h3>Năng lực tương thích</h3>{strengths.length ? <ul className="pdf-list">{strengths.map((item, i) => <li key={i}>{String(item)}</li>)}</ul> : <Empty>Chưa tìm thấy bằng chứng tương thích rõ ràng.</Empty>}</div>
              <div className="pdf-panel"><h3>Nội dung cần làm rõ</h3>{weaknesses.length ? <ul className="pdf-list">{weaknesses.map((item, i) => <li key={i}>{String(item)}</li>)}</ul> : <Empty>Không có nội dung cần làm rõ được ghi nhận.</Empty>}</div>
            </div>
          </section>

          <section className="pdf-section pdf-keep">
            <div className="pdf-section-head"><span className="pdf-index">02</span><h2>Đối chiếu kỹ năng và tiêu chí</h2></div>
            <div className="pdf-grid-2" style={{ marginBottom: 14 }}>
              <div><h3>Kỹ năng đã khớp</h3>{matchedSkills.length ? <div className="pdf-tags">{matchedSkills.map((item, i) => <span className="pdf-tag" key={i}>{String(item)}</span>)}</div> : <Empty>Chưa có kỹ năng khớp.</Empty>}</div>
              <div><h3>Kỹ năng cần bổ sung bằng chứng</h3>{missingSkills.length ? <div className="pdf-tags">{missingSkills.map((item, i) => <span className="pdf-tag missing" key={i}>{String(item)}</span>)}</div> : <Empty>Không ghi nhận kỹ năng còn thiếu.</Empty>}</div>
            </div>
            {criteria.length > 0 && <table className="pdf-table"><thead><tr><th>Tiêu chí</th><th>Điểm</th><th>Nhận xét</th></tr></thead><tbody>{criteria.map((item, i) => <tr key={i}><td>{item.criterion_name || item.CriterionName}</td><td>{item.score ?? item.Score ?? 0}/{item.max_score ?? item.MaxScore ?? item.weight ?? 0}</td><td>{item.comment || item.Comment || ""}</td></tr>)}</tbody></table>}
            {redFlags.length > 0 && <div style={{ marginTop: 16 }}><h3>Điểm cần xác minh thêm</h3>{redFlags.map((flag, i) => <div className="pdf-note pdf-keep" key={i}><strong>{flag.title || "Điểm cần làm rõ"}</strong><br />{flag.description || ""}</div>)}</div>}
          </section>

          <section className="pdf-section pdf-page-break">
            <div className="pdf-section-head"><span className="pdf-index">03</span><h2>Tối ưu nội dung theo STAR</h2></div>
            {tips.length ? tips.map((tip, i) => <article className="pdf-card" key={i}><div className="pdf-card-title">{i + 1}. {tip.title || "Gợi ý cải thiện"}</div><p>{tip.detail || ""}</p>{tip.star_guidance && <div className="pdf-note"><strong>Hướng dẫn STAR:</strong> {tip.star_guidance}</div>}{(tip.example_before || tip.example_after) && <div className="pdf-before-after"><div className="pdf-before"><span className="pdf-label">Nội dung hiện tại</span>{tip.example_before || "Không có"}</div><div className="pdf-after"><span className="pdf-label">Cách trình bày đề xuất</span>{tip.example_after || "Cần bổ sung thông tin thực tế"}</div></div>}</article>) : <Empty>Không đủ dữ liệu để tạo đề xuất STAR.</Empty>}
          </section>

          <section className="pdf-section pdf-page-break">
            <div className="pdf-section-head"><span className="pdf-index">04</span><h2>Ngôn từ và tính chân thực</h2></div>
            {language.insufficient_data ? <Empty>{language.language_comment || "Không đủ dữ liệu để đánh giá."}</Empty> : <><div className="pdf-grid-2"><div className="pdf-panel"><span className="pdf-label">Điểm ngôn từ</span><div style={{ fontSize: 25, fontWeight: 800, color: "#2563eb" }}>{language.overall_language_score ?? "—"}/100</div></div><div className="pdf-panel"><span className="pdf-label">Nhận xét</span>{language.language_comment || "Chưa có nhận xét."}</div></div>{safeList(language.good_action_verbs).length > 0 && <div style={{ marginTop: 16 }}><h3>Động từ hành động được ghi nhận</h3><div className="pdf-tags">{safeList(language.good_action_verbs).map((item, i) => <span className="pdf-tag" key={i}>{String(item)}</span>)}</div></div>}{safeList(language.weak_phrases).length > 0 && <div style={{ marginTop: 18 }}><h3>Cụm từ cần cải thiện</h3>{safeList(language.weak_phrases).map((item, i) => <div className="pdf-card" key={i}><strong>{item.original}</strong><div className="pdf-note">Gợi ý: {item.suggestion}<br />Lý do: {item.reason}</div></div>)}</div>}{language.ai_generation_risk && <div className="pdf-note pdf-keep" style={{ marginTop: 16 }}><strong>Đánh giá tham khảo về cách diễn đạt:</strong> {language.ai_generation_risk.comment || "Chưa có nhận xét."}</div>}</>}
          </section>

          <section className="pdf-section pdf-page-break">
            <div className="pdf-section-head"><span className="pdf-index">05</span><h2>Lộ trình ôn tập</h2></div>
            {learningPath.length ? learningPath.map((item, i) => <article className="pdf-card" key={i}><div className="pdf-card-title">{i + 1}. {item.question || "Chủ đề ôn tập"}</div><p><strong>Vì sao nên ưu tiên:</strong> {item.intention || ""}</p><div className="pdf-note"><strong>Cách hệ thống hóa kinh nghiệm:</strong> {item.star_guide || ""}</div><p style={{ marginTop: 10, marginBottom: 0 }}><strong>Tài liệu và hướng dẫn:</strong> {item.best_answer || ""}</p></article>) : <Empty>Chưa có lộ trình ôn tập cho hồ sơ này.</Empty>}
          </section>

          <footer className="pdf-footer"><span>RecruitInsight AI · Báo cáo chỉ có giá trị tham khảo</span><span>Tạo lúc {generatedDate}</span></footer>
        </article>
      </div>
    </>
  );
};

export default PdfExportUtils;
