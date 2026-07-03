import React from "react";
import { Space, Alert, Row, Col, Card, Tag, Typography, Table } from "antd";
import { CheckCircleOutlined, WarningOutlined, CloseCircleOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface CompetencyTabProps {
  scoreAnalysis: any;
  criteriaResults: any[];
  loading?: boolean;
}

const CompetencyTab: React.FC<CompetencyTabProps> = ({ scoreAnalysis, criteriaResults, loading = false }) => {
  if (loading) {
    return (
      <Space direction="vertical" size={20} style={{ width: "100%" }}>
        <style>
          {`
            @keyframes pulse {
              0% { opacity: 0.6; }
              50% { opacity: 1; }
              100% { opacity: 0.6; }
            }
          `}
        </style>
        <Alert
          message="AI đang phân tích nhận xét chuyên sâu..."
          description="Đang tiến hành chấm điểm và đối sánh năng lực của ứng viên với JD..."
          type="info"
          showIcon
        />

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card
              size="small"
              title="Năng lực tương thích tốt"
              style={{
                borderRadius: 12,
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                height: "100%",
              }}
              bodyStyle={{ padding: "16px" }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ width: "80%", height: 16, background: "#e2e8f0", borderRadius: 4, animation: "pulse 1.5s infinite" }} />
                <div style={{ width: "50%", height: 16, background: "#e2e8f0", borderRadius: 4, animation: "pulse 1.5s infinite" }} />
                <div style={{ width: "65%", height: 16, background: "#e2e8f0", borderRadius: 4, animation: "pulse 1.5s infinite" }} />
              </div>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card
              size="small"
              title="Cần làm rõ / Cải thiện"
              style={{
                borderRadius: 12,
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                height: "100%",
              }}
              bodyStyle={{ padding: "16px" }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ width: "70%", height: 16, background: "#e2e8f0", borderRadius: 4, animation: "pulse 1.5s infinite" }} />
                <div style={{ width: "60%", height: 16, background: "#e2e8f0", borderRadius: 4, animation: "pulse 1.5s infinite" }} />
                <div style={{ width: "45%", height: 16, background: "#e2e8f0", borderRadius: 4, animation: "pulse 1.5s infinite" }} />
              </div>
            </Card>
          </Col>
        </Row>
      </Space>
    );
  }

  const matchedSkills = scoreAnalysis.matched_skills || [];
  const missingSkills = scoreAnalysis.missing_skills || [];
  const redFlags = scoreAnalysis.red_flags || [];

  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      <Alert
        message="Tóm tắt nhận xét chuyên sâu từ AI"
        description={scoreAnalysis.summary || "Hệ thống đã phân tích CV so với JD."}
        type="info"
        showIcon
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card
            size="small"
            title={
              <span style={{ color: "#16a34a", fontWeight: 700 }}>
                <CheckCircleOutlined /> Năng lực tương thích tốt ({matchedSkills.length})
              </span>
            }
            style={{
              borderRadius: 12,
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              height: "100%",
            }}
            bodyStyle={{ padding: "12px" }}
          >
            {matchedSkills.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                {matchedSkills.map((s: string) => (
                  <Tag
                    color="success"
                    key={s}
                    style={{
                      margin: 0,
                      maxWidth: "100%",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                      lineHeight: 1.6,
                      padding: "3px 8px",
                      borderRadius: 6,
                      fontWeight: 600,
                      display: "inline-block",
                    }}
                  >
                    {s}
                  </Tag>
                ))}
              </div>
            ) : (
              <Text type="secondary" style={{ fontStyle: "italic" }}>
                Không tìm thấy kỹ năng tương thích
              </Text>
            )}
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            size="small"
            title={
              <span style={{ color: "#d97706", fontWeight: 700 }}>
                <WarningOutlined /> Cần làm rõ / Cải thiện ({missingSkills.length})
              </span>
            }
            style={{
              borderRadius: 12,
              background: "#fffbeb",
              border: "1px solid #fde68a",
              height: "100%",
            }}
            bodyStyle={{ padding: "12px" }}
          >
            {missingSkills.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                {missingSkills.map((s: string) => (
                  <Tag
                    key={s}
                    color="warning"
                    style={{
                      margin: 0,
                      maxWidth: "100%",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                      lineHeight: 1.6,
                      padding: "3px 8px",
                      borderRadius: 6,
                      fontWeight: 600,
                      display: "inline-block",
                    }}
                  >
                    {s}
                  </Tag>
                ))}
              </div>
            ) : (
              <Text type="secondary" style={{ fontStyle: "italic", color: "#16a34a" }}>
                CV đã đáp ứng đủ kỹ năng cốt lõi 🎉
              </Text>
            )}
          </Card>
        </Col>
      </Row>

      {/* Red Flags */}
      {redFlags.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <Text
            strong
            style={{
              color: "#dc2626",
              display: "block",
              marginBottom: 12,
              textTransform: "uppercase",
            }}
          >
            <CloseCircleOutlined /> Điểm cảnh báo cần lưu ý (Red Flags)
          </Text>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {redFlags.map((flag: any, idx: number) => (
              <Alert
                key={idx}
                type="error"
                showIcon
                message={<strong style={{ color: "#991b1b" }}>{flag.title || "Cảnh báo"}</strong>}
                description={<span style={{ color: "#7f1d1d" }}>{flag.description}</span>}
                style={{ borderRadius: 8 }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Criteria table */}
      <div style={{ marginTop: 8 }}>
        <Text strong style={{ display: "block", marginBottom: 12 }}>
          Điểm chi tiết theo từng tiêu chí
        </Text>
        <Table
          dataSource={criteriaResults}
          rowKey={(record: any) => record.criterion_name || record.criterionName}
          pagination={false}
          size="small"
          bordered
          columns={[
            {
              title: "Tiêu chí đánh giá",
              key: "criterionName",
              width: "35%",
              render: (_: any, record: any) =>
                record.criterion_name || record.criterionName || "Chưa có tên",
            },
            {
              title: "Trọng số",
              key: "weight",
              width: "15%",
              render: (_: any, record: any) => `${record.weight || 0}%`,
            },
            {
              title: "Điểm đạt được",
              key: "score",
              width: "20%",
              render: (_: any, record: any) => (
                <strong>
                  {record.score || 0} / {record.max_score || record.maxScore || 0}
                </strong>
              ),
            },
            {
              title: "AI Giải thích",
              dataIndex: "comment",
              key: "comment",
              width: "30%",
            },
          ]}
          locale={{ emptyText: "Không có dữ liệu tiêu chí đánh giá" }}
        />
      </div>
    </Space>
  );
};

export default CompetencyTab;
