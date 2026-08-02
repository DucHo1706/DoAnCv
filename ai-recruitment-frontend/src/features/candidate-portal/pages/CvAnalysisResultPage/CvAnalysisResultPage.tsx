import React, { useEffect, useState, useRef } from "react";
import { Typography, Button, Tag, Space, Row, Col, Card, Progress, message } from "antd";
import { ArrowLeftOutlined, SendOutlined, AlertOutlined } from "@ant-design/icons";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axiosClient from "../../../../services/axiosClient";
import AiDetailedTabs from "../../../../components/ai-report/AiDetailedTabs";
import PdfExportUtils from "./components/PdfExportUtils";
import AiCoreIcon from "../../../../components/common/AiCoreIcon";

const { Title, Text, Paragraph } = Typography;

const getAiApiUrl = (endpoint: string) => {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  if (import.meta.env.VITE_AI_API_URL) {
    return `${import.meta.env.VITE_AI_API_URL}${cleanEndpoint}`;
  }
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return `/ai-api${cleanEndpoint}`;
  }
  return `http://127.0.0.1:8000${cleanEndpoint}`;
};

interface RedFlag {
  type: string;
  title: string;
  description: string;
}

interface ScoreAnalysis {
  total_score: number;
  classification: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  matched_skills: string[];
  missing_skills: string[];
  red_flags?: RedFlag[];
}

interface OptimizationTip {
  group: string;
  title: string;
  detail: string;
  priority: "high" | "medium";
  star_guidance?: string;
  example_before?: string | null;
  example_after?: string | null;
}

interface WeakPhrase {
  original: string;
  suggestion: string;
  reason: string;
}

interface AiGenerationRisk {
  detected: boolean;
  section: string;
  score: number;
  comment: string;
}

interface LanguageReview {
  overall_language_score: number;
  language_comment: string;
  good_action_verbs: string[];
  weak_phrases: WeakPhrase[];
  ai_generation_risk?: AiGenerationRisk;
}

interface MockInterviewQuestion {
  question: string;
  intention: string;
  star_guide: string;
  best_answer: string;
}

interface AnalysisData {
  status: string;
  score_analysis: ScoreAnalysis;
  optimization_tips: OptimizationTip[];
  language_review: LanguageReview;
  mock_interview?: MockInterviewQuestion[];
  candidate_info?: { email?: string; phone?: string; extracted_skills?: string[] };
  cv_text?: string;
  job_description?: string;
}

