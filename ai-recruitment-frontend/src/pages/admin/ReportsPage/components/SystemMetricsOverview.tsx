import { Card, Col, Row, Space, Typography } from "antd";
import {
  CheckCircleOutlined,
  HourglassOutlined,
  SolutionOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import { appTheme } from "../../../../constants/theme";

const { Title, Text } = Typography;

const glassCardStyle = {
  background: "rgba(255, 255, 255, 0.85)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(226, 232, 240, 0.8)",
  boxShadow: "0 8px 32px 0 rgba(148, 163, 184, 0.08)",
  borderRadius: "16px",
};

interface SystemMetricsOverviewProps {
  metrics: any;
}

export default function SystemMetricsOverview({ metrics }: SystemMetricsOverviewProps) {
  return (
    <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
      {/* Card 1: Tổng người dùng */}
      <Col xs={24} sm={12} lg={6}>
        <Card style={glassCardStyle} bodyStyle={{ padding: 24 }}>
          <Space direction="vertical" size={4} style={{ width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>TỔNG NGƯỜI DÙNG</Text>
              <UserAddOutlined style={{ fontSize: 20, color: appTheme.colors.primary }} />
            </div>
            <Title level={2} style={{ margin: 0, fontWeight: 800 }}>{metrics.totalUsers ?? 0}</Title>
            <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>
              Ứng viên: <strong style={{ color: "#334155" }}>{metrics.totalCandidateUsers ?? 0}</strong> | HR: <strong style={{ color: "#334155" }}>{metrics.totalHrUsers ?? 0}</strong>
            </div>
          </Space>
        </Card>
      </Col>

      {/* Card 2: Tin tuyển dụng đang mở */}
      <Col xs={24} sm={12} lg={6}>
        <Card style={glassCardStyle} bodyStyle={{ padding: 24 }}>
          <Space direction="vertical" size={4} style={{ width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>TIN TUYỂN DỤNG ĐANG MỞ</Text>
              <SolutionOutlined style={{ fontSize: 20, color: appTheme.colors.success }} />
            </div>
            <Title level={2} style={{ margin: 0, fontWeight: 800 }}>{metrics.activeJobs ?? 0}</Title>
            <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: "block" }}>
              Tin tuyển dụng được duyệt & hiển thị
            </Text>
          </Space>
        </Card>
      </Col>

      {/* Card 3: Tỷ lệ hồ sơ khớp cao */}
      <Col xs={24} sm={12} lg={6}>
        <Card style={glassCardStyle} bodyStyle={{ padding: 24 }}>
          <Space direction="vertical" size={4} style={{ width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>ỨNG VIÊN KHỚP CAO</Text>
              <CheckCircleOutlined style={{ fontSize: 20, color: "#8B5CF6" }} />
            </div>
            <Title level={2} style={{ margin: 0, fontWeight: 800 }}>{metrics.highMatchRate ?? 0}%</Title>
            <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>
              Quét thành công: <strong style={{ color: "#334155" }}>{metrics.analyzedCvs ?? 0} CV</strong>
            </div>
          </Space>
        </Card>
      </Col>

      {/* Card 4: Thời gian phỏng vấn trung bình */}
      <Col xs={24} sm={12} lg={6}>
        <Card style={glassCardStyle} bodyStyle={{ padding: 24 }}>
          <Space direction="vertical" size={4} style={{ width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>THỜI GIAN TUYỂN DỤNG (TB)</Text>
              <HourglassOutlined style={{ fontSize: 20, color: appTheme.colors.warning }} />
            </div>
            <Title level={2} style={{ margin: 0, fontWeight: 800 }}>{metrics.timeToHireDays ?? 0} ngày</Title>
            <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: "block" }}>
              Tính từ lúc nộp đơn tới lúc lên lịch hẹn
            </Text>
          </Space>
        </Card>
      </Col>
    </Row>
  );
}
