import { EyeOutlined, TrophyOutlined, UserOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Drawer,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "../../components/common/PageContainer";
import TableToolbar from "../../components/common/TableToolbar";
import { recruitmentService } from "../../services/recruitmentService";
import type { ApplicationDto, CriteriaResultDto } from "../../services/recruitmentService";
import { jobService } from "../../services/jobService";
import type { JobDto } from "../../services/jobService";
import { appTheme } from "../../constants/theme";

const { Text, Title } = Typography;

const glassCardStyle = {
  background: "rgba(255, 255, 255, 0.85)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(226, 232, 240, 0.8)",
  boxShadow: "0 8px 32px 0 rgba(148, 163, 184, 0.08)",
  borderRadius: "16px",
};

function CVRankingPage() {
  const navigate = useNavigate();
  const [selectedCandidate, setSelectedCandidate] = useState<ApplicationDto | null>(null);
  const [applications, setApplications] = useState<ApplicationDto[]>([]);
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [appData, jobData] = await Promise.all([
          recruitmentService.getHrApplications(),
          jobService.getMyJobs(),
        ]);
        setApplications(Array.isArray(appData) ? appData : (appData as any)?.$values || []);
        setJobs(Array.isArray(jobData) ? jobData : (jobData as any)?.$values || []);
      } catch (error) {
        message.error("Lỗi khi tải dữ liệu xếp hạng");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const rankingData = useMemo(() => {
    let filtered = applications;
    if (selectedJobId) {
      filtered = filtered.filter((a) => a.jobId === selectedJobId);
    }
    return [...filtered]
      .sort((a, b) => b.aiScore - a.aiScore)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
        key: item.id,
      }));
  }, [applications, selectedJobId]);

  const parseSkills = (skillsData?: string[] | string | null): string[] => {
    if (!skillsData) {
      return [];
    }

    if (Array.isArray(skillsData)) {
      return skillsData
        .filter((skill) => typeof skill === "string")
        .map((skill) => skill.trim())
        .filter((skill) => skill.length > 0);
    }

    if (typeof skillsData === "string") {
      try {
        const parsedSkills = JSON.parse(skillsData);

        if (Array.isArray(parsedSkills)) {
          return parsedSkills
            .map((skillItem) => {
              if (typeof skillItem === "string") {
                return skillItem;
              }

              if (skillItem?.name) {
                return skillItem.name;
              }

              if (skillItem?.skillName) {
                return skillItem.skillName;
              }

              if (skillItem?.skill) {
                return skillItem.skill;
              }

              return "";
            })
            .map((skill) => skill.trim())
            .filter((skill) => skill.length > 0);
        }

        return [];
      } catch {
        return skillsData
          .split(",")
          .map((skill) => skill.trim())
          .filter((skill) => skill.length > 0);
      }
    }

    return [];
  };

  const getCriterionName = (record: CriteriaResultDto) => {
    if (record.criterionName) {
      return record.criterionName;
    }

    if (record.criterion_name) {
      return record.criterion_name;
    }
    return "Chưa có tên tiêu chí";
  };

  const getCriterionMaxScore = (record: CriteriaResultDto) => {
    if (record.maxScore !== undefined && record.maxScore !== null) {
      return record.maxScore;
    }

    if (record.max_score !== undefined && record.max_score !== null) {
      return record.max_score;
    }
    return 0;
  };

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

  const columns = [
    {
      title: "Hạng",
      dataIndex: "rank",
      key: "rank",
      render: (value: number) => {
        if (value === 1) {
          return (
            <Tag
              style={{
                background: "#FEF3C7",
                color: "#D97706",
                border: "1px solid #FDE68A",
                fontWeight: 600,
                borderRadius: 6,
                padding: "3px 8px",
                fontFamily: appTheme.font.family,
              }}
            >
              🏆 Hạng 1
            </Tag>
          );
        }
        if (value === 2) {
          return (
            <Tag
              style={{
                background: "#F1F5F9",
                color: "#475569",
                border: "1px solid #E2E8F0",
                fontWeight: 600,
                borderRadius: 6,
                padding: "3px 8px",
                fontFamily: appTheme.font.family,
              }}
            >
              🥈 Hạng 2
            </Tag>
          );
        }
        if (value === 3) {
          return (
            <Tag
              style={{
                background: "#FFEDD5",
                color: "#C2410C",
                border: "1px solid #FDBA74",
                fontWeight: 600,
                borderRadius: 6,
                padding: "3px 8px",
                fontFamily: appTheme.font.family,
              }}
            >
              🥉 Hạng 3
            </Tag>
          );
        }
        return (
          <Tag
            style={{
              background: "#F8FAFC",
              color: "#64748B",
              border: "1px solid #E2E8F0",
              borderRadius: 6,
              padding: "3px 8px",
              fontFamily: appTheme.font.family,
            }}
          >
            #{value}
          </Tag>
        );
      },
    },
    {
      title: "Ứng viên",
      dataIndex: "candidateName",
      key: "candidateName",
      render: (name: string) => (
        <Text strong style={{ color: appTheme.colors.textPrimary, fontFamily: appTheme.font.family }}>
          {name}
        </Text>
      ),
    },
    {
      title: "Vị trí ứng tuyển",
      dataIndex: "jobTitle",
      key: "jobTitle",
      render: (title: string) => (
        <Text style={{ color: appTheme.colors.textSecondary, fontFamily: appTheme.font.family }}>
          {title || "Chưa cập nhật vị trí"}
        </Text>
      ),
    },
    {
      title: "Điểm phù hợp",
      dataIndex: "aiScore",
      key: "aiScore",
      render: (value: number) => {
        let color = appTheme.colors.error;
        let bg = "#FEF2F2";
        let border = "#FECACA";
        if (value >= 75) {
          color = appTheme.colors.success;
          bg = "#F0FDF4";
          border = "#BBF7D0";
        } else if (value >= 50) {
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
              fontFamily: appTheme.font.family,
            }}
          >
            {value} / 100
          </Tag>
        );
      },
    },
    {
      title: "Phân loại",
      dataIndex: "classification",
      key: "classification",
      render: (value: string | undefined) => {
        let color = "#64748B";
        let bg = "#F1F5F9";
        let border = "#E2E8F0";

        if (value) {
          if (value.includes("Phù hợp cao")) {
            color = appTheme.colors.success;
            bg = "#F0FDF4";
            border = "#BBF7D0";
          } else if (value === "Phù hợp") {
            color = appTheme.colors.primary;
            bg = "#EFF6FF";
            border = "#BFDBFE";
          } else if (value.includes("Nên xem xét")) {
            color = appTheme.colors.warning;
            bg = "#FFFBEB";
            border = "#FDE68A";
          } else if (value.includes("Chưa phù hợp") || value.includes("Không phù hợp")) {
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
              borderRadius: 8,
              padding: "4px 10px",
              fontWeight: 500,
              fontFamily: appTheme.font.family,
            }}
          >
            {value || "Chưa phân loại"}
          </Tag>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_: unknown, record: ApplicationDto) => (
        <Space size="middle">
          <Button
            icon={<EyeOutlined />}
            onClick={() => setSelectedCandidate(record)}
            style={{
              borderRadius: 8,
              fontFamily: appTheme.font.family,
              fontSize: 13,
            }}
          >
            Xem nhanh AI
          </Button>
          <Button
            type="primary"
            icon={<UserOutlined />}
            onClick={() => navigate(`/recruiter/candidates/${record.id}`)}
            style={{
              borderRadius: 8,
              background: appTheme.colors.primary,
              borderColor: appTheme.colors.primary,
              fontFamily: appTheme.font.family,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Hồ sơ chi tiết
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title="Xếp hạng hồ sơ ứng tuyển"
      subtitle="Danh sách ứng viên được sắp xếp tự động theo mức độ phù hợp AI (AI Matching Score)."
    >
      {/* Khối Thống kê Bento Grid không đối xứng */}
      <Row gutter={[20, 20]} style={{ marginBottom: 28 }}>
        {/* Bento Cell 1: Top 1 Ứng viên (Span 12) */}
        <Col xs={24} md={12}>
          <Card
            style={{
              height: "100%",
              borderRadius: 16,
              border: `1px solid ${appTheme.colors.border}`,
              background: `linear-gradient(135deg, ${appTheme.colors.surface} 0%, #EFF6FF 100%)`,
              boxShadow: appTheme.shadow.card,
            }}
            bodyStyle={{ padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <Text style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em", color: appTheme.colors.textSecondary, fontFamily: appTheme.font.family, fontWeight: 600 }}>
                  Ứng viên xuất sắc nhất
                </Text>
                <div style={{ background: "rgba(217, 119, 6, 0.1)", padding: 6, borderRadius: "50%", color: "#D97706", display: "flex" }}>
                  <TrophyOutlined style={{ fontSize: 18 }} />
                </div>
              </div>
              <Title level={3} style={{ margin: 0, fontSize: 20, color: appTheme.colors.textPrimary, fontFamily: appTheme.font.family, fontWeight: 700 }}>
                {rankingData[0]?.candidateName || "Chưa có ứng viên"}
              </Title>
              <Text style={{ fontSize: 14, color: appTheme.colors.textSecondary, display: "block", marginTop: 4, fontFamily: appTheme.font.family }}>
                Vị trí: {rankingData[0]?.jobTitle || "-"}
              </Text>
            </div>
            <div style={{ marginTop: 20 }}>
              <Tag
                style={{
                  background: "#FEF3C7",
                  color: "#D97706",
                  border: "1px solid #FDE68A",
                  fontWeight: 700,
                  fontSize: 13,
                  borderRadius: 6,
                  padding: "4px 12px",
                  fontFamily: appTheme.font.family,
                }}
              >
                Match Score: {rankingData[0]?.aiScore ? `${rankingData[0].aiScore}/100` : "-"}
              </Tag>
            </div>
          </Card>
        </Col>

        {/* Bento Cell 2: Điểm cao nhất (Span 6) */}
        <Col xs={24} sm={12} md={6}>
          <Card
            style={{
              height: "100%",
              borderRadius: 16,
              border: `1px solid ${appTheme.colors.border}`,
              background: appTheme.colors.surface,
              boxShadow: appTheme.shadow.card,
            }}
            bodyStyle={{ padding: 24 }}
          >
            <Text style={{ fontSize: 13, color: appTheme.colors.textSecondary, fontFamily: appTheme.font.family, fontWeight: 600, display: "block", marginBottom: 16 }}>
              Điểm match cao nhất
            </Text>
            <div style={{ fontSize: 32, fontWeight: 800, color: appTheme.colors.primary, fontFamily: appTheme.font.family, lineHeight: 1 }}>
              {rankingData[0]?.aiScore || 0}
              <span style={{ fontSize: 16, fontWeight: 500, color: appTheme.colors.textSecondary }}>/100</span>
            </div>
            <Text style={{ fontSize: 12, color: appTheme.colors.textSecondary, display: "block", marginTop: 12, fontFamily: appTheme.font.family }}>
              Best Fit Score
            </Text>
          </Card>
        </Col>

        {/* Bento Cell 3: Số lượng hồ sơ (Span 6) */}
        <Col xs={24} sm={12} md={6}>
          <Card
            style={{
              height: "100%",
              borderRadius: 16,
              border: `1px solid ${appTheme.colors.border}`,
              background: appTheme.colors.surface,
              boxShadow: appTheme.shadow.card,
            }}
            bodyStyle={{ padding: 24 }}
          >
            <Text style={{ fontSize: 13, color: appTheme.colors.textSecondary, fontFamily: appTheme.font.family, fontWeight: 600, display: "block", marginBottom: 16 }}>
              Tổng số hồ sơ
            </Text>
            <div style={{ fontSize: 32, fontWeight: 800, color: appTheme.colors.textPrimary, fontFamily: appTheme.font.family, lineHeight: 1 }}>
              {rankingData.length}
              <span style={{ fontSize: 16, fontWeight: 500, color: appTheme.colors.textSecondary }}> hồ sơ</span>
            </div>
            <Text style={{ fontSize: 12, color: appTheme.colors.textSecondary, display: "block", marginTop: 12, fontFamily: appTheme.font.family }}>
              {selectedJobId ? "Theo tin tuyển dụng này" : "Tất cả tin tuyển dụng"}
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Bộ lọc kính mờ Glassmorphism */}
      <Card
        style={{
          ...glassCardStyle,
          marginBottom: 24,
        }}
        bodyStyle={{ padding: 20 }}
      >
        <TableToolbar
          searchPlaceholder="Tìm nhanh tên ứng viên..."
          extra={
            <Select
              placeholder="Lọc theo tin tuyển dụng..."
              style={{ width: 320 }}
              allowClear
              value={selectedJobId}
              onChange={setSelectedJobId}
              size="large"
              options={jobs.map((j) => ({
                label: `${j.position?.name || "Vị trí"} (${j.branch?.name || "Chi nhánh"})`,
                value: j.id,
              }))}
            />
          }
        />
      </Card>

      {/* Bảng Xếp hạng */}
      <Card
        style={{
          background: appTheme.colors.surface,
          borderRadius: 16,
          border: `1px solid ${appTheme.colors.border}`,
          boxShadow: appTheme.shadow.card,
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Table
          columns={columns}
          dataSource={rankingData}
          loading={loading}
          pagination={{ pageSize: 6 }}
          style={{ fontFamily: appTheme.font.family }}
        />
      </Card>

      {/* Drawer giải thích AI */}
      <Drawer
        title={
          <Title level={4} style={{ margin: 0, fontSize: 18, fontFamily: appTheme.font.family, fontWeight: 600 }}>
            Phân tích mức độ phù hợp bằng AI
          </Title>
        }
        placement="right"
        width={720}
        open={!!selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        bodyStyle={{ background: "#F8FAFC", padding: 24 }}
      >
        {selectedCandidate ? (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {/* Thẻ ứng viên */}
            <Card
              style={{
                borderRadius: 12,
                border: `1px solid ${appTheme.colors.border}`,
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
              }}
              bodyStyle={{ padding: 20 }}
            >
              <Row gutter={16} align="middle">
                <Col span={18}>
                  <Title level={5} style={{ margin: 0, fontSize: 16, color: appTheme.colors.textPrimary, fontFamily: appTheme.font.family }}>
                    {selectedCandidate.candidateName}
                  </Title>
                  <Text type="secondary" style={{ fontSize: 13, marginTop: 4, display: "block", fontFamily: appTheme.font.family }}>
                    Ứng tuyển vị trí: <strong>{selectedCandidate.jobTitle}</strong>
                  </Text>
                </Col>
                <Col span={6} style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: selectedCandidate.aiScore >= 75 ? appTheme.colors.success : appTheme.colors.warning }}>
                    {selectedCandidate.aiScore}
                    <span style={{ fontSize: 13, color: appTheme.colors.textSecondary }}>/100</span>
                  </div>
                  <Tag
                    style={{
                      marginTop: 4,
                      background: selectedCandidate.classification?.includes("Phù hợp cao") ? "#F0FDF4" : "#FFFBEB",
                      color: selectedCandidate.classification?.includes("Phù hợp cao") ? appTheme.colors.success : appTheme.colors.warning,
                      border: "none",
                      borderRadius: 4,
                    }}
                  >
                    {selectedCandidate.classification || "Chưa phân loại"}
                  </Tag>
                </Col>
              </Row>
            </Card>

            {/* Khối tóm tắt */}
            <div>
              <Text strong style={{ fontSize: 15, color: appTheme.colors.textPrimary, fontFamily: appTheme.font.family }}>
                Tóm tắt đánh giá của AI
              </Text>
              <div
                style={{
                  marginTop: 10,
                  padding: 16,
                  background: "rgba(37, 99, 235, 0.03)",
                  border: `1px solid ${appTheme.colors.border}`,
                  borderRadius: 12,
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: appTheme.colors.textSecondary,
                  fontFamily: appTheme.font.family,
                }}
              >
                {(() => {
                  const parsed = getParsedAnalysis(selectedCandidate);
                  return parsed?.summary || parsed?.score_analysis?.summary || selectedCandidate.aiReason || "Chưa có nhận xét từ AI";
                })()}
              </div>
            </div>

            {/* Kỹ năng khớp và thiếu */}
            <Row gutter={16}>
              <Col span={12}>
                <Card
                  title={<Text strong style={{ fontSize: 14, color: appTheme.colors.success }}>Kỹ năng khớp</Text>}
                  size="small"
                  style={{ borderRadius: 12, border: "1px solid #BBF7D0", height: "100%" }}
                  bodyStyle={{ padding: 12 }}
                >
                  <Space wrap size={[4, 8]} style={{ marginTop: 4 }}>
                    {parseSkills(selectedCandidate.matchedSkills).length > 0 ? (
                      parseSkills(selectedCandidate.matchedSkills).map((item) => (
                        <Tag
                          key={item}
                          style={{
                            background: "#F0FDF4",
                            color: appTheme.colors.success,
                            border: "1px solid #BBF7D0",
                            borderRadius: 6,
                            padding: "3px 8px",
                            fontFamily: appTheme.font.family,
                          }}
                        >
                          {item}
                        </Tag>
                      ))
                    ) : (
                      <Text type="secondary" style={{ fontSize: 13 }}>Không có kỹ năng khớp</Text>
                    )}
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card
                  title={<Text strong style={{ fontSize: 14, color: appTheme.colors.error }}>Kỹ năng còn thiếu</Text>}
                  size="small"
                  style={{ borderRadius: 12, border: "1px solid #FECACA", height: "100%" }}
                  bodyStyle={{ padding: 12 }}
                >
                  <Space wrap size={[4, 8]} style={{ marginTop: 4 }}>
                    {parseSkills(selectedCandidate.missingSkills).length > 0 ? (
                      parseSkills(selectedCandidate.missingSkills).map((item) => (
                        <Tag
                          key={item}
                          style={{
                            background: "#FEF2F2",
                            color: appTheme.colors.error,
                            border: "1px solid #FECACA",
                            borderRadius: 6,
                            padding: "3px 8px",
                            fontFamily: appTheme.font.family,
                          }}
                        >
                          {item}
                        </Tag>
                      ))
                    ) : (
                      <Text type="secondary" style={{ fontSize: 13 }}>Không thiếu kỹ năng nào</Text>
                    )}
                  </Space>
                </Card>
              </Col>
            </Row>

            {/* Bảng điểm chi tiết */}
            <div>
              <Text strong style={{ fontSize: 15, color: appTheme.colors.textPrimary, fontFamily: appTheme.font.family, display: "block", marginBottom: 10 }}>
                Chi tiết điểm theo tiêu chí tuyển dụng
              </Text>
              <Table
                size="small"
                pagination={false}
                rowKey={(record) => getCriterionName(record)}
                dataSource={selectedCandidate.criteriaResults || []}
                style={{ fontFamily: appTheme.font.family }}
                columns={[
                  {
                    title: "Tiêu chí đánh giá",
                    key: "criterionName",
                    render: (_: unknown, record: CriteriaResultDto) => (
                      <Text strong style={{ color: appTheme.colors.textPrimary }}>
                        {getCriterionName(record)}
                      </Text>
                    ),
                  },
                  {
                    title: "Trọng số",
                    dataIndex: "weight",
                    key: "weight",
                    width: 100,
                    align: "center",
                    render: (value: number) => <Tag style={{ borderRadius: 4 }}>{(value * 100).toFixed(0)}%</Tag>,
                  },
                  {
                    title: "Điểm AI",
                    key: "score",
                    width: 100,
                    align: "center",
                    render: (_: unknown, record: CriteriaResultDto) => {
                      const maxScore = getCriterionMaxScore(record);
                      return (
                        <Text strong style={{ color: appTheme.colors.primary }}>
                          {record.score}/{maxScore}
                        </Text>
                      );
                    },
                  },
                  {
                    title: "Giải thích & Nhận xét",
                    dataIndex: "comment",
                    key: "comment",
                    render: (text: string) => (
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        {text || "-"}
                      </Text>
                    ),
                  },
                ]}
                locale={{
                  emptyText: "Chưa có dữ liệu điểm theo tiêu chí",
                }}
              />
            </div>
          </Space>
        ) : null}
      </Drawer>
    </PageContainer>
  );
}

export default CVRankingPage;
