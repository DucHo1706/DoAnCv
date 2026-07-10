import React from "react";
import { Space, Typography, Alert, Collapse } from "antd";

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

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
          Gợi ý tài liệu & lộ trình ôn luyện phỏng vấn từ AI
        </Title>
        <Text type="secondary" style={{ fontSize: 14 }}>
          AI dựa trên CV và JD của vị trí tuyển dụng để tổng hợp các chủ đề ôn tập cốt lõi cùng các đường dẫn tài liệu tự học hữu ích trên internet.
        </Text>
      </div>
      {interviewQuestions.length > 0 ? (
        <Collapse
          accordion
          bordered={false}
          defaultActiveKey={["0"]}
          expandIconPosition="end"
          style={{ background: "white" }}
        >
          {interviewQuestions.map((item: MockInterviewQuestion, index: number) => (
            <Panel
              header={
                <Text strong style={{ color: "#0F172A" }}>
                  Chủ đề {index + 1}: {item.question}
                </Text>
              }
              key={index.toString()}
              style={{
                marginBottom: 12,
                background: "#f8fafc",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "8px 0" }}>
                <div style={{ marginBottom: 12 }}>
                  <Text strong style={{ color: "#475569" }}>Tầm quan trọng: </Text>
                  <Paragraph style={{ color: "#64748B", margin: "4px 0 0" }}>{item.intention}</Paragraph>
                </div>
                
                <div style={{ marginBottom: 12 }}>
                  <Text strong style={{ color: "#475569" }}>Cách hệ thống theo chuẩn STAR: </Text>
                  <Paragraph style={{ color: "#64748B", margin: "4px 0 0" }}>{item.star_guide}</Paragraph>
                </div>

                <div style={{ marginTop: 8 }}>
                  <Text strong style={{ color: "#2563EB" }}>
                    Gợi ý ôn luyện & Tài liệu tham khảo:
                  </Text>
                  <Paragraph style={{ color: "#475569", marginTop: 4, whiteSpace: "pre-line" }}>
                    {renderTextWithLinks(item.best_answer)}
                  </Paragraph>
                </div>
              </div>
            </Panel>
          ))}
        </Collapse>
      ) : (
        <Alert
          message="AI chưa sinh gợi ý ôn tập phỏng vấn cho hồ sơ này."
          type="warning"
          showIcon
        />
      )}
    </Space>
  );
};

export default InterviewQuestionsTab;
