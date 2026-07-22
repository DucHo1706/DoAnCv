import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Typography,
  Card,
  Row,
  Col,
  Input,
  Select,
  Button,
  Spin,
  Tag,
  Steps,
  message,
} from "antd";
import {
  ClockCircleOutlined,
  SearchOutlined,
  EyeOutlined,
  LoadingOutlined,
  FileDoneOutlined,
  InfoCircleOutlined,
  TrophyOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  VideoCameraOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { useApplicationStatus } from "./hooks/useApplicationStatus";
import PageContainer from "../../../components/common/PageContainer";
import AiDetailedTabs from "../../../components/ai-report/AiDetailedTabs";
import CompetencyTab from "../../../components/ai-report/CompetencyTab";
import StarOptimizationTab from "../../../components/ai-report/StarOptimizationTab";
import LanguageReviewTab from "../../../components/ai-report/LanguageReviewTab";
import InterviewQuestionsTab from "../../../components/ai-report/InterviewQuestionsTab";
// @ts-ignore
import html2pdf from "html2pdf.js";
import AiCoreIcon from "../../../components/common/AiCoreIcon";
import { appTheme } from "../../../constants/theme";
import { recruitmentService, type InterviewScheduleDto } from "../../../services/recruitmentService";
import { useEffect } from "react";

const { Title, Text } = Typography;

const InterviewScheduleWidget: React.FC<{ applicationId: string }> = ({ applicationId }) => {
  const [schedule, setSchedule] = useState<InterviewScheduleDto | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const data = await recruitmentService.getInterviewSchedule(applicationId);
        if (active) {
          setSchedule(data);
        }
      } catch (err) {
        console.error("Lỗi khi tải lịch phỏng vấn:", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    fetchSchedule();
    return () => {
      active = false;
    };
  }, [applicationId]);

  if (loading) {
    return (
      <div style={{ marginTop: 12, padding: "12px 16px", background: "#F1F5F9", borderRadius: 8, textAlign: "center" }}>
        <Spin size="small" tip="Đang tải lịch phỏng vấn..." />
      </div>
    );
  }

  if (!schedule) return null;

  const dateStr = schedule.interviewDate
    ? new Date(schedule.interviewDate).toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Chưa xác định";

  return (
    <div
      style={{
        marginTop: 16,
        padding: "16px 20px",
        background: "rgba(37, 99, 235, 0.04)",
        borderRadius: "12px",
        border: "1px dashed rgba(37, 99, 235, 0.2)",
        width: "100%",
        fontFamily: appTheme.font.family,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 650, color: "#1E3A8A", fontSize: "15px", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <CalendarOutlined style={{ color: "#2563EB" }} /> LỊCH HẸN PHỎNG VẤN
          </div>
          <div style={{ marginBottom: 6, fontSize: "14px" }}>
            <Text strong style={{ color: "#334155" }}>Thời gian: </Text>
            <Text style={{ color: "#0F172A", fontWeight: 600 }}>{dateStr}</Text>
          </div>
          <div style={{ marginBottom: 6, fontSize: "14px" }}>
            <Text strong style={{ color: "#334155" }}>Hình thức: </Text>
            <Tag color={schedule.format === "Online" ? "blue" : "purple"} style={{ fontWeight: 600 }}>
              {schedule.format === "Online" ? "Phỏng vấn Online" : "Trực tiếp tại văn phòng"}
            </Tag>
          </div>
          {schedule.format === "Offline" && (
            <div style={{ marginBottom: 6, fontSize: "14px" }}>
              <Text strong style={{ color: "#334155" }}>Địa điểm: </Text>
              <Text style={{ color: "#0F172A" }}>{schedule.locationOrLink}</Text>
            </div>
          )}
          {schedule.meetingId && (
            <div style={{ marginBottom: 6, fontSize: "14px" }}>
              <Text strong style={{ color: "#334155" }}>Meeting ID: </Text>
              <Text code>{schedule.meetingId}</Text>
              {schedule.passcode && (
                <>
                  <Text strong style={{ color: "#334155", marginLeft: 12 }}>Mật mã: </Text>
                  <Text code>{schedule.passcode}</Text>
                </>
              )}
            </div>
          )}
          {schedule.notes && (
            <div style={{ marginTop: 10, padding: "8px 12px", background: "#FFFFFF", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: "13px" }}>
              <Text type="secondary" style={{ fontStyle: "italic" }}><InfoCircleOutlined style={{ marginRight: 4 }} /> HR dặn dò: {schedule.notes}</Text>
            </div>
          )}
        </div>

        {schedule.format === "Online" && (
          <Button
            type="primary"
            icon={<VideoCameraOutlined />}
            href={schedule.locationOrLink.startsWith("http") ? schedule.locationOrLink : `https://${schedule.locationOrLink}`}
            target="_blank"
            style={{
              backgroundColor: "#2563EB",
              borderColor: "#2563EB",
              borderRadius: "10px",
              height: "40px",
              fontWeight: 600,
              boxShadow: "0 4px 10px rgba(37, 99, 235, 0.15)",
            }}
          >
            Tham gia trực tuyến
          </Button>
        )}
      </div>
    </div>
  );
};

export default function ApplicationStatusPage() {
  const {
    applications,
    loading,
    isDetailModalOpen,
    setIsDetailModalOpen,
    selectedApp,
    setSelectedApp,
    searchText,
    setSearchText,
    statusFilter,
    setStatusFilter,
    isAiReady,
    isAiError,
    handleViewDetail,
    parsed,
  } = useApplicationStatus();

  const handleExportPDF = () => {
    const element = document.getElementById("ai-report-printable-area");
    if (!element) {
      message.error("Không tìm thấy vùng báo cáo để xuất!");
      return;
    }
    const hideMessage = message.loading("Đang khởi tạo tệp PDF báo cáo AI...", 0);
    element.style.display = "block";
    const opt = {
      margin: [15, 15, 15, 15] as [number, number, number, number],
      filename: `BaoCao_AI_${selectedApp?.jobTitle || "UngVien"}.pdf`,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const }
    };
    html2pdf().set(opt).from(element).save().then(() => {
      element.style.display = "none";
      hideMessage();
      message.success("Xuất báo cáo PDF thành công!");
    }).catch((err: any) => {
      console.error(err);
      element.style.display = "none";
      hideMessage();
      message.error("Có lỗi xảy ra khi xuất PDF!");
    });
  };

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const navigate = useNavigate();

  const getApplicationStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case "applied":
        return { text: "Đã gửi hồ sơ (Chờ duyệt)", color: "#2563EB", bg: "rgba(37, 99, 235, 0.06)", border: "1px solid rgba(37, 99, 235, 0.12)" };
      case "reviewed":
        return { text: "HR đang xem xét", color: "#8B5CF6", bg: "rgba(139, 92, 246, 0.06)", border: "1px solid rgba(139, 92, 246, 0.12)" };
      case "shortlisted":
        return { text: "Hồ sơ đạt yêu cầu", color: "#06B6D4", bg: "rgba(6, 182, 212, 0.06)", border: "1px solid rgba(6, 182, 212, 0.12)" };
      case "interviewing":
        return { text: "Được chọn phỏng vấn", color: "#F59E0B", bg: "rgba(245, 158, 11, 0.06)", border: "1px solid rgba(245, 158, 11, 0.12)" };
      case "accepted":
        return { text: "Đã nhận việc 🎉", color: "#10B981", bg: "rgba(16, 185, 129, 0.06)", border: "1px solid rgba(16, 185, 129, 0.12)" };
      case "rejected":
        return { text: "Chưa phù hợp", color: "#EF4444", bg: "rgba(239, 68, 68, 0.06)", border: "1px solid rgba(239, 68, 68, 0.12)" };
      default:
        return { text: status || "Đã gửi hồ sơ", color: "#2563EB", bg: "rgba(37, 99, 235, 0.06)", border: "1px solid rgba(37, 99, 235, 0.12)" };
    }
  };

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchText, statusFilter]);

  const getScoreColor = (score: number) => {
    if (score >= 75) return appTheme.colors.success;
    if (score >= 50) return appTheme.colors.warning;
    return appTheme.colors.error;
  };

  // Helper selectors for summary stats
  const totalAppsCount = applications.length;
  const readyApps = applications.filter((app) => isAiReady(app));
  const avgScore = readyApps.length
    ? Math.round(readyApps.reduce((acc, app) => acc + (app.aiScore || 0), 0) / readyApps.length)
    : 0;
  const processingCount = applications.filter(
    (app) => !isAiReady(app) && !isAiError(app)
  ).length;

  const filteredApplications = applications.filter((application) => {
    const keyword = searchText.trim().toLowerCase();
    const jobTitle = application?.jobTitle?.toLowerCase() || "";
    const matchesSearch = keyword.length === 0 || jobTitle.includes(keyword);
    let matchesStatus = true;

    if (statusFilter === "processing") {
      matchesStatus = isAiReady(application) === false && isAiError(application) === false;
    }
    if (statusFilter === "completed") {
      matchesStatus = isAiReady(application) === true;
    }
    if (statusFilter === "failed") {
      matchesStatus = isAiError(application) === true;
    }
    return matchesSearch && matchesStatus;
  });

  const paginatedApplications = filteredApplications.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const totalPages = Math.ceil(filteredApplications.length / pageSize);

  const customStyles = `
    .app-card {
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      border: 1px solid #E2E8F0;
      cursor: pointer;
    }
    .app-card:hover {
      transform: translateY(-2px);
      border-color: #2563EB;
      box-shadow: 0 12px 30px rgba(37, 99, 235, 0.08);
    }
    .app-card-btn {
      transition: all 0.2s ease;
    }
    .app-card-btn:hover {
      background: #1D4ED8 !important;
      border-color: #1D4ED8 !important;
    }
    .app-card-btn:active {
      transform: scale(0.96);
    }
    .stat-card {
      transition: all 0.25s ease;
    }
    .stat-card:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 24px rgba(148, 163, 184, 0.12);
    }
    .pagination-btn {
      transition: all 0.2s ease;
      border-radius: 10px;
      border: 1px solid #E2E8F0;
      background: #FFFFFF;
      color: #64748B;
      cursor: pointer;
      padding: 8px 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
      font-size: 14px;
    }
    .pagination-btn:hover:not(:disabled) {
      border-color: #2563EB;
      color: #2563EB;
    }
    .pagination-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    @media (max-width: 768px) {
      .app-card {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 20px !important;
      }
      .app-card > div {
        width: 100% !important;
      }
      .app-card-actions {
        justify-content: space-between !important;
        border-top: 1px solid #F1F5F9;
        padding-top: 16px;
        margin-top: 4px;
      }
    }
  `;

  if (isDetailModalOpen) {
    return (
      <PageContainer title="" subtitle="">
        <style dangerouslySetInnerHTML={{ __html: customStyles }} />
        <div
          style={{
            background: "#F8FAFC",
            margin: "-24px",
            padding: "40px 40px 80px",
            minHeight: "calc(100vh - 80px)",
            fontFamily: appTheme.font.family,
          }}
        >
          <div style={{ maxWidth: 1300, margin: "0 auto" }}>
            <div style={{ marginBottom: 32 }}>
              <Title level={2} style={{ marginBottom: 8, color: "#0F172A", fontWeight: 700 }}>
                Báo cáo phân tích chi tiết từ AI
              </Title>
              <Text type="secondary" style={{ fontSize: 16 }}>
                Phân tích năng lực, tối ưu hóa STAR, ngôn từ chân thực và gợi ý phỏng vấn chuyên sâu cho hồ sơ ứng tuyển của bạn.
              </Text>
            </div>
            
            <Card 
              style={{ 
                borderRadius: 16, 
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)", 
                marginBottom: 24,
                background: "rgba(255, 255, 255, 0.85)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(226, 232, 240, 0.8)",
              }}
              bodyStyle={{ padding: "24px" }}
            >
              <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <Button
                  type="primary"
                  ghost
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    setSelectedApp(null);
                  }}
                  style={{ borderRadius: 8 }}
                >
                  ← Quay lại danh sách hồ sơ ứng tuyển
                </Button>
                {parsed && (
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleExportPDF}
                    style={{ borderRadius: 8, fontWeight: 600, background: appTheme.colors.primary, borderColor: appTheme.colors.primary }}
                  >
                    Xuất báo cáo PDF
                  </Button>
                )}
              </div>
              {parsed ? (
                <>
                  <AiDetailedTabs parsedAnalysis={parsed} />

                  {/* Printable Area for PDF Export */}
                  <div id="ai-report-printable-area" style={{ display: "none", padding: "24px", background: "#FFFFFF", color: "#0F172A", fontFamily: appTheme.font.family }}>
                    <div style={{ textAlign: "center", marginBottom: "30px", borderBottom: "2px solid #2563EB", paddingBottom: "16px" }}>
                      <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#1E3A8A", margin: "0 0 8px" }}>
                        BÁO CÁO PHÂN TÍCH HỒ SƠ TUYỂN DỤNG CÁ NHÂN (AI)
                      </h1>
                      <p style={{ color: "#64748B", fontSize: "14px", margin: 0 }}>
                        Hệ thống AI Recruitment Screening & Recommendation - {new Date().toLocaleDateString("vi-VN")}
                      </p>
                    </div>

                    <div style={{ marginBottom: "24px", background: "#F8FAFC", padding: "16px 20px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                      <h3 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 700, color: "#0F172A" }}>THÔNG TIN HỒ SƠ</h3>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px", fontSize: "14px" }}>
                        <div><strong>Vị trí ứng tuyển:</strong> {selectedApp?.jobTitle}</div>
                        <div><strong>Điểm tương hợp AI:</strong> <span style={{ color: "#2563EB", fontWeight: 700 }}>{selectedApp?.aiScore} / 100</span></div>
                        <div><strong>Phân loại:</strong> {selectedApp?.classification || "Chờ xử lý"}</div>
                        <div><strong>Thời gian nộp:</strong> {selectedApp?.appliedAt ? new Date(selectedApp.appliedAt).toLocaleDateString("vi-VN") : ""}</div>
                      </div>
                    </div>

                    <div style={{ marginTop: "24px" }}>
                      <h2 style={{ fontSize: "16px", color: "#1E3A8A", borderBottom: "1px solid #E2E8F0", paddingBottom: "6px", fontWeight: 700 }}>
                        1. NĂNG LỰC & CẢNH BÁO
                      </h2>
                      <CompetencyTab scoreAnalysis={parsed.score_analysis || {}} criteriaResults={parsed.criteria_results || []} />
                    </div>

                    <div style={{ marginTop: "34px", pageBreakBefore: "always" }}>
                      <h2 style={{ fontSize: "16px", color: "#1E3A8A", borderBottom: "1px solid #E2E8F0", paddingBottom: "6px", fontWeight: 700 }}>
                        2. TỐI ƯU HÓA (STAR)
                      </h2>
                      <StarOptimizationTab optimizationTips={parsed.optimization_tips || []} />
                    </div>

                    <div style={{ marginTop: "34px", pageBreakBefore: "always" }}>
                      <h2 style={{ fontSize: "16px", color: "#1E3A8A", borderBottom: "1px solid #E2E8F0", paddingBottom: "6px", fontWeight: 700 }}>
                        3. NGÔN TỪ & CHÂN THỰC
                      </h2>
                      <LanguageReviewTab languageReview={parsed.language_review || {}} />
                    </div>

                    <div style={{ marginTop: "34px", pageBreakBefore: "always" }}>
                      <h2 style={{ fontSize: "16px", color: "#1E3A8A", borderBottom: "1px solid #E2E8F0", paddingBottom: "6px", fontWeight: 700 }}>
                        4. GỢI Ý PHỎNG VẤN
                      </h2>
                      <InterviewQuestionsTab interviewQuestions={parsed.mock_interview || []} />
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                  <Spin tip="Đang đọc kết quả đánh giá hồ sơ..." />
                </div>
              )}
            </Card>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="" subtitle="">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <div
        style={{
          background: "#F8FAFC",
          margin: "-24px",
          padding: "40px 40px 80px",
          minHeight: "calc(100vh - 80px)",
          fontFamily: appTheme.font.family,
        }}
      >
        <div style={{ maxWidth: 1300, margin: "0 auto" }}>
          {/* Header Title Section */}
          <div style={{ marginBottom: 32 }}>
            <Title level={2} style={{ marginBottom: 8, color: "#0F172A", fontWeight: 700 }}>
              Lịch sử ứng tuyển
            </Title>
            <Text type="secondary" style={{ fontSize: 16 }}>
              Theo dõi tiến trình hồ sơ của bạn và xem lại phân tích chuyên sâu từ hệ thống AI.
            </Text>
          </div>

        {/* Stats Grid Dashboard */}
        <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
          <Col xs={24} sm={8}>
            <Card
              className="stat-card"
              style={{
                background: "rgba(255, 255, 255, 0.85)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(226, 232, 240, 0.8)",
                borderRadius: "16px",
                boxShadow: "0 8px 32px 0 rgba(148, 163, 184, 0.04)",
              }}
              bodyStyle={{ padding: "20px 24px" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: "rgba(37, 99, 235, 0.08)",
                    color: appTheme.colors.primary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                  }}
                >
                  <AppstoreOutlined />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 2 }}>
                    TỔNG HỒ SƠ ĐÃ NỘP
                  </Text>
                  <span style={{ fontSize: 26, fontWeight: 700, color: "#0F172A" }}>
                    {totalAppsCount}
                  </span>
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card
              className="stat-card"
              style={{
                background: "rgba(255, 255, 255, 0.85)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(226, 232, 240, 0.8)",
                borderRadius: "16px",
                boxShadow: "0 8px 32px 0 rgba(148, 163, 184, 0.04)",
              }}
              bodyStyle={{ padding: "20px 24px" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: "rgba(22, 163, 74, 0.08)",
                    color: appTheme.colors.success,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                  }}
                >
                  <TrophyOutlined />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 2 }}>
                    ĐIỂM TƯƠNG HỢP TRUNG BÌNH
                  </Text>
                  <span style={{ fontSize: 26, fontWeight: 700, color: "#0F172A" }}>
                    {avgScore > 0 ? `${avgScore}%` : "Chưa có"}
                  </span>
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card
              className="stat-card"
              style={{
                background: "rgba(255, 255, 255, 0.85)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(226, 232, 240, 0.8)",
                borderRadius: "16px",
                boxShadow: "0 8px 32px 0 rgba(148, 163, 184, 0.04)",
              }}
              bodyStyle={{ padding: "20px 24px" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: "rgba(245, 158, 11, 0.08)",
                    color: appTheme.colors.warning,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                  }}
                >
                  <AiCoreIcon size={24} style={{ filter: "brightness(0.9)" }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 2 }}>
                    HỒ SƠ ĐANG ĐỐI SÁNH
                  </Text>
                  <span style={{ fontSize: 26, fontWeight: 700, color: "#0F172A" }}>
                    {processingCount}
                  </span>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Filter & Search Panel */}
        <Card
          style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 8px 24px rgba(148, 163, 184, 0.04)",
            marginBottom: 24,
          }}
          bodyStyle={{ padding: 24 }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={16}>
              <Input
                size="large"
                allowClear
                prefix={<SearchOutlined style={{ color: "#94A3B8", marginRight: 4 }} />}
                placeholder="Tìm kiếm vị trí ứng tuyển công việc..."
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                style={{ height: 48, borderRadius: 12, border: "1px solid #CBD5E1" }}
              />
            </Col>
            <Col xs={24} md={8}>
              <Select
                size="large"
                value={statusFilter}
                onChange={(value) => setStatusFilter(value)}
                style={{ width: "100%", height: 48 }}
                dropdownStyle={{ borderRadius: 12 }}
                options={[
                  { value: "all", label: "Tất cả trạng thái AI" },
                  { value: "processing", label: "AI đang phân tích" },
                  { value: "completed", label: "AI đã hoàn tất" },
                  { value: "failed", label: "AI lỗi phân tích" },
                ]}
              />
            </Col>
          </Row>
        </Card>

        {/* Applications List Area */}
        <div style={{ minHeight: 300, position: "relative" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <Spin indicator={<LoadingOutlined style={{ fontSize: 36, color: appTheme.colors.primary }} spin />} />
              <div style={{ marginTop: 16, color: "#64748B", fontWeight: 500 }}>Đang tải danh sách ứng tuyển...</div>
            </div>
          ) : filteredApplications.length === 0 ? (
            <Card
              style={{
                borderRadius: "16px",
                border: "1px solid #E2E8F0",
                textAlign: "center",
                background: "#FFFFFF",
              }}
              bodyStyle={{ padding: "64px 32px" }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: "#F8FAFC",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                  fontSize: 32,
                  color: "#94A3B8",
                }}
              >
                <InfoCircleOutlined />
              </div>
              <Title level={4} style={{ color: "#0F172A", marginBottom: 8, fontWeight: 600 }}>
                Không tìm thấy hồ sơ ứng tuyển
              </Title>
              <Text type="secondary" style={{ fontSize: 15, maxWidth: 420, display: "inline-block" }}>
                {searchText || statusFilter !== "all"
                  ? "Không tìm thấy công việc phù hợp với tiêu chuẩn lọc của bạn. Hãy thử thay đổi từ khóa."
                  : "Bạn chưa nộp CV ứng tuyển vào vị trí công việc nào."}
              </Text>
            </Card>
          ) : (
            <div>
              {paginatedApplications.map((record: any) => {
                const recordId = record.id || record.applicationId;
                const ready = isAiReady(record);
                const error = isAiError(record);

                return (
                  <div
                    key={recordId}
                    className="app-card"
                    style={{
                      background: "#FFFFFF",
                      borderRadius: "16px",
                      padding: "24px",
                      marginBottom: "16px",
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Brand border strip */}
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: "5px",
                        background: error
                          ? appTheme.colors.error
                          : ready
                          ? appTheme.colors.success
                          : appTheme.colors.primary,
                      }}
                    />

                    {/* Left & Center Information block */}
                    <div
                      style={{
                        display: "flex",
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 20,
                        paddingLeft: 8,
                      }}
                    >
                      {/* Icon */}
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "12px",
                          background: error
                            ? "rgba(220, 38, 38, 0.06)"
                            : ready
                            ? "rgba(22, 163, 74, 0.06)"
                            : "rgba(37, 99, 235, 0.06)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "20px",
                          color: error
                            ? appTheme.colors.error
                            : ready
                            ? appTheme.colors.success
                            : appTheme.colors.primary,
                        }}
                      >
                        {error ? (
                          <AiCoreIcon size={20} />
                        ) : ready ? (
                          <FileDoneOutlined />
                        ) : (
                          <LoadingOutlined spin />
                        )}
                      </div>

                      {/* Main info text */}
                      <div style={{ flex: 1 }}>
                        <Text
                          strong
                          style={{
                            fontSize: "17px",
                            color: "#0F172A",
                            display: "block",
                            marginBottom: 4,
                            fontWeight: 650,
                          }}
                        >
                          {record.jobTitle || "Chưa cập nhật vị trí"}
                        </Text>
                        <Button
                          type="link"
                          size="small"
                          onClick={() => navigate(`/jobs/${record.jobId}`)}
                          style={{ padding: 0, height: "auto", display: "block", marginBottom: 12, textAlign: "left", fontSize: "14px" }}
                        >
                          Xem chi tiết tin tuyển dụng
                        </Button>
                        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                          <Text
                            type="secondary"
                            style={{ fontSize: "14px", display: "flex", alignItems: "center", gap: 6 }}
                          >
                            <ClockCircleOutlined />
                            Đã nộp:{" "}
                            {record.appliedAt
                              ? new Date(record.appliedAt).toLocaleDateString("vi-VN")
                              : "Chưa có thời gian"}
                          </Text>

                          {/* HR status pill tag */}
                          {(() => {
                            const statusInfo = getApplicationStatusLabel(record.status);
                            return (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  padding: "4px 10px",
                                  borderRadius: "8px",
                                  fontSize: "13px",
                                  fontWeight: 550,
                                  background: statusInfo.bg,
                                  color: statusInfo.color,
                                  border: statusInfo.border,
                                }}
                              >
                                {statusInfo.text}
                              </span>
                            );
                          })()}

                          {/* Status pill tag */}
                          {error ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "4px 10px",
                                borderRadius: "8px",
                                fontSize: "13px",
                                fontWeight: 550,
                                background: "rgba(220, 38, 38, 0.06)",
                                color: appTheme.colors.error,
                                border: "1px solid rgba(220, 38, 38, 0.12)",
                              }}
                            >
                              <InfoCircleOutlined />
                              AI gặp lỗi
                            </span>
                          ) : ready ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "4px 10px",
                                borderRadius: "8px",
                                fontSize: "13px",
                                fontWeight: 550,
                                background: "rgba(22, 163, 74, 0.06)",
                                color: appTheme.colors.success,
                                border: "1px solid rgba(22, 163, 74, 0.12)",
                              }}
                            >
                              <FileDoneOutlined />
                              AI đã hoàn tất
                            </span>
                          ) : (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "4px 10px",
                                borderRadius: "8px",
                                fontSize: "13px",
                                fontWeight: 550,
                                background: "rgba(37, 99, 235, 0.06)",
                                color: appTheme.colors.primary,
                                border: "1px solid rgba(37, 99, 235, 0.12)",
                              }}
                            >
                              <LoadingOutlined spin />
                              AI đang đối sánh...
                            </span>
                          )}
                        </div>
                        {record.status?.toLowerCase() === "interview" && (
                          <InterviewScheduleWidget applicationId={recordId} />
                        )}

                        <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #F1F5F9" }}>
                          <Steps
                            size="small"
                            current={(() => {
                              const st = record.status?.toLowerCase();
                              if (st === "offer" || st === "accepted") return 3;
                              if (st === "interview" || st === "interviewing" || st === "interview") return 2;
                              if (st === "reviewed" || st === "reviewing" || st === "shortlisted") return 1;
                              if (st === "rejected") {
                                // Nếu có lịch phỏng vấn, chứng tỏ bị loại sau vòng phỏng vấn (bước 2)
                                if (record.interviewSchedule || record.status === "Interview") return 2;
                                return 1; // Ngược lại bị loại từ vòng lọc hồ sơ
                              }
                              return 0;
                            })()}
                            status={record.status?.toLowerCase() === "rejected" ? "error" : "process"}
                            items={[
                              { title: "Nộp hồ sơ" },
                              { title: "Lọc AI & HR" },
                              { title: "Phỏng vấn" },
                              { title: "Nhận việc" },
                            ]}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right column - Score & Action Button */}
                    <div
                      className="app-card-actions"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 28,
                        flexDirection: "row",
                      }}
                    >
                      {/* Score Indicator */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 100 }}>
                        {error ? (
                          <Text type="secondary" style={{ fontSize: "13px" }}>
                            Bị gián đoạn
                          </Text>
                        ) : !ready ? (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                            <Spin size="small" indicator={<LoadingOutlined style={{ fontSize: 16 }} spin />} />
                            <Text type="secondary" style={{ fontSize: "12px", textAlign: "center" }}>
                              Đang tính...
                            </Text>
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <span
                              style={{
                                fontSize: "28px",
                                fontWeight: 800,
                                color: getScoreColor(record.aiScore),
                                lineHeight: 1.1,
                              }}
                            >
                              {Math.round(record.aiScore)}
                            </span>
                            <Text
                              type="secondary"
                              style={{ fontSize: "12px", marginTop: 4, fontWeight: 500, color: "#64748B" }}
                            >
                              Điểm tương hợp
                            </Text>
                          </div>
                        )}
                      </div>

                      {/* Action CTA */}
                      <Button
                        type="primary"
                        className="app-card-btn"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewDetail(record)}
                        style={{
                          height: 44,
                          borderRadius: "12px",
                          fontWeight: 600,
                          padding: "0 22px",
                          background: appTheme.colors.primary,
                          borderColor: appTheme.colors.primary,
                          boxShadow: "0 4px 12px rgba(37, 99, 235, 0.12)",
                        }}
                      >
                        {ready ? "Xem AI đánh giá" : "Theo dõi AI"}
                      </Button>
                    </div>
                  </div>
                );
              })}

              {/* Custom SaaS Pagination Controls */}
              {totalPages > 1 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 32,
                    flexWrap: "wrap",
                    gap: 16,
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 14 }}>
                    Hiển thị từ{" "}
                    <strong>{Math.min(filteredApplications.length, (currentPage - 1) * pageSize + 1)}</strong> tới{" "}
                    <strong>{Math.min(filteredApplications.length, currentPage * pageSize)}</strong> trong số{" "}
                    <strong>{filteredApplications.length}</strong> hồ sơ đã nộp CV
                  </Text>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="pagination-btn"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Trang trước
                    </button>
                    {Array.from({ length: totalPages }).map((_, idx) => (
                      <button
                        key={idx}
                        className="pagination-btn"
                        style={{
                          borderColor: currentPage === idx + 1 ? appTheme.colors.primary : "#E2E8F0",
                          color: currentPage === idx + 1 ? appTheme.colors.primary : "#64748B",
                          backgroundColor:
                            currentPage === idx + 1 ? "rgba(37, 99, 235, 0.05)" : "#FFFFFF",
                          fontWeight: currentPage === idx + 1 ? 650 : 500,
                        }}
                        onClick={() => setCurrentPage(idx + 1)}
                      >
                        {idx + 1}
                      </button>
                    ))}
                    <button
                      className="pagination-btn"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Trang sau
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      </div>

    </PageContainer>
  );
}

