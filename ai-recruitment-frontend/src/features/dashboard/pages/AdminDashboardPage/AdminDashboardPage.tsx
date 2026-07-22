import {
  Card,
  Col,
  DatePicker,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
  Tabs,
} from "antd";
import {
  CheckCircleOutlined,
  CloudServerOutlined,
  FileTextOutlined,
  FireOutlined,
  HourglassOutlined,
  InfoCircleOutlined,
  RobotOutlined,
  SolutionOutlined,
  TeamOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { Column, Pie, Line } from "@ant-design/plots";
import PageContainer from "../../../../components/common/PageContainer";
import MetricCard from "./components/MetricCard";
import ActivityTrendChart from "./components/ActivityTrendChart";
import CategoryDonutChart from "./components/CategoryDonutChart";
import ConversionFunnelChart from "./components/ConversionFunnelChart";
import OcrErrorRateChart from "./components/OcrErrorRateChart";
import AprioriRulesSection from "./components/AprioriRulesSection";
import HUIMRulesSection from "./components/HUIMRulesSection";
import { useAdminDashboard, getStatusTagColor, formatNumber } from "./hooks/useAdminDashboard";
import axiosClient from "../../../../services/axiosClient";
import { appTheme } from "../../../../constants/theme";
import { message } from "antd";

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

const glassCardStyle: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.85)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(226, 232, 240, 0.8)",
  boxShadow: "0 8px 32px 0 rgba(148, 163, 184, 0.08)",
  borderRadius: "16px",
};

