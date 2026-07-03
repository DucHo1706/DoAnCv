import React from "react";
import { Space, Typography, Card, Alert, Collapse, Row, Col } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

interface OptimizationTip {
  group: string;
  title: string;
  detail: string;
  priority: "high" | "medium";
  star_guidance?: string;
  example_before?: string | null;
  example_after?: string | null;
}

interface StarOptimizationTabProps {
  optimizationTips: OptimizationTip[];
}

// Hàm tìm và in đậm các từ khóa kỹ thuật/SaaS quan trọng cũng như làm nổi bật các chỉ số/con số lượng hóa
const highlightKeywords = (text: string): React.ReactNode => {
  if (!text) return "";

  const keywords = [
    "SDLC", "Agile/Scrum", "Agile", "Scrum", "SQL", "BA", "Business Analysis", 
    "Coursera", "Udemy", "Flutter", "Figma", "Visio", "Draw.io", "Balsamiq", 
    "MVVM", "JSON", "API", "Dart", "Firebase", "Authentication", "Cloud Firestore", 
    "Hive", "SQLite", "Secure Storage", "Git", "GitHub", "VS Code", "Android Studio", 
    "GPA", "SELECT", "JOIN", "WHERE", "GROUP BY", "BA/PM", "IT", "HOC VAN", "KỸ NĂNG MỀM",
    "Flutter ttr", "Cybersoft Academy"
  ];

  const escapedKeywords = keywords.map(kw => kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  // Lấy ra các từ lượng hóa: 40%, 10,000, 3 năm, 10,000 lượt xem
  const metricPattern = "\\b\\d+(?:[\\.,\\d]*\\d)?%?(?:\\s*(?:lượt xem|lần|cơ hội|năm|tháng|kỹ năng|dự án|bài viết|trang|%))?\\b";
  const regex = new RegExp(`(${escapedKeywords.join("|")}|${metricPattern})`, "gi");

  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;
        
        const isKeyword = keywords.some(
          kw => kw.toLowerCase() === part.toLowerCase()
        );
        
        const isMetric = /^\d/.test(part) || part.includes("%");

        if (isKeyword) {
          return (
            <strong key={index} style={{ color: "#0F172A", fontWeight: 700 }}>
              {part}
            </strong>
          );
        } else if (isMetric) {
          return (
            <span key={index} style={{ color: "#2563EB", fontWeight: 700, padding: "0 2px" }}>
              {part}
            </span>
          );
        }
        return part;
      })}
    </>
  );
};

