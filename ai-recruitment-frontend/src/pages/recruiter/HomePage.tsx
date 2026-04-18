import { Button, Col, Row, Typography, Card, Space, Divider, Tag } from "antd";
import {
  RobotOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  TeamOutlined,
  UserOutlined,
  SolutionOutlined,
  BarChartOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Paragraph, Text } = Typography;

function HomePage() {
  const navigate = useNavigate();

  return (
    <div style={{ background: "#fff", width: "100%" }}>
      {/* Hero Section */}
      <div style={{ padding: "80px 20px", background: "linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%)", textAlign: "center" }}>
        <Title style={{ fontSize: "42px", fontWeight: "bold", color: "#001529", marginBottom: "20px" }}>
          Cổng Thông Tin Tuyển Dụng & Quản Trị Nhân Sự
        </Title>
        <Paragraph style={{ fontSize: "20px", color: "#555", maxWidth: "800px", margin: "0 auto 40px" }}>
          Hệ thống hướng tới tự động hóa quy trình sàng lọc hồ sơ đầu vào. Thay vì nhân sự (HR) phải đọc thủ công hàng trăm CV, hệ thống ứng dụng AI để tự động đọc hiểu, trích xuất thông tin và chấm điểm mức độ phù hợp của ứng viên so với yêu cầu công việc.
        </Paragraph>
        <Space size="large" wrap style={{ display: "flex", justifyContent: "center" }}>
          <Button type="primary" size="large" onClick={() => navigate("/jobs")} icon={<ArrowRightOutlined />}>
            Dành cho Ứng Viên (Xem việc làm)
          </Button>
          <Button size="large" onClick={() => navigate("/login")}>
            Đăng nhập hệ thống (HR / Admin)
          </Button>
        </Space>
      </div>

      {/* User Roles Section */}
      <div style={{ padding: "80px 20px", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <Title level={2}>Hệ thống hỗ trợ toàn diện 3 đối tượng</Title>
          <Paragraph type="secondary" style={{ fontSize: "16px" }}>
            Được thiết kế với phân quyền chặt chẽ, tối ưu trải nghiệm cho cả quá trình ứng tuyển lẫn quản trị.
          </Paragraph>
        </div>
        
        <Row gutter={[32, 32]}>
          <Col xs={24} md={8}>
            <Card hoverable style={{ height: "100%", padding: "20px", borderRadius: "12px", borderTop: "4px solid #52c41a" }}>
              <UserOutlined style={{ fontSize: "40px", color: "#52c41a", marginBottom: "16px" }} />
              <Title level={4}>Ứng Viên</Title>
              <Paragraph type="secondary" style={{ minHeight: "80px" }}>
                Dễ dàng upload CV hoặc tạo CV bằng công cụ trực tuyến. Nhận gợi ý việc làm tự động và theo dõi trạng thái hồ sơ ứng tuyển theo thời gian thực.
              </Paragraph>
              <Button type="link" style={{ padding: 0 }} onClick={() => navigate("/jobs")}>Bắt đầu ứng tuyển <ArrowRightOutlined /></Button>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card hoverable style={{ height: "100%", padding: "20px", borderRadius: "12px", borderTop: "4px solid #1677ff" }}>
              <TeamOutlined style={{ fontSize: "40px", color: "#1677ff", marginBottom: "16px" }} />
              <Title level={4}>Nhà Tuyển Dụng (HR)</Title>
              <Paragraph type="secondary" style={{ minHeight: "80px" }}>
                Tạo và quản lý tin tuyển dụng. Xem AI tự động trích xuất thông tin CV, chấm điểm, giải thích lý do và xếp hạng ứng viên theo độ phù hợp.
              </Paragraph>
              <Button type="link" style={{ padding: 0 }} onClick={() => navigate("/login")}>Vào phân hệ HR <ArrowRightOutlined /></Button>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card hoverable style={{ height: "100%", padding: "20px", borderRadius: "12px", borderTop: "4px solid #faad14" }}>
              <SafetyCertificateOutlined style={{ fontSize: "40px", color: "#faad14", marginBottom: "16px" }} />
              <Title level={4}>Quản Trị Viên (Admin)</Title>
              <Paragraph type="secondary" style={{ minHeight: "80px" }}>
                Quản lý hệ thống toàn diện: Kiểm soát người dùng, phân quyền bảo mật, duyệt tin tuyển dụng và theo dõi các báo cáo thống kê chi tiết.
              </Paragraph>
              <Button type="link" style={{ padding: 0 }} onClick={() => navigate("/login")}>Vào trang Quản trị <ArrowRightOutlined /></Button>
            </Card>
          </Col>
        </Row>
      </div>

      <Divider style={{ margin: 0 }} />

      {/* About Thesis/Project Detail */}
      <div style={{ padding: "80px 20px", maxWidth: "1200px", margin: "0 auto" }}>
        <Row gutter={[48, 48]} align="middle">
          <Col xs={24} lg={12}>
            <Title level={2}>Tự Động Hóa Với Công Nghệ Hiện Đại</Title>
            <Paragraph style={{ fontSize: "16px", lineHeight: "1.8", color: "#555" }}>
              Mục tiêu lớn nhất của nền tảng là giúp giảm thiểu tối đa thời gian sàng lọc hồ sơ, hỗ trợ nhà tuyển dụng tìm ra được ứng viên phù hợp một cách khách quan nhất.
            </Paragraph>
            <Space direction="vertical" size="middle" style={{ marginTop: "20px" }}>
              <Text style={{ fontSize: "16px" }}><CheckCircleOutlined style={{ color: "#1677ff", marginRight: "8px" }} /> <b>Frontend:</b> ReactTS kết hợp Ant Design.</Text>
              <Text style={{ fontSize: "16px" }}><CheckCircleOutlined style={{ color: "#1677ff", marginRight: "8px" }} /> <b>Backend:</b> ASP.NET Core MVC & SQL Server (ORM).</Text>
              <Text style={{ fontSize: "16px" }}><CheckCircleOutlined style={{ color: "#1677ff", marginRight: "8px" }} /> <b>Số hóa dữ liệu:</b> Tesseract OCR, PyPDF2 để bóc tách từ Ảnh, PDF, Word.</Text>
              <Text style={{ fontSize: "16px" }}><CheckCircleOutlined style={{ color: "#1677ff", marginRight: "8px" }} /> <b>AI Chấm điểm:</b> Dùng spaCy và Scikit-learn (hoặc Gemini) đánh giá mức độ phù hợp.</Text>
            </Space>
          </Col>
          <Col xs={24} lg={12}>
            <div style={{ background: "#f8fafc", padding: "40px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
              <Title level={4} style={{ color: "#0f172a", marginBottom: "20px" }}><RobotOutlined /> Luồng xử lý AI</Title>
              <div style={{ background: "#fff", padding: "16px", borderRadius: "8px", marginBottom: "12px", borderLeft: "4px solid #1677ff" }}>
                1. AI đọc CV và JD, tự động bóc tách từ khóa quan trọng.
              </div>
              <div style={{ background: "#fff", padding: "16px", borderRadius: "8px", marginBottom: "12px", borderLeft: "4px solid #1677ff" }}>
                2. So sánh đối chiếu kỹ năng có trong CV và yêu cầu của JD.
              </div>
              <div style={{ background: "#fff", padding: "16px", borderRadius: "8px", borderLeft: "4px solid #1677ff" }}>
                3. Đưa ra điểm số (Fit Score), giải thích cụ thể điểm mạnh / yếu.
              </div>
            </div>
          </Col>
        </Row>
      </div>

      {/* KPIs & Results Section */}
      <div style={{ padding: "60px 20px", background: "#1677ff", color: "#fff" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <Title level={2} style={{ color: "#fff", textAlign: "center", marginBottom: "40px" }}>Kết Quả Và Hiệu Năng Dự Kiến</Title>
          <Row gutter={[32, 32]} justify="space-around" style={{ textAlign: "center" }}>
            <Col xs={12} md={6}>
              <Title level={1} style={{ color: "#fff", margin: 0 }}>{'<'} 3s</Title>
              <Text style={{ color: "#e6f4ff", fontSize: "16px" }}>Thời gian xử lý mỗi CV</Text>
            </Col>
            <Col xs={12} md={6}>
              <Title level={1} style={{ color: "#fff", margin: 0 }}>{'>'} 70%</Title>
              <Text style={{ color: "#e6f4ff", fontSize: "16px" }}>Độ chính xác AI</Text>
            </Col>
            <Col xs={12} md={6}>
              <Title level={1} style={{ color: "#fff", margin: 0 }}>1,000+</Title>
              <Text style={{ color: "#e6f4ff", fontSize: "16px" }}>Hỗ trợ quy mô hồ sơ</Text>
            </Col>
            <Col xs={12} md={6}>
              <Title level={1} style={{ color: "#fff", margin: 0 }}><SolutionOutlined /></Title>
              <Text style={{ color: "#e6f4ff", fontSize: "16px" }}>Tự động hóa hoàn toàn</Text>
            </Col>
          </Row>
        </div>
      </div>

      {/* CTA Section */}
      <div style={{ padding: "80px 20px", textAlign: "center", background: "#f0f7ff" }}>
        <Title level={2} style={{ color: "#001529", marginBottom: "20px" }}>
          Hệ thống Quản trị Tuyển dụng Ứng dụng AI
        </Title>
        <Paragraph style={{ color: "#555", fontSize: "18px", maxWidth: "600px", margin: "0 auto 40px" }}>
          Bắt đầu nộp CV ngay hôm nay hoặc đăng nhập với tư cách HR để xem sức mạnh tự động hóa hệ thống.
        </Paragraph>
        <Space size="large" wrap style={{ display: "flex", justifyContent: "center" }}>
          <Button type="primary" size="large" shape="round" style={{ height: "50px", padding: "0 40px", fontSize: "18px" }} onClick={() => navigate("/jobs")}>
            Xem Tin Tuyển Dụng
          </Button>
          <Button size="large" shape="round" style={{ height: "50px", padding: "0 40px", fontSize: "18px" }} onClick={() => navigate("/login")}>
            Dành Cho HR/Admin
          </Button>
        </Space>
      </div>
      
      {/* Footer */}
      <div style={{ textAlign: "center", padding: "24px", background: "#001529", color: "#fff" }}>
        <Text style={{ color: "#8c8c8c" }}>Đề tài Khóa Luận Tốt Nghiệp © {new Date().getFullYear()} - Ứng dụng AI tự động hóa quy trình sàng lọc hồ sơ CV.</Text>
      </div>
    </div>
  );
}

export default HomePage;