import React, { useState } from "react";
import {
  Space,
  Alert,
  Card,
  Tag,
  Typography,
  Tabs,
  Row,
  Col,
  Progress,
  List,
  Button,
  Empty,
} from "antd";
import {
  CheckCircleOutlined,
  WarningOutlined,
  RobotOutlined,
  BulbOutlined,
  AimOutlined,
  QuestionCircleOutlined,
  TrophyOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import CompetencyTab from "./CompetencyTab";
import StarOptimizationTab from "./StarOptimizationTab";
import LanguageReviewTab from "./LanguageReviewTab";
import InterviewQuestionsTab from "./InterviewQuestionsTab";

const { Text } = Typography;

interface RecruiterAnalysisTabsProps {
  parsedAnalysis: any;
  candidate: any;
  finalMatchedSkills: string[];
  finalMissingSkills: string[];
}

const RecruiterAnalysisTabs: React.FC<RecruiterAnalysisTabsProps> = ({
  parsedAnalysis,
  candidate,
  finalMatchedSkills,
  finalMissingSkills,
}) => {
  const score = parsedAnalysis.score_analysis || {};
  const criteriaResults = parsedAnalysis.criteria_results || [];
  const strengths = score.strengths || [];
  const weaknesses = score.weaknesses || [];
  const summary = score.summary || "";

  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);

  const handleGenerateQuestions = () => {
    setGeneratingQuestions(true);
    setTimeout(() => {
      const skills = [...finalMatchedSkills, ...finalMissingSkills].slice(0, 5);
      const questions =
        skills.length > 0
          ? [
              `[Điểm mạnh: ${skills[0]}] Hãy mô tả dự án phức tạp nhất bạn từng áp dụng kỹ năng này.`,
              `[Kinh nghiệm] Kể về tình huống bạn gặp khó khăn nhất trong dự án và cách bạn vượt qua.`,
              `[Chuyên môn] Bạn cập nhật công nghệ mới bằng cách nào? Cho ví dụ cụ thể.`,
              `[Teamwork] Bạn xử lý thế nào khi có bất đồng với đồng nghiệp về giải pháp kỹ thuật?`,
              `[Động lực] Điều gì khiến bạn muốn gia nhập công ty chúng tôi?`,
            ]
          : [
              "Hãy mô tả dự án ấn tượng nhất bạn từng tham gia.",
              "Bạn xử lý thế nào khi gặp vấn đề chưa có giải pháp?",
              "Mục tiêu phát triển sự nghiệp của bạn trong 2 năm tới là gì?",
            ];
      setAiQuestions(questions);
      setGeneratingQuestions(false);
    }, 1500);
  };

  const tabItems = [
    /* ======= TAB 1: TỔNG QUAN ======= */
    {
      key: "overview",
      label: (
        <span>
          <TrophyOutlined /> Tổng quan
        </span>
      ),
      children: (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          {/* AI Summary */}
          {summary && (
            <Alert
              message="Nhận xét từ AI"
              description={summary}
              type="info"
              showIcon
              icon={<RobotOutlined />}
              style={{ borderRadius: 10, background: "#f0f7ff", border: "1px solid #bfdbfe" }}
            />
          )}

          <Row gutter={[16, 16]}>
            {/* Fit Score */}
            <Col xs={24} sm={8}>
              <Card style={{ borderRadius: 12, textAlign: "center", height: "100%" }}>
                <Text strong style={{ display: "block", marginBottom: 8, color: "#64748b" }}>
                  Mức độ phù hợp
                </Text>
                <Progress
                  type="circle"
                  percent={candidate?.aiScore}
                  strokeColor={
                    candidate?.aiScore >= 75
                      ? "#10B981"
                      : candidate?.aiScore >= 50
                        ? "#F59E0B"
                        : "#EF4444"
                  }
                  format={(p) => `${p}/100`}
                  size={80}
                />
                <div style={{ marginTop: 8 }}>
                  <Tag
                    color={
                      candidate?.classification === "Phù hợp" ||
                      candidate?.classification === "Phù hợp cao"
                        ? "success"
                        : candidate?.classification === "Nên xem xét"
                          ? "warning"
                          : "default"
                    }
                  >
                    {candidate?.classification || "Chưa phân loại"}
                  </Tag>
                </div>
              </Card>
            </Col>

            {/* Strengths */}
            <Col xs={24} sm={8}>
              <Card
                size="small"
                title={
                  <span style={{ color: "#16A34A", fontWeight: 700 }}>
                    <CheckCircleOutlined /> Điểm mạnh
                  </span>
                }
                style={{
                  borderRadius: 12,
                  background: "#F0FDF4",
                  border: "1px solid #BBF7D0",
                  height: "100%",
                }}
                bodyStyle={{ padding: 12 }}
              >
                {strengths.length > 0 ? (
                  strengths.map((s: string, i: number) => (
                    <Text
                      key={i}
                      style={{ display: "block", marginBottom: 6, fontSize: 13, lineHeight: 1.5 }}
                    >
                      ✅ {s}
                    </Text>
                  ))
                ) : finalMatchedSkills.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {finalMatchedSkills.map((s) => (
                      <Tag key={s} color="success" style={{ margin: 0 }}>
                        {s}
                      </Tag>
                    ))}
                  </div>
                ) : (
                  <Text type="secondary" italic>
                    AI không tìm thấy điểm mạnh
                  </Text>
                )}
              </Card>
            </Col>

            {/* Weaknesses */}
            <Col xs={24} sm={8}>
              <Card
                size="small"
                title={
                  <span style={{ color: "#D97706", fontWeight: 700 }}>
                    <WarningOutlined /> Cần cải thiện
                  </span>
                }
                style={{
                  borderRadius: 12,
                  background: "#FFFBEB",
                  border: "1px solid #FDE68A",
                  height: "100%",
                }}
                bodyStyle={{ padding: 12 }}
              >
                {weaknesses.length > 0 ? (
                  weaknesses.map((w: string, i: number) => (
                    <Text
                      key={i}
                      style={{ display: "block", marginBottom: 6, fontSize: 13, lineHeight: 1.5 }}
                    >
                      ⚠️ {w}
                    </Text>
                  ))
                ) : finalMissingSkills.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {finalMissingSkills.map((s) => (
                      <Tag key={s} color="warning" style={{ margin: 0 }}>
                        {s}
                      </Tag>
                    ))}
                  </div>
                ) : (
                  <Text type="secondary" italic style={{ color: "#16A34A" }}>
                    Ứng viên đáp ứng đủ yêu cầu 🎉
                  </Text>
                )}
              </Card>
            </Col>
          </Row>
        </Space>
      ),
    },

    /* ======= TAB 2: NĂNG LỰC & CẢNH BÁO ======= */
    {
      key: "competency",
      label: (
        <span>
          <BulbOutlined /> Năng lực & Cảnh báo
        </span>
      ),
      children: <CompetencyTab scoreAnalysis={score} criteriaResults={criteriaResults} />,
    },

    /* ======= TAB 3: TỐI ƯU HÓA (STAR) ======= */
    {
      key: "optimization",
      label: (
        <span>
          <AimOutlined /> Tối ưu hóa (STAR)
        </span>
      ),
      children: <StarOptimizationTab optimizationTips={parsedAnalysis.optimization_tips || []} />,
    },

    /* ======= TAB 4: NGÔN TỪ & CHÂN THỰC ======= */
    {
      key: "language",
      label: (
        <span>
          <SafetyOutlined /> Ngôn từ & Chân thực
        </span>
      ),
      children: <LanguageReviewTab languageReview={parsedAnalysis.language_review || {}} />,
    },

    /* ======= TAB 5: GỢI Ý PHỎNG VẤN ======= */
    {
      key: "interview",
      label: (
        <span>
          <QuestionCircleOutlined /> Gợi ý phỏng vấn
        </span>
      ),
      children:
        parsedAnalysis.mock_interview && parsedAnalysis.mock_interview.length > 0 ? (
          <InterviewQuestionsTab interviewQuestions={parsedAnalysis.mock_interview} />
        ) : (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Alert
              message="Câu hỏi phỏng vấn dành cho HR"
              description="Dựa trên CV và kết quả phân tích, hệ thống gợi ý các câu hỏi chuyên sâu để bạn khai thác ứng viên."
              type="info"
              showIcon
              style={{ borderRadius: 10, background: "#f0f7ff", border: "1px solid #bfdbfe" }}
            />
            <Button
              type="primary"
              icon={<RobotOutlined />}
              onClick={handleGenerateQuestions}
              loading={generatingQuestions}
              size="large"
              style={{ borderRadius: 10, fontWeight: 600 }}
            >
              {aiQuestions.length > 0 ? "🔄 Tạo lại câu hỏi" : "🤖 Tạo câu hỏi phỏng vấn"}
            </Button>

            {aiQuestions.length > 0 ? (
              <List
                dataSource={aiQuestions}
                renderItem={(item, idx) => (
                  <List.Item
                    style={{
                      padding: "12px 16px",
                      background: "#F8FAFC",
                      borderRadius: 10,
                      marginBottom: 8,
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    <List.Item.Meta
                      avatar={
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            background: "#2563EB",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: 14,
                          }}
                        >
                          {idx + 1}
                        </div>
                      }
                      description={<Text style={{ fontSize: 14, lineHeight: 1.6 }}>{item}</Text>}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                description="Bấm 'Tạo câu hỏi' để AI phân tích CV và gợi ý câu hỏi phỏng vấn chuyên sâu"
                style={{ padding: 40 }}
              />
            )}
          </Space>
        ),
    },
  ];

  return (
    <Tabs defaultActiveKey="overview" items={tabItems} size="large" style={{ minHeight: 400 }} />
  );
};

export default RecruiterAnalysisTabs;
