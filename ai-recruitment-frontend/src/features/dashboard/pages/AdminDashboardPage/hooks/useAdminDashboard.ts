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

export function useAdminDashboard() {
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<AdminDashboardStats>(emptyAdminDashboardStats);
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

      const response = await axiosClient.get("/Dashboard/admin-stats", { params });
      const normalizedStats = normalizeAdminDashboardStats(response);
      setStats(normalizedStats);
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi tải dữ liệu Admin Dashboard");
      setStats(emptyAdminDashboardStats);
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

  return {
    loading,
    stats,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedDateRange,
    setSelectedDateRange,
    categorySelectOptions,
    aiStatusColor,
    averageProcessingText,
  };
}
