import {
  Card,
  Col,
  DatePicker,
  Empty,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  ApiOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloudServerOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  FilterOutlined,
  RobotOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import PageContainer from "../../components/common/PageContainer";
import axiosClient from "../../services/axiosClient";

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

interface CategoryOption {
  categoryId: string;
  categoryName: string;
}

interface QuickMetrics {
  totalUsers: number;
  totalHrUsers: number;
  totalCandidateUsers: number;
  activeJobs: number;
  analyzedCvs: number;
  aiServerStatus: string;
  averageProcessingSeconds: number | null;
}

interface ActivityTrendItem {
  date: string;
  cvSubmissions: number;
  newJobs: number;
}

interface JobCategoryShareItem {
  categoryId?: string;
  categoryName: string;
  value: number;
}

interface ConversionFunnelItem {
  stage: string;
  value: number;
  percent: number;
}

interface OcrErrorRateItem {
  fileType: string;
  errorRate: number;
  total: number;
  failed: number;
}

interface AdminDashboardStats {
  isSuccess: boolean;
  message: string;
  categoryOptions: CategoryOption[];
  quickMetrics: QuickMetrics;
  activityTrend: ActivityTrendItem[];
  jobCategoryShare: JobCategoryShareItem[];
  conversionFunnel: ConversionFunnelItem[];
  ocrErrorRate: OcrErrorRateItem[];
}

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  valueSuffix?: string;
}

interface EmptyChartProps {
  description: string;
  height?: number;
}

const emptyAdminDashboardStats: AdminDashboardStats = {
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

const chartColors = [
  "#1677ff",
  "#52c41a",
  "#faad14",
  "#722ed1",
  "#13c2c2",
  "#eb2f96",
  "#fa8c16",
  "#2f54eb",
];

function getArrayValue<T>(value: any): T[] {
  if (Array.isArray(value) === true) {
    return value;
  }

  if (value && Array.isArray(value.$values) === true) {
    return value.$values;
  }

  return [];
}

function getNumberValue(value: any, fallback: number = 0): number {
  if (typeof value === "number" && Number.isNaN(value) === false) {
    return value;
  }

  if (typeof value === "string") {
    const parsedValue = Number(value);

    if (Number.isNaN(parsedValue) === false) {
      return parsedValue;
    }
  }

  return fallback;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function formatPercent(value: number): string {
  return `${Number(value || 0).toFixed(1)}%`;
}

function formatShortDate(dateValue: string): string {
  if (stringIsEmpty(dateValue) === true) {
    return "";
  }

  const parsedDate = dayjs(dateValue);

  if (parsedDate.isValid() === false) {
    return dateValue;
  }

  return parsedDate.format("DD/MM");
}

function stringIsEmpty(value?: string | null): boolean {
  return value === undefined || value === null || value.trim().length === 0;
}

function normalizeAdminDashboardStats(rawData: any): AdminDashboardStats {
  const source = rawData?.data ? rawData.data : rawData;

  const quickMetricsSource = source?.quickMetrics || {};

  const normalizedStats: AdminDashboardStats = {
    isSuccess: source?.isSuccess ?? true,
    message: source?.message || "",
    categoryOptions: getArrayValue<CategoryOption>(source?.categoryOptions).map((item: any) => {
      return {
        categoryId: item.categoryId || item.categoryID || item.id || "",
        categoryName: item.categoryName || item.name || "Chưa phân loại",
      };
    }),
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
        quickMetricsSource.averageProcessingSeconds ??
        source?.averageProcessingSeconds ??
        null,
    },
    activityTrend: getArrayValue<ActivityTrendItem>(source?.activityTrend).map((item: any) => {
      return {
        date: item.date || "",
        cvSubmissions: getNumberValue(item.cvSubmissions),
        newJobs: getNumberValue(item.newJobs),
      };
    }),
    jobCategoryShare: getArrayValue<JobCategoryShareItem>(source?.jobCategoryShare).map(
      (item: any) => {
        return {
          categoryId: item.categoryId || item.categoryID || "",
          categoryName: item.categoryName || item.type || item.name || "Chưa phân loại",
          value: getNumberValue(item.value),
        };
      }
    ),
    conversionFunnel: getArrayValue<ConversionFunnelItem>(source?.conversionFunnel).map(
      (item: any) => {
        return {
          stage: item.stage || item.name || "Chưa xác định",
          value: getNumberValue(item.value),
          percent: getNumberValue(item.percent),
        };
      }
    ),
    ocrErrorRate: getArrayValue<OcrErrorRateItem>(source?.ocrErrorRate).map((item: any) => {
      return {
        fileType: item.fileType || item.type || "Không xác định",
        errorRate: getNumberValue(item.errorRate),
        total: getNumberValue(item.total),
        failed: getNumberValue(item.failed),
      };
    }),
  };

  return normalizedStats;
}

function getStatusColor(status: string): string {
  if (status === "Bình thường") {
    return "#52c41a";
  }

  if (status === "Cảnh báo") {
    return "#faad14";
  }

  if (status === "Quá tải") {
    return "#ff4d4f";
  }

  return "#8c8c8c";
}

function getStatusTagColor(status: string): string {
  if (status === "Bình thường") {
    return "success";
  }

  if (status === "Cảnh báo") {
    return "warning";
  }

  if (status === "Quá tải") {
    return "error";
  }

  return "default";
}

function MetricCard(props: MetricCardProps) {
  return (
    <Card
      bordered={false}
      style={{
        height: "100%",
        borderRadius: 16,
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
      }}
      bodyStyle={{ padding: 20 }}
    >
      <Space align="start" style={{ width: "100%", justifyContent: "space-between" }}>
        <div>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {props.title}
          </Text>

          <Statistic
            value={props.value}
            suffix={props.valueSuffix}
            valueStyle={{
              color: props.color,
              fontSize: 30,
              fontWeight: 800,
              lineHeight: "40px",
            }}
          />

          <Text type="secondary" style={{ fontSize: 12 }}>
            {props.subtitle}
          </Text>
        </div>

        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: `${props.color}14`,
            color: props.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
          }}
        >
          {props.icon}
        </div>
      </Space>
    </Card>
  );
}

