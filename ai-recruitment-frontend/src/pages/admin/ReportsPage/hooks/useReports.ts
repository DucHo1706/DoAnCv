import { useEffect, useState } from "react";
import { message } from "antd";
import axiosClient from "../../../services/axiosClient";

export function useReports() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  const fetchAdminStats = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get("/Dashboard/admin-stats");
      setStats(response.data || response);
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi tải dữ liệu thống kê tổng hợp!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const metrics = stats?.quickMetrics || {};

  // Biến đổi dữ liệu xu hướng hoạt động (Line Chart)
  const activityTrendData: any[] = [];
  if (stats?.activityTrend) {
    const rawTrend = Array.isArray(stats.activityTrend)
      ? stats.activityTrend
      : stats.activityTrend?.$values || [];
    rawTrend.forEach((item: any) => {
      activityTrendData.push({ date: item.date, value: item.cvSubmissions, type: "CV nộp mới" });
      activityTrendData.push({ date: item.date, value: item.newJobs, type: "Tin tuyển dụng mới" });
    });
  }

  // Biến đổi dữ liệu ngành nghề (Pie Chart)
  const jobCategoryData = stats?.jobCategoryShare
    ? Array.isArray(stats.jobCategoryShare)
      ? stats.jobCategoryShare
      : stats.jobCategoryShare?.$values || []
    : [];

  // Biến đổi dữ liệu phễu chuyển đổi (Column Chart)
  const funnelData = stats?.conversionFunnel
    ? Array.isArray(stats.conversionFunnel)
      ? stats.conversionFunnel
      : stats.conversionFunnel?.$values || []
    : [];

  // Danh sách chi nhánh hoạt động hiệu quả nhất
  const topBranches = metrics.topBranches
    ? Array.isArray(metrics.topBranches)
      ? metrics.topBranches
      : metrics.topBranches?.$values || []
    : [];

  return {
    loading,
    metrics,
    activityTrendData,
    jobCategoryData,
    funnelData,
    topBranches,
  };
}
