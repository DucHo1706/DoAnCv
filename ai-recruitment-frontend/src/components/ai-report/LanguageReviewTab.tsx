import React from "react";
import { Space, Typography, Card, Alert, Row, Col, Tag } from "antd";
import { CheckCircleOutlined, WarningOutlined, QuestionCircleOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

interface WeakPhrase {
  original: string;
  suggestion: string;
  reason: string;
}

interface AiGenerationRisk {
  detected: boolean;
  section: string;
  score: number;
  comment: string;
}

interface LanguageReview {
  overall_language_score: number | null;
  language_comment: string;
  good_action_verbs: string[];
  weak_phrases: WeakPhrase[];
  uncertain_statements?: any[];
  unverified_language_observations?: any[];
  ai_generation_risk?: AiGenerationRisk;
  summary?: string;
  effective_language?: string[];
  areas_for_improvement?: string[];
  insufficient_data?: boolean;
  insufficient_reason?: "extraction_unreliable" | "ai_unavailable" | "analysis_error" | "pending_analysis" | "content_insufficient" | string;
  is_fallback?: boolean;
  analysis_scope?: "full_extracted_text" | "extracted_text_with_quality_limitations" | string;
  source_quality_notice?: string;
}

interface LanguageReviewTabProps {
  languageReview: LanguageReview;
}

const LanguageReviewTab: React.FC<LanguageReviewTabProps> = ({ languageReview }) => {
  const lang = languageReview;

  // Map backend format to frontend variables for backward compatibility
  const summaryText = lang.summary || lang.language_comment;
  const effectiveLanguage = lang.effective_language || lang.good_action_verbs || [];
  const weakPhrasesList = lang.weak_phrases || [];

  const uncertainStatements = lang.uncertain_statements || [];
  const unverifiedObservations = lang.unverified_language_observations || [];
  const isLocalFallback = lang.is_fallback === true && lang.insufficient_data !== true;
  const insufficientTitle = lang.insufficient_reason === "extraction_unreliable"
    ? "Chưa thể đánh giá ngôn từ từ bản trích xuất này"
    : lang.insufficient_reason === "ai_unavailable"
      ? "Chưa hoàn tất phân tích ngôn từ do dịch vụ AI"
      : lang.insufficient_reason === "analysis_error"
        ? "Chưa thể hoàn tất phân tích ngôn từ"
        : "Nội dung CV chưa đủ để đánh giá ngôn từ";

  const hasData = !!(summaryText || effectiveLanguage.length > 0 || weakPhrasesList.length > 0);

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <div>
        <Title
          level={4}
          style={{
            color: "#0F172A",
            margin: "0 0 6px",
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          Phân tích Ngôn từ & Chân thực
          {isLocalFallback && (
            <Tag color="gold" style={{ marginLeft: 10, verticalAlign: 2, fontWeight: 600 }}>
              Rà soát cục bộ
            </Tag>
          )}
        </Title>
        <Text type="secondary" style={{ fontSize: 14 }}>
          Hệ thống rà soát cách diễn đạt và những nội dung nên làm rõ. Hệ thống không xác minh
          lời khai đúng hay sai và không xác định CV có được viết bằng AI hay không.
        </Text>
      </div>

      {lang.insufficient_data ? (
        <Alert
          message={insufficientTitle}
          description={summaryText || "Hệ thống chưa có đủ dữ liệu để đánh giá ngôn từ của hồ sơ này."}
          type="warning"
          showIcon
          style={{ borderRadius: 12, border: "1px solid #FDE68A", background: "#FFFBEB" }}
        />
      ) : hasData ? (
        <>
          {lang.analysis_scope === "extracted_text_with_quality_limitations" && (
            <Alert
              message="Phạm vi đánh giá theo phần văn bản đọc được"
              description={lang.source_quality_notice || "Lỗi dấu, ký tự hoặc bố cục do bước đọc tài liệu không được tính là lỗi diễn đạt của ứng viên."}
              type="warning"
              showIcon
              style={{ borderRadius: 12, border: "1px solid #FDE68A", background: "#FFFBEB" }}
            />
          )}
          {lang.overall_language_score !== null && lang.overall_language_score !== undefined && (
            <Alert
              message={
                <span style={{ fontWeight: 600, color: "#1E3A8A" }}>
                  Điểm diễn đạt tham khảo: {lang.overall_language_score}/100
                </span>
              }
              type="info"
              style={{ borderRadius: 12, background: "#EFF6FF", border: "1px solid #BFDBFE" }}
            />
          )}

          {/* CARD 1: ĐỘNG TỪ MẠNH / NGÔN NGỮ HIỆU QUẢ */}
          <Card
            size="small"
            title={
              <span style={{ color: "#0F172A", fontWeight: 700, fontSize: 15 }}>
                <CheckCircleOutlined style={{ color: "#10B981", marginRight: 6 }} /> Động từ hành động mạnh & Ngôn ngữ hiệu quả
              </span>
            }
            style={{
              borderRadius: 16,
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderLeft: "4px solid #10B981",
            }}
            bodyStyle={{ padding: "20px" }}
          >
            {effectiveLanguage.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {effectiveLanguage.map((verb: string, index: number) => (
                  <Tag
                    color="success"
                    key={`good-verb-${index}`}
                    style={{
                      margin: 0,
                      padding: "4px 10px",
                      borderRadius: 8,
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    {verb}
                  </Tag>
                ))}
              </div>
            ) : (
              <Text type="secondary" style={{ fontStyle: "italic", fontSize: 13.5 }}>
                Không phát hiện động từ hành động đặc biệt nổi bật trong CV.
              </Text>
            )}
          </Card>

          {/* CARD 2: CÁC CỤM TỪ MƠ HỒ CẦN CẢI THIỆN (SO SÁNH TRỰC QUAN) */}
          <Card
            size="small"
            title={
              <span style={{ color: "#0F172A", fontWeight: 700, fontSize: 15 }}>
                <WarningOutlined style={{ color: "#F59E0B", marginRight: 6 }} /> Rà soát từ ngữ mơ hồ & Đề xuất cải thiện ({weakPhrasesList.length})
              </span>
            }
            style={{
              borderRadius: 16,
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderLeft: "4px solid #F59E0B",
            }}
            bodyStyle={{ padding: "20px" }}
          >
            {weakPhrasesList.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {weakPhrasesList.map((item: WeakPhrase, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: 12,
                      padding: "16px",
                    }}
                  >
                    <Row gutter={[16, 12]}>
                      <Col xs={24} sm={12}>
                        <div
                          style={{
                            padding: "10px 14px",
                            background: "#FFFFFF",
                            borderRadius: 8,
                            border: "1px solid #E2E8F0",
                            borderLeft: "3px solid #94A3B8",
                            height: "100%",
                          }}
                        >
                          <Text
                            strong
                            style={{
                              color: "#64748B",
                              fontSize: 11,
                              display: "block",
                              marginBottom: 4,
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                            }}
                          >
                            ❌ Cụm từ mơ hồ trong CV:
                          </Text>
                          <Text style={{ color: "#475569", fontSize: 13.5, fontWeight: 600 }}>
                            "{item.original}"
                          </Text>
                        </div>
                      </Col>
                      <Col xs={24} sm={12}>
                        <div
                          style={{
                            padding: "10px 14px",
                            background: "#FFFFFF",
                            borderRadius: 8,
                            border: "1px solid #E2E8F0",
                            borderLeft: "3px solid #10B981",
                            height: "100%",
                          }}
                        >
                          <Text
                            strong
                            style={{
                              color: "#10B981",
                              fontSize: 11,
                              display: "block",
                              marginBottom: 4,
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                            }}
                          >
                            ✔️ Gợi ý thay thế mạnh mẽ:
                          </Text>
                          <Text style={{ color: "#0F172A", fontSize: 13.5, fontWeight: 600 }}>
                            "{item.suggestion}"
                          </Text>
                        </div>
                      </Col>
                    </Row>
                    <div
                      style={{
                        marginTop: 12,
                        padding: "8px 12px 0",
                        borderTop: "1px dashed #E2E8F0",
                        fontSize: 13.5,
                        color: "#475569",
                        lineHeight: "1.5",
                      }}
                    >
                      <strong>Lý do tối ưu:</strong> {item.reason}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Text type="secondary" style={{ fontStyle: "italic", fontSize: 13.5 }}>
                Không ghi nhận cụm từ mơ hồ trong phạm vi nội dung đã rà soát.
              </Text>
            )}
          </Card>

          {/* NỘI DUNG CẦN ỨNG VIÊN LÀM RÕ */}
          {uncertainStatements && uncertainStatements.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <Text
                strong
                style={{
                  color: "#B45309",
                  display: "block",
                  marginBottom: 12,
                  textTransform: "uppercase",
                  fontSize: 13,
                  letterSpacing: 0.5,
                }}
              >
                <QuestionCircleOutlined style={{ marginRight: 6 }} /> Nội dung diễn đạt cần làm rõ
              </Text>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {uncertainStatements.map((statement: any, idx: number) => (
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
                      <WarningOutlined style={{ color: "#D97706", fontSize: "16px", marginTop: "3px" }} />
                      <div>
                        <Text strong style={{ color: "#0F172A", fontSize: "15px", display: "block", marginBottom: 4 }}>
                          {statement.title || "Nhận định cần làm rõ"}
                        </Text>
                        <Text type="secondary" style={{ color: "#64748B", fontSize: "14px" }}>
                          {statement.description}
                        </Text>
                        {statement.evidence_text && (
                          <Text type="secondary" style={{ display: "block", marginTop: 6, fontSize: "13px" }}>
                            Đoạn trích trong CV: “{statement.evidence_text}” — đây là thông tin tự khai, chưa được xác minh.
                          </Text>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {unverifiedObservations.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <Alert
                type="warning"
                showIcon
                message="Gợi ý ngôn từ AI chưa đối chiếu"
                description="Các nhận xét dưới đây chưa truy hồi được cụm từ gần-nguyên-văn từ CV. Hãy xem như gợi ý rà soát, không phải kết luận về cách viết hoặc tính chân thực của ứng viên."
                style={{
                  border: "1px solid #FDE68A",
                  borderRadius: 12,
                  background: "#FFFBEB",
                  marginBottom: 12,
                }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {unverifiedObservations.map((item: any, idx: number) => (
                  <Card
                    key={`language-unverified-${idx}`}
                    size="small"
                    style={{
                      borderRadius: 12,
                      background: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderLeft: "4px solid #F59E0B",
                    }}
                    bodyStyle={{ padding: 16 }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <Text strong style={{ color: "#0F172A", fontSize: 15 }}>
                        {item?.title || "Nội dung AI đề xuất xem lại"}
                      </Text>
                      <Tag color="gold" style={{ margin: 0 }}>Chưa đối chiếu</Tag>
                    </div>
                    {item?.description && <Text type="secondary">{item.description}</Text>}
                    {item?.suggestion && (
                      <Text style={{ display: "block", marginTop: 6, color: "#475569" }}>
                        <strong>Gợi ý:</strong> {item.suggestion}
                      </Text>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <Alert
          message="Hệ thống không tìm thấy đủ dữ liệu để phân tích chất lượng ngôn từ của CV này."
          type="warning"
          showIcon
          style={{ borderRadius: 12 }}
        />
      )}
    </Space>
  );
};

export default LanguageReviewTab;