function EmptyChart(props: EmptyChartProps) {
  const chartHeight = props.height || 260;

  return (
    <div
      style={{
        height: chartHeight,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={props.description} />
    </div>
  );
}

function ActivityTrendChart(props: { data: ActivityTrendItem[] }) {
  const data = props.data || [];

  const chartData = useMemo(() => {
    if (data.length <= 45) {
      return data;
    }

    const groupedData = new Map<string, ActivityTrendItem>();

    data.forEach((item) => {
      const parsedDate = dayjs(item.date);
      let groupKey = item.date;

      if (parsedDate.isValid() === true) {
        groupKey = parsedDate.format("MM/YYYY");
      }

      const existingItem = groupedData.get(groupKey);

      if (existingItem) {
        existingItem.cvSubmissions = existingItem.cvSubmissions + item.cvSubmissions;
        existingItem.newJobs = existingItem.newJobs + item.newJobs;
      } else {
        groupedData.set(groupKey, {
          date: groupKey,
          cvSubmissions: item.cvSubmissions,
          newJobs: item.newJobs,
        });
      }
    });

    return Array.from(groupedData.values());
  }, [data]);

  if (chartData.length === 0) {
    return <EmptyChart description="Chưa có dữ liệu lưu lượng hoạt động." />;
  }

  const maxValue = Math.max(
    1,
    ...chartData.map((item) => {
      return Math.max(item.cvSubmissions, item.newJobs);
    })
  );

  return (
    <div style={{ height: 290, paddingTop: 12 }}>
      <div
        style={{
          height: 226,
          borderLeft: "1px solid #f0f0f0",
          borderBottom: "1px solid #f0f0f0",
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
          padding: "0 8px",
        }}
      >
        {chartData.map((item, index) => {
          const cvHeight = Math.max(6, (item.cvSubmissions / maxValue) * 200);
          const jobHeight = Math.max(6, (item.newJobs / maxValue) * 200);
          const label = chartData.length > 45 ? item.date : formatShortDate(item.date);

          return (
            <Tooltip
              key={`${item.date}-${index}`}
              title={
                <div>
                  <div>
                    <b>{chartData.length > 45 ? item.date : dayjs(item.date).format("DD/MM/YYYY")}</b>
                  </div>
                  <div>CV nộp: {formatNumber(item.cvSubmissions)}</div>
                  <div>Tin đăng mới: {formatNumber(item.newJobs)}</div>
                </div>
              }
            >
              <div
                style={{
                  flex: 1,
                  minWidth: chartData.length > 20 ? 8 : 18,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    height: 205,
                    width: "100%",
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    gap: 3,
                  }}
                >
                  <div
                    style={{
                      height: cvHeight,
                      width: chartData.length > 20 ? 6 : 10,
                      borderRadius: "8px 8px 0 0",
                      background: "linear-gradient(180deg, #69b1ff 0%, #1677ff 100%)",
                    }}
                  />

                  <div
                    style={{
                      height: jobHeight,
                      width: chartData.length > 20 ? 6 : 10,
                      borderRadius: "8px 8px 0 0",
                      background: "linear-gradient(180deg, #ffd591 0%, #fa8c16 100%)",
                    }}
                  />
                </div>

                {index % Math.ceil(chartData.length / 8) === 0 && (
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 10,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {label}
                  </Text>
                )}
              </div>
            </Tooltip>
          );
        })}
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 18, justifyContent: "center" }}>
        <Space size={6}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              backgroundColor: "#1677ff",
              display: "inline-block",
            }}
          />
          <Text type="secondary">CV nộp</Text>
        </Space>

        <Space size={6}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              backgroundColor: "#fa8c16",
              display: "inline-block",
            }}
          />
          <Text type="secondary">Tin đăng mới</Text>
        </Space>
      </div>
    </div>
  );
}

