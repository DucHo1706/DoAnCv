import { Col, Row, Card, Typography, Statistic } from "antd";
import { CheckCircleOutlined, TeamOutlined, RobotOutlined, FileTextOutlined } from "@ant-design/icons";
import PageContainer from "../../components/common/PageContainer";
import StatCard from "../../components/common/StatCard";

const { Title, Paragraph } = Typography;

function AdminDashboardPage() {
  return (
    <PageContainer
      title="Admin Dashboard"
      subtitle="Tổng quan hoạt động của hệ thống và thống kê hiệu suất xử lý AI."
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Tổng Người Dùng"
            value={1250}
            subtitle="HR, Candidate & Admin"
            icon={<TeamOutlined style={{ color: "#1677ff" }} />}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Tin Tuyển Dụng"
            value={85}
            subtitle="Đang public trên hệ thống"
            icon={<FileTextOutlined style={{ color: "#52c41a" }} />}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="CV Đã Phân Tích (AI)"
            value={3420}
            subtitle="Xử lý thành công bằng Gemini"
            icon={<RobotOutlined style={{ color: "#722ed1" }} />}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Hệ Thống"
            value="Bình Thường"
            subtitle="Database & AI API Online"
            icon={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Tình trạng Server & API"><Paragraph>Toàn bộ Core Backend và API Gemini đang hoạt động ổn định. Thời gian phản hồi phân tích CV trung bình: 1.2s</Paragraph></Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Cảnh báo / Cần xử lý"><Paragraph>Có 3 tin tuyển dụng mới đang chờ bạn duyệt ở mục "Duyệt Tin Tuyển Dụng".</Paragraph></Card>
        </Col>
      </Row>
    </PageContainer>
  );
}

export default AdminDashboardPage;