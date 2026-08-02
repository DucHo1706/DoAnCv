import React from "react";
import { Card, Col, Row, Skeleton, Tabs } from "antd";
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

type SkeletonVariant = "star" | "language" | "interview";

function AiTabSkeleton({ variant }: { variant: SkeletonVariant }) {
  const cardCount = variant === "interview" ? 3 : 2;

  return (
    <div aria-live="polite" aria-label="AI đang phân tích dữ liệu">
      <Skeleton active title={{ width: variant === "language" ? "42%" : "34%" }} paragraph={{ rows: 2 }} />
      <div style={{ display: "grid", gap: 16, marginTop: 22 }}>
        {Array.from({ length: cardCount }).map((_, index) => (
          <Card
            key={`${variant}-${index}`}
            size="small"
            style={{ border: "1px solid #E2E8F0", borderRadius: 14 }}
            styles={{ body: { padding: 20 } }}
          >
            <Skeleton.Input active size="small" style={{ width: index === 0 ? 190 : 150, marginBottom: 18 }} />
            {variant === "star" ? (
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}><Skeleton active title={false} paragraph={{ rows: 3 }} /></Col>
                <Col xs={24} md={12}><Skeleton active title={false} paragraph={{ rows: 3 }} /></Col>
              </Row>
            ) : (
              <Skeleton active title={false} paragraph={{ rows: variant === "interview" ? 2 : 3 }} />
            )}
          </Card>
        ))}
      </div>
    </div>
  );
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

  const scrollContainerStyle = {
    maxHeight: "580px",
    overflowY: "auto" as const,
    paddingRight: "12px",
    paddingBottom: "12px",
  };

  const tabItems = [
    {
      key: "1",
      label: "Năng lực & Cảnh báo",
      children: (
        <div className="custom-scrollbar" style={scrollContainerStyle}>
          <CompetencyTab scoreAnalysis={score} criteriaResults={criteriaResults} loading={isInitialLoading} />
        </div>
      ),
    },
    {
      key: "2",
      label: "Tối ưu hóa (STAR)",
      children: (
        <div className="custom-scrollbar" style={scrollContainerStyle}>
          {tipsLoading || isInitialLoading ? (
            <AiTabSkeleton variant="star" />
          ) : (
            <StarOptimizationTab optimizationTips={tips} />
          )}
        </div>
      ),
    },
    {
      key: "3",
      label: "Ngôn từ & Chân thực",
      children: (
        <div className="custom-scrollbar" style={scrollContainerStyle}>
          {langLoading || isInitialLoading ? (
            <AiTabSkeleton variant="language" />
          ) : (
            <LanguageReviewTab languageReview={lang} />
          )}
        </div>
      ),
    },
    {
      key: "4",
      label: "Gợi ý phỏng vấn",
      children: (
        <div className="custom-scrollbar" style={scrollContainerStyle}>
          {interviewLoading || isInitialLoading ? (
            <AiTabSkeleton variant="interview" />
          ) : (
            <InterviewQuestionsTab interviewQuestions={interviewQuestions} />
          )}
        </div>
      ),
    },
  ];

  return <Tabs defaultActiveKey="1" items={tabItems} size="large" onChange={onChange} />;
};

export default AiDetailedTabs;
