import React from "react";
import { Space, Typography, Card, Alert, Row, Col } from "antd";
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
  is_fallback?: boolean;
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
                  borderRadius: 8,
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
  const normalizedTips = (optimizationTips || []).map((t: any, idx: number) => {
    const group = t.group || "Kinh nghiệm & Dự án";
    const title = t.title || (t.reason ? `Đề xuất tối ưu #${idx + 1}` : "Tối ưu mô tả kinh nghiệm theo chuẩn STAR");
    const detail = t.detail || t.reason || "Bổ sung số liệu lượng hóa và sử dụng động từ hành động mạnh để gây ấn tượng với nhà tuyển dụng.";
    const priority = t.priority || (idx === 0 ? "high" : "medium");
    const star_guidance = t.star_guidance || "Nêu rõ bối cảnh (Situation), nhiệm vụ (Task), hành động (Action) và kết quả định lượng (Result).";
    const example_before = t.example_before || t.original_text || null;
    const example_after = t.example_after || t.improved_text || null;

    return {
      group,
      title,
      detail,
      priority,
      star_guidance,
      example_before,
      example_after,
    } as OptimizationTip;
  });

  const tipGroups = normalizedTips.reduce(
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
          Đề xuất tối ưu hóa nội dung (STAR)
        </Title>
        <Text type="secondary" style={{ fontSize: 14 }}>
          AI viết lại các mô tả công việc chưa rõ ràng trong CV của bạn theo tiêu chuẩn STAR
          (Situation, Task, Action, Result) để gây ấn tượng mạnh với nhà tuyển dụng.
        </Text>
      </div>

      {normalizedTips.some((tip: any) => tip.is_fallback) && (
        <Alert
          message="Đang hiển thị phân tích cơ bản"
          description="Gemini tạm thời không khả dụng. Các gợi ý dưới đây được tạo từ câu và kỹ năng có thật trong CV; hệ thống không tự tạo thành tích hoặc số liệu."
          type="info"
          showIcon
          style={{ borderRadius: 12 }}
        />
      )}

      {Object.keys(tipGroups).length > 0 ? (
        Object.entries(tipGroups).map(([group, groupTips]) => (
          <Card
            key={group}
            size="small"
            title={
              <span style={{ color: "#0F172A", fontWeight: 700, fontSize: 15 }}>
                <InfoCircleOutlined style={{ color: "#2563EB", marginRight: 6 }} /> Phần CV: {group} ({groupTips.length} đề xuất)
              </span>
            }
            style={{
              borderRadius: 16,
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderLeft: "4px solid #2563EB",
              marginBottom: 16,
            }}
            bodyStyle={{ padding: "20px" }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {groupTips.map((tip: OptimizationTip, idx: number) => (
                <div
                  key={idx}
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: 12,
                    padding: "18px",
                  }}
                >
                  {/* Tip Header with Title and Priority Tag */}
                  <div style={{ marginBottom: 12, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    <Text strong style={{ fontSize: 15, color: "#0F172A", display: "inline-block" }}>
                      Đề xuất {idx + 1}: {tip.title}
                    </Text>
                    {tip.priority === "high" && (
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 8px",
                          borderRadius: 8,
                          background: "rgba(239, 68, 68, 0.06)",
                          border: "1px solid rgba(239, 68, 68, 0.15)",
                          color: "#EF4444",
                          fontWeight: 700,
                        }}
                      >
                        ƯU TIÊN CAO
                      </span>
                    )}
                  </div>

                  {/* Tip Detail */}
                  <Paragraph style={{ color: "#475569", fontSize: 14, lineHeight: "1.6", marginBottom: 12 }}>
                    {tip.detail}
                  </Paragraph>

                  {/* STAR Guidance */}
                  {tip.star_guidance && (
                    <div
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                        borderLeft: "3px solid #2563EB",
                        padding: "10px 14px",
                        borderRadius: 8,
                        marginBottom: 16,
                      }}
                    >
                      <Text style={{ color: "#1E293B", fontSize: 13.5, display: "block", lineHeight: "1.5" }}>
                        <strong>Hướng dẫn STAR:</strong> {tip.star_guidance}
                      </Text>
                    </div>
                  )}

                  {/* Before / After Columns */}
                  {tip.example_before && (
                    <Row gutter={[16, 12]}>
                      <Col xs={24} sm={12}>
                        <div
                          style={{
                            padding: "14px",
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
                              marginBottom: 8,
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                            }}
                          >
                            ❌ Bản gốc CV chưa tối ưu:
                          </Text>
                          <div style={{ color: "#334155", fontSize: 13.5 }}>
                            {renderFormattedStarText(tip.example_before || null)}
                          </div>
                        </div>
                      </Col>
                      <Col xs={24} sm={12}>
                        <div
                          style={{
                            padding: "14px",
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
                              marginBottom: 8,
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                            }}
                          >
                            ✔️ Đề xuất viết lại theo chuẩn STAR:
                          </Text>
                          <div style={{ color: "#1E293B", fontSize: 13.5 }}>
                            {renderFormattedStarText(tip.example_after || null)}
                          </div>
                        </div>
                      </Col>
                    </Row>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))
      ) : (
        <Alert
          message="Chưa có đủ dữ liệu để đề xuất viết lại theo STAR."
          description="Hệ thống chưa có đủ dữ liệu để tạo nội dung tối ưu STAR cho hồ sơ này."
          type="warning"
          showIcon
          style={{ borderRadius: 12 }}
        />
      )}
    </Space>
  );
};

export default StarOptimizationTab;
