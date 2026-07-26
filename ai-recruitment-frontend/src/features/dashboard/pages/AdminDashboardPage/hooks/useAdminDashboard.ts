import { useState, useEffect, useMemo } from "react";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { message } from "antd";
import axiosClient from "../../../../../services/axiosClient";

export interface CategoryOption {
  categoryId: string;
  categoryName: string;
}

export interface QuickMetrics {
  totalUsers: number;
  totalHrUsers: number;
  totalCandidateUsers: number;
  activeJobs: number;
  analyzedCvs: number;
  aiServerStatus: string;
  averageProcessingSeconds: number | null;
}

export interface ActivityTrendItem {
  date: string;
  cvSubmissions: number;
  newJobs: number;
}

export interface JobCategoryShareItem {
  categoryId?: string;
  categoryName: string;
  value: number;
}

export interface ConversionFunnelItem {
  stage: string;
  value: number;
  percent: number;
}

export interface OcrErrorRateItem {
  fileType: string;
  errorRate: number;
  total: number;
  failed: number;
}

export interface AdminDashboardStats {
  isSuccess: boolean;
  message: string;
  categoryOptions: CategoryOption[];
  quickMetrics: QuickMetrics;
  activityTrend: ActivityTrendItem[];
  jobCategoryShare: JobCategoryShareItem[];
  conversionFunnel: ConversionFunnelItem[];
  ocrErrorRate: OcrErrorRateItem[];
}

export const emptyAdminDashboardStats: AdminDashboardStats = {
  isSuccess: true,
  message: "",
  categoryOptions: [],
  quickMetrics: {
    totalUsers: 0,
    totalHrUsers: 0,
    totalCandidateUsers: 0,
    activeJobs: 0,
    analyzedCvs: 0,
    aiServerStatus: "Chưa có dữ liệu",
    averageProcessingSeconds: null,
  },
  activityTrend: [],
  jobCategoryShare: [],
  conversionFunnel: [],
  ocrErrorRate: [],
};

export const chartColors = [
  "#1677ff",
  "#52c41a",
  "#faad14",
  "#722ed1",
  "#13c2c2",
  "#eb2f96",
  "#fa8c16",
  "#2f54eb",
];

export function getArrayValue<T>(value: any): T[] {
  if (Array.isArray(value) === true) return value;
  if (value && Array.isArray(value.$values) === true) return value.$values;
  return [];
}

