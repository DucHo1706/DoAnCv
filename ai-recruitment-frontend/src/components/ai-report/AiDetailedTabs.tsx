import React from "react";
import { Alert, Card, Col, Row, Skeleton, Tabs } from "antd";
import CompetencyTab from "./CompetencyTab";
import StarOptimizationTab from "./StarOptimizationTab";
import LanguageReviewTab from "./LanguageReviewTab";
import InterviewQuestionsTab from "./InterviewQuestionsTab";

interface AiDetailedTabsProps {
  parsedAnalysis: any;
  extractedSkills?: string[];
  onChange?: (activeKey: string) => void;
  tipsLoading?: boolean;
  langLoading?: boolean;
  interviewLoading?: boolean;
  isInitialLoading?: boolean;
  showLearningPath?: boolean;
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
            style={{ border: "1px solid #E2E8F0", borderRadius: 16 }}
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
  extractedSkills: extractedSkillsProp,
  onChange,
  tipsLoading = false,
  langLoading = false,
  interviewLoading = false,
  isInitialLoading = false,
  showLearningPath = true,
}) => {
  const score = parsedAnalysis?.score_analysis || {};
  const criteriaResults = parsedAnalysis?.criteria_results || [];
  const experienceTimeline = parsedAnalysis?.experience_timeline || {};
  const extractedSkills = extractedSkillsProp
    || parsedAnalysis?.extracted_skills
    || parsedAnalysis?.candidate_info?.extracted_skills
    || [];
  const tips = parsedAnalysis?.optimization_tips || [];
  const lang = parsedAnalysis?.language_review || {};
  const interviewQuestions = parsedAnalysis?.mock_interview || [];
  const extractionQuality = parsedAnalysis?.extraction_quality || {};
  const extractionMethod = String(extractionQuality?.method || "").toLowerCase();
  const extractionWarnings = Array.isArray(extractionQuality?.warnings) ? extractionQuality.warnings : [];
  const usesOcr = extractionMethod.includes("ocr") || extractionMethod.includes("tesseract");
  const hasExtractionNotice = extractionQuality?.quality_level === "partial" || extractionWarnings.length > 0;

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
          <CompetencyTab
            scoreAnalysis={score}
            extractedSkills={extractedSkills}
            criteriaResults={criteriaResults}
            experienceTimeline={experienceTimeline}
            loading={isInitialLoading}
          />
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
      label: "Lộ trình ôn tập",
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
  ].filter((item) => showLearningPath || item.key !== "4");

  return (
    <div>
      {hasExtractionNotice && (
        <Alert
          type="warning"
          showIcon
          message="Chất lượng đọc tài liệu cần lưu ý"
          description={
            usesOcr
              ? "CV được hệ thống đọc qua OCR nên một số ký tự hoặc dấu tiếng Việt có thể chưa chính xác. Đây là giới hạn của bước trích xuất, không phải lỗi của ứng viên và không được dùng làm cảnh báo năng lực."
              : "Một phần văn bản chưa được trích xuất ổn định. Hệ thống không quy lỗi ký tự hoặc định dạng này cho ứng viên."
          }
          style={{ marginBottom: 16, borderRadius: 12 }}
        />
      )}
      <Tabs defaultActiveKey="1" items={tabItems} size="large" onChange={onChange} />
    </div>
  );
};

export default AiDetailedTabs;
