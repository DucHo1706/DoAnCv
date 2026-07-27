import { useState, useEffect, useRef } from "react";
import { message } from "antd";
import dashboardService, { emptyHrDashboardStats } from "../../../../../services/dashboardService";
import type { HrDashboardStats } from "../../../../../services/dashboardService";

export function useRecruiterDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<HrDashboardStats>(emptyHrDashboardStats);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);

  const carouselRef = useRef<any>(null);
  const [isAutoSlide, setIsAutoSlide] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const fetchHrStats = async () => {
      setLoading(true);
      try {
        const dashboardStats = await dashboardService.getHrDashboardStats({
          jobId: selectedJob,
        });
        setStats(dashboardStats);
      } catch (error) {
        message.error("Lỗi khi tải dữ liệu thống kê tuyển dụng");
        setStats(emptyHrDashboardStats);
      } finally {
        setLoading(false);
      }
    };

    fetchHrStats();
  }, [selectedJob]);

  const getFitScoreColor = (score: number) => {
    if (score < 50) return "#ff4d4f";
    if (score >= 50 && score <= 70) return "#faad14";
    return "#52c41a";
  };

  const getAverageFitScoreColor = (score: number) => {
    return getFitScoreColor(score);
  };

  const handleChangeSelectedJob = (value?: string | number) => {
    if (value !== undefined && value !== null) {
      setSelectedJob(String(value));
    } else {
      setSelectedJob(null);
    }
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
    selectedJob,
    setSelectedJob,
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
    handleChangeSelectedJob,
    carouselTitles,
    getTopSkillData,
    getFitScoreColumnColor,
    getExperienceData,
    getUniversityCarouselData,
    truncateText
  };
}
