import { useEffect, useState } from "react";
import { EyeOutlined, RiseOutlined, TeamOutlined, UserAddOutlined, ClockCircleOutlined } from "@ant-design/icons";
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
import ApplicationTrendChart from "./components/ApplicationTrendChart";
import UpcomingInterviewsWidget from "./components/UpcomingInterviewsWidget";

export default function RecruiterDashboardPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [selectedJobLevel, setSelectedJobLevel] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);

  const {
    loading,
    stats,
    selectedTimeRange,
    setSelectedTimeRange,
    carouselRef,
    isAutoSlide,
    activeSlide,
    handleCarouselPrevious,
    handleCarouselNext,
    handleCarouselDotClick,
    handleCarouselAfterChange,
    getFitScoreColor,
    getAverageFitScoreColor,
    carouselTitles,
    getTopSkillData,
    getFitScoreColumnColor,
    getExperienceData,
    getUniversityCarouselData,
    truncateText,
  } = useRecruiterDashboard({
    categoryId: selectedCategory,
    positionId: selectedPosition,
    jobLevelId: selectedJobLevel,
    branchId: selectedBranch,
    jobId: selectedJob,
  });

  const categories = Array.from(
    new Map(
      stats.jobOptions
        .filter((job) => job.categoryId)
        .map((job) => [job.categoryId as string, { value: job.categoryId as string, label: job.categoryName || "Lĩnh vực khác" }])
    ).values()
  );

  // Các bộ lọc chiều (lĩnh vực/vị trí/cấp bậc/chi nhánh) phải cùng một ngữ
  // cảnh với tin tuyển dụng. Chỉ hiển thị những tin còn phù hợp để HR không
  // chọn một tổ hợp chắc chắn trả về "Không có dữ liệu".
  const filteredJobOptions = stats.jobOptions.filter((job) =>
    (!selectedCategory || job.categoryId === selectedCategory) &&
    (!selectedPosition || job.positionId === selectedPosition) &&
    (!selectedJobLevel || job.jobLevelId === selectedJobLevel) &&
    (!selectedBranch || job.branchId === selectedBranch)
  );

  // Các option phụ thuộc phải lấy từ chính các tin tuyển dụng đang có,
  // tránh hiển thị toàn bộ vị trí của hệ thống khi HR đã chọn một lĩnh vực.
  const jobsForPositionOptions = stats.jobOptions.filter((job) =>
    (!selectedCategory || job.categoryId === selectedCategory) &&
    (!selectedJobLevel || job.jobLevelId === selectedJobLevel) &&
    (!selectedBranch || job.branchId === selectedBranch)
  );
  const jobsForLevelOptions = stats.jobOptions.filter((job) =>
    (!selectedCategory || job.categoryId === selectedCategory) &&
    (!selectedPosition || job.positionId === selectedPosition) &&
    (!selectedBranch || job.branchId === selectedBranch)
  );
  const jobsForBranchOptions = stats.jobOptions.filter((job) =>
    (!selectedCategory || job.categoryId === selectedCategory) &&
    (!selectedPosition || job.positionId === selectedPosition) &&
    (!selectedJobLevel || job.jobLevelId === selectedJobLevel)
  );

  const positionOptionIds = new Set(jobsForPositionOptions.map((job) => job.positionId).filter(Boolean));
  const jobLevelOptionIds = new Set(jobsForLevelOptions.map((job) => job.jobLevelId).filter(Boolean));
  const branchOptionIds = new Set(jobsForBranchOptions.map((job) => job.branchId).filter(Boolean));
  const filteredPositionOptions = stats.positionOptions.filter((item) => positionOptionIds.has(item.id));
  const filteredJobLevelOptions = stats.jobLevelOptions.filter((item) => jobLevelOptionIds.has(item.id));
  const filteredBranchOptions = stats.branchOptions.filter((item) => branchOptionIds.has(item.id));

  useEffect(() => {
    if (selectedPosition && !filteredPositionOptions.some((item) => item.id === selectedPosition)) setSelectedPosition(null);
    if (selectedJobLevel && !filteredJobLevelOptions.some((item) => item.id === selectedJobLevel)) setSelectedJobLevel(null);
    if (selectedBranch && !filteredBranchOptions.some((item) => item.id === selectedBranch)) setSelectedBranch(null);
    if (selectedJob && !filteredJobOptions.some((item) => String(item.jobId) === selectedJob)) setSelectedJob(null);
  }, [stats.jobOptions, selectedPosition, selectedJobLevel, selectedBranch, selectedJob]);

  const clearSelectedJobWhenIncompatible = (next: {
    categoryId?: string | null;
    positionId?: string | null;
    jobLevelId?: string | null;
    branchId?: string | null;
  }) => {
    if (!selectedJob) return;
    const job = stats.jobOptions.find((item) => String(item.jobId) === String(selectedJob));
    if (!job) {
      setSelectedJob(null);
      return;
    }
    const matches =
      (!next.categoryId || job.categoryId === next.categoryId) &&
      (!next.positionId || job.positionId === next.positionId) &&
      (!next.jobLevelId || job.jobLevelId === next.jobLevelId) &&
      (!next.branchId || job.branchId === next.branchId);
    if (!matches) setSelectedJob(null);
  };

  const handleCategoryChange = (value: string | undefined) => {
    const nextValue = value || null;
    setSelectedCategory(nextValue);
    setSelectedPosition(null);
    setSelectedJobLevel(null);
    setSelectedBranch(null);
    setSelectedJob(null);
  };

  const handlePositionChange = (value?: string) => {
    const nextValue = value || null;
    setSelectedPosition(nextValue);
    clearSelectedJobWhenIncompatible({ categoryId: selectedCategory, positionId: nextValue, jobLevelId: selectedJobLevel, branchId: selectedBranch });
  };

  const handleJobLevelChange = (value?: string) => {
    const nextValue = value || null;
    setSelectedJobLevel(nextValue);
    clearSelectedJobWhenIncompatible({ categoryId: selectedCategory, positionId: selectedPosition, jobLevelId: nextValue, branchId: selectedBranch });
  };

  const handleBranchChange = (value?: string) => {
    const nextValue = value || null;
    setSelectedBranch(nextValue);
    clearSelectedJobWhenIncompatible({ categoryId: selectedCategory, positionId: selectedPosition, jobLevelId: selectedJobLevel, branchId: nextValue });
  };

  const handleJobChange = (value?: number | string) => {
    const nextJobId = value == null ? null : String(value);
    setSelectedJob(nextJobId);
    if (!nextJobId) return;

    // Chọn tin là một thao tác tra cứu cụ thể: tự đồng bộ các chiều lọc theo
    // metadata của tin, kể cả tin đã đóng để HR vẫn xem được lịch sử.
    const job = stats.jobOptions.find((item) => String(item.jobId) === nextJobId);
    if (!job) return;
    setSelectedCategory(job.categoryId || null);
    setSelectedPosition(job.positionId || null);
    setSelectedJobLevel(job.jobLevelId || null);
    setSelectedBranch(job.branchId || null);
  };

  const quickMetrics = stats.quickMetrics as any;

  return (
    <PageContainer title="Tổng quan tuyển dụng">
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <DashboardFilterBar
            selectedCategory={selectedCategory}
            categories={categories}
            handleCategoryChange={handleCategoryChange}
            selectedJob={selectedJob}
            handleChangeSelectedJob={handleJobChange}
            selectedPosition={selectedPosition}
            handlePositionChange={handlePositionChange}
            positionOptions={filteredPositionOptions}
            selectedJobLevel={selectedJobLevel}
            handleJobLevelChange={handleJobLevelChange}
            jobLevelOptions={filteredJobLevelOptions}
            selectedBranch={selectedBranch}
            handleBranchChange={handleBranchChange}
            branchOptions={filteredBranchOptions}
            loading={loading}
            filteredJobOptions={filteredJobOptions}
            selectedTimeRange={selectedTimeRange}
            handleTimeRangeChange={setSelectedTimeRange}
          />
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 16, height: "100%", width: "100%", boxShadow: appTheme.shadow.card, border: `1px solid ${appTheme.colors.border}` }} bodyStyle={{ padding: 16 }}>
            <Statistic title="Tổng số CV đã nhận" value={stats.quickMetrics.totalApplications} valueStyle={{ fontSize: 22, fontWeight: 700, lineHeight: 1.1 }} prefix={<TeamOutlined style={{ color: "#2563EB" }} />} />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 16, height: "100%", width: "100%", boxShadow: appTheme.shadow.card, border: `1px solid ${appTheme.colors.border}` }} bodyStyle={{ padding: 16 }}>
            <Statistic title="CV mới chưa đọc" value={stats.quickMetrics.newApplications} valueStyle={{ fontSize: 22, fontWeight: 700, lineHeight: 1.1 }} prefix={<UserAddOutlined style={{ color: "#EF4444" }} />} />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 16, height: "100%", width: "100%", boxShadow: appTheme.shadow.card, border: `1px solid ${appTheme.colors.border}` }} bodyStyle={{ padding: 16 }}>
            <Statistic title="Điểm phù hợp trung bình" value={stats.quickMetrics.averageFitScore} precision={1} suffix="/100" valueStyle={{ fontSize: 22, fontWeight: 700, lineHeight: 1.1, color: getAverageFitScoreColor(stats.quickMetrics.averageFitScore) }} prefix={<RiseOutlined />} />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 16, height: "100%", width: "100%", boxShadow: appTheme.shadow.card, border: `1px solid ${appTheme.colors.border}` }} bodyStyle={{ padding: 16 }}>
            <Statistic title="Thời gian đến lịch phỏng vấn TB" value={quickMetrics.avgTimeToHireDays || 0} precision={1} suffix=" ngày" valueStyle={{ fontSize: 22, fontWeight: 700, lineHeight: 1.1, color: "#D97706" }} prefix={<ClockCircleOutlined style={{ color: "#F59E0B" }} />} />
          </Card>
        </Col>

        <Col span={24}>
          <Card title="Hoạt động nhanh" style={{ borderRadius: 16, boxShadow: appTheme.shadow.card, border: `1px solid ${appTheme.colors.border}` }} bodyStyle={{ padding: 16 }}>
            <Row gutter={[16, 16]}>
              <Col xs={12} lg={6}><Statistic title="CV nhận hôm nay" value={stats.quickMetrics.applicationsToday} prefix={<UserAddOutlined style={{ color: "#2563EB" }} />} /></Col>
              <Col xs={12} lg={6}><Statistic title="Chuyển trạng thái hôm nay" value={stats.quickMetrics.statusChangesToday} prefix={<RiseOutlined style={{ color: "#10B981" }} />} /></Col>
              <Col xs={12} lg={6}><Statistic title="Tổng lượt xem tin" value={quickMetrics.totalViews || 0} prefix={<EyeOutlined style={{ color: "#7C3AED" }} />} /></Col>
              <Col xs={12} lg={6}><Statistic title="Tỷ lệ ứng tuyển" value={quickMetrics.applicationRate || 0} precision={1} suffix="%" valueStyle={{ color: "#10B981" }} /></Col>
            </Row>
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

          {/* Application Trend & Upcoming Interviews Row */}
          <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={14}>
              <ApplicationTrendChart trendData={(stats as any).applicationTrend || []} />
            </Col>
            <Col xs={24} lg={10}>
              <UpcomingInterviewsWidget interviews={(stats as any).upcomingInterviews || []} />
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Card title="Top năng lực nổi bật trong tập ứng viên" style={{ borderRadius: 16, boxShadow: appTheme.shadow.card, border: `1px solid ${appTheme.colors.border}` }}>
                <SkillHorizontalBarChart topSkillData={getTopSkillData()} />
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="Phân bố điểm phù hợp của ứng viên" style={{ borderRadius: 16, boxShadow: appTheme.shadow.card, border: `1px solid ${appTheme.colors.border}` }}>
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
