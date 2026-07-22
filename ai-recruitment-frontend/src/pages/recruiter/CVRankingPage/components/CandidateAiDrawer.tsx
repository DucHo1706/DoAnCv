import { Alert, Card, Col, Drawer, Row, Space, Table, Tag, Typography } from "antd";
import { appTheme } from "../../../../constants/theme";
import type { CandidateCriterionResult, CandidateRankingItem } from "../../../../services/candidateComparisonService";

const { Title, Text } = Typography;

const cardStyle = {
  background: appTheme.colors.surface,
  border: `1px solid ${appTheme.colors.border}`,
  borderRadius: appTheme.radius.lg,
  boxShadow: appTheme.shadow.card,
};

interface CandidateAiDrawerProps {
  candidate: CandidateRankingItem | null;
  onClose: () => void;
}

export default function CandidateAiDrawer({ candidate, onClose }: CandidateAiDrawerProps) {
  return (
    <Drawer
      title="Phân tích nhanh hồ sơ"
      width={720}
      open={candidate != null}
      onClose={onClose}
      bodyStyle={{ background: appTheme.colors.background, padding: appTheme.spacing.lg }}
    >
      {candidate != null ? (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Card style={cardStyle}>
            <Row gutter={[16, 12]} align="middle">
              <Col flex="auto">
                <Title level={4} style={{ margin: 0 }}>
                  {candidate.candidateName}
                </Title>
                <Text style={{ color: appTheme.colors.textSecondary }}>
                  {candidate.candidateEmail}
                </Text>
              </Col>
              <Col>{renderScoreTag(candidate.aiScore, 100)}</Col>
            </Row>
          </Card>

          <Alert
            showIcon
            type={isCandidateEligible(candidate) ? "info" : "warning"}
            message={renderAiStatusLabel(candidate)}
            description={candidate.aiDataMessage}
          />

          <Card title="Tóm tắt đánh giá" style={cardStyle}>
            <Text style={{ whiteSpace: "pre-wrap" }}>
              {candidate.summary || "Chưa có nhận xét AI."}
            </Text>
          </Card>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <SkillCard title="Kỹ năng phù hợp" skills={candidate.matchedSkills} color="green" />
            </Col>
            <Col xs={24} md={12}>
              <SkillCard title="Kỹ năng còn thiếu" skills={candidate.missingSkills} color="gold" />
            </Col>
          </Row>

          <Card title="Điểm theo tiêu chí" style={cardStyle}>
            <Table<CandidateCriterionResult>
              rowKey="criterionName"
              size="small"
              pagination={false}
              dataSource={candidate.criteriaResults}
              columns={[
                {
                  title: "Tiêu chí",
                  dataIndex: "criterionName",
                  key: "criterionName",
                },
                {
                  title: "Trọng số",
                  dataIndex: "weight",
                  key: "weight",
                  render: (weight: number) => `${weight}%`,
                },
                {
                  title: "Điểm",
                  key: "score",
                  render: (_, criterion) => renderScoreTag(criterion.score, criterion.maxScore),
                },
                {
                  title: "Nhận xét",
                  dataIndex: "comment",
                  key: "comment",
                },
              ]}
              locale={{ emptyText: "Chưa có dữ liệu điểm theo tiêu chí." }}
            />
          </Card>
        </Space>
      ) : null}
    </Drawer>
  );
}

function SkillCard({ title, skills, color }: { title: string; skills: string[]; color: string }) {
  return (
    <Card title={title} style={{ ...cardStyle, height: "100%" }}>
      {skills.length > 0 ? (
        <Space wrap>
          {skills.map((skill) => (
            <Tag color={color} key={skill}>
              {skill}
            </Tag>
          ))}
        </Space>
      ) : (
        <Text type="secondary">Chưa có dữ liệu.</Text>
      )}
    </Card>
  );
}

export function renderScoreTag(score: number | null, maxScore: number) {
  if (score == null) {
    return <Text type="secondary">Chưa có dữ liệu</Text>;
  }

  let color = "red";
  if (maxScore > 0 && score / maxScore >= 0.75) {
    color = "green";
  } else if (maxScore > 0 && score / maxScore >= 0.5) {
    color = "gold";
  }

  return <Tag color={color}>{score}/{maxScore}</Tag>;
}

export function isCandidateEligible(candidate: CandidateRankingItem): boolean {
  return candidate.aiDataStatus === "ready" || candidate.aiDataStatus === "partial";
}

export function renderAiStatusLabel(candidate: CandidateRankingItem) {
  let label = "Chưa có dữ liệu AI";

  if (candidate.aiDataStatus === "ready") {
    label = "Đã đánh giá";
  } else if (candidate.aiDataStatus === "partial") {
    label = "Dữ liệu một phần";
  } else if (candidate.aiDataStatus === "error") {
    label = "AI xử lý lỗi";
  } else if (candidate.aiDataStatus === "invalid") {
    label = "Dữ liệu không hợp lệ";
  }

  return label;
}
