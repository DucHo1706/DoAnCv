import { useState } from "react";
import { EyeOutlined, RiseOutlined, TeamOutlined, UserAddOutlined } from "@ant-design/icons";
import { Card, Col, Row, Spin, Statistic } from "antd";
import PageContainer from "../../../../components/common/PageContainer";
import { useRecruiterDashboard } from "./hooks/useRecruiterDashboard";
import { appTheme } from "../../../../constants/theme";

import DashboardFilterBar from "./components/DashboardFilterBar";
import RecruitmentPipelineFunnel from "./components/RecruitmentPipelineFunnel";
import SkillHorizontalBarChart from "./components/SkillHorizontalBarChart";
import FitScoreDistributionChart from "./components/FitScoreDistributionChart";
import TopCandidateLeaderboard from "./components/TopCandidateLeaderboard";
import AutoSliderAnalytics from "./components/AutoSliderAnalytics";

export default function RecruiterDashboardPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const {
    loading,
    stats,
    selectedJob,
    carouselRef,
    isAutoSlide,
    activeSlide,
    handleCarouselPrevious,
    handleCarouselNext,
    handleCarouselDotClick,
    handleCarouselAfterChange,
    getFitScoreColor,
    getAverageFitScoreColor,
    handleChangeSelectedJob,
    carouselTitles,
    getTopSkillData,
    getFitScoreColumnColor,
    getExperienceData,
    getUniversityCarouselData,
    truncateText,
  } = useRecruiterDashboard();

  const categories = Array.from(
    new Set(stats.jobOptions.map((job) => job.categoryName || "Lĩnh vực khác"))
  );

  const filteredJobOptions = selectedCategory
    ? stats.jobOptions.filter(
        (job) => (job.categoryName || "Lĩnh vực khác") === selectedCategory
      )
    : stats.jobOptions;

  const handleCategoryChange = (value: string | undefined) => {
    setSelectedCategory(value || null);
    if (value && selectedJob) {
      const job = stats.jobOptions.find((j) => j.jobId === selectedJob);
      if (job && (job.categoryName || "Lĩnh vực khác") !== value) {
        handleChangeSelectedJob(undefined);
      }
    }
  };

  const quickMetrics = stats.quickMetrics as any;

  return (
    <PageContainer
      title="Tổng quan tuyển dụng"
      subtitle="Theo dõi hiệu suất phễu ứng viên và phân tích chất lượng hồ sơ theo thời gian thực."
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <DashboardFilterBar
            selectedCategory={selectedCategory}
            categories={categories}
            handleCategoryChange={handleCategoryChange}
            selectedJob={selectedJob}
            handleChangeSelectedJob={handleChangeSelectedJob}
            loading={loading}
            filteredJobOptions={filteredJobOptions}
          />
        </Col>

        {/* Statistic Metric Cards */}
        <Col xs={24} md={5}>
          <Card style={{ borderRadius: 16, height: "100%", width: "100%", boxShadow: appTheme.shadow.card, border: `1px solid ${appTheme.colors.border}` }} bodyStyle={{ padding: 16 }}>
            <Statistic title="Tổng số CV đã nhận" value={stats.quickMetrics.totalApplications} valueStyle={{ fontSize: 24, fontWeight: 700, lineHeight: 1.1 }} prefix={<TeamOutlined style={{ color: "#2563EB" }} />} />
          </Card>
        </Col>

        <Col xs={24} md={5}>
          <Card style={{ borderRadius: 16, height: "100%", width: "100%", boxShadow: appTheme.shadow.card, border: `1px solid ${appTheme.colors.border}` }} bodyStyle={{ padding: 16 }}>
            <Statistic title="CV mới chưa đọc" value={stats.quickMetrics.newApplications} valueStyle={{ fontSize: 24, fontWeight: 700, lineHeight: 1.1 }} prefix={<UserAddOutlined style={{ color: "#ff4d4f" }} />} />
          </Card>
        </Col>

        <Col xs={24} md={5}>
          <Card style={{ borderRadius: 16, height: "100%", width: "100%", boxShadow: appTheme.shadow.card, border: `1px solid ${appTheme.colors.border}` }} bodyStyle={{ padding: 16 }}>
            <Statistic title="Điểm Fit Score TB" value={stats.quickMetrics.averageFitScore} precision={1} suffix="/100" valueStyle={{ fontSize: 24, fontWeight: 700, lineHeight: 1.1, color: getAverageFitScoreColor(stats.quickMetrics.averageFitScore) }} prefix={<RiseOutlined />} />
          </Card>
        </Col>

        <Col xs={24} md={5}>
          <Card style={{ borderRadius: 16, height: "100%", width: "100%", boxShadow: appTheme.shadow.card, border: `1px solid ${appTheme.colors.border}` }} bodyStyle={{ padding: 16 }}>
            <Statistic title="Tổng lượt xem tin" value={quickMetrics.totalViews || 0} valueStyle={{ fontSize: 24, fontWeight: 700, lineHeight: 1.1 }} prefix={<EyeOutlined style={{ color: "#7C3AED" }} />} />
          </Card>
        </Col>

        <Col xs={24} md={4}>
          <Card style={{ borderRadius: 16, height: "100%", width: "100%", boxShadow: appTheme.shadow.card, border: `1px solid ${appTheme.colors.border}` }} bodyStyle={{ padding: 16 }}>
            <Statistic title="Tỷ lệ ứng tuyển" value={quickMetrics.applicationRate || 0} precision={1} suffix="%" valueStyle={{ fontSize: 24, fontWeight: 700, lineHeight: 1.1, color: "#10B981" }} prefix={<RiseOutlined style={{ color: "#10B981" }} />} />
          </Card>
        </Col>
      </Row>

      {loading ? (
        <div style={{ textAlign: "center", padding: "50px 0" }}>
          <Spin size="large" tip="Đang truy xuất dữ liệu CV..." />
        </div>
      ) : (
        <>
          <RecruitmentPipelineFunnel funnel={(stats as any).funnel} />

          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Card title="Top năng lực nổi bật trong tập ứng viên" style={{ borderRadius: 16, boxShadow: appTheme.shadow.card, border: `1px solid ${appTheme.colors.border}` }}>
                <SkillHorizontalBarChart topSkillData={getTopSkillData()} />
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="Chất lượng Ứng viên (Fit Score Distribution)" style={{ borderRadius: 16, boxShadow: appTheme.shadow.card, border: `1px solid ${appTheme.colors.border}` }}>
                <FitScoreDistributionChart distributionData={stats.fitScoreDistribution || []} getFitScoreColumnColor={getFitScoreColumnColor} />
              </Card>
            </Col>
          </Row>

          <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
            <Col xs={24} lg={10}>
              <Card title="Top 5 Ứng viên tiềm năng nhất" style={{ borderRadius: 16, height: 400, boxShadow: appTheme.shadow.card, border: `1px solid ${appTheme.colors.border}` }} bodyStyle={{ padding: "12px 14px", height: 344, overflow: "hidden" }}>
                <TopCandidateLeaderboard topCandidates={stats.topCandidates || []} getFitScoreColor={getFitScoreColor} truncateText={truncateText} />
              </Card>
            </Col>

            <Col xs={24} lg={14}>
              <AutoSliderAnalytics
                carouselRef={carouselRef}
                carouselTitles={carouselTitles}
                activeSlide={activeSlide}
                isAutoSlide={isAutoSlide}
                handleCarouselPrevious={handleCarouselPrevious}
                handleCarouselNext={handleCarouselNext}
                handleCarouselDotClick={handleCarouselDotClick}
                handleCarouselAfterChange={handleCarouselAfterChange}
                experienceData={getExperienceData()}
                degreeData={stats.degreeData || []}
                universityData={getUniversityCarouselData()}
              />
            </Col>
          </Row>
        </>
      )}
    </PageContainer>
  );
}
