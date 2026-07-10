import React from "react";
import { Tabs, Spin } from "antd";
import CompetencyTab from "./CompetencyTab";
import StarOptimizationTab from "./StarOptimizationTab";
import LanguageReviewTab from "./LanguageReviewTab";
import InterviewQuestionsTab from "./InterviewQuestionsTab";

interface AiDetailedTabsProps {
  parsedAnalysis: any;
  onChange?: (activeKey: string) => void;
  tipsLoading?: boolean;
  langLoading?: boolean;
  interviewLoading?: boolean;
  isInitialLoading?: boolean;
}

const AiDetailedTabs: React.FC<AiDetailedTabsProps> = ({
  parsedAnalysis,
  onChange,
  tipsLoading = false,
  langLoading = false,
  interviewLoading = false,
  isInitialLoading = false,
}) => {
  const score = parsedAnalysis?.score_analysis || {};
  const criteriaResults = parsedAnalysis?.criteria_results || [];
  const tips = parsedAnalysis?.optimization_tips || [];
  const lang = parsedAnalysis?.language_review || {};
  const interviewQuestions = parsedAnalysis?.mock_interview || [];

  const tabItems = [
    {
      key: "1",
      label: "Năng lực & Cảnh báo",
      children: <CompetencyTab scoreAnalysis={score} criteriaResults={criteriaResults} loading={isInitialLoading} />,
    },
    {
      key: "2",
      label: "Tối ưu hóa (STAR)",
      children: tipsLoading ? (
        <div style={{ textAlign: "center", padding: "50px 0" }}>
          <Spin tip="AI đang tối ưu hóa CV theo chuẩn STAR..." size="large" />
        </div>
      ) : (
        <StarOptimizationTab optimizationTips={tips} />
      ),
    },
    {
      key: "3",
      label: "Ngôn từ & Chân thực",
      children: langLoading ? (
        <div style={{ textAlign: "center", padding: "50px 0" }}>
          <Spin tip="AI đang đánh giá chất lượng ngôn từ & phân tích tính chân thực..." size="large" />
        </div>
      ) : (
        <LanguageReviewTab languageReview={lang} />
      ),
    },
    {
      key: "4",
      label: "Gợi ý phỏng vấn",
      children: interviewLoading ? (
        <div style={{ textAlign: "center", padding: "50px 0" }}>
          <Spin tip="AI đang soạn bộ câu hỏi phỏng vấn tối ưu cho bạn..." size="large" />
        </div>
      ) : (
        <InterviewQuestionsTab interviewQuestions={interviewQuestions} />
      ),
    },
  ];

  return <Tabs defaultActiveKey="1" items={tabItems} size="large" onChange={onChange} />;
};

export default AiDetailedTabs;