export default function CvAnalysisResultPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [meta, setMeta] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const hasTriggeredRef = useRef(false);

  // Tải thông tin ứng viên từ localStorage đăng nhập an toàn
  const [candidateName, setCandidateName] = useState<string>("Ứng viên");

  // Các state hỗ trợ gọi API trực tiếp tại trang phân tích và hiển thị Skeleton
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // States lưu trữ nội dung văn bản cho Lazy Loading
  const [cvText, setCvText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [cvSkills, setCvSkills] = useState<string[]>([]);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [langLoading, setLangLoading] = useState(false);
  const [interviewLoading, setInterviewLoading] = useState(false);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        const name = user?.fullName || user?.FullName || "Ứng viên";
        setCandidateName(name);
      }
    } catch (e) {
      console.error("Lỗi đọc thông tin user từ localStorage:", e);
    }
  }, []);

  const locationFile = location.state?.file;
  const locationJobTitle = location.state?.jobTitle || "";
  const locationCompanyName = location.state?.companyName || "AI Recruitment";
  const locationJobDescription = location.state?.jobDescription || "";
  const triggerAnalysis = location.state?.triggerAnalysis;

  const runPageAnalysis = async () => {
    if (!locationFile) return;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", locationFile);
      formData.append("job_description", locationJobDescription || "");
      formData.append("job_title", locationJobTitle || "");
      formData.append("company_name", locationCompanyName || "AI Recruitment");

      const response = await fetch(getAiApiUrl("/analyze-cv-preview"), {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error(`Lỗi kết nối AI Service (${response.status})`);
      const data = await response.json();
      if (data.status === "error") throw new Error(data.message || "AI không thể phân tích CV.");

      setAnalysisData(data);
      setCvText(data.cv_text || "");
      setJobDescription(data.job_description || "");
      setCvSkills(data.candidate_info?.extracted_skills || []);

      const metaData = {
        analysisData: data,
        jobId: id,
        jobTitle: locationJobTitle,
        companyName: locationCompanyName,
        fileName: locationFile.name,
        cv_text: data.cv_text || "",
        job_description: data.job_description || "",
        analyzedAt: new Date().toISOString(),
      };
      setMeta(metaData);
      localStorage.setItem(`cv_analysis_result_${id}`, JSON.stringify(metaData));
      setLoading(false);
      message.success("AI đã chấm xong điểm và kỹ năng! 🎉");
      triggerBackgroundPreFetch(data, locationJobTitle, locationCompanyName);
    } catch (err: any) {
      setLoading(false);
      setError(
        err.message ||
          "Không thể kết nối tới AI Service. Vui lòng đảm bảo Python server đang chạy (port 8000)."
      );
    }
  };

  async function triggerBackgroundPreFetch(
    currentAnalysisData: any,
    jobTitle: string,
    companyName: string
  ) {
    const currentCvText = cvText || currentAnalysisData?.cv_text || "";
    const currentJdText = jobDescription || currentAnalysisData?.job_description || "";
    const currentCvSkills = cvSkills || currentAnalysisData?.candidate_info?.extracted_skills || [];
    const currentJdSkills = currentAnalysisData?.score_analysis?.missing_skills || [];

    if (!currentCvText || !currentJdText) return;

    const payload = {
      cv_text: currentCvText,
      jd_text: currentJdText,
      cv_skills: currentCvSkills,
      jd_skills: currentJdSkills,
      job_title: jobTitle,
      company_name: companyName,
    };

    const tasks = [];

    // 1. Tải gợi ý STAR chạy song song
    if (!currentAnalysisData.optimization_tips || currentAnalysisData.optimization_tips.length === 0) {
      const taskStar = async () => {
        setTipsLoading(true);
        try {
          const res = await fetch(getAiApiUrl("/analyze-cv-star"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const resData = await res.json();
          if (resData.status === "success" && resData.data) {
            setAnalysisData((prev) => {
              const updated = prev ? { ...prev, optimization_tips: resData.data } : null;
              if (updated) {
                const stored = localStorage.getItem(`cv_analysis_result_${id}`);
                const currentMeta = stored ? JSON.parse(stored) : {};
                const updatedMeta = { ...currentMeta, analysisData: updated };
                localStorage.setItem(`cv_analysis_result_${id}`, JSON.stringify(updatedMeta));
              }
              return updated;
            });
          }
        } catch (e) {
          console.error("Background pre-fetch STAR failed", e);
        } finally {
          setTipsLoading(false);
        }
      };
      tasks.push(taskStar());
    }

    // 2. Tải đánh giá ngôn ngữ chạy song song
    if (!currentAnalysisData.language_review || (currentAnalysisData.language_review.overall_language_score ?? 0) === 0) {
      const taskLang = async () => {
        setLangLoading(true);
        try {
          const res = await fetch(getAiApiUrl("/analyze-cv-language"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const resData = await res.json();
          if (resData.status === "success" && resData.data) {
            setAnalysisData((prev) => {
              const updated = prev ? { ...prev, language_review: resData.data } : null;
              if (updated) {
                const stored = localStorage.getItem(`cv_analysis_result_${id}`);
                const currentMeta = stored ? JSON.parse(stored) : {};
                const updatedMeta = { ...currentMeta, analysisData: updated };
                localStorage.setItem(`cv_analysis_result_${id}`, JSON.stringify(updatedMeta));
              }
              return updated;
            });
          }
        } catch (e) {
          console.error("Background pre-fetch Language failed", e);
        } finally {
          setLangLoading(false);
        }
      };
      tasks.push(taskLang());
    }

    // 3. Tải gợi ý phỏng vấn chạy song song
    if (!currentAnalysisData.mock_interview || currentAnalysisData.mock_interview.length === 0) {
      const taskInterview = async () => {
        setInterviewLoading(true);
        try {
          const res = await fetch(getAiApiUrl("/analyze-cv-interview"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const resData = await res.json();
          if (resData.status === "success" && resData.data) {
            setAnalysisData((prev) => {
              const updated = prev ? { ...prev, mock_interview: resData.data } : null;
              if (updated) {
                const stored = localStorage.getItem(`cv_analysis_result_${id}`);
                const currentMeta = stored ? JSON.parse(stored) : {};
                const updatedMeta = { ...currentMeta, analysisData: updated };
                localStorage.setItem(`cv_analysis_result_${id}`, JSON.stringify(updatedMeta));
              }
              return updated;
            });
          }
        } catch (e) {
          console.error("Background pre-fetch Interview failed", e);
        } finally {
          setInterviewLoading(false);
        }
      };
      tasks.push(taskInterview());
    }

    if (tasks.length > 0) {
      try {
        await Promise.all(tasks);
      } catch (err) {
        console.error("Parallel background pre-fetch failed", err);
      }
    }
  }

  useEffect(() => {
    if (location.state?.file) {
      setCvFile(location.state.file);
    }

    if (triggerAnalysis && locationFile && !hasTriggeredRef.current && !loading && !analysisData) {
      hasTriggeredRef.current = true;
      // Thay thế state hiện tại để tắt cờ triggerAnalysis, tránh chạy lại khi F5
      navigate(location.pathname, {
        replace: true,
        state: { ...location.state, triggerAnalysis: false },
      });
      runPageAnalysis();
    } else {
      if (hasTriggeredRef.current) {
        return;
      }
      const stored = localStorage.getItem(`cv_analysis_result_${id}`);
      if (!stored) {
        message.error("Không tìm thấy kết quả phân tích. Vui lòng thực hiện lại.");
        navigate(`/jobs/${id}`);
        return;
      }
      try {
        const parsed = JSON.parse(stored);
        setAnalysisData(parsed.analysisData);
        setMeta(parsed);
        setCvText(parsed.cv_text || parsed.analysisData?.cv_text || "");
        setJobDescription(parsed.job_description || parsed.analysisData?.job_description || "");
        setCvSkills(parsed.analysisData?.candidate_info?.extracted_skills || []);
        
        // Kích hoạt nạp ngầm tuần tự
        if (parsed.analysisData) {
          triggerBackgroundPreFetch(parsed.analysisData, parsed.jobTitle || "", parsed.companyName || "");
        }
      } catch {
        navigate(`/jobs/${id}`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  const handleUpdateAnalysisData = (newData: any) => {
    setAnalysisData(newData);
    if (meta) {
      const updatedMeta = { ...meta, analysisData: newData };
      setMeta(updatedMeta);
      localStorage.setItem(`cv_analysis_result_${id}`, JSON.stringify(updatedMeta));
    }
  };

  const handleTabChange = async (key: string) => {
    if (key === "1") return;

    if (key === "2") {
      if (tipsLoading) return;
      if (analysisData?.optimization_tips && analysisData.optimization_tips.length > 0) return;
    } else if (key === "3") {
      if (langLoading) return;
      if (
        analysisData?.language_review &&
        (analysisData.language_review.overall_language_score ?? 0) > 0
      )
        return;
    } else if (key === "4") {
      if (interviewLoading) return;
      if (analysisData?.mock_interview && analysisData.mock_interview.length > 0) return;
    }

    const currentCvText = cvText || analysisData?.cv_text || "";
    const currentJdText = jobDescription || analysisData?.job_description || "";
    const currentCvSkills = cvSkills || analysisData?.candidate_info?.extracted_skills || [];
    const currentJdSkills = analysisData?.score_analysis?.missing_skills || [];

    if (!currentCvText || !currentJdText) {
      return;
    }

    const payload = {
      cv_text: currentCvText,
      jd_text: currentJdText,
      cv_skills: currentCvSkills,
      jd_skills: currentJdSkills,
      job_title: meta?.jobTitle || locationJobTitle,
      company_name: meta?.companyName || locationCompanyName,
    };

    if (key === "2") {
      setTipsLoading(true);
      try {
        const res = await fetch(getAiApiUrl("/analyze-cv-star"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.status === "success" && data.data) {
          setAnalysisData((prev) => {
            const updated = prev ? { ...prev, optimization_tips: data.data } : null;
            if (updated && meta) {
              const updatedMeta = { ...meta, analysisData: updated };
              setMeta(updatedMeta);
              localStorage.setItem(`cv_analysis_result_${id}`, JSON.stringify(updatedMeta));
            }
            return updated;
          });
        }
      } catch (e) {
        message.error("Lỗi kết nối khi tải gợi ý STAR.");
      } finally {
        setTipsLoading(false);
      }
    } else if (key === "3") {
      setLangLoading(true);
      try {
        const res = await fetch(getAiApiUrl("/analyze-cv-language"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.status === "success" && data.data) {
          setAnalysisData((prev) => {
            const updated = prev ? { ...prev, language_review: data.data } : null;
            if (updated && meta) {
              const updatedMeta = { ...meta, analysisData: updated };
              setMeta(updatedMeta);
              localStorage.setItem(`cv_analysis_result_${id}`, JSON.stringify(updatedMeta));
            }
            return updated;
          });
        }
      } catch (e) {
        message.error("Lỗi kết nối khi rà soát ngôn ngữ.");
      } finally {
        setLangLoading(false);
      }
    } else if (key === "4") {
      setInterviewLoading(true);
      try {
        const res = await fetch(getAiApiUrl("/analyze-cv-interview"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.status === "success" && data.data) {
          setAnalysisData((prev) => {
            const updated = prev ? { ...prev, mock_interview: data.data } : null;
            if (updated && meta) {
              const updatedMeta = { ...meta, analysisData: updated };
              setMeta(updatedMeta);
              localStorage.setItem(`cv_analysis_result_${id}`, JSON.stringify(updatedMeta));
            }
            return updated;
          });
        }
      } catch (e) {
        message.error("Lỗi kết nối khi tải bộ câu hỏi phỏng vấn.");
      } finally {
        setInterviewLoading(false);
      }
    }
  };

  const handleContinueApply = async () => {
    if (!id) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("JobId", id);
      if (cvFile) {
        formData.append("CvFile", cvFile);
      } else {
        message.error(
          "Không tìm thấy tệp CV trong bộ nhớ tạm. Vui lòng chọn 'Quay lại' để thực hiện lại."
        );
        setSubmitting(false);
        return;
      }
      await axiosClient.post("/Recruitment/apply", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      message.success("Nộp hồ sơ thành công! AI chúc bạn sớm nhận lịch hẹn phỏng vấn 🎉");
      localStorage.removeItem(`cv_analysis_result_${id}`);
      navigate("/my-applications");
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Đã có lỗi xảy ra khi gửi hồ sơ.";
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Cấu hình phong cách kính mờ sáng (Light Glassmorphism Theme) màu trắng & xanh
  const glassCardStyle = (mb = 24): React.CSSProperties => ({
    background: "rgba(255, 255, 255, 0.85)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(226, 232, 240, 0.8)",
    boxShadow: "0 8px 32px 0 rgba(148, 163, 184, 0.08)",
    borderRadius: "16px",
    marginBottom: mb,
    overflow: "hidden",
  });



  // Hiển thị giao diện báo lỗi nếu API thất bại
  if (error) {
    return (
      <div
        style={{
          background: "#F8FAFC",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
        }}
      >
        <div
          style={{
            maxWidth: 600,
            width: "100%",
            background: "#FFFFFF",
            padding: "40px",
            borderRadius: 16,
            boxShadow: "0 8px 32px 0 rgba(148, 163, 184, 0.08)",
            border: "1px solid #E2E8F0",
            textAlign: "center",
          }}
        >
          <AlertOutlined style={{ color: "#EF4444", fontSize: 48, marginBottom: 16 }} />
          <Title
            level={3}
            style={{ color: "#0F172A", margin: "0 0 12px", fontSize: 20, fontWeight: 700 }}
          >
            Không thể phân tích hồ sơ
          </Title>
          <Paragraph
            style={{ color: "#64748B", fontSize: 14, lineHeight: "1.6", marginBottom: 28 }}
          >
            {error}
          </Paragraph>
          <Space size={16} style={{ width: "100%", justifyContent: "center" }}>
            <Button
              onClick={() => navigate(`/jobs/${id}`)}
              size="large"
              style={{ borderRadius: 8, height: 44, paddingInline: 24 }}
            >
              Quay lại Tin tuyển dụng
            </Button>
            <Button
              type="primary"
              onClick={runPageAnalysis}
              size="large"
              style={{
                background: "#2563EB",
                border: "none",
                borderRadius: 8,
                height: 44,
                paddingInline: 24,
                fontWeight: 600,
              }}
            >
              Thử lại
            </Button>
          </Space>
        </div>
      </div>
    );
  }

  // Xác định trạng thái tải dữ liệu ban đầu
  const isInitialLoading = loading || !analysisData;

  const score = analysisData?.score_analysis || {
    total_score: 0,
    classification: "Chưa tương thích",
    summary: "AI đang tiến hành phân tích nhận xét tổng quan...",
    strengths: [],
    weaknesses: [],
    matched_skills: [],
    missing_skills: [],
    red_flags: [],
  };

  const scoreColor = isInitialLoading
    ? "#e2e8f0"
    : (score.total_score ?? 0) >= 80
      ? "#10b981"
      : (score.total_score ?? 0) >= 60
        ? "#f59e0b"
        : "#ef4444";

  const whiteboxScore = typeof (score as any).whitebox_score === "number"
    ? Math.max(0, Math.min(100, (score as any).whitebox_score))
    : null;
  const blackboxScore = typeof (score as any).blackbox_score === "number"
    ? Math.max(0, Math.min(100, (score as any).blackbox_score))
    : null;

  const getClassificationTag = (cls: string) => {
    if (isInitialLoading) {
      return (
        <Tag
          color="default"
          style={{
            fontWeight: 700,
            borderRadius: 6,
            fontSize: 14,
            padding: "4px 14px",
            background: "#f1f5f9",
            border: "1px solid #e2e8f0",
            color: "#64748b",
          }}
        >
          Đang phân tích...
        </Tag>
      );
    }
    switch (cls) {
      case "Không đủ dữ liệu":
        return (
          <Tag
            color="default"
            style={{
              fontWeight: 700,
              borderRadius: 6,
              fontSize: 14,
              padding: "4px 14px",
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              color: "#475569",
            }}
          >
            Không đủ dữ liệu OCR
          </Tag>
        );
      case "AI tạm thời không khả dụng":
        return (
          <Tag color="warning" style={{ fontWeight: 700, borderRadius: 6, fontSize: 14, padding: "4px 14px" }}>
            AI tạm thời không khả dụng
          </Tag>
        );
      case "Phù hợp":
        return (
          <Tag
            color="success"
            style={{
              fontWeight: 700,
              borderRadius: 6,
              fontSize: 14,
              padding: "4px 14px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#16a34a",
            }}
          >
            Phù hợp xuất sắc
          </Tag>
        );
      case "Nên xem xét":
        return (
          <Tag
            color="warning"
            style={{
              fontWeight: 700,
              borderRadius: 6,
              fontSize: 14,
              padding: "4px 14px",
              background: "#fffbeb",
              border: "1px solid #fde68a",
              color: "#d97706",
            }}
          >
            Cần cải thiện thêm
          </Tag>
        );
      default:
        return (
          <Tag
            color="error"
            style={{
              fontWeight: 700,
              borderRadius: 6,
              fontSize: 14,
              padding: "4px 14px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#dc2626",
            }}
          >
            Chưa tương thích
          </Tag>
        );
    }
  };

  return (
    <div
      style={{
        background: "#F8FAFC",
        minHeight: "100vh",
        paddingBottom: 80,
        paddingTop: 24,
        color: "#0F172A",
      }}
    >
      <style>{`
        .light-glass-tabs .ant-tabs-nav::before {
          border-bottom: 1px solid #E2E8F0 !important;
        }
        .light-glass-tabs .ant-tabs-tab {
          font-size: 15px !important;
          padding: 14px 10px !important;
          color: #64748B !important;
          transition: all 0.3s ease;
        }
        .light-glass-tabs .ant-tabs-tab:hover {
          color: #2563EB !important;
        }
        .light-glass-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #2563EB !important;
          font-weight: 700 !important;
        }
        .light-glass-tabs .ant-tabs-ink-bar {
          background: #2563EB !important;
          height: 3px !important;
          border-radius: 2px !important;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
        @keyframes pulse-glow {
          0% { transform: scale(0.96); box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.3); }
          70% { transform: scale(1.04); box-shadow: 0 0 0 16px rgba(37, 99, 235, 0); }
          100% { transform: scale(0.96); box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
        }
      `}</style>

      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ marginBottom: 24 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(`/jobs/${id}`)}
            style={{
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              color: "#0F172A",
              borderRadius: 8,
              fontWeight: 600,
              height: 38,
            }}
          >
            Quay lại Tin tuyển dụng
          </Button>
        </div>

        <Row gutter={[24, 24]}>
          {/* CỘT TRÁI - Rộng 8/24 */}
          <Col xs={24} lg={8}>
            <Space direction="vertical" size={24} style={{ width: "100%" }}>
              {/* Card 1: THÔNG TIN ỨNG VIÊN */}
              <Card
                title={
                  <span
                    style={{
                      color: "#0F172A",
                      fontWeight: 700,
                      fontSize: 14,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    THÔNG TIN ỨNG VIÊN
                  </span>
                }
                style={glassCardStyle(0)}
                bodyStyle={{ padding: "20px 24px" }}
                headStyle={{ borderBottom: "1px solid #F1F5F9" }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "120px 1fr",
                    gap: "18px 8px",
                    fontSize: 14,
                  }}
                >
                  <Text type="secondary">Họ tên</Text>
                  <Text strong style={{ color: "#0f172a" }}>
                    {candidateName}
                  </Text>

                  <Text type="secondary">Chuyên ngành</Text>
                  <Text strong style={{ color: "#0f172a" }}>
                    {isInitialLoading ? "Đang trích xuất..." : "Chưa xác định"}
                  </Text>

                  <Text type="secondary">Vị trí ứng tuyển</Text>
                  <Text strong style={{ color: "#0f172a" }}>
                    {meta?.jobTitle || locationJobTitle}
                  </Text>

                  <Text type="secondary">CV đã nộp</Text>
                  <Text strong style={{ color: "#2563eb", wordBreak: "break-all" }}>
                    {meta?.fileName || locationFile?.name}
                  </Text>

                  <Text type="secondary">Liên kết JD</Text>
                  <a
                    href={`/jobs/${id}`}
                    style={{ fontWeight: 600, color: "#2563eb", wordBreak: "break-all" }}
                  >
                    jobs/{id}
                  </a>
                </div>
              </Card>

              {/* Card 2: ĐIỂM KHỚP NGỮ NGHĨA */}
              <Card
                title={
                  <span
                    style={{
                      color: "#0F172A",
                      fontWeight: 700,
                      fontSize: 14,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    ĐIỂM TƯƠNG THÍCH AI
                  </span>
                }
                style={glassCardStyle(0)}
                bodyStyle={{ padding: "24px", textAlign: "center" }}
                headStyle={{ borderBottom: "1px solid #F1F5F9" }}
              >
                <div style={{ margin: "16px 0", display: "flex", justifyContent: "center" }}>
                  {isInitialLoading ? (
                    <div
                      style={{
                        width: 140,
                        height: 140,
                        borderRadius: "50%",
                        border: "8px solid #f1f5f9",
                        borderTopColor: "#2563eb",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        animation: "spin 1.5s linear infinite",
                      }}
                    >
                      <AiCoreIcon size={32} style={{ animation: "pulse-glow 1.5s infinite", verticalAlign: "middle" }} />
                    </div>
                  ) : (
                    <Progress
                      type="circle"
                      percent={score.total_score ?? 0}
                      strokeColor={scoreColor}
                      width={140}
                      strokeWidth={8}
                      format={(p) => (
                        <span style={{ fontSize: 32, fontWeight: 800, color: "#0F172A" }}>{p}%</span>
                      )}
                    />
                  )}
                </div>
                <div style={{ marginTop: 12 }}>
                  {getClassificationTag(score.classification || "")}
                </div>

                {isInitialLoading ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
                    <div style={{ width: "100%", height: 12, background: "#f1f5f9", borderRadius: 4, animation: "pulse 1.5s infinite" }} />
                    <div style={{ width: "90%", height: 12, background: "#f1f5f9", borderRadius: 4, animation: "pulse 1.5s infinite" }} />
                    <div style={{ width: "95%", height: 12, background: "#f1f5f9", borderRadius: 4, animation: "pulse 1.5s infinite" }} />
                    <div style={{ width: "60%", height: 12, background: "#f1f5f9", borderRadius: 4, animation: "pulse 1.5s infinite" }} />
                  </div>
                ) : (
                  <Paragraph
                    style={{
                      fontSize: 14,
                      color: "#475569",
                      marginTop: 24,
                      textAlign: "left",
                      lineHeight: "1.7",
                      marginBottom: 0,
                    }}
                  >
                    {score.summary || "AI đã hoàn thành phân tích."}
                  </Paragraph>
                )}

                {!isInitialLoading && (
                  <div style={{ marginTop: 24, textAlign: "left", background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                    <Text strong style={{ display: "block", fontSize: 13, color: "#0F172A", marginBottom: 4 }}>
                      Cách hệ thống đánh giá CV
                    </Text>
                    <Text type="secondary" style={{ display: "block", fontSize: 11.5, lineHeight: 1.5, marginBottom: 14 }}>
                      Điểm tổng thể được AI tổng hợp từ mức độ khớp nội dung và mức độ phù hợp theo ngữ cảnh.
                    </Text>

                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Đối chiếu từ khóa, kỹ năng và kinh nghiệm
                        </Text>
                        <Text strong style={{ fontSize: 12, color: "#16a34a" }}>
                          {whiteboxScore === null ? "Chưa có dữ liệu" : `${Math.round(whiteboxScore)}%`}
                        </Text>
                      </div>
                      {whiteboxScore !== null && <Progress percent={whiteboxScore} size="small" strokeColor="#16a34a" showInfo={false} />}
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Phân tích mức độ phù hợp theo ngữ cảnh
                        </Text>
                        <Text strong style={{ fontSize: 12, color: "#2563eb" }}>
                          {blackboxScore === null ? "Chưa có dữ liệu" : `${Math.round(blackboxScore)}%`}
                        </Text>
                      </div>
                      {blackboxScore !== null && <Progress percent={blackboxScore} size="small" strokeColor="#2563eb" showInfo={false} />}
                    </div>

                    <details style={{ marginTop: 14, borderTop: "1px solid #E2E8F0", paddingTop: 10 }}>
                      <summary style={{ cursor: "pointer", color: "#2563EB", fontSize: 11.5, fontWeight: 650 }}>
                        Giải thích phương pháp tính
                      </summary>
                      <div style={{ color: "#64748B", fontSize: 11.5, lineHeight: 1.55, marginTop: 8 }}>
                        <div><strong>Đối chiếu có thể giải thích (Whitebox):</strong> dùng TF-IDF và độ tương đồng Cosine để đo mức độ trùng khớp từ khóa.</div>
                        <div style={{ marginTop: 5 }}><strong>Phân tích ngữ cảnh (Blackbox):</strong> dùng Gemini để xem xét ý nghĩa của kỹ năng và kinh nghiệm trong toàn bộ CV.</div>
                        <div style={{ marginTop: 5 }}>Hai chỉ số là tín hiệu tham khảo; điểm tổng thể không phải phép cộng trực tiếp của hai tỷ lệ.</div>
                      </div>
                    </details>
                  </div>
                )}
              </Card>
            </Space>
          </Col>

          {/* CỘT PHẢI - Rộng 16/24 (Hộp Tabs để giữ trang không quá dài) */}
          <Col xs={24} lg={16}>
            <Card style={glassCardStyle(0)} bodyStyle={{ padding: "24px 32px" }} bordered={false}>
              <AiDetailedTabs
                parsedAnalysis={analysisData}
                onChange={handleTabChange}
                tipsLoading={tipsLoading}
                langLoading={langLoading}
                interviewLoading={interviewLoading}
                isInitialLoading={isInitialLoading}
              />
            </Card>
          </Col>
        </Row>

        {/* Nút thao tác dưới cùng (Footer Flat Buttons) — chỉ hiển thị sau khi có dữ liệu */}
        {!isInitialLoading && (
        <div
          style={{
            marginTop: 32,
            display: "flex",
            justifyContent: "flex-start",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <Button
            type="primary"
            size="large"
            icon={<SendOutlined />}
            loading={submitting}
            onClick={handleContinueApply}
            style={{
              background: "#2563EB",
              border: "none",
              fontWeight: 700,
              borderRadius: 8,
              height: 46,
              paddingInline: 28,
            }}
          >
            Tiếp tục nộp CV
          </Button>
          <PdfExportUtils
            analysisData={analysisData}
            meta={meta}
            cvText={cvText}
            jobDescription={jobDescription}
            cvSkills={cvSkills}
            jobTitle={meta?.jobTitle || locationJobTitle}
            companyName={meta?.companyName || locationCompanyName}
            candidateName={candidateName}
            onUpdateAnalysisData={handleUpdateAnalysisData}
          />
        </div>
        )}
      </div>

    </div>
  );
}
