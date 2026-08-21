import React from "react";
import { Space, Alert, Row, Col, Card, Tag, Typography } from "antd";
import { CheckCircleOutlined, WarningOutlined, QuestionCircleOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface CompetencyTabProps {
  scoreAnalysis: any;
  extractedSkills?: string[];
  criteriaResults?: any[];
  experienceTimeline?: any;
  loading?: boolean;
}

const CompetencyTab: React.FC<CompetencyTabProps> = (props) => {
  const {
    scoreAnalysis,
    extractedSkills = [],
    criteriaResults = [],
    experienceTimeline = {},
    loading = false,
  } = props;
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

  const matchedSkills = scoreAnalysis?.matched_skills || [];
  const missingSkills = scoreAnalysis?.missing_skills || [];
  const redFlags = scoreAnalysis?.red_flags || [];
  const strengths = scoreAnalysis?.strengths || [];
  const weaknesses = scoreAnalysis?.weaknesses || [];
  const calculatedEvidenceCoverage = (() => {
    const totalWeight = criteriaResults.reduce((sum, item) => sum + Number(item?.weight || item?.max_score || 0), 0);
    if (!totalWeight) return 0;
    const weighted = criteriaResults.reduce((sum, item) => {
      const weight = Number(item?.weight || item?.max_score || 0);
      return sum + (String(item?.evidence_text || "").trim() ? weight : 0);
    }, 0);
    return Math.round((weighted / totalWeight) * 100);
  })();
  const evidenceCoverage = Number(scoreAnalysis?.evidence_coverage ?? calculatedEvidenceCoverage);
  const verificationCount = Number(
    scoreAnalysis?.verification_count
      ?? criteriaResults.filter((item) => item?.needs_verification === true).length
  );

  const matchedCount = matchedSkills.length > 0 ? matchedSkills.length : strengths.length;
  const missingCount = missingSkills.length > 0 ? missingSkills.length : weaknesses.length;

  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      <section style={{ paddingBottom: 16, borderBottom: "1px solid #E2E8F0" }}>
        <Text strong style={{ display: "block", marginBottom: 6, color: "#0F172A" }}>
          Tóm tắt đánh giá
        </Text>
        <Text style={{ color: "#475569", lineHeight: 1.65 }}>
          {scoreAnalysis?.summary || "Hệ thống đã phân tích CV so với mô tả công việc."}
        </Text>
      </section>

      <Alert
        type={verificationCount > 0 ? "warning" : "success"}
        showIcon
        message={`Mức độ đầy đủ của bằng chứng trong CV: ${evidenceCoverage}%`}
        description={
          verificationCount > 0
            ? `${verificationCount} tiêu chí có thông tin cần làm rõ khi phỏng vấn. Tỷ lệ này phản ánh mức độ có đoạn trích hỗ trợ, không phải xác suất lời khai là đúng và không phải kết luận ứng viên khai gian.`
            : "Các tiêu chí có đoạn trích trực tiếp trong CV. Nội dung này vẫn là thông tin ứng viên tự khai, chưa được xác minh với nguồn bên ngoài."
        }
      />

      {extractedSkills.length > 0 && (
        <Card
          size="small"
          title={`Kỹ năng nhận diện trong CV (${extractedSkills.length})`}
          style={{ borderRadius: 12, border: "1px solid #E2E8F0", background: "#FFFFFF" }}
          styles={{ body: { padding: 16 } }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {extractedSkills.map((skill) => (
              <Tag color="blue" key={skill} style={{ margin: 0, borderRadius: 6 }}>
                {skill}
              </Tag>
            ))}
          </div>
        </Card>
      )}

      {!experienceTimeline?.insufficient_data && Number(experienceTimeline?.total_experience_months || 0) > 0 && (
        <Card
          size="small"
          title="Kinh nghiệm đã chuẩn hóa theo timeline"
          style={{ borderRadius: 12, border: "1px solid #E2E8F0" }}
        >
          <Space direction="vertical" size={10} style={{ width: "100%" }}>
            <Text>
              Tổng kinh nghiệm không cộng trùng: <strong>{experienceTimeline.total_experience_months} tháng</strong>
              {experienceTimeline.overlap_detected ? " · Đã loại thời gian chồng lặp" : ""}
            </Text>
            {Object.keys(experienceTimeline.skill_experience_months || {}).length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {Object.entries(experienceTimeline.skill_experience_months).map(([skill, months]) => (
                  <Tag color="blue" key={skill}>{skill}: {Number(months)} tháng</Tag>
                ))}
              </div>
            )}
            {(experienceTimeline.gaps || []).map((gap: any, index: number) => (
              <Alert
                key={`${gap.start_date}-${index}`}
                type="info"
                showIcon
                message={gap.message}
                description="Đây chỉ là thông tin cần làm rõ, không tự động trừ điểm hoặc kết luận tiêu cực."
              />
            ))}
          </Space>
        </Card>
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card
            size="small"
            title={
              <span style={{ color: "#0F172A", fontWeight: 700 }}>
                <CheckCircleOutlined style={{ color: "#10B981", marginRight: 6 }} /> Năng lực tương thích tốt ({matchedCount})
              </span>
            }
            style={{
              borderRadius: 12,
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderLeft: "4px solid #10B981",
              height: "100%",
            }}
            bodyStyle={{ padding: "12px 16px" }}
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
            ) : strengths.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {strengths.map((strItem: string, idx: number) => (
                  <Text key={idx} style={{ color: "#334155", fontSize: 13.5 }}>
                    • {strItem}
                  </Text>
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
              <span style={{ color: "#0F172A", fontWeight: 700 }}>
                <WarningOutlined style={{ color: "#F59E0B", marginRight: 6 }} /> Cần làm rõ / Cải thiện ({missingCount})
              </span>
            }
            style={{
              borderRadius: 12,
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderLeft: "4px solid #F59E0B",
              height: "100%",
            }}
            bodyStyle={{ padding: "12px 16px" }}
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
            ) : weaknesses.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {weaknesses.map((wItem: string, idx: number) => (
                  <Text key={idx} style={{ color: "#334155", fontSize: 13.5 }}>
                    • {wItem}
                  </Text>
                ))}
              </div>
            ) : (
              <Text type="secondary" style={{ fontStyle: "italic", color: "#10B981" }}>
                CV đã đáp ứng đủ kỹ năng cốt lõi 
              </Text>
            )}
          </Card>
        </Col>
      </Row>

      {/* Thông tin cần HR làm rõ, không mặc định quy kết là gian lận */}
      <div style={{ marginTop: 8 }}>
        <Text
          strong
          style={{
            color: "#B45309",
            display: "block",
            marginBottom: 12,
            textTransform: "uppercase",
            fontSize: "14px",
            fontWeight: 700,
          }}
        >
          <QuestionCircleOutlined style={{ marginRight: 6 }} /> Thông tin cần làm rõ khi phỏng vấn
        </Text>
        {redFlags.length === 0 ? (
          <Alert
            type="info"
            showIcon
            message="Chưa có cảnh báo đủ bằng chứng để hiển thị"
            description="Các cảnh báo AI không có đoạn trích nguyên văn trong CV đã được loại bỏ. Những tiêu chí còn thiếu hoặc cần bổ sung nằm ở mục Cần làm rõ / Cải thiện."
            style={{
              border: "1px solid #E2E8F0",
              borderRadius: 12,
              background: "#F8FAFC",
            }}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {redFlags.map((flag: any, idx: number) => {
              const titleText =
                typeof flag === "string"
                  ? "Nội dung cần ứng viên giải thích thêm"
                  : flag.title || flag.flag || flag.name || "Thông tin cần làm rõ";
              const descText =
                typeof flag === "string"
                  ? flag
                  : flag.description || flag.detail || flag.reason || flag.comment || "";

              return (
                <Card
                  key={idx}
                  size="small"
                  style={{
                    borderRadius: 12,
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderLeft: "4px solid #F59E0B",
                  }}
                  bodyStyle={{ padding: "16px" }}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <QuestionCircleOutlined style={{ color: "#D97706", fontSize: "16px", marginTop: "3px" }} />
                    <div>
                      <Text strong style={{ color: "#0F172A", fontSize: "15px", display: "block", marginBottom: 4 }}>
                        {titleText}
                      </Text>
                      {descText && (
                        <Text type="secondary" style={{ color: "#64748B", fontSize: "14px" }}>
                          {descText}
                        </Text>
                      )}
                      {typeof flag !== "string" && flag.evidence_text && (
                        <div style={{ marginTop: 8 }}>
                          <Text style={{ color: "#475569", fontSize: 13 }}>
                            <strong>Đoạn trích trong CV:</strong> “{flag.evidence_text}”
                          </Text>
                          <Text type="secondary" style={{ display: "block", marginTop: 4, fontSize: 12 }}>
                            Đây là thông tin ứng viên tự khai, chưa xác minh với nguồn bên ngoài.
                          </Text>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Space>
  );
};

export default CompetencyTab;
