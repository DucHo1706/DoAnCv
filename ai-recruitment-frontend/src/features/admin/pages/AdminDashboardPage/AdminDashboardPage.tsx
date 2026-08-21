import {
  Card,
  Col,
  DatePicker,
  Row,
  Select,
  Space,
  Skeleton,
  Tag,
  Statistic,
  Typography,
} from "antd";
import {
  CloudServerOutlined,
  FileTextOutlined,
  RobotOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import PageContainer from "../../../../components/common/PageContainer";
import MetricCard from "./components/MetricCard";
import ActivityTrendChart from "./components/ActivityTrendChart";
import CategoryDonutChart from "./components/CategoryDonutChart";
import ConversionFunnelChart from "./components/ConversionFunnelChart";
import OcrErrorRateChart from "./components/OcrErrorRateChart";
import { useAdminDashboard, getStatusTagColor, formatNumber } from "./hooks/useAdminDashboard";
import { appTheme } from "../../../../constants/theme";

const { RangePicker } = DatePicker;
const { Text } = Typography;

const cardShadowStyle: React.CSSProperties = {
  borderRadius: appTheme.radius.lg,
  boxShadow: appTheme.shadow.card,
  border: `1px solid ${appTheme.colors.border}`,
};

export default function AdminDashboardPage() {
  const {
    loading,
    stats,
    trends,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedPositionId,
    setSelectedPositionId,
    selectedJobLevelId,
    setSelectedJobLevelId,
    selectedBranchId,
    setSelectedBranchId,
    selectedJobId,
    setSelectedJobId,
    selectedDateRange,
    setSelectedDateRange,
    categorySelectOptions,
    positionOptions,
    jobLevelOptions,
    branchOptions,
    jobOptions,
    aiStatusColor,
    averageProcessingText,
  } = useAdminDashboard();

  return (
    <PageContainer title="Thống kê và phân tích">
      {/* Filter bar */}
      <Card
        bordered={false}
        style={{ marginBottom: 24, ...cardShadowStyle }}
        styles={{ body: { padding: 20 } }}
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
          <Col xs={24} md={12} lg={5}>
            <Text type="secondary" style={{ display: "block", marginBottom: 6 }}>Ngành nghề / vị trí</Text>
            <Select showSearch allowClear style={{ width: "100%" }} placeholder="Tất cả vị trí" value={selectedPositionId} options={positionOptions.map((item) => ({ value: item.id, label: item.name }))} optionFilterProp="label" onChange={(value) => { setSelectedPositionId(value); setSelectedJobId(undefined); }} />
          </Col>
          <Col xs={24} md={12} lg={5}>
            <Text type="secondary" style={{ display: "block", marginBottom: 6 }}>Cấp bậc</Text>
            <Select showSearch allowClear style={{ width: "100%" }} placeholder="Tất cả cấp bậc" value={selectedJobLevelId} options={jobLevelOptions.map((item) => ({ value: item.id, label: item.name }))} optionFilterProp="label" onChange={setSelectedJobLevelId} />
          </Col>
          <Col xs={24} md={12} lg={5}>
            <Text type="secondary" style={{ display: "block", marginBottom: 6 }}>Chi nhánh làm việc</Text>
            <Select showSearch allowClear style={{ width: "100%" }} placeholder="Tất cả chi nhánh" value={selectedBranchId} options={branchOptions.map((item) => ({ value: item.id, label: item.name }))} optionFilterProp="label" onChange={setSelectedBranchId} />
          </Col>
          <Col xs={24} md={12} lg={5}>
            <Text type="secondary" style={{ display: "block", marginBottom: 6 }}>Tin tuyển dụng</Text>
            <Select
              showSearch
              allowClear
              style={{ width: "100%" }}
              placeholder="Tất cả tin"
              value={selectedJobId}
              options={jobOptions.map((item) => ({
                value: item.jobId,
                label: `${item.jobTitle} · ${item.status === "Published" ? "Đang mở" : "Đã đóng"}${item.deadline ? ` · Hạn ${dayjs(item.deadline).format("DD/MM/YYYY")}` : ""}`,
              }))}
              optionFilterProp="label"
              onChange={setSelectedJobId}
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
                { label: "Hôm nay", value: [dayjs().startOf("day"), dayjs().endOf("day")] },
                { label: "7 ngày gần nhất", value: [dayjs().subtract(6, "day").startOf("day"), dayjs().endOf("day")] },
                { label: "30 ngày gần nhất", value: [dayjs().subtract(29, "day").startOf("day"), dayjs().endOf("day")] },
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
        <Row gutter={[24, 24]}>
          {[0, 1, 2, 3].map((key) => (
            <Col xs={24} sm={12} lg={6} key={key}>
              <Card style={cardShadowStyle} styles={{ body: { padding: 20 } }}>
                <Skeleton active paragraph={{ rows: 2 }} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <>
          {/* KPI chính - có so sánh % với kỳ trước */}
          <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <MetricCard
                title="Tổng người dùng"
                value={stats.quickMetrics.totalUsers}
                subtitle={`${formatNumber(stats.quickMetrics.totalHrUsers)} Nhà tuyển dụng | ${formatNumber(stats.quickMetrics.totalCandidateUsers)} Ứng viên`}
                icon={<TeamOutlined />}
                color={appTheme.colors.primary}
                trend={trends?.totalUsers}
                index={0}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <MetricCard
                title="Tin tuyển dụng đang mở"
                value={stats.quickMetrics.activeJobs}
                subtitle="Tin đang hiển thị công khai và chưa hết hạn"
                icon={<FileTextOutlined />}
                color={appTheme.colors.success}
                trend={trends?.activeJobs}
                index={1}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <MetricCard
                title="CV đã phân tích AI"
                value={stats.quickMetrics.analyzedCvs}
                subtitle="AI OCR/NLP xử lý thành công"
                icon={<RobotOutlined />}
                color="#722ed1"
                trend={trends?.analyzedCvs}
                index={2}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card
                bordered={false}
                className="hover-card entry-anim"
                style={{ height: "100%", "--i": 3, ...cardShadowStyle } as React.CSSProperties}
                styles={{ body: { padding: 20 } }}
              >
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
                  <div style={{ width: 46, height: 46, borderRadius: appTheme.radius.md, backgroundColor: `${aiStatusColor}14`, color: aiStatusColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21, flexShrink: 0 }}>
                    <CloudServerOutlined />
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>

          <Card
            bordered={false}
            title="Hoạt động tuyển dụng hôm nay"
            extra={<Text type="secondary">Theo múi giờ Việt Nam</Text>}
            style={{ marginBottom: 24, ...cardShadowStyle }}
            styles={{ body: { padding: 20 } }}
          >
            <Row gutter={[24, 16]}>
              <Col xs={24} sm={12}>
                <Statistic title="CV nhận hôm nay" value={stats.quickMetrics.applicationsToday} prefix={<FileTextOutlined style={{ color: appTheme.colors.primary }} />} />
                <Text type="secondary">Dựa trên sự kiện nộp hồ sơ, không suy ra từ trạng thái hiện tại.</Text>
              </Col>
              <Col xs={24} sm={12}>
                <Statistic title="Chuyển trạng thái hôm nay" value={stats.quickMetrics.statusChangesToday} prefix={<TeamOutlined style={{ color: appTheme.colors.success }} />} />
                <Text type="secondary">Không tính lần tạo hồ sơ ban đầu.</Text>
              </Col>
            </Row>
          </Card>

          {/* Biểu đồ xu hướng tăng trưởng */}
          <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
            <Col xs={24} xl={16}>
              <Card bordered={false} title="Lưu lượng hoạt động theo thời gian" extra={<Text type="secondary">CV nộp vào hệ thống và tin tuyển dụng mới</Text>} style={{ height: "100%", ...cardShadowStyle }}>
                <ActivityTrendChart data={stats.activityTrend} />
              </Card>
            </Col>
            <Col xs={24} xl={8}>
              <Card bordered={false} title="Tỷ trọng tin đăng theo lĩnh vực" style={{ height: "100%", ...cardShadowStyle }}>
                <CategoryDonutChart data={stats.jobCategoryShare} />
              </Card>
            </Col>
          </Row>

          {/* Phễu chuyển đổi & Chất lượng CV */}
          <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
            <Col xs={24} xl={14}>
              <Card bordered={false} title="Tỷ lệ chuyển đổi tổng thể" extra={<Text type="secondary">Toàn hệ thống</Text>} style={{ height: "100%", ...cardShadowStyle }}>
                <ConversionFunnelChart data={stats.conversionFunnel} />
              </Card>
            </Col>
            <Col xs={24} xl={10}>
              <Card bordered={false} title="Thống kê lỗi nhận diện OCR/NLP" extra={<Text type="secondary">Tỷ lệ lỗi</Text>} style={{ height: "100%", ...cardShadowStyle }}>
                <OcrErrorRateChart data={stats.ocrErrorRate} />
              </Card>
            </Col>
          </Row>
        </>
      )}
    </PageContainer>
  );
}
