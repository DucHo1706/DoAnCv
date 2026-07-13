import React from "react";
import { Space, Typography, Alert, Card } from "antd";
import { ReadOutlined } from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

interface MockInterviewQuestion {
  question: string;
  intention: string;
  star_guide: string;
  best_answer: string;
}

interface InterviewQuestionsTabProps {
  interviewQuestions: MockInterviewQuestion[];
}

const renderTextWithLinks = (text: string) => {
  if (!text) return "";
  const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(
      <a 
        key={match.index} 
        href={match[2]} 
        target="_blank" 
        rel="noopener noreferrer"
        style={{ color: "#2563EB", textDecoration: "underline", fontWeight: 500 }}
      >
        {match[1]}
      </a>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
};

const InterviewQuestionsTab: React.FC<InterviewQuestionsTabProps> = ({ interviewQuestions }) => {
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
          Gợi ý tài liệu & lộ trình ôn luyện phỏng vấn từ AI
        </Title>
        <Text type="secondary" style={{ fontSize: 14 }}>
          AI dựa trên CV và JD của vị trí tuyển dụng để tổng hợp các chủ đề ôn tập cốt lõi cùng các đường dẫn tài liệu tự học hữu ích trên internet.
        </Text>
      </div>

      {interviewQuestions.length > 0 ? (
        <Card
          size="small"
          title={
            <span style={{ color: "#2563EB", fontWeight: 700, fontSize: 14.5 }}>
              <ReadOutlined style={{ marginRight: 6 }} /> Danh sách {interviewQuestions.length} định hướng & chủ đề phỏng vấn
            </span>
          }
          style={{
            borderRadius: 14,
            background: "#EFF6FF",
            border: "1px solid #BFDBFE",
          }}
          bodyStyle={{ padding: "16px" }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {interviewQuestions.map((item: MockInterviewQuestion, index: number) => (
              <div
                key={index}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: 12,
                  padding: "18px",
                  boxShadow: "0 2px 8px rgba(148, 163, 184, 0.02)",
                }}
              >
                <div style={{ marginBottom: 12 }}>
                  <Text strong style={{ fontSize: 15, color: "#0F172A", display: "block" }}>
                    📌 Định hướng {index + 1}: {item.question}
                  </Text>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <Text strong style={{ color: "#475569", fontSize: 13 }}>🎯 Tầm quan trọng: </Text>
                  <Paragraph style={{ color: "#64748B", margin: "4px 0 0", fontSize: 14 }}>{item.intention}</Paragraph>
                </div>
                
                <div style={{ marginBottom: 12 }}>
                  <Text strong style={{ color: "#475569", fontSize: 13 }}>💡 Gợi ý chuẩn bị phỏng vấn: </Text>
                  <Paragraph style={{ color: "#64748B", margin: "4px 0 0", fontSize: 14 }}>{item.star_guide}</Paragraph>
                </div>

                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px dashed #E2E8F0" }}>
                  <Text strong style={{ color: "#2563EB", fontSize: 13.5 }}>
                    📖 Hướng dẫn ôn tập & Tài liệu gợi ý:
                  </Text>
                  <Paragraph style={{ color: "#334155", marginTop: 6, fontSize: 14, lineHeight: "1.6", whiteSpace: "pre-line" }}>
                    {renderTextWithLinks(item.best_answer)}
                  </Paragraph>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Alert
          message="AI chưa sinh gợi ý ôn tập phỏng vấn cho hồ sơ này."
          type="warning"
          showIcon
          style={{ borderRadius: 12 }}
        />
      )}
    </Space>
  );
};

export default InterviewQuestionsTab;
