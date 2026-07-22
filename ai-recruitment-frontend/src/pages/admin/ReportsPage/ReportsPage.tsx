import { Card, Col, Row, Spin, Space, Table, Tag, Typography } from "antd";
import { FireOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { Column, Line, Pie } from "@ant-design/plots";
import PageContainer from "../../../components/common/PageContainer";
import { appTheme } from "../../../constants/theme";
import { useReports } from "./hooks/useReports";
import SystemMetricsOverview from "./components/SystemMetricsOverview";

const { Text } = Typography;

const glassCardStyle = {
  background: "rgba(255, 255, 255, 0.85)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(226, 232, 240, 0.8)",
  boxShadow: "0 8px 32px 0 rgba(148, 163, 184, 0.08)",
  borderRadius: "16px",
};

export default function ReportsPage() {
  const {
    loading,
    metrics,
    activityTrendData,
    jobCategoryData,
    funnelData,
    topBranches,
  } = useReports();

  if (loading) {
    return (
      <PageContainer title="Báo cáo thống kê">
        <div style={{ textAlign: "center", padding: "100px 0" }}>
          <Spin size="large" tip="Đang tính toán dữ liệu thống kê từ hệ thống..." />
        </div>
      </PageContainer>
    );
  }

  const lineConfig = {
    data: activityTrendData,
    xField: "date",
    yField: "value",
    colorField: "type",
    smooth: true,
    legend: { position: "top" as const },
  };

  const pieConfig = {
    data: jobCategoryData,
    angleField: "value",
    colorField: "categoryName",
    radius: 0.75,
    legend: { position: "right" as const },
    label: {
      text: "value",
      style: {
        fontSize: 12,
        fontWeight: "bold",
      },
    },
  };

  const columnConfig = {
    data: funnelData,
    xField: "stage",
    yField: "value",
    color: appTheme.colors.primary,
    label: {
      position: "top" as const,
      style: {
        fill: "#1e293b",
        opacity: 0.9,
        fontWeight: "bold",
      },
    },
  };

  return (
    <PageContainer
      title="Báo cáo & Phân tích hệ thống"
      subtitle="Bức tranh tổng thể về hiệu suất tuyển dụng, chất lượng ứng viên AI và mức độ hoạt động các chi nhánh."
    >
      <div style={{ fontFamily: appTheme.font.family }}>

        {/* KPI Grid Section */}
        <SystemMetricsOverview metrics={metrics} />

        {/* Charts & Graphs Section */}
        <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
          {/* Biểu đồ xu hướng */}
          <Col xs={24} lg={16}>
            <Card
              title={<span style={{ fontWeight: 700 }}>Xu hướng hoạt động nền tảng</span>}
              style={glassCardStyle}
              bodyStyle={{ padding: 24 }}
            >
              <Line {...lineConfig} style={{ height: 320 }} />
            </Card>
          </Col>

          {/* Top Chi nhánh hoạt động */}
          <Col xs={24} lg={8}>
            <Card
              title={<span style={{ fontWeight: 700 }}>Top Chi nhánh tuyển dụng</span>}
              style={glassCardStyle}
              bodyStyle={{ padding: 24 }}
            >
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
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          paddingBottom: 12,
                          borderBottom: "1px solid #F1F5F9",
                        }}
                      >
                        <Space>
                          <span
                            style={{
                              display: "inline-flex",
                              width: 24,
                              height: 24,
                              borderRadius: "50%",
                              background: iconColor,
                              color: idx < 3 ? "#FFFFFF" : "#475569",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 12,
                              fontWeight: "bold",
                            }}
                          >
                            {idx + 1}
                          </span>
                          <Text strong style={{ color: "#334155" }}>{item.branchName}</Text>
                        </Space>
                        <Tag color="blue" style={{ borderRadius: 6, fontWeight: "bold" }}>
                          {item.count} tin đăng
                        </Tag>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[20, 20]}>
          {/* Phễu chuyển đổi */}
          <Col xs={24} md={12}>
            <Card
              title={<span style={{ fontWeight: 700 }}>Phễu chuyển đổi ứng tuyển</span>}
              style={glassCardStyle}
              bodyStyle={{ padding: 24 }}
            >
              <Column {...columnConfig} style={{ height: 280 }} />
            </Card>
          </Col>

          {/* Phân bổ theo lĩnh vực */}
          <Col xs={24} md={12}>
            <Card
              title={<span style={{ fontWeight: 700 }}>Tỷ trọng tin đăng theo Lĩnh vực</span>}
              style={glassCardStyle}
              bodyStyle={{ padding: 24 }}
            >
              <Pie {...pieConfig} style={{ height: 280 }} />
            </Card>
          </Col>
        </Row>

        {/* AI Server Status Alert Footer */}
        <Card
          style={{
            marginTop: 24,
            borderRadius: 16,
            background: "rgba(37, 99, 235, 0.03)",
            border: "1px dashed rgba(37, 99, 235, 0.2)",
            padding: "8px 12px",
          }}
        >
          <Space size="middle" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}>
            <Space>
              <FireOutlined style={{ color: "#2563EB" }} />
              <Text strong style={{ color: "#1E3A8A" }}>TRẠNG THÁI AI ENGINE:</Text>
              <Text style={{ color: "#3B82F6", fontWeight: 650 }}>{metrics.aiServerStatus}</Text>
            </Space>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Thời gian xử lý OCR & NLP trung bình: <strong style={{ color: "#1E3A8A" }}>{metrics.averageProcessingSeconds ?? "0"} giây / CV</strong>
            </Text>
          </Space>
        </Card>

      </div>
    </PageContainer>
  );
}
