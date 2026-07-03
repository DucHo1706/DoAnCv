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
          Gợi ý các kịch bản phỏng vấn chuyên sâu từ AI
        </Title>
        <Text type="secondary" style={{ fontSize: 14 }}>
          AI dựa trên CV và tin tuyển dụng để tạo ra các câu hỏi phỏng vấn chuyên sâu, giúp bạn
          chuẩn bị tốt hơn cho buổi phỏng vấn.
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
                  Câu hỏi {index + 1}: {item.question}
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
                <Text strong style={{ color: "#2563EB" }}>
                  AI Gợi ý trả lời:
                </Text>
                <Paragraph style={{ color: "#475569" }}>{item.best_answer}</Paragraph>
              </div>
            </Panel>
          ))}
        </Collapse>
      ) : (
        <Alert
          message="AI chưa sinh kịch bản câu hỏi phỏng vấn cho hồ sơ này."
          type="warning"
          showIcon
        />
      )}
    </Space>
  );
};

export default InterviewQuestionsTab;
