import { useState, useEffect, useRef } from "react";
import { message } from "antd";
import dashboardService, { emptyHrDashboardStats } from "../../../../../services/dashboardService";
import type { HrDashboardStats } from "../../../../../services/dashboardService";

export interface RecruiterDashboardFilters {
  categoryId?: string | null;
  positionId?: string | null;
  jobLevelId?: string | null;
  branchId?: string | null;
  jobId?: string | null;
}

export function useRecruiterDashboard(filters: RecruiterDashboardFilters = {}) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<HrDashboardStats>(emptyHrDashboardStats);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("month");

  const carouselRef = useRef<any>(null);
  const [isAutoSlide, setIsAutoSlide] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const fetchHrStats = async () => {
      setLoading(true);
      try {
        const dashboardStats = await dashboardService.getHrDashboardStats({
          ...filters,
          timeRange: selectedTimeRange,
        });
        setStats(dashboardStats);
      } catch (error) {
        const apiError = error as {
          response?: { status?: number; data?: { message?: string } };
          message?: string;
        };
        const status = apiError.response?.status;
        const serverMessage = apiError.response?.data?.message;
        const detail = serverMessage || (status ? `HTTP ${status}` : apiError.message);
        console.error("Không tải được Tổng quan tuyển dụng", error);
        message.error(detail ? `Không tải được Tổng quan tuyển dụng: ${detail}` : "Không tải được Tổng quan tuyển dụng.");
        // Giữ số liệu hiện tại khi một lần đổi bộ lọc thất bại, tránh làm
        // toàn bộ dashboard nhấp nháy về trạng thái rỗng gây hiểu nhầm.
      } finally {
        setLoading(false);
      }
    };

    fetchHrStats();
    const refreshOnRecruitmentEvent = () => { fetchHrStats(); };
    window.addEventListener("recruitment:dashboard-refresh", refreshOnRecruitmentEvent);
    return () => window.removeEventListener("recruitment:dashboard-refresh", refreshOnRecruitmentEvent);
  }, [filters.categoryId, filters.positionId, filters.jobLevelId, filters.branchId, filters.jobId, selectedTimeRange]);

  const getFitScoreColor = (score: number) => {
    if (score < 50) return "#ff4d4f";
    if (score >= 50 && score <= 70) return "#faad14";
    return "#52c41a";
  };

  const getAverageFitScoreColor = (score: number) => {
    return getFitScoreColor(score);
  };

  const carouselTitles = [
    "Thống kê Số năm Kinh nghiệm",
    "Trình độ Học văn",
    "Top 5 Trường Đại học",
  ];

  const handleCarouselPrevious = () => {
    setIsAutoSlide(false);
    if (carouselRef.current) {
      carouselRef.current.prev();
    }
  };

  const handleCarouselNext = () => {
    setIsAutoSlide(false);
    if (carouselRef.current) {
      carouselRef.current.next();
    }
  };

  const handleCarouselDotClick = (slideIndex: number) => {
    setIsAutoSlide(false);
    setActiveSlide(slideIndex);
    if (carouselRef.current) {
      carouselRef.current.goTo(slideIndex);
    }
  };

  const handleCarouselAfterChange = (currentSlide: number) => {
    setActiveSlide(currentSlide);
  };

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return "Chưa xác định";
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  const getTopSkillData = () => {
    return (stats.skillCloudData || [])
      .slice()
      .sort((firstItem, secondItem) => secondItem.value - firstItem.value)
      .slice(0, 7)
      .map((item) => ({
        skill: item.text,
        shortSkill: truncateText(item.text, 34),
        count: item.value,
      }));
  };

  const getFitScoreColumnColor = (range: string) => {
    if (range === "Trên 85") return "#52c41a";
    if (range === "70-85") return "#1677ff";
    if (range === "50-70") return "#91caff";
    return "#d9d9d9";
  };

  const getExperienceData = () => {
    if (stats.experienceData && stats.experienceData.length > 0) {
      return stats.experienceData;
    }
    return stats.expData || [];
  };

  const getUniversityCarouselData = () => {
    return (stats.universityData || [])
      .slice()
      .sort((firstItem, secondItem) => secondItem.value - firstItem.value)
      .slice(0, 5)
      .map((item) => ({
        type: item.type,
        shortType: truncateText(item.type, 28),
        value: item.value,
      }));
  };

  return {
    loading,
    stats,
    selectedTimeRange,
    setSelectedTimeRange,
    carouselRef,
    isAutoSlide,
    setIsAutoSlide,
    activeSlide,
    setActiveSlide,
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
    truncateText
  };
}