export function getNumberValue(value: any, fallback: number = 0): number {
  if (typeof value === "number" && Number.isNaN(value) === false) return value;
  if (typeof value === "string") {
    const parsedValue = Number(value);
    if (Number.isNaN(parsedValue) === false) return parsedValue;
  }
  return fallback;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export function formatPercent(value: number): string {
  return `${Number(value || 0).toFixed(1)}%`;
}

export function formatShortDate(dateValue: string): string {
  if (stringIsEmpty(dateValue) === true) return "";
  const parsedDate = dayjs(dateValue);
  if (parsedDate.isValid() === false) return dateValue;
  return parsedDate.format("DD/MM");
}

export function stringIsEmpty(value?: string | null): boolean {
  return value === undefined || value === null || value.trim().length === 0;
}

export function normalizeAdminDashboardStats(rawData: any): AdminDashboardStats {
  const source = rawData?.data ? rawData.data : rawData;
  const quickMetricsSource = source?.quickMetrics || {};

  return {
    isSuccess: source?.isSuccess ?? true,
    message: source?.message || "",
    categoryOptions: getArrayValue<CategoryOption>(source?.categoryOptions).map((item: any) => ({
      categoryId: item.categoryId || item.categoryID || item.id || "",
      categoryName: item.categoryName || item.name || "Chưa phân loại",
    })),
    quickMetrics: {
      totalUsers: getNumberValue(quickMetricsSource.totalUsers ?? source?.totalUsers),
      totalHrUsers: getNumberValue(quickMetricsSource.totalHrUsers ?? source?.totalHrUsers),
      totalCandidateUsers: getNumberValue(
        quickMetricsSource.totalCandidateUsers ?? source?.totalCandidateUsers
      ),
      activeJobs: getNumberValue(
        quickMetricsSource.activeJobs ?? source?.activeJobs ?? source?.totalJobs
      ),
      analyzedCvs: getNumberValue(
        quickMetricsSource.analyzedCvs ??
          quickMetricsSource.totalAnalyzedCVs ??
          source?.analyzedCvs ??
          source?.totalAnalyzedCVs
      ),
      aiServerStatus:
        quickMetricsSource.aiServerStatus || source?.aiServerStatus || "Chưa có dữ liệu",
      averageProcessingSeconds:
        quickMetricsSource.averageProcessingSeconds ?? source?.averageProcessingSeconds ?? null,
    },
    activityTrend: getArrayValue<ActivityTrendItem>(source?.activityTrend).map((item: any) => ({
      date: item.date || "",
      cvSubmissions: getNumberValue(item.cvSubmissions),
      newJobs: getNumberValue(item.newJobs),
    })),
    jobCategoryShare: getArrayValue<JobCategoryShareItem>(source?.jobCategoryShare).map(
      (item: any) => ({
        categoryId: item.categoryId || item.categoryID || "",
        categoryName: item.categoryName || item.type || item.name || "Chưa phân loại",
        value: getNumberValue(item.value),
      })
    ),
    conversionFunnel: getArrayValue<ConversionFunnelItem>(source?.conversionFunnel).map(
      (item: any) => ({
        stage: item.stage || item.name || "Chưa xác định",
        value: getNumberValue(item.value),
        percent: getNumberValue(item.percent),
      })
    ),
    ocrErrorRate: getArrayValue<OcrErrorRateItem>(source?.ocrErrorRate).map((item: any) => ({
      fileType: item.fileType || item.type || "Không xác định",
      errorRate: getNumberValue(item.errorRate),
      total: getNumberValue(item.total),
      failed: getNumberValue(item.failed),
    })),
  };
}

export function getStatusColor(status: string): string {
  if (status === "Bình thường") return "#52c41a";
  if (status === "Cảnh báo") return "#faad14";
  if (status === "Quá tải") return "#ff4d4f";
  return "#8c8c8c";
}

export function getStatusTagColor(status: string): string {
  if (status === "Bình thường") return "success";
  if (status === "Cảnh báo") return "warning";
  if (status === "Quá tải") return "error";
  return "default";
}

export interface TrendInfo {
  percent: number | null;
  direction: "up" | "down" | "flat";
}

function calculateTrend(current: number, previous: number): TrendInfo {
  if (previous <= 0) {
    if (current <= 0) return { percent: null, direction: "flat" };
    return { percent: 100, direction: "up" };
  }
  const percent = Math.round(((current - previous) / previous) * 1000) / 10;
  if (percent === 0) return { percent: 0, direction: "flat" };
  return { percent: Math.abs(percent), direction: percent > 0 ? "up" : "down" };
}

/**
 * Tính khoảng ngày "kỳ trước" liền kề, cùng độ dài với khoảng đang chọn.
 * Nếu không chọn khoảng thời gian, mặc định so sánh 30 ngày gần nhất với 30 ngày trước đó.
 */
function getPreviousPeriod(selectedDateRange: [Dayjs, Dayjs] | null): { fromDate: string; toDate: string } {
  if (selectedDateRange !== null) {
    const [from, to] = selectedDateRange;
    const durationDays = to.diff(from, "day") + 1;
    const previousTo = from.subtract(1, "day");
    const previousFrom = previousTo.subtract(durationDays - 1, "day");
    return {
      fromDate: previousFrom.format("YYYY-MM-DD"),
      toDate: previousTo.format("YYYY-MM-DD"),
    };
  }

  const today = dayjs();
  return {
    fromDate: today.subtract(59, "day").format("YYYY-MM-DD"),
    toDate: today.subtract(30, "day").format("YYYY-MM-DD"),
  };
}

export function useAdminDashboard() {
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<AdminDashboardStats>(emptyAdminDashboardStats);
  const [previousStats, setPreviousStats] = useState<AdminDashboardStats | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [selectedDateRange, setSelectedDateRange] = useState<[Dayjs, Dayjs] | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params: {
        categoryId?: string;
        fromDate?: string;
        toDate?: string;
      } = {};

      if (stringIsEmpty(selectedCategoryId) === false) {
        params.categoryId = selectedCategoryId;
      }
      if (selectedDateRange !== null) {
        params.fromDate = selectedDateRange[0].format("YYYY-MM-DD");
        params.toDate = selectedDateRange[1].format("YYYY-MM-DD");
      }

      const previousPeriod = getPreviousPeriod(selectedDateRange);
      const previousParams: { categoryId?: string; fromDate: string; toDate: string } = {
        ...previousPeriod,
      };
      if (stringIsEmpty(selectedCategoryId) === false) {
        previousParams.categoryId = selectedCategoryId;
      }

      const [response, previousResponse] = await Promise.all([
        axiosClient.get("/Dashboard/admin-stats", { params }),
        axiosClient.get("/Dashboard/admin-stats", { params: previousParams }).catch(() => null),
      ]);

      const normalizedStats = normalizeAdminDashboardStats(response);
      setStats(normalizedStats);
      setPreviousStats(previousResponse ? normalizeAdminDashboardStats(previousResponse) : null);
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi tải dữ liệu Admin Dashboard");
      setStats(emptyAdminDashboardStats);
      setPreviousStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedCategoryId, selectedDateRange]);

  const categorySelectOptions = useMemo(() => {
    return stats.categoryOptions.map((category) => ({
      label: category.categoryName,
      value: category.categoryId,
    }));
  }, [stats.categoryOptions]);

  const aiStatusColor = getStatusColor(stats.quickMetrics.aiServerStatus);
  const averageProcessingSeconds = stats.quickMetrics.averageProcessingSeconds;
  const averageProcessingText =
    averageProcessingSeconds === null || averageProcessingSeconds === undefined
      ? "Chưa có dữ liệu tốc độ xử lý"
      : `Avg: ${averageProcessingSeconds}s / CV`;

  const trends = useMemo(() => {
    if (previousStats === null) return null;
    return {
      totalUsers: calculateTrend(stats.quickMetrics.totalUsers, previousStats.quickMetrics.totalUsers),
      activeJobs: calculateTrend(stats.quickMetrics.activeJobs, previousStats.quickMetrics.activeJobs),
      analyzedCvs: calculateTrend(stats.quickMetrics.analyzedCvs, previousStats.quickMetrics.analyzedCvs),
    };
  }, [stats, previousStats]);

  return {
    loading,
    stats,
    trends,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedDateRange,
    setSelectedDateRange,
    categorySelectOptions,
    aiStatusColor,
    averageProcessingText,
  };
}
