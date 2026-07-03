import {
  ArrowLeftOutlined,
  DownloadOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Descriptions,
  Progress,
  Row,
  Space,
  Tag,
  Timeline,
  Typography,
  Spin,
  message,
  Alert,
} from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageContainer from "../../components/common/PageContainer";
import { recruitmentService } from "../../services/recruitmentService";
import RecruiterAnalysisTabs from "../../components/ai-report/RecruiterAnalysisTabs";
import { appTheme } from "../../constants/theme";

const { Text, Paragraph } = Typography;

function CandidateDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reEvaluating, setReEvaluating] = useState(false);

  const handleReEvaluate = async () => {
    if (!id) return;
    setReEvaluating(true);
    message.loading({
      content: "Đang yêu cầu AI đọc và phân tích chi tiết lại CV...",
      key: "reeval",
    });
    try {
      await recruitmentService.reEvaluateApplication(id);
      message.success({
        content: "Đã kích hoạt AI chạy lại thành công! Đang tải lại dữ liệu...",
        key: "reeval",
        duration: 2,
      });

      setTimeout(async () => {
        try {
          const data = await recruitmentService.getHrApplications();
          const apps = Array.isArray(data) ? data : (data as any)?.$values || [];
          const found = apps.find((app: any) => app.id === id);
          setCandidate(found || null);
          message.success("Đã cập nhật báo cáo AI chi tiết mới! 🎉");
        } catch {
          message.error("Lỗi khi tải lại dữ liệu mới.");
        } finally {
          setReEvaluating(false);
        }
      }, 4500);
    } catch (error: any) {
      const errMsg = error?.response?.data?.message || "Không thể yêu cầu AI phân tích lại.";
      message.error({ content: errMsg, key: "reeval" });
      setReEvaluating(false);
    }
  };

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const data = await recruitmentService.getHrApplications();
        const apps = Array.isArray(data) ? data : (data as any)?.$values || [];
        const found = apps.find((app: any) => app.id === id);
        setCandidate(found || null);
      } catch (error: any) {
        const errMsg =
          error?.response?.status === 403
            ? "Bạn không có quyền truy cập hồ sơ này (403). Vui lòng đăng nhập lại."
            : error?.response?.status === 401
              ? "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại."
              : "Lỗi khi tải chi tiết hồ sơ";
        message.error(errMsg);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const parseSkills = (jsonStr: string) => {
    if (!jsonStr) return [];
    try {
      const parsed = JSON.parse(jsonStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  // ====== HELPER PHÂN TÍCH NHANH CHO BÁO CÁO CHI TIẾT TỪ AI ======
  const getParsedAnalysis = (app: any) => {
    if (!app || !app.aiReason) return null;
    if (typeof app.aiReason === "object" && !Array.isArray(app.aiReason)) return app.aiReason;
    try {
      let reasonStr = String(app.aiReason).trim();
      const firstBrace = reasonStr.indexOf("{");
      if (firstBrace > 0) reasonStr = reasonStr.substring(firstBrace);
      if (reasonStr.startsWith("{")) {
        return JSON.parse(reasonStr);
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  if (loading) {
    return (
      <PageContainer title="Chi tiết ứng viên">
        <div style={{ textAlign: "center", padding: "100px 0" }}>
          <Spin size="large" tip="Đang tải dữ liệu hồ sơ..." />
        </div>
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

  const strengths = parseSkills(candidate.matchedSkills);
  const gaps = parseSkills(candidate.missingSkills);

  const parsed = getParsedAnalysis(candidate);
  const matchedSkillsFromParse = parsed?.score_analysis?.matched_skills ?? [];
  const missingSkillsFromParse = parsed?.score_analysis?.missing_skills ?? [];

  const finalMatchedSkills = matchedSkillsFromParse.length > 0 ? matchedSkillsFromParse : strengths;
  const finalMissingSkills = missingSkillsFromParse.length > 0 ? missingSkillsFromParse : gaps;

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
            icon={<RobotOutlined />}
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
            href={candidate.cvUrl}
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

            {!parsed && (
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
                            const parsed = JSON.parse(jsonStr);
                            return (
                              <span>
                                {prefix && (
                                  <span>
                                    {prefix}
                                    <br />
                                  </span>
                                )}
                                {parsed.score_analysis?.summary && (
                                  <Paragraph style={{ marginBottom: 8, fontStyle: "italic" }}>
                                    "{parsed.score_analysis.summary}"
                                  </Paragraph>
                                )}
                                {parsed.score_analysis?.matched_skills?.length > 0 && (
                                  <span>
                                    ✅ Kỹ năng khớp:{" "}
                                    {parsed.score_analysis.matched_skills.join(", ")}
                                    <br />
                                  </span>
                                )}
                                {parsed.score_analysis?.missing_skills?.length > 0 && (
                                  <span>
                                    ❌ Kỹ năng thiếu:{" "}
                                    {parsed.score_analysis.missing_skills.join(", ")}
                                    <br />
                                  </span>
                                )}
                                {parsed.score_analysis?.total_score && (
                                  <span>
                                    🏆 Điểm tổng quan: {parsed.score_analysis.total_score}/100
                                    <br />
                                  </span>
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
                        icon={<RobotOutlined />}
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
            <Card
              title={
                <span style={{ fontWeight: 700, fontFamily: appTheme.font.family, fontSize: 16 }}>
                  <RobotOutlined style={{ marginRight: 8, color: appTheme.colors.primary }} />
                  Báo cáo Phân tích chi tiết từ AI
                </span>
              }
              style={{
                borderRadius: 16,
                border: `1px solid ${appTheme.colors.border}`,
                boxShadow: appTheme.shadow.card,
                background: appTheme.colors.surface,
              }}
              bodyStyle={{ padding: "20px 24px" }}
            >
              <RecruiterAnalysisTabs
                parsedAnalysis={parsed}
                candidate={candidate}
                finalMatchedSkills={finalMatchedSkills}
                finalMissingSkills={finalMissingSkills}
              />
            </Card>
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
              <Space>
                <RobotOutlined style={{ color: appTheme.colors.primary }} />
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
 
export default CandidateDetailPage;