// ─── Tab 2: Recruitment Analytics ───────────────────────────────────────────
function RecruitmentAnalyticsTab() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    axiosClient
      .get("/Dashboard/admin-stats")
      .then((res) => setStats(res.data || res))
      .catch(() => message.error("Lỗi tải dữ liệu báo cáo!"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <Spin size="large" tip="Đang tính toán dữ liệu..." />
      </div>
    );
  }

  if (!stats) return null;

  const metrics = stats?.quickMetrics || {};

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

  const lineConfig = {
    data: activityTrendData,
    xField: "date",
    yField: "value",
    colorField: "type",
    smooth: true,
    legend: { position: "top" as const },
  };

  const jobCategoryData = stats?.jobCategoryShare
    ? Array.isArray(stats.jobCategoryShare)
      ? stats.jobCategoryShare
      : stats.jobCategoryShare?.$values || []
    : [];

  const pieConfig = {
    data: jobCategoryData,
    angleField: "value",
    colorField: "categoryName",
    radius: 0.75,
    legend: { position: "right" as const },
    label: { text: "value", style: { fontSize: 12, fontWeight: "bold" } },
  };

  const funnelData = stats?.conversionFunnel
    ? Array.isArray(stats.conversionFunnel)
      ? stats.conversionFunnel
      : stats.conversionFunnel?.$values || []
    : [];

  const columnConfig = {
    data: funnelData,
    xField: "stage",
    yField: "value",
    color: appTheme.colors.primary,
    label: {
      position: "top" as const,
      style: { fill: "#1e293b", opacity: 0.9, fontWeight: "bold" },
    },
  };

  const topBranches = metrics.topBranches
    ? Array.isArray(metrics.topBranches)
      ? metrics.topBranches
      : metrics.topBranches?.$values || []
    : [];

  return (
    <div>
      {/* KPI Row */}
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={glassCardStyle} bodyStyle={{ padding: 24 }}>
            <Space direction="vertical" size={4} style={{ width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>TỔNG NGƯỜI DÙNG</Text>
                <UserAddOutlined style={{ fontSize: 20, color: appTheme.colors.primary }} />
              </div>
              <Title level={2} style={{ margin: 0, fontWeight: 800 }}>{metrics.totalUsers}</Title>
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>
                Ứng viên: <strong style={{ color: "#334155" }}>{metrics.totalCandidateUsers}</strong> | HR: <strong style={{ color: "#334155" }}>{metrics.totalHrUsers}</strong>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={glassCardStyle} bodyStyle={{ padding: 24 }}>
            <Space direction="vertical" size={4} style={{ width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>TIN TUYỂN DỤNG ĐANG MỞ</Text>
                <SolutionOutlined style={{ fontSize: 20, color: appTheme.colors.success }} />
              </div>
              <Title level={2} style={{ margin: 0, fontWeight: 800 }}>{metrics.activeJobs}</Title>
              <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: "block" }}>Tin đã được duyệt & hiển thị</Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={glassCardStyle} bodyStyle={{ padding: 24 }}>
            <Space direction="vertical" size={4} style={{ width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>ỨNG VIÊN KHỚP CAO</Text>
                <CheckCircleOutlined style={{ fontSize: 20, color: "#8B5CF6" }} />
              </div>
              <Title level={2} style={{ margin: 0, fontWeight: 800 }}>{metrics.highMatchRate}%</Title>
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>
                CV phân tích thành công: <strong style={{ color: "#334155" }}>{metrics.analyzedCvs}</strong>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={glassCardStyle} bodyStyle={{ padding: 24 }}>
            <Space direction="vertical" size={4} style={{ width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>TIME-TO-HIRE (TB)</Text>
                <HourglassOutlined style={{ fontSize: 20, color: appTheme.colors.warning }} />
              </div>
              <Title level={2} style={{ margin: 0, fontWeight: 800 }}>{metrics.timeToHireDays} ngày</Title>
              <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: "block" }}>Từ lúc nộp đơn → lên lịch phỏng vấn</Text>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Charts Row 1 */}
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card title={<span style={{ fontWeight: 700 }}>Xu hướng hoạt động nền tảng</span>} style={glassCardStyle} bodyStyle={{ padding: 24 }}>
            <Line {...lineConfig} style={{ height: 320 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title={<span style={{ fontWeight: 700 }}>Top Chi nhánh tuyển dụng</span>} style={glassCardStyle} bodyStyle={{ padding: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, height: 320, overflowY: "auto" }}>
              {topBranches.length === 0 ? (
                <div style={{ textAlign: "center", padding: "80px 0", color: "#94A3B8" }}>
                  <InfoCircleOutlined style={{ fontSize: 24, marginBottom: 8, display: "block" }} />
                  Chưa có thống kê chi nhánh
                </div>
              ) : (
                topBranches.map((item: any, idx: number) => {
                  const iconColor = idx === 0 ? "#F59E0B" : idx === 1 ? "#94A3B8" : idx === 2 ? "#B45309" : "#E2E8F0";
                  return (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, borderBottom: "1px solid #F1F5F9" }}>
                      <Space>
                        <span style={{ display: "inline-flex", width: 24, height: 24, borderRadius: "50%", background: iconColor, color: idx < 3 ? "#FFFFFF" : "#475569", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: "bold" }}>{idx + 1}</span>
                        <Text strong style={{ color: "#334155" }}>{item.branchName}</Text>
                      </Space>
                      <Tag color="blue" style={{ borderRadius: 6, fontWeight: "bold" }}>{item.count} tin đăng</Tag>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Charts Row 2 */}
      <Row gutter={[20, 20]}>
        <Col xs={24} md={12}>
          <Card title={<span style={{ fontWeight: 700 }}>Phễu chuyển đổi ứng tuyển</span>} style={glassCardStyle} bodyStyle={{ padding: 24 }}>
            <ConversionFunnelChart data={funnelData} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title={<span style={{ fontWeight: 700 }}>Tỷ trọng tin đăng theo Lĩnh vực</span>} style={glassCardStyle} bodyStyle={{ padding: 24 }}>
            <Pie {...pieConfig} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>

      {/* AI Status Footer */}
      <Card style={{ marginTop: 24, borderRadius: 16, background: "rgba(37, 99, 235, 0.03)", border: "1px dashed rgba(37, 99, 235, 0.2)", padding: "8px 12px" }}>
        <Space size="middle" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}>
          <Space>
            <FireOutlined style={{ color: "#2563EB" }} />
            <Text strong style={{ color: "#1E3A8A" }}>TRẠNG THÁI AI ENGINE:</Text>
            <Text style={{ color: "#3B82F6", fontWeight: 650 }}>{metrics.aiServerStatus}</Text>
          </Space>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Xử lý OCR & NLP trung bình: <strong style={{ color: "#1E3A8A" }}>{metrics.averageProcessingSeconds ?? "0"} giây / CV</strong>
          </Text>
        </Space>
      </Card>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const {
    loading,
    stats,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedDateRange,
    setSelectedDateRange,
    categorySelectOptions,
    aiStatusColor,
    averageProcessingText,
  } = useAdminDashboard();

  const tabItems = [
    {
      key: "overview",
      label: "Tổng quan hệ thống",
      children: (
        <>
          {/* Filter bar */}
          <Card
            bordered={false}
            style={{ marginBottom: 24, borderRadius: 16, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)" }}
            bodyStyle={{ padding: 20 }}
          >
            <Row gutter={[24, 16]} align="middle">
              <Col xs={24} md={24} lg={4}>
                <Text strong style={{ fontSize: 16 }}>Bộ lọc</Text>
              </Col>
              <Col xs={24} md={12} lg={10}>
                <Text type="secondary" style={{ display: "block", marginBottom: 6 }}>Lĩnh vực tuyển dụng</Text>
                <Select
                  showSearch
                  allowClear
                  style={{ width: "100%" }}
                  placeholder="Tất cả lĩnh vực"
                  value={selectedCategoryId}
                  options={categorySelectOptions}
                  optionFilterProp="label"
                  onChange={(value) => setSelectedCategoryId(value)}
                />
              </Col>
              <Col xs={24} md={12} lg={10}>
                <Text type="secondary" style={{ display: "block", marginBottom: 6 }}>Khoảng thời gian</Text>
                <RangePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  value={selectedDateRange}
                  allowClear
                  presets={[
                    { label: "Tuần này", value: [dayjs().startOf("week"), dayjs().endOf("week")] },
                    { label: "Tháng này", value: [dayjs().startOf("month"), dayjs().endOf("month")] },
                    { label: "Năm nay", value: [dayjs().startOf("year"), dayjs().endOf("year")] },
                  ]}
                  onChange={(dates) => {
                    if (!dates || !dates[0] || !dates[1]) {
                      setSelectedDateRange(null);
                      return;
                    }
                    setSelectedDateRange([dates[0], dates[1]]);
                  }}
                />
              </Col>
            </Row>
          </Card>

          {loading ? (
            <div style={{ minHeight: 420, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Spin size="large" tip="Đang tổng hợp dữ liệu hệ thống..." />
            </div>
          ) : (
            <>
              <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                  <MetricCard title="Tổng Người Dùng" value={stats.quickMetrics.totalUsers} subtitle={`${formatNumber(stats.quickMetrics.totalHrUsers)} HR | ${formatNumber(stats.quickMetrics.totalCandidateUsers)} Candidate`} icon={<TeamOutlined />} color="#1677ff" />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <MetricCard title="Tin Tuyển Dụng Active" value={stats.quickMetrics.activeJobs} subtitle="Job đang public và chưa hết hạn" icon={<FileTextOutlined />} color="#52c41a" />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <MetricCard title="CV Đã Phân Tích AI" value={stats.quickMetrics.analyzedCvs} subtitle="AI OCR/NLP xử lý thành công" icon={<RobotOutlined />} color="#722ed1" />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card bordered={false} style={{ height: "100%", borderRadius: 16, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)" }} bodyStyle={{ padding: 20 }}>
                    <Space align="start" style={{ width: "100%", justifyContent: "space-between" }}>
                      <div>
                        <Text type="secondary" style={{ fontSize: 13 }}>Trạng thái Máy chủ AI</Text>
                        <div style={{ marginTop: 8, marginBottom: 8 }}>
                          <Tag color={getStatusTagColor(stats.quickMetrics.aiServerStatus)} style={{ fontSize: 16, padding: "5px 12px", borderRadius: 999, fontWeight: 700 }}>
                            {stats.quickMetrics.aiServerStatus}
                          </Tag>
                        </div>
                        <Text type="secondary" style={{ fontSize: 12 }}>{averageProcessingText}</Text>
                      </div>
                      <div style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: `${aiStatusColor}14`, color: aiStatusColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                        <CloudServerOutlined />
                      </div>
                    </Space>
                  </Card>
                </Col>
              </Row>

              <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
                <Col xs={24} xl={16}>
                  <Card bordered={false} title="Lưu lượng Hoạt động theo thời gian" extra={<Text type="secondary">CV nộp vào hệ thống và tin tuyển dụng mới</Text>} style={{ height: "100%", borderRadius: 16, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)" }}>
                    <ActivityTrendChart data={stats.activityTrend} />
                  </Card>
                </Col>
                <Col xs={24} xl={8}>
                  <Card bordered={false} title="Tỷ trọng Tin đăng theo Lĩnh vực" style={{ height: "100%", borderRadius: 16, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)" }}>
                    <CategoryDonutChart data={stats.jobCategoryShare} />
                  </Card>
                </Col>
              </Row>

              <Row gutter={[24, 24]}>
                <Col xs={24} xl={14}>
                  <Card bordered={false} title="Tỷ lệ chuyển đổi tổng thể" extra={<Text type="secondary">Platform Conversion Rate</Text>} style={{ height: "100%", borderRadius: 16, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)" }}>
                    <ConversionFunnelChart data={stats.conversionFunnel} />
                  </Card>
                </Col>
                <Col xs={24} xl={10}>
                  <Card bordered={false} title="Thống kê Lỗi Nhận diện OCR/NLP" extra={<Text type="secondary">Error Rate</Text>} style={{ height: "100%", borderRadius: 16, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)" }}>
                    <OcrErrorRateChart data={stats.ocrErrorRate} />
                  </Card>
                </Col>
              </Row>
            </>
          )}
        </>
      ),
    },
    {
      key: "analytics",
      label: "Recruitment Analytics",
      children: <RecruitmentAnalyticsTab />,
    },
    {
      key: "datamining",
      label: "Phân tích Kỹ năng & Tri thức Tuyển dụng",
      children: (
        <div>
          <AprioriRulesSection />
          <HUIMRulesSection />
        </div>
      ),
    },
  ];

  return (
    <PageContainer title="Analytics & Insights">
      <Tabs
        defaultActiveKey="overview"
        size="large"
        items={tabItems}
        style={{ marginTop: -8 }}
        tabBarStyle={{ marginBottom: 24, fontWeight: 600 }}
      />
    </PageContainer>
  );
}