// Hàm phân tích và định dạng văn bản STAR hoặc danh sách dấu sao (*) đẹp mắt
const renderFormattedStarText = (text: string | null) => {
  if (!text) return null;

  // 1. Phân tích theo mô hình STAR nếu có các từ khóa STAR
  const starRegex = /(\*(?:\s*)(?:Tình huống|Nhiệm vụ|Hành động|Kết quả|Situation|Task|Action|Result)(?:\s*):)/i;
  const hasStar = starRegex.test(text);

  if (hasStar) {
    const parts = text.split(starRegex);
    const elements: React.ReactNode[] = [];
    let currentLabel = "";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isMarker = starRegex.test(part);

      if (isMarker) {
        currentLabel = part.replace(/\*/g, "").trim();
      } else if (part.trim()) {
        const cleanText = part.trim();
        if (currentLabel) {
          let badgeColor = "#2563EB"; // Mặc định là xanh thương hiệu
          let badgeBg = "#EFF6FF";
          let labelName = currentLabel;

          if (/Tình huống|Situation/i.test(currentLabel)) {
            badgeColor = "#3B82F6"; // Blue
            badgeBg = "#EFF6FF";
          } else if (/Nhiệm vụ|Task/i.test(currentLabel)) {
            badgeColor = "#F59E0B"; // Amber
            badgeBg = "#FFFBEB";
          } else if (/Hành động|Action/i.test(currentLabel)) {
            badgeColor = "#8B5CF6"; // Purple
            badgeBg = "#F5F3FF";
          } else if (/Kết quả|Result/i.test(currentLabel)) {
            badgeColor = "#10B981"; // Emerald
            badgeBg = "#F0FDF4";
          }

          elements.push(
            <div key={i} style={{ marginBottom: 12 }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "3px 9px",
                  borderRadius: 6,
                  fontSize: "11px",
                  fontWeight: 700,
                  color: badgeColor,
                  background: badgeBg,
                  marginRight: 8,
                  textTransform: "uppercase",
                  border: `1px solid ${badgeColor}20`,
                }}
              >
                {labelName.replace(":", "")}
              </span>
              <span
                style={{
                  fontSize: "15px",
                  lineHeight: "1.7",
                  fontWeight: 500,
                  color: "#1E293B",
                }}
              >
                {highlightKeywords(cleanText)}
              </span>
            </div>
          );
          currentLabel = "";
        } else {
          elements.push(
            <div
              key={i}
              style={{
                fontSize: "15px",
                lineHeight: "1.7",
                marginBottom: 8,
                color: "#334155",
              }}
            >
              {highlightKeywords(cleanText)}
            </div>
          );
        }
      }
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
        {elements}
      </div>
    );
  }

  // 2. Phân tích Bullet points nếu có chứa dấu "*"
  if (text.includes("*")) {
    const rawBullets = text.split("*");
    const intro = rawBullets[0].trim();
    const bullets = rawBullets.slice(1).map((b) => b.trim()).filter(Boolean);

    return (
      <div style={{ fontSize: "15px", lineHeight: "1.7", color: "#334155" }}>
        {intro && (
          <div style={{ marginBottom: 10, fontWeight: 600, color: "#0F172A" }}>
            {highlightKeywords(intro)}
          </div>
        )}
        {bullets.length > 0 && (
          <ul style={{ paddingLeft: 18, margin: 0, listStyleType: "disc" }}>
            {bullets.map((b, idx) => (
              <li key={idx} style={{ marginBottom: 8, color: "#334155" }}>
                {highlightKeywords(b)}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // 3. Văn bản thuần thông thường
  return (
    <div style={{ fontSize: "15px", lineHeight: "1.7", color: "#334155" }}>
      {highlightKeywords(text)}
    </div>
  );
};

const StarOptimizationTab: React.FC<StarOptimizationTabProps> = ({ optimizationTips }) => {
  const tipGroups = optimizationTips.reduce(
    (acc: Record<string, OptimizationTip[]>, tip: OptimizationTip) => {
      if (tip && tip.group) {
        if (!acc[tip.group]) acc[tip.group] = [];
        acc[tip.group].push(tip);
      }
      return acc;
    },
    {}
  );

  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
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
          Đề xuất tối ưu hóa nội dung (STAR)
        </Title>
        <Text type="secondary" style={{ fontSize: 14 }}>
          AI viết lại các mô tả công việc chưa rõ ràng trong CV của bạn theo tiêu chuẩn STAR
          (Situation, Task, Action, Result) để gây ấn tượng mạnh với nhà tuyển dụng.
        </Text>
      </div>

      {Object.keys(tipGroups).length > 0 ? (
        Object.entries(tipGroups).map(([group, groupTips]) => (
          <Card
            key={group}
            title={
              <span style={{ color: "#0F172A", fontWeight: 700, fontSize: 15 }}>
                <InfoCircleOutlined style={{ color: "#2563EB", marginRight: 8 }} /> Mục: {group}
              </span>
            }
            style={{
              borderRadius: 16,
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              boxShadow: "0 4px 12px rgba(148, 163, 184, 0.02)",
            }}
            bodyStyle={{ padding: "16px 20px" }}
          >
            <Collapse
              ghost
              expandIconPosition="end"
              defaultActiveKey={["0"]} // Tự động mở đề xuất đầu tiên cho đỡ trống
              style={{ background: "transparent" }}
            >
              {groupTips.map((tip: OptimizationTip, idx: number) => (
                <Collapse.Panel
                  key={idx.toString()}
                  header={
                    <span
                      style={{
                        color: "#0F172A",
                        fontWeight: 600,
                        fontSize: 14,
                        display: "inline-flex",
                        alignItems: "center",
                      }}
                    >
                      💡 Đề xuất {idx + 1}: {tip.title}
                      {tip.priority === "high" && (
                        <span
                          style={{
                            marginLeft: 8,
                            fontSize: 10,
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: "#FEF2F2",
                            border: "1px solid #FECACA",
                            color: "#EF4444",
                            fontWeight: 700,
                          }}
                        >
                          ƯU TIÊN CAO
                        </span>
                      )}
                    </span>
                  }
                  style={{
                    marginBottom: 12,
                    background: "#F8FAFC",
                    borderRadius: 12,
                    border: "1px solid #E2E8F0",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ padding: "4px 8px 12px" }}>
                    <div style={{ marginBottom: 16 }}>
                      <Paragraph
                        style={{
                          color: "#334155",
                          fontSize: 15,
                          lineHeight: "1.65",
                          marginBottom: 10,
                        }}
                      >
                        {tip.detail}
                      </Paragraph>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "3px 10px",
                          background: "#F1F5F9",
                          borderRadius: 6,
                          border: "1px solid #E2E8F0",
                        }}
                      >
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
                          🎯 Cơ sở gợi ý:
                        </span>
                        <span style={{ fontSize: 13, color: "#64748B" }}>
                          Khoảng cách kỹ năng & Kinh nghiệm được đối sánh trực tiếp từ JD tuyển dụng
                        </span>
                      </div>
                    </div>

                    {tip.star_guidance && (
                      <div
                        style={{
                          background: "rgba(239, 246, 255, 0.5)",
                          padding: "14px 16px",
                          borderRadius: 10,
                          borderLeft: "4px solid #2563EB",
                          marginBottom: 16,
                        }}
                      >
                        <Text
                          strong
                          style={{
                            color: "#1E40AF",
                            fontSize: 14,
                            display: "block",
                            marginBottom: 6,
                          }}
                        >
                          📌 Hướng dẫn tối ưu STAR:
                        </Text>
                        <Text
                          style={{
                            color: "#1E3A8A",
                            fontSize: 14,
                            lineHeight: "1.65",
                            display: "block",
                          }}
                        >
                          {tip.star_guidance}
                        </Text>
                      </div>
                    )}

                    {tip.example_before && (
                      <Row gutter={[16, 16]}>
                        <Col xs={24} md={12}>
                          <div
                            style={{
                              background: "#FAF9F9",
                              padding: "16px",
                              borderRadius: 12,
                              border: "1px solid #F3EEEE",
                              height: "100%",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "flex-start",
                            }}
                          >
                            <Text
                              strong
                              style={{
                                color: "#991B1B",
                                fontSize: 12.5,
                                display: "block",
                                marginBottom: 12,
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                              }}
                            >
                              ❌ Cơ sở đối chiếu (Bản gốc CV chưa tối ưu):
                            </Text>
                            <div style={{ flex: 1 }}>{renderFormattedStarText(tip.example_before || null)}</div>
                          </div>
                        </Col>
                        <Col xs={24} md={12}>
                          <div
                            style={{
                              background: "#F6FCF8",
                              padding: "16px",
                              borderRadius: 12,
                              border: "1px solid #E1F4E8",
                              height: "100%",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "flex-start",
                            }}
                          >
                            <Text
                              strong
                              style={{
                                color: "#166534",
                                fontSize: 12.5,
                                display: "block",
                                marginBottom: 12,
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                              }}
                            >
                              ✔️ Đề xuất viết lại theo chuẩn STAR (Đo lường & Lượng hóa):
                            </Text>
                            <div style={{ flex: 1 }}>{renderFormattedStarText(tip.example_after || null)}</div>
                          </div>
                        </Col>
                      </Row>
                    )}
                  </div>
                </Collapse.Panel>
              ))}
            </Collapse>
          </Card>
        ))
      ) : (
        <Alert
          message="Tuyệt vời! CV của bạn đã viết rất chuyên nghiệp, không cần viết lại theo STAR."
          type="success"
          showIcon
        />
      )}
    </Space>
  );
};

export default StarOptimizationTab;
