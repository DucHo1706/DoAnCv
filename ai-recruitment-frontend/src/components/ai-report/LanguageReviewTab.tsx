import React from "react";
import { Space, Typography, Card, Alert, Row, Col, Tag } from "antd";
import { CheckCircleOutlined, WarningOutlined, CloseCircleOutlined } from "@ant-design/icons";

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
  ai_generation_risk?: AiGenerationRisk;
  summary?: string;
  effective_language?: string[];
  areas_for_improvement?: string[];
  insufficient_data?: boolean;
  is_fallback?: boolean;
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

  const uncertainStatements =
    lang.uncertain_statements ||
    (lang.ai_generation_risk && lang.ai_generation_risk.detected
      ? [
          {
            title: `Nghi vấn sử dụng AI tại phần: ${lang.ai_generation_risk.section} (${lang.ai_generation_risk.score}%)`,
            description: lang.ai_generation_risk.comment,
          },
        ]
      : []);

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
          Phân tích Ngôn từ & Chân thực từ AI
        </Title>
        <Text type="secondary" style={{ fontSize: 14 }}>
          AI sẽ đánh giá các yếu tố liên quan đến cách bạn dùng ngôn ngữ trong CV, cũng như các điểm
          có thể chưa được chân thực hoặc gây hiểu lầm.
        </Text>
      </div>

      {lang.insufficient_data ? (
        <Alert
          message="Không đủ dữ liệu để đánh giá ngôn từ"
          description={summaryText || "Hệ thống chưa có đủ dữ liệu để đánh giá ngôn từ của hồ sơ này."}
          type="warning"
          showIcon
          style={{ borderRadius: 12, border: "1px solid #FDE68A", background: "#FFFBEB" }}
        />
      ) : hasData ? (
        <>
          {summaryText && (
            <Alert
              message={
                <span style={{ fontWeight: 600, color: "#1E3A8A" }}>
                  Tổng quan đánh giá ngôn từ & chân thực (Điểm: {lang.overall_language_score || 0}/100)
                </span>
              }
              description={
                <span style={{ fontSize: "13.5px", lineHeight: "1.6", color: "#1E40AF" }}>
                  {summaryText}
                </span>
              }
              type="info"
              showIcon
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
              borderRadius: 14,
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
              borderRadius: 14,
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
              <Text type="secondary" style={{ fontStyle: "italic", fontSize: 13.5, color: "#10B981" }}>
                Tuyệt vời! AI không phát hiện từ ngữ sáo rỗng hoặc mơ hồ nào trong CV này. 🎉
              </Text>
            )}
          </Card>

          {/* SỰ THIẾU CHÂN THỰC / AI GENERATION RISK */}
          {uncertainStatements && uncertainStatements.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <Text
                strong
                style={{
                  color: "#EF4444",
                  display: "block",
                  marginBottom: 12,
                  textTransform: "uppercase",
                  fontSize: 13,
                  letterSpacing: 0.5,
                }}
              >
                <CloseCircleOutlined style={{ marginRight: 6 }} /> Phát hiện nguy cơ & Đánh giá mức độ chân thực
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
                      borderLeft: "4px solid #EF4444",
                    }}
                    bodyStyle={{ padding: "16px" }}
                  >
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <WarningOutlined style={{ color: "#EF4444", fontSize: "16px", marginTop: "3px" }} />
                      <div>
                        <Text strong style={{ color: "#0F172A", fontSize: "15px", display: "block", marginBottom: 4 }}>
                          {statement.title || "Nhận định cần làm rõ"}
                        </Text>
                        <Text type="secondary" style={{ color: "#64748B", fontSize: "14px" }}>
                          {statement.description}
                        </Text>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <Alert
          message="AI không tìm thấy dữ liệu phân tích ngôn từ hoặc chân thực cho CV này."
          type="warning"
          showIcon
          style={{ borderRadius: 12 }}
        />
      )}
    </Space>
  );
};

export default LanguageReviewTab;