function CategoryDonutChart(props: { data: JobCategoryShareItem[] }) {
  const data = props.data || [];

  if (data.length === 0) {
    return <EmptyChart description="Chưa có dữ liệu phân bổ lĩnh vực." />;
  }

  const totalValue = data.reduce((total, item) => {
    return total + item.value;
  }, 0);

  if (totalValue <= 0) {
    return <EmptyChart description="Chưa có dữ liệu phân bổ lĩnh vực." />;
  }

  let currentPercent = 0;

  const gradientParts = data.map((item, index) => {
    const itemPercent = (item.value / totalValue) * 100;
    const startPercent = currentPercent;
    const endPercent = currentPercent + itemPercent;
    currentPercent = endPercent;

    return `${chartColors[index % chartColors.length]} ${startPercent}% ${endPercent}%`;
  });

  const donutBackground = `conic-gradient(${gradientParts.join(", ")})`;

  return (
    <div style={{ minHeight: 290, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: donutBackground,
          position: "relative",
          marginTop: 8,
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            width: 108,
            height: 108,
            borderRadius: "50%",
            backgroundColor: "#fff",
            position: "absolute",
            top: 36,
            left: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            boxShadow: "0 4px 16px rgba(15, 23, 42, 0.08)",
          }}
        >
          <Text type="secondary" style={{ fontSize: 12 }}>
            Tổng tin
          </Text>
          <Title level={3} style={{ margin: 0 }}>
            {formatNumber(totalValue)}
          </Title>
        </div>
      </div>

      <div style={{ width: "100%", marginTop: 18 }}>
        {data.slice(0, 7).map((item, index) => {
          const percent = (item.value / totalValue) * 100;

          return (
            <Tooltip
              key={`${item.categoryName}-${index}`}
              title={`${item.categoryName}: ${formatNumber(item.value)} tin (${formatPercent(percent)})`}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 10,
                  gap: 8,
                  width: "100%",
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    backgroundColor: chartColors[index % chartColors.length],
                    flexShrink: 0,
                  }}
                />

                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    paddingRight: 12,
                  }}
                >
                  <Text
                    style={{
                      display: "block",
                      width: "100%",
                    }}
                    ellipsis
                  >
                    {item.categoryName}
                  </Text>
                </div>

                <div
                  style={{
                    minWidth: 56,
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  <Text strong>{formatPercent(percent)}</Text>
                </div>
              </div>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}

function ConversionFunnelChart(props: { data: ConversionFunnelItem[] }) {
  const data = props.data || [];

  if (data.length === 0) {
    return <EmptyChart description="Chưa có dữ liệu phễu chuyển đổi." />;
  }

  const firstValue = data[0]?.value || 0;

  if (firstValue <= 0) {
    return <EmptyChart description="Chưa có dữ liệu phễu chuyển đổi." />;
  }

  return (
    <div style={{ minHeight: 300, padding: "8px 0" }}>
      {data.map((item, index) => {
        let widthPercent = item.percent;

        if (widthPercent <= 0) {
          widthPercent = (item.value / firstValue) * 100;
        }

        if (widthPercent > 100) {
          widthPercent = 100;
        }

        const visualWidth = Math.max(18, widthPercent);
        const backgroundColor = chartColors[index % chartColors.length];

        return (
          <div key={`${item.stage}-${index}`} style={{ marginBottom: 18 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 6,
              }}
            >
              <Tooltip title={item.stage}>
                <Text strong ellipsis style={{ maxWidth: "70%" }}>
                  {item.stage}
                </Text>
              </Tooltip>

              <Text type="secondary">
                {formatNumber(item.value)} · {formatPercent(widthPercent)}
              </Text>
            </div>

            <div
              style={{
                height: 34,
                backgroundColor: "#f5f5f5",
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <Tooltip
                title={`${item.stage}: ${formatNumber(item.value)} hồ sơ (${formatPercent(
                  widthPercent
                )})`}
              >
                <div
                  style={{
                    width: `${visualWidth}%`,
                    height: "100%",
                    background: `linear-gradient(90deg, ${backgroundColor}cc, ${backgroundColor})`,
                    borderRadius: 999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    paddingRight: 12,
                    color: "#fff",
                    fontWeight: 700,
                    transition: "width 0.25s ease",
                  }}
                >
                  {widthPercent >= 24 && formatPercent(widthPercent)}
                </div>
              </Tooltip>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OcrErrorRateChart(props: { data: OcrErrorRateItem[] }) {
  const data = props.data || [];

  if (data.length === 0) {
    return <EmptyChart description="Chưa có dữ liệu lỗi OCR/NLP." />;
  }

  const maxRate = Math.max(
    1,
    ...data.map((item) => {
      return item.errorRate;
    })
  );

  return (
    <div style={{ minHeight: 300, padding: "8px 0" }}>
      {data.map((item, index) => {
        const barWidth = Math.max(4, (item.errorRate / maxRate) * 100);
        let barColor = "#52c41a";

        if (item.errorRate >= 30) {
          barColor = "#ff4d4f";
        } else if (item.errorRate >= 10) {
          barColor = "#faad14";
        }

        return (
          <div key={`${item.fileType}-${index}`} style={{ marginBottom: 18 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 6,
              }}
            >
              <Tooltip title={item.fileType}>
                <Text strong ellipsis style={{ maxWidth: "55%" }}>
                  {item.fileType}
                </Text>
              </Tooltip>

              <Text type="secondary">
                {formatPercent(item.errorRate)} · {formatNumber(item.failed)}/
                {formatNumber(item.total)} lỗi
              </Text>
            </div>

            <div
              style={{
                height: 28,
                backgroundColor: "#f5f5f5",
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <Tooltip
                title={`${item.fileType}: ${formatPercent(item.errorRate)} lỗi nhận diện`}
              >
                <div
                  style={{
                    width: `${barWidth}%`,
                    height: "100%",
                    backgroundColor: barColor,
                    borderRadius: 999,
                    transition: "width 0.25s ease",
                  }}
                />
              </Tooltip>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AdminDashboardPage() {
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

      const response = await axiosClient.get("/Dashboard/admin-stats", {
        params,
      });

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
    const options = stats.categoryOptions.map((category) => {
      return {
        label: category.categoryName,
        value: category.categoryId,
      };
    });

    return options;
  }, [stats.categoryOptions]);

  const aiStatusColor = getStatusColor(stats.quickMetrics.aiServerStatus);
  const averageProcessingSeconds = stats.quickMetrics.averageProcessingSeconds;

  const averageProcessingText =
    averageProcessingSeconds === null || averageProcessingSeconds === undefined
      ? "Chưa có dữ liệu tốc độ xử lý"
      : `Avg: ${averageProcessingSeconds}s / CV`;

  return (
    <PageContainer
      title="Admin Dashboard"
      subtitle="Giám sát sức khỏe hệ thống, tăng trưởng nền tảng và hiệu suất xử lý AI."
    >
      <Card
        bordered={false}
        style={{
          marginBottom: 24,
          borderRadius: 16,
          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
        }}
        bodyStyle={{ padding: 20 }}
      >
        <Row gutter={[24, 16]} align="middle">
          <Col xs={24} md={24} lg={4}>
            <Space>
              <FilterOutlined style={{ color: "#1677ff", fontSize: 20 }} />
              <Text strong style={{ fontSize: 16 }}>
                Bộ lọc tổng
              </Text>
            </Space>
          </Col>

          <Col xs={24} md={12} lg={10}>
            <Text type="secondary" style={{ display: "block", marginBottom: 6 }}>
              Lĩnh vực tuyển dụng
            </Text>

            <Select
              showSearch
              allowClear
              style={{ width: "100%" }}
              placeholder="Tất cả lĩnh vực"
              value={selectedCategoryId}
              options={categorySelectOptions}
              optionFilterProp="label"
              onChange={(value) => {
                setSelectedCategoryId(value);
              }}
            />
          </Col>

          <Col xs={24} md={12} lg={10}>
            <Text type="secondary" style={{ display: "block", marginBottom: 6 }}>
              Khoảng thời gian
            </Text>

            <RangePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              value={selectedDateRange}
              allowClear
              presets={[
                {
                  label: "Tuần này",
                  value: [dayjs().startOf("week"), dayjs().endOf("week")],
                },
                {
                  label: "Tháng này",
                  value: [dayjs().startOf("month"), dayjs().endOf("month")],
                },
                {
                  label: "Năm nay",
                  value: [dayjs().startOf("year"), dayjs().endOf("year")],
                },
              ]}
              onChange={(dates) => {
                if (dates === null || dates[0] === null || dates[1] === null) {
                  setSelectedDateRange(null);
                  return;
                }

                setSelectedDateRange([dates[0], dates[1]]);
              }}
            />
          </Col>
        </Row>
      </Card>

      {loading === true ? (
        <div
          style={{
            minHeight: 420,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Spin size="large" tip="Đang tổng hợp dữ liệu hệ thống..." />
        </div>
      ) : (
        <>
          <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <MetricCard
                title="Tổng Người Dùng"
                value={stats.quickMetrics.totalUsers}
                subtitle={`${formatNumber(stats.quickMetrics.totalHrUsers)} HR | ${formatNumber(
                  stats.quickMetrics.totalCandidateUsers
                )} Candidate`}
                icon={<TeamOutlined />}
                color="#1677ff"
              />
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <MetricCard
                title="Tin Tuyển Dụng Active"
                value={stats.quickMetrics.activeJobs}
                subtitle="Job đang public và chưa hết hạn"
                icon={<FileTextOutlined />}
                color="#52c41a"
              />
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <MetricCard
                title="CV Đã Phân Tích AI"
                value={stats.quickMetrics.analyzedCvs}
                subtitle="AI OCR/NLP xử lý thành công"
                icon={<RobotOutlined />}
                color="#722ed1"
              />
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card
                bordered={false}
                style={{
                  height: "100%",
                  borderRadius: 16,
                  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
                }}
                bodyStyle={{ padding: 20 }}
              >
                <Space align="start" style={{ width: "100%", justifyContent: "space-between" }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      Trạng thái Máy chủ AI
                    </Text>

                    <div style={{ marginTop: 8, marginBottom: 8 }}>
                      <Tag
                        color={getStatusTagColor(stats.quickMetrics.aiServerStatus)}
                        style={{
                          fontSize: 16,
                          padding: "5px 12px",
                          borderRadius: 999,
                          fontWeight: 700,
                        }}
                      >
                        {stats.quickMetrics.aiServerStatus}
                      </Tag>
                    </div>

                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {averageProcessingText}
                    </Text>
                  </div>

                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: `${aiStatusColor}14`,
                      color: aiStatusColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                    }}
                  >
                    <CloudServerOutlined />
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>

          <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
            <Col xs={24} xl={16}>
              <Card
                bordered={false}
                title={
                  <Space>
                    <BarChartOutlined style={{ color: "#1677ff" }} />
                    <span>Lưu lượng Hoạt động theo thời gian</span>
                  </Space>
                }
                extra={
                  <Text type="secondary">
                    CV nộp vào hệ thống và tin tuyển dụng mới
                  </Text>
                }
                style={{
                  height: "100%",
                  borderRadius: 16,
                  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
                }}
              >
                <ActivityTrendChart data={stats.activityTrend} />
              </Card>
            </Col>

            <Col xs={24} xl={8}>
              <Card
                bordered={false}
                title={
                  <Space>
                    <FileSearchOutlined style={{ color: "#52c41a" }} />
                    <span>Tỷ trọng Tin đăng theo Lĩnh vực</span>
                  </Space>
                }
                style={{
                  height: "100%",
                  borderRadius: 16,
                  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
                }}
              >
                <CategoryDonutChart data={stats.jobCategoryShare} />
              </Card>
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            <Col xs={24} xl={14}>
              <Card
                bordered={false}
                title={
                  <Space>
                    <CheckCircleOutlined style={{ color: "#1677ff" }} />
                    <span>Tỷ lệ chuyển đổi tổng thể</span>
                  </Space>
                }
                extra={
                  <Text type="secondary">
                    Platform Conversion Rate
                  </Text>
                }
                style={{
                  height: "100%",
                  borderRadius: 16,
                  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
                }}
              >
                <ConversionFunnelChart data={stats.conversionFunnel} />
              </Card>
            </Col>

            <Col xs={24} xl={10}>
              <Card
                bordered={false}
                title={
                  <Space>
                    <ApiOutlined style={{ color: "#fa8c16" }} />
                    <span>Thống kê Lỗi Nhận diện OCR/NLP</span>
                  </Space>
                }
                extra={
                  <Space size={6}>
                    <ClockCircleOutlined />
                    <Text type="secondary">Error Rate</Text>
                  </Space>
                }
                style={{
                  height: "100%",
                  borderRadius: 16,
                  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
                }}
              >
                <OcrErrorRateChart data={stats.ocrErrorRate} />
              </Card>
            </Col>
          </Row>
        </>
      )}
    </PageContainer>
  );
}

export default AdminDashboardPage;