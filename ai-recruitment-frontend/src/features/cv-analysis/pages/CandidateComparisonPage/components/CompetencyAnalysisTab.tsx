import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import { Alert, Card, Col, List, Row, Space, Tag, Typography } from "antd";
import type { ReactNode } from "react";
import { appTheme } from "../../../../../constants/theme";
import type { CandidateRankingItem } from "../../../../../services/candidateComparisonService";
import { getAiArrayEmptyMessage } from "./aiDisplayMessages";
import { comparisonCardStyle, comparisonScrollStyle } from "./comparisonStyles";

const { Text, Title } = Typography;

type CompetencyAnalysisTabProps = {
  candidates: CandidateRankingItem[];
};

function CompetencyAnalysisTab({ candidates }: CompetencyAnalysisTabProps) {
  return (
    <div style={comparisonScrollStyle}>
      <Row gutter={[16, 16]} wrap={false} style={{ minWidth: getMinimumRowWidth(candidates.length) }}>
        {candidates.map((candidate) => (
          <Col key={candidate.applicationId} flex={getCandidateColumnFlex(candidates.length)}>
            <Card
              style={comparisonCardStyle}
              bodyStyle={{ padding: appTheme.spacing.lg, height: "100%" }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: appTheme.spacing.lg,
                  minHeight: 720,
                  height: "100%",
                }}
              >
                <div
                  style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                    paddingBottom: appTheme.spacing.sm,
                    background: appTheme.colors.surface,
                    borderBottom: `1px solid ${appTheme.colors.border}`,
                  }}
                >
                  <Title level={4} style={{ margin: 0, overflowWrap: "anywhere" }}>
                    {candidate.candidateName || "Chưa có dữ liệu"}
                  </Title>
                  <Text
                    style={{
                      color: appTheme.colors.textSecondary,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {candidate.candidateEmail || "Chưa có dữ liệu"}
                  </Text>
                </div>

                {candidate.aiDataStatus === "ready" ? null : (
                  <Alert
                    showIcon
                    type={candidate.aiDataStatus === "error" ? "error" : "warning"}
                    message={getAiStatusLabel(candidate)}
                    description={candidate.aiDataMessage || "Dữ liệu AI chưa sẵn sàng."}
                  />
                )}

                <AnalysisList
                  title="Điểm mạnh"
                  values={candidate.strengths}
                  emptyText={getAiArrayEmptyMessage(candidate.aiDataStatus, "strengths")}
                  icon={<PlusCircleOutlined style={{ color: appTheme.colors.success }} />}
                />
                <AnalysisList
                  title="Điểm cần cải thiện"
                  values={candidate.weaknesses}
                  emptyText={getAiArrayEmptyMessage(candidate.aiDataStatus, "weaknesses")}
                  icon={<ExclamationCircleOutlined style={{ color: appTheme.colors.warning }} />}
                />
                <SkillList
                  title="Kỹ năng phù hợp"
                  values={candidate.matchedSkills}
                  emptyText={getAiArrayEmptyMessage(candidate.aiDataStatus, "matchedSkills")}
                  color="green"
                  icon={<CheckCircleOutlined style={{ color: appTheme.colors.success }} />}
                />
                <SkillList
                  title="Kỹ năng còn thiếu"
                  values={candidate.missingSkills}
                  emptyText={getAiArrayEmptyMessage(candidate.aiDataStatus, "missingSkills")}
                  color="gold"
                  icon={<MinusCircleOutlined style={{ color: appTheme.colors.warning }} />}
                />
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}

function AnalysisList({
  title,
  values,
  emptyText,
  icon,
}: {
  title: string;
  values: string[];
  emptyText: string;
  icon: ReactNode;
}) {
  return (
    <div style={analysisGroupStyle}>
      <Space size={appTheme.spacing.xs} style={{ marginBottom: appTheme.spacing.sm }}>
        {icon}
        <Text strong>{title}</Text>
      </Space>
      {values.length > 0 ? (
        <List
          size="small"
          style={{ marginTop: 0 }}
          dataSource={values}
          renderItem={(value) => (
            <List.Item style={{ paddingInline: 0 }}>
              <Text style={{ color: appTheme.colors.textSecondary }}>{value}</Text>
            </List.Item>
          )}
        />
      ) : (
        <Text
          type="secondary"
          style={{ display: "block", lineHeight: 1.6, paddingTop: appTheme.spacing.xs }}
        >
          {emptyText}
        </Text>
      )}
    </div>
  );
}

function SkillList({
  title,
  values,
  emptyText,
  color,
  icon,
}: {
  title: string;
  values: string[];
  emptyText: string;
  color: string;
  icon: ReactNode;
}) {
  return (
    <div style={analysisGroupStyle}>
      <Space size={appTheme.spacing.xs} style={{ marginBottom: appTheme.spacing.sm }}>
        {icon}
        <Text strong>{title}</Text>
      </Space>
      {values.length > 0 ? (
        <Space wrap size={[4, 8]}>
          {values.map((value) => (
            <Tag color={color} key={value}>
              {value}
            </Tag>
          ))}
        </Space>
      ) : (
        <Text
          type="secondary"
          style={{ display: "block", lineHeight: 1.6, paddingTop: appTheme.spacing.xs }}
        >
          {emptyText}
        </Text>
      )}
    </div>
  );
}

function getAiStatusLabel(candidate: CandidateRankingItem): string {
  if (candidate.aiDataStatus === "partial") {
    return "Dữ liệu AI chưa đầy đủ";
  }

  if (candidate.aiDataStatus === "error") {
    return "AI chưa thể xử lý hồ sơ";
  }

  if (candidate.aiDataStatus === "invalid") {
    return "Dữ liệu AI không hợp lệ";
  }

  return "Hồ sơ chưa có đánh giá AI";
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

const analysisGroupStyle = {
  minHeight: 150,
  padding: appTheme.spacing.md,
  background: appTheme.colors.background,
  border: `1px solid ${appTheme.colors.border}`,
  borderRadius: appTheme.radius.md,
};

export default CompetencyAnalysisTab;
