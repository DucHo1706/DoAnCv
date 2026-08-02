import {
  SkillMatchedIcon,
  SkillMissingIcon,
} from "../../../../components/common/AppIcons";
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Progress,
  Row,
  Space,
  Spin,
  Tag,
  Timeline,
  Typography,
  Skeleton,
} from "antd";
import PageContainer from "../../../../components/common/PageContainer";
import AiDetailedTabs from "../../../../components/ai-report/AiDetailedTabs";
import CompetencyTab from "../../../../components/ai-report/CompetencyTab";
import StarOptimizationTab from "../../../../components/ai-report/StarOptimizationTab";
import LanguageReviewTab from "../../../../components/ai-report/LanguageReviewTab";
import { appTheme } from "../../../../constants/theme";
import AiCoreIcon from "../../../../components/common/AiCoreIcon";
import { useCandidateDetail } from "./hooks/useCandidateDetail";
import { ArrowLeftOutlined, DownloadOutlined } from "@ant-design/icons";

const { Text, Paragraph } = Typography;

export default function CandidateDetailPage() {
  const {
    navigate,
    candidate,
    loading,
    reEvaluating,
    evalProgress,
    evalStatusText,
    parsed,
    handleExportPDF,
    handleReEvaluate,
  } = useCandidateDetail();

  if (loading) {
    return (
      <PageContainer title="Chi tiết ứng viên">
        <Card style={{ borderRadius: 16, border: "1px solid #E2E8F0", padding: 24 }}>
          <Skeleton active paragraph={{ rows: 10 }} />
        </Card>
      </PageContainer>
    );
  }

  if (!candidate) {
    return (
      <PageContainer title="Không tìm thấy hồ sơ">
        <div style={{ textAlign: "center", padding: "100px 0" }}>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Không tìm thấy hồ sơ ứng viên này hoặc bạn không có quyền truy cập.
          </Text>
          <div style={{ marginTop: 20 }}>
            <Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
              Quay lại
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={candidate.candidateName}
      subtitle={`Hồ sơ chi tiết cho vị trí ${candidate.jobTitle}`}
      extra={
        <Space size="middle">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            style={{
              borderRadius: 10,
              fontFamily: appTheme.font.family,
            }}
          >
            Quay lại
          </Button>
          <Button
            type="primary"
            ghost
            icon={<AiCoreIcon size={16} style={{ verticalAlign: "middle" }} />}
            loading={reEvaluating}
            onClick={handleReEvaluate}
            style={{
              borderColor: appTheme.colors.primary,
              color: appTheme.colors.primary,
              borderRadius: 10,
              fontWeight: 600,
              fontFamily: appTheme.font.family,
            }}
          >
            Yêu cầu AI phân tích lại
          </Button>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            href={candidate.cvUrl ? candidate.cvUrl.replace(/https?:\/\/localhost:(7006|5286)/gi, window.location.origin) : "#"}
            target="_blank"
            style={{
              background: appTheme.colors.primary,
              borderColor: appTheme.colors.primary,
              borderRadius: 10,
              fontWeight: 600,
              fontFamily: appTheme.font.family,
            }}
          >
            Xem File CV
          </Button>
        </Space>
      }
    >
      <Row gutter={[20, 20]}>
        {/* ======= CỘT TRÁI: THÔNG TIN + BÁO CÁO AI ======= */}
        <Col xs={24} xl={15}>
          <Card
            title={
              <span style={{ fontFamily: appTheme.font.family, fontWeight: 700, fontSize: 16 }}>
                Thông tin cơ bản
              </span>
            }
            style={{
              borderRadius: 16,
              border: `1px solid ${appTheme.colors.border}`,
              background: appTheme.colors.surface,
              boxShadow: appTheme.shadow.card,
              marginBottom: 20,
            }}
            bodyStyle={{ padding: 24 }}
          >
            <Descriptions column={2} bordered style={{ fontFamily: appTheme.font.family }}>
              <Descriptions.Item label="Email">
                <Text style={{ color: appTheme.colors.textPrimary }}>{candidate.email}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                <Text style={{ color: appTheme.colors.textPrimary }}>{candidate.phone || "Chưa cập nhật"}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Vị trí ứng tuyển">
                <Text strong style={{ color: appTheme.colors.primary }}>{candidate.jobTitle}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {(() => {
                  let color = "#64748B";
                  let bg = "#F1F5F9";
                  let border = "#E2E8F0";
                  const classification = candidate.classification;
                  if (classification) {
                    if (classification.includes("Phù hợp cao") || classification === "Phù hợp") {
                      color = appTheme.colors.success;
                      bg = "#F0FDF4";
                      border = "#BBF7D0";
                    } else if (classification.includes("Nên xem xét")) {
                      color = appTheme.colors.warning;
                      bg = "#FFFBEB";
                      border = "#FDE68A";
                    } else {
                      color = appTheme.colors.error;
                      bg = "#FEF2F2";
                      border = "#FECACA";
                    }
                  }
                  return (
                    <Tag
                      style={{
                        background: bg,
                        color: color,
                        border: `1px solid ${border}`,
                        borderRadius: 6,
                        padding: "3px 10px",
                        fontWeight: 600,
                      }}
                    >
                      {classification || "Đã nhận CV"}
                    </Tag>
                  );
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="Fit Score" span={2}>
                {(() => {
                  let color = appTheme.colors.error;
                  let bg = "#FEF2F2";
                  let border = "#FECACA";
                  const score = candidate.aiScore;
                  if (score >= 75) {
                    color = appTheme.colors.success;
                    bg = "#F0FDF4";
                    border = "#BBF7D0";
                  } else if (score >= 50) {
                    color = appTheme.colors.warning;
                    bg = "#FFFBEB";
                    border = "#FDE68A";
                  }
                  return (
                    <Tag
                      style={{
                        background: bg,
                        color: color,
                        border: `1px solid ${border}`,
                        fontWeight: 700,
                        borderRadius: 6,
                        padding: "3px 10px",
                      }}
                    >
                      {score} / 100
                    </Tag>
                  );
                })()}
              </Descriptions.Item>
            </Descriptions>

            {reEvaluating && evalProgress !== null && (
              <Card
                style={{
                  marginTop: 20,
                  borderRadius: 14,
                  background: "#EFF6FF",
                  border: "1px solid #BFDBFE",
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.08)"
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 650, color: "#1E40AF", display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <AiCoreIcon spin size={16} /> Tiến trình phân tích AI thời gian thực (Real-time)
                    </span>
                    <span style={{ fontWeight: 700, color: "#2563EB" }}>{evalProgress}%</span>
                  </div>
                  <Progress percent={evalProgress} strokeColor="#2563EB" status="active" showInfo={false} />
                  <Text style={{ fontSize: 13, color: "#475569", fontStyle: "italic" }}>
                    {evalStatusText || "Đang xử lý hồ sơ..."}
                  </Text>
                </div>
              </Card>
            )}

            {!parsed && !reEvaluating && (
              <div style={{ marginTop: 20 }}>
                <Alert
                  message="Báo cáo AI chưa được nâng cấp"
                  description={
                    <div>
                      <Paragraph style={{ marginBottom: 12, color: "#475569", fontFamily: appTheme.font.family }}>
                        Hồ sơ này được AI chấm bằng phiên bản cũ, chỉ có nhận xét tổng quát. Bấm nút
                        bên dưới để AI phân tích lại đầy đủ với 4 báo cáo chi tiết.
                      </Paragraph>
                      <Paragraph
                        style={{
                          padding: 14,
                          background: "#f8fafc",
                          borderRadius: 8,
                          border: "1px solid #e2e8f0",
                          color: "#334155",
                          marginBottom: 16,
                          fontFamily: appTheme.font.family,
                        }}
                      >
                        <Text
                          strong
                          style={{ display: "block", marginBottom: 6, color: "#0f172a" }}
                        >
                          Nhận xét AI:
                        </Text>
                        {(() => {
                          try {
                            const raw = String(candidate.aiReason);
                            const braceIdx = raw.indexOf("{");
                            const prefix = braceIdx > 0 ? raw.substring(0, braceIdx) : "";
                            const jsonStr = braceIdx >= 0 ? raw.substring(braceIdx) : raw;
                            const parsedData = JSON.parse(jsonStr);
                            return (
                              <span>
                                {prefix && (
                                  <span>
                                    {prefix}
                                    <br />
                                  </span>
                                )}
                                {parsedData.score_analysis?.summary && (
                                  <Paragraph style={{ marginBottom: 8, fontStyle: "italic" }}>
                                    "{parsedData.score_analysis.summary}"
                                  </Paragraph>
                                )}
                                {parsedData.score_analysis?.matched_skills?.length > 0 && (
                                  <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
                                    <SkillMatchedIcon size={14} />
                                    <Text strong style={{ color: "#0F172A", marginRight: 6 }}>Kỹ năng khớp:</Text>
                                    <Text>{parsedData.score_analysis.matched_skills.join(", ")}</Text>
                                  </div>
                                )}
                                {parsedData.score_analysis?.missing_skills?.length > 0 && (
                                  <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
                                    <SkillMissingIcon size={14} />
                                    <Text strong style={{ color: "#0F172A", marginRight: 6 }}>Kỹ năng thiếu:</Text>
                                    <Text>{parsedData.score_analysis.missing_skills.join(", ")}</Text>
                                  </div>
                                )}
                                {parsedData.score_analysis?.total_score && (
                                  <div style={{ display: "flex", alignItems: "center" }}>
                                    <Text strong style={{ color: "#2563EB", marginRight: 6 }}>Điểm tổng quan AI:</Text>
                                    <Tag color="blue" style={{ fontWeight: 700 }}>{parsedData.score_analysis.total_score} / 100</Tag>
                                  </div>
                                )}
                              </span>
                            );
                          } catch {
                            return (
                              <Text
                                style={{
                                  whiteSpace: "pre-wrap",
                                  wordBreak: "break-word",
                                  fontSize: 13,
                                }}
                              >
                                {String(candidate.aiReason).substring(0, 500)}
                              </Text>
                            );
                          }
                        })()}
                      </Paragraph>
                      <Button
                        type="primary"
                        size="large"
                        icon={<AiCoreIcon size={16} style={{ filter: "brightness(0) invert(1)", verticalAlign: "middle" }} />}
                        loading={reEvaluating}
                        onClick={handleReEvaluate}
                        style={{
                          background: appTheme.colors.primary,
                          borderColor: appTheme.colors.primary,
                          borderRadius: 12,
                          fontWeight: 600,
                          height: 44,
                          padding: "0 28px",
                          boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)",
                          fontFamily: appTheme.font.family,
                        }}
                      >
                        🚀 Nâng cấp báo cáo AI chi tiết ngay
                      </Button>
                    </div>
                  }
                  type="warning"
                  showIcon
                  style={{ borderRadius: 12 }}
                />
              </div>
            )}
          </Card>

          {parsed && (
            <>
              <Card
                title={
                  <span style={{ display: "inline-flex", alignItems: "center", fontWeight: 700, fontFamily: appTheme.font.family, fontSize: 16 }}>
                    <AiCoreIcon size={18} style={{ marginRight: 8 }} />
                    Báo cáo Phân tích chi tiết từ AI
                  </span>
                }
                extra={
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleExportPDF}
                    style={{ borderRadius: 10, fontWeight: 600, background: appTheme.colors.primary, borderColor: appTheme.colors.primary }}
                  >
                    Xuất báo cáo PDF
                  </Button>
                }
                style={{
                  borderRadius: 16,
                  border: `1px solid ${appTheme.colors.border}`,
                  boxShadow: appTheme.shadow.card,
                  background: appTheme.colors.surface,
                }}
                bodyStyle={{ padding: "20px 24px" }}
              >
                <AiDetailedTabs
                  parsedAnalysis={parsed}
                  showLearningPath={false}
                />
              </Card>

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
                    <div><strong>Ứng viên:</strong> {candidate.candidateName}</div>
                    <div><strong>Email:</strong> {candidate.email}</div>
                    <div><strong>Vị trí ứng tuyển:</strong> {candidate.jobTitle}</div>
                    <div><strong>Điểm tương hợp AI:</strong> <span style={{ color: "#2563EB", fontWeight: 700 }}>{candidate.aiScore} / 100</span></div>
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

              </div>
            </>
          )}
        </Col>

        {/* ======= SIDEBAR BÊN PHẢI: TIẾN TRÌNH XỬ LÝ ======= */}
        <Col xs={24} xl={9}>
          <Card
            title={
              <span style={{ fontFamily: appTheme.font.family, fontWeight: 700, fontSize: 16 }}>
                Mức độ phù hợp
              </span>
            }
            style={{
              borderRadius: 16,
              border: `1px solid ${appTheme.colors.border}`,
              background: appTheme.colors.surface,
              boxShadow: appTheme.shadow.card,
              marginBottom: 20,
              textAlign: "center",
            }}
            bodyStyle={{ padding: 32 }}
          >
            <Progress
              type="circle"
              percent={candidate.aiScore}
              strokeColor={
                candidate.aiScore >= 75
                  ? appTheme.colors.success
                  : candidate.aiScore >= 50
                    ? appTheme.colors.warning
                    : appTheme.colors.error
              }
              strokeWidth={7}
              trailColor="#e5e7eb"
              format={(percent) => (
                <div style={{ fontFamily: appTheme.font.family, fontWeight: 800, fontSize: 24, color: appTheme.colors.textPrimary }}>
                  {percent}
                  <span style={{ fontSize: 12, color: appTheme.colors.textSecondary, fontWeight: 500 }}>/100</span>
                </div>
              )}
            />
          </Card>

          <Card
            title={
              <Space style={{ display: "inline-flex", alignItems: "center" }}>
                <AiCoreIcon size={18} />
                <span style={{ fontFamily: appTheme.font.family, fontWeight: 700, fontSize: 16 }}>
                  Luồng xử lý hồ sơ
                </span>
              </Space>
            }
            style={{
              borderRadius: 16,
              border: `1px solid ${appTheme.colors.border}`,
              background: appTheme.colors.surface,
              boxShadow: appTheme.shadow.card,
            }}
            bodyStyle={{ padding: 24 }}
          >
            <Timeline
              style={{ fontFamily: appTheme.font.family }}
              items={[
                { color: appTheme.colors.primary, children: <Text type="secondary" style={{ fontSize: 13 }}>CV đã được tải lên hệ thống</Text> },
                { color: appTheme.colors.primary, children: <Text type="secondary" style={{ fontSize: 13 }}>Thông tin hồ sơ đã được trích xuất</Text> },
                { color: appTheme.colors.primary, children: <Text type="secondary" style={{ fontSize: 13 }}>AI đã so khớp với JD</Text> },
                { color: appTheme.colors.success, children: <Text strong style={{ fontSize: 13, color: appTheme.colors.success }}>Ứng viên đã được chấm điểm và xếp hạng</Text> },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
}
