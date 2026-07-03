import React from "react";
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
import dayjs from "dayjs";
import PageContainer from "../../../components/common/PageContainer";
import MetricCard from "./components/MetricCard";
import ActivityTrendChart from "./components/ActivityTrendChart";
import CategoryDonutChart from "./components/CategoryDonutChart";
import ConversionFunnelChart from "./components/ConversionFunnelChart";
import OcrErrorRateChart from "./components/OcrErrorRateChart";
import { useAdminDashboard, getStatusTagColor, formatNumber } from "./hooks/useAdminDashboard";

const { RangePicker } = DatePicker;
const { Text } = Typography;

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
                extra={<Text type="secondary">CV nộp vào hệ thống và tin tuyển dụng mới</Text>}
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
                extra={<Text type="secondary">Platform Conversion Rate</Text>}
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
