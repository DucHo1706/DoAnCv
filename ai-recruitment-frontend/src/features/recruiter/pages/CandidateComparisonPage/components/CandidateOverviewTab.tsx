import {
  CrownOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Card, Col, Divider, Row, Space, Tag, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { appTheme } from "../../../../../constants/theme";
import type { CandidateRankingItem } from "../../../../../services/candidateComparisonService";
import { getAiArrayEmptyMessage } from "./aiDisplayMessages";
import { comparisonCardStyle, comparisonScrollStyle } from "./comparisonStyles";

const { Text, Title } = Typography;

type CandidateOverviewTabProps = {
  candidates: CandidateRankingItem[];
};

function CandidateOverviewTab({ candidates }: CandidateOverviewTabProps) {
  const navigate = useNavigate();
  const highestScore = getHighestScore(candidates);

  return (
    <div style={comparisonScrollStyle}>
      <Row gutter={[16, 16]} wrap={false} style={{ minWidth: getMinimumRowWidth(candidates.length) }}>
        {candidates.map((candidate) => {
          const isHighestScore = candidate.aiScore != null && candidate.aiScore === highestScore;

          return (
            <Col key={candidate.applicationId} flex={getCandidateColumnFlex(candidates.length)}>
              <Card
                style={{
                  ...comparisonCardStyle,
                  borderColor: isHighestScore ? "#FDE68A" : appTheme.colors.border,
                  boxShadow: isHighestScore
                    ? "0 8px 24px rgba(245, 158, 11, 0.12)"
                    : appTheme.shadow.card,
                }}
                bodyStyle={{ padding: appTheme.spacing.lg, height: "100%" }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: appTheme.spacing.md,
                    minHeight: 680,
                    height: "100%",
                  }}
                >
                  <div>
                    <Space wrap style={{ marginBottom: appTheme.spacing.xs }}>
                      {isHighestScore ? (
                        <Tag color="gold" icon={<CrownOutlined />}>
                          Điểm tổng cao nhất
                        </Tag>
                      ) : null}
                      {candidate.overallRank != null ? (
                        <Tag color={candidate.overallRank === 1 ? "gold" : "blue"}>
                          Hạng tổng #{candidate.overallRank}
                        </Tag>
                      ) : (
                        <Tag>Chưa xếp hạng</Tag>
                      )}
                    </Space>

                    <Title
                      level={4}
                      style={{
                        margin: 0,
                        color: appTheme.colors.textPrimary,
                        overflowWrap: "anywhere",
                      }}
                    >
                      {candidate.candidateName || "Chưa có dữ liệu"}
                    </Title>
                    <Space direction="vertical" size={2} style={{ marginTop: appTheme.spacing.xs }}>
                      <Text
                        style={{
                          color: appTheme.colors.textSecondary,
                          overflowWrap: "anywhere",
                        }}
                      >
                        <MailOutlined /> {candidate.candidateEmail || "Chưa có dữ liệu"}
                      </Text>
                      <Text style={{ color: appTheme.colors.textSecondary }}>
                        <PhoneOutlined /> {candidate.candidatePhone || "Chưa có dữ liệu"}
                      </Text>
                    </Space>
                  </div>

                  <Row gutter={[12, 12]}>
                    <Col span={12}>
                      <MetricBox
                        label="Điểm AI"
                        value={candidate.aiScore == null ? "Chưa có dữ liệu" : `${candidate.aiScore}/100`}
                      />
                    </Col>
                    <Col span={12}>
                      <MetricBox
                        label="Phân loại"
                        value={candidate.classification || "Chưa có dữ liệu"}
                      />
                    </Col>
                  </Row>

                  <AiStatus candidate={candidate} />

                  <Divider style={{ margin: 0 }} />

                  <InformationRow
                    label="Kinh nghiệm"
                    value={formatExperience(candidate.yearsOfExperience)}
                  />
                  <InformationRow label="Học vấn" value={formatEducation(candidate)} />
                  <InformationRow
                    label="Trạng thái hồ sơ"
                    value={formatApplicationStatus(candidate.applicationStatus)}
                  />

                  <SkillSection
                    title="Kỹ năng phù hợp"
                    skills={candidate.matchedSkills}
                    color="green"
                    emptyText={getAiArrayEmptyMessage(
                      candidate.aiDataStatus,
                      "matchedSkills"
                    )}
                  />
                  <SkillSection
                    title="Kỹ năng còn thiếu"
                    skills={candidate.missingSkills}
                    color="gold"
                    emptyText={getAiArrayEmptyMessage(
                      candidate.aiDataStatus,
                      "missingSkills"
                    )}
                  />

                  <Button
                    type="primary"
                    block
                    icon={<UserOutlined />}
                    style={{ marginTop: "auto" }}
                    onClick={() => navigate(`/recruiter/candidates/${candidate.applicationId}`)}
                  >
                    Xem hồ sơ
                  </Button>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        height: "100%",
        padding: appTheme.spacing.sm,
        background: appTheme.colors.background,
        border: `1px solid ${appTheme.colors.border}`,
        borderRadius: appTheme.radius.md,
      }}
    >
      <Text style={{ display: "block", color: appTheme.colors.textSecondary, fontSize: 12 }}>
        {label}
      </Text>
      <Text strong style={{ color: appTheme.colors.textPrimary }}>
        {value}
      </Text>
    </div>
  );
}

function InformationRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Text strong style={{ display: "block", marginBottom: 4 }}>
        {label}
      </Text>
      <Text style={{ color: appTheme.colors.textSecondary }}>{value}</Text>
    </div>
  );
}

function SkillSection({
  title,
  skills,
  color,
  emptyText,
}: {
  title: string;
  skills: string[];
  color: string;
  emptyText: string;
}) {
  return (
    <div>
      <Text strong style={{ display: "block", marginBottom: appTheme.spacing.xs }}>
        {title}
      </Text>
      {skills.length > 0 ? (
        <Space wrap size={[4, 8]}>
          {skills.map((skill) => (
            <Tag color={color} key={skill}>
              {skill}
            </Tag>
          ))}
        </Space>
      ) : (
        <Text type="secondary">{emptyText}</Text>
      )}
    </div>
  );
}

function AiStatus({ candidate }: { candidate: CandidateRankingItem }) {
  let color = "default";
  let label = "Chưa có dữ liệu AI";

  if (candidate.aiDataStatus === "ready") {
    color = "green";
    label = "Dữ liệu AI đầy đủ";
  } else if (candidate.aiDataStatus === "partial") {
    color = "gold";
    label = "Dữ liệu AI một phần";
  } else if (candidate.aiDataStatus === "error") {
    color = "red";
    label = "AI xử lý lỗi";
  } else if (candidate.aiDataStatus === "invalid") {
    color = "orange";
    label = "Dữ liệu AI không hợp lệ";
  }

  return (
    <div>
      <Tag color={color}>{label}</Tag>
      {candidate.aiDataMessage ? (
        <Text style={{ display: "block", marginTop: 4, color: appTheme.colors.textSecondary }}>
          {candidate.aiDataMessage}
        </Text>
      ) : null}
    </div>
  );
}

function getHighestScore(candidates: CandidateRankingItem[]): number | null {
  const scores = candidates
    .map((candidate) => candidate.aiScore)
    .filter((score): score is number => score != null);

  if (scores.length === 0) {
    return null;
  }

  return Math.max(...scores);
}

function formatExperience(yearsOfExperience: number | null | undefined): string {
  if (yearsOfExperience == null) {
    return "Chưa có dữ liệu";
  }

  if (yearsOfExperience === 0) {
    return "Chưa có kinh nghiệm làm việc";
  }

  return `${yearsOfExperience} năm kinh nghiệm`;
}

function formatEducation(candidate: CandidateRankingItem): string {
  const educationParts = [candidate.degree, candidate.major, candidate.university].filter(
    (value) => value && value.trim().length > 0
  );

  if (educationParts.length === 0) {
    return "Chưa có dữ liệu";
  }

  return educationParts.join(" • ");
}

function formatApplicationStatus(status: string): string {
  const statusLabels: Record<string, string> = {
    Applied: "Mới nộp",
    Reviewing: "Đang xem xét",
    Interview: "Phỏng vấn",
    Offer: "Nhận việc (Offer)",
    Rejected: "Đã từ chối",
  };

  return statusLabels[status] || status || "Chưa có dữ liệu";
}

function getCandidateColumnFlex(candidateCount: number): string {
  if (candidateCount === 2) {
    return "1 0 420px";
  }

  return "0 0 360px";
}

function getMinimumRowWidth(candidateCount: number): number {
  if (candidateCount === 2) {
    return 856;
  }

  return candidateCount * 376;
}

export default CandidateOverviewTab;
