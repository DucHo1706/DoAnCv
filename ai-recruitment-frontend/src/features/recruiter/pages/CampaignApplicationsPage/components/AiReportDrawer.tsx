import React from "react";
import {
  Drawer,
  Button,
  Row,
  Col,
  Tag,
  Progress,
  Typography,
  Space,
  Table,
  Skeleton,
  Alert,
} from "antd";
import { FilePdfOutlined } from "@ant-design/icons";
import type { ApplicationDto } from "../../../services/recruitmentService";
import AiCoreIcon from "../../../../../components/common/AiCoreIcon";
import { SkillMatchedIcon } from "../../../../../components/common/AppIcons";

const { Text, Title, Paragraph } = Typography;

interface AiReportDrawerProps {
  open: boolean;
  application: ApplicationDto | null;
  loading?: boolean;
  onClose: () => void;
  parseSkills: (val: any) => string[];
}

export function AiReportDrawer({
  open,
  application,
  loading = false,
  onClose,
  parseSkills,
}: AiReportDrawerProps) {
  const isAiError = application?.classification === "AI_ERROR";
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
    } catch {
      return null;
    }
    return null;
  };

  const safeParseSkills = (value: string | string[] | undefined) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return parseSkills(value);
  };

  return (
    <Drawer
      title={
        <span style={{ display: "inline-flex", alignItems: "center" }}>
          <AiCoreIcon size={20} style={{ marginRight: 8 }} /> Báo cáo Phân tích từ AI
        </span>
      }
      placement="right"
      open={open}
      onClose={onClose}
      extra={
        <Button
          type="primary"
          icon={<FilePdfOutlined />}
          href={
            application?.cvUrl
              ? application.cvUrl.replace(/https?:\/\/localhost:(7006|5286)/gi, window.location.origin)
              : "#"
          }
          target="_blank"
        >
          Xem CV
        </Button>
      }
      width={760}
    >
      {application && (
        <div>
          <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 24, marginTop: 16 }}>
            <Col span={6} style={{ textAlign: "center" }}>
              {isAiError ? (
                <Tag color="error">Chưa có kết quả</Tag>
              ) : application.aiScore == null ? (
                <Tag>Chưa có điểm AI</Tag>
              ) : (
                <Progress
                  type="dashboard"
                  percent={application.aiScore}
                  strokeColor={
                    application.aiScore >= 80
                      ? "#52c41a"
                      : application.aiScore >= 60
                      ? "#faad14"
                      : "#ff4d4f"
                  }
                  format={(percent) => `${percent} Điểm`}
                />
              )}
            </Col>
            <Col span={18}>
              <Title level={4} style={{ margin: 0 }}>
                {application.candidateName}
              </Title>
              <Text type="secondary" style={{ display: "block" }}>
                {application.email}
              </Text>
              <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
                Vị trí ứng tuyển: <Text strong>{application.jobTitle}</Text>
              </Text>
              <div>
                Phân loại:{" "}
                <Tag
                  color={
                    application.classification === "Phù hợp" ||
                    application.classification === "Phù hợp cao"
                      ? "green"
                      : application.classification === "Nên xem xét"
                      ? "orange"
                      : "red"
                  }
                >
                  {isAiError ? "Lỗi phân tích AI" : application.classification || "Chưa phân loại"}
                </Tag>
              </div>
            </Col>
          </Row>

          {loading ? (
            <div aria-live="polite" aria-label="Đang tải báo cáo phân tích AI">
              <Skeleton active title={{ width: "38%" }} paragraph={{ rows: 4 }} />
              <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col xs={24} md={12}><Skeleton active paragraph={{ rows: 3 }} /></Col>
                <Col xs={24} md={12}><Skeleton active paragraph={{ rows: 3 }} /></Col>
              </Row>
              <Skeleton active title={{ width: "32%" }} paragraph={{ rows: 4 }} style={{ marginTop: 24 }} />
            </div>
          ) : isAiError ? (
            <Alert
              type="error"
              showIcon
              message="Chưa thể hoàn tất phân tích CV"
              description="Đây là lỗi kỹ thuật của dịch vụ AI, không phải kết quả đánh giá ứng viên. Không sử dụng mức 0 điểm để đưa ra quyết định tuyển dụng; vui lòng xem CV gốc và thử lại sau khi dịch vụ ổn định."
              style={{ borderRadius: 12, border: "1px solid #FECACA" }}
            />
          ) : (
          <div>
          {(() => {
            const parsed = getParsedAnalysis(application);
            const summaryText =
              parsed?.summary || parsed?.score_analysis?.summary || application.aiReason || "Chưa có nhận xét từ AI";
            return (
              <div
                style={{
                  padding: 16,
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderLeft: "4px solid #2563EB",
                  borderRadius: 8,
                  marginBottom: 24,
                }}
              >
                <Text strong style={{ display: "block", marginBottom: 6, color: "#1E293B" }}>
                  🤖 Trí tuệ nhân tạo (AI) nhận xét tổng quan:
                </Text>
                <Paragraph style={{ color: "#475569", margin: 0, fontSize: 13, lineHeight: 1.6 }}>
                  {summaryText}
                </Paragraph>
              </div>
            );
          })()}

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={12}>
              <div
                style={{
                  padding: 16,
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderLeft: "4px solid #10B981",
                  borderRadius: 8,
                  height: "100%",
                }}
              >
                <Space style={{ display: "flex", marginBottom: 8 }}>
                  <SkillMatchedIcon size={14} />
                  <Text strong style={{ color: "#0F172A" }}>
                    Kỹ năng đáp ứng được (CV có):
                  </Text>
                </Space>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {safeParseSkills(application.matchedSkills).length > 0 ? (
                    safeParseSkills(application.matchedSkills).map((skill: string) => (
                      <Tag color="green" key={skill} style={{ margin: 0 }}>
                        {skill}
                      </Tag>
                    ))
                  ) : (
                    <Text type="secondary">Không có</Text>
                  )}
                </div>
              </div>
            </Col>
            <Col span={12}>
              <div
                style={{
                  padding: 16,
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderLeft: "4px solid #EF4444",
                  borderRadius: 8,
                  height: "100%",
                }}
              >
                <Text strong style={{ display: "block", marginBottom: 8, color: "#0F172A" }}>
                  ❌ Kỹ năng còn thiếu (JD yêu cầu):
                </Text>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {safeParseSkills(application.missingSkills).length > 0 ? (
                    safeParseSkills(application.missingSkills).map((skill: string) => (
                      <Tag color="red" key={skill} style={{ margin: 0 }}>
                        {skill}
                      </Tag>
                    ))
                  ) : (
                    <Text type="secondary">Không thiếu kỹ năng nào</Text>
                  )}
                </div>
              </div>
            </Col>
          </Row>

          <Title level={5}>Điểm chi tiết theo từng tiêu chí</Title>
          <Table
            dataSource={(application as any).criteriaResults || []}
            rowKey={(record: any) => record.criterionName || record.criterion_name}
            pagination={false}
            size="small"
            bordered
            columns={[
              {
                title: "Tiêu chí đánh giá",
                key: "criterionName",
                width: "30%",
                render: (_: any, record: any) =>
                  record.criterionName || record.criterion_name || "Chưa có tên",
              },
              {
                title: "Trọng số",
                key: "weight",
                width: "10%",
                render: (_: any, record: any) => `${record.weight || 0}%`,
              },
              {
                title: "Điểm",
                key: "score",
                width: "15%",
                render: (_: any, record: any) => (
                  <strong>
                    {record.score || 0} / {record.maxScore || record.max_score || 0}
                  </strong>
                ),
              },
              {
                title: "AI Giải thích",
                dataIndex: "comment",
                key: "comment",
                width: "45%",
              },
            ]}
            locale={{ emptyText: "Không có dữ liệu tiêu chí đánh giá" }}
          />
          </div>
          )}
        </div>
      )}
    </Drawer>
  );
}
