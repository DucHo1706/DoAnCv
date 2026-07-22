import { Card, Col, Progress, Row, Typography } from "antd";
import { appTheme } from "../../../../constants/theme";

const { Text, Title } = Typography;

interface FunnelData {
  applied: number;
  reviewing: number;
  interview: number;
  offer: number;
  rejected: number;
}

interface RecruitmentPipelineFunnelProps {
  funnel?: FunnelData;
}

export default function RecruitmentPipelineFunnel({ funnel }: RecruitmentPipelineFunnelProps) {
  const safeFunnel = funnel || { applied: 0, reviewing: 0, interview: 0, offer: 0, rejected: 0 };
  const stages = [
    { label: "Mới nộp (Applied)", count: safeFunnel.applied, color: "#2563EB" },
    { label: "Đang xem xét (Reviewing)", count: safeFunnel.reviewing, color: "#7C3AED" },
    { label: "Phỏng vấn (Interview)", count: safeFunnel.interview, color: "#F59E0B" },
    { label: "Nhận việc (Offer)", count: safeFunnel.offer, color: "#10B981" },
    { label: "Từ chối (Rejected)", count: safeFunnel.rejected, color: "#EF4444" },
  ];
  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <Card
      title="Phễu quy trình tuyển dụng (Recruitment Pipeline Funnel)"
      style={{
        borderRadius: 16,
        boxShadow: appTheme.shadow.card,
        border: `1px solid ${appTheme.colors.border}`,
        marginBottom: 24,
      }}
    >
      <Row gutter={[16, 16]} justify="space-between">
        {stages.map((stage) => {
          const percentage = Math.round((stage.count / maxCount) * 100);
          return (
            <Col key={stage.label} xs={24} sm={12} md={4} style={{ textAlign: "center" }}>
              <div
                style={{
                  padding: "20px 12px",
                  background: "#FFFFFF",
                  border: `1.5px solid ${appTheme.colors.border}`,
                  borderLeft: `5px solid ${stage.color}`,
                  borderRadius: 12,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.01)",
                }}
              >
                <Text
                  type="secondary"
                  style={{
                    fontSize: 11,
                    display: "block",
                    marginBottom: 8,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {stage.label}
                </Text>
                <Title level={3} style={{ margin: 0, color: stage.color }}>
                  {stage.count} <span style={{ fontSize: 12, fontWeight: 400, color: "#64748B" }}>CV</span>
                </Title>
                <Progress
                  percent={percentage}
                  size="small"
                  strokeColor={stage.color}
                  showInfo={false}
                  style={{ marginTop: 10 }}
                />
              </div>
            </Col>
          );
        })}
      </Row>
    </Card>
  );
}
