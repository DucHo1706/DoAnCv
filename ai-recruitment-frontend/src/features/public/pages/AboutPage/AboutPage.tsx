import { Card, Col, Row, Typography, Space, Divider } from "antd";
import {
  RobotOutlined,
  CompassOutlined,
  SlidersOutlined,
  BookOutlined,
} from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

function AboutPage() {
  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" }}>
      {/* Banner giới thiệu */}
      <div style={{ textAlign: "center", marginBottom: 60 }}>
        <Title level={1} style={{ fontWeight: 800, color: "#1E3A8A", fontSize: "40px" }}>
          Về AI Recruitment
        </Title>
        <Paragraph style={{ fontSize: "18px", color: "#64748B", maxWidth: "800px", margin: "0 auto" }}>
          Giải pháp tuyển dụng thông minh ứng dụng Trí tuệ nhân tạo (AI) giúp tối ưu hóa việc sàng lọc, chấm điểm và kết nối ứng viên tài năng với các doanh nghiệp.
        </Paragraph>
      </div>

      <Row gutter={[32, 32]} style={{ marginBottom: 60 }}>
        <Col xs={24} md={12}>
          <Title level={3} style={{ fontWeight: 700, color: "#1E293B" }}>
            Sứ Mệnh Của Hệ Thống
          </Title>
          <Paragraph style={{ fontSize: "16px", lineHeight: "1.8", color: "#475569" }}>
            Hệ thống **AI Recruitment** ra đời với mục tiêu giải quyết các nút thắt trong quy trình tuyển dụng truyền thống. Bằng cách áp dụng các công nghệ xử lý ngôn ngữ tự nhiên (NLP) và mô hình học sâu lớn, hệ thống giúp giảm thiểu thời gian sàng lọc hồ sơ thủ công lên tới 80%, đồng thời tăng độ chính xác trong việc lựa chọn nhân sự chất lượng.
          </Paragraph>
          <Paragraph style={{ fontSize: "16px", lineHeight: "1.8", color: "#475569" }}>
            Chúng tôi xây dựng môi trường minh bạch cho cả Ứng viên và Nhà tuyển dụng, nơi mà năng lực thực tế được đánh giá và giải thích một cách rõ ràng, trực quan (Explainable AI).
          </Paragraph>
        </Col>

        <Col xs={24} md={12}>
          <Card
            bordered={false}
            style={{
              backgroundColor: "#EFF6FF",
              borderRadius: "16px",
              height: "100%",
            }}
          >
            <Space direction="vertical" size={16}>
              <div style={{ display: "flex", gap: 16, alignItems: "start" }}>
                <RobotOutlined style={{ fontSize: 24, color: "#3B82F6", marginTop: 4 }} />
                <div>
                  <Text strong style={{ fontSize: 16 }}>Đánh giá Hồ sơ bằng AI</Text>
                  <Paragraph style={{ color: "#475569", margin: "4px 0 0" }}>
                    Tự động đọc, phân tách thông tin CV (OCR) và chấm điểm độ tương thích với mô tả công việc (JD) theo tiêu chuẩn nhân sự.
                  </Paragraph>
                </div>
              </div>
              <div style={{ display: "flex", gap: 16, alignItems: "start" }}>
                <CompassOutlined style={{ fontSize: 24, color: "#3B82F6", marginTop: 4 }} />
                <div>
                  <Text strong style={{ fontSize: 16 }}>Gợi ý Kỹ năng Tự động</Text>
                  <Paragraph style={{ color: "#475569", margin: "4px 0 0" }}>
                    Sử dụng luật kết hợp dữ liệu giúp phát hiện những điểm thiếu sót về kỹ năng trong CV và gợi ý bổ sung kịp thời.
                  </Paragraph>
                </div>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Divider style={{ margin: "40px 0" }} />

      {/* Phần giới thiệu các Công nghệ cốt lõi */}
      <Title level={2} style={{ textAlign: "center", fontWeight: 800, marginBottom: 40, color: "#0F172A" }}>
        Nền Tảng Công Nghệ & Thuật Toán
      </Title>

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={8}>
          <Card
            hoverable
            style={{ borderRadius: "16px", height: "100%" }}
            bodyStyle={{ padding: 24 }}
          >
            <Space direction="vertical" size={12}>
              <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: "#E0F2FE", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <SlidersOutlined style={{ fontSize: 24, color: "#0284C7" }} />
              </div>
              <Text strong style={{ fontSize: 18 }}>So sánh Hộp trắng & Hộp đen</Text>
              <Paragraph style={{ color: "#475569" }}>
                Hệ thống đánh giá hồ sơ song song qua thuật toán **TF-IDF + Cosine Similarity** (Hộp trắng truyền thống) và **Gemini AI** (Hộp đen ngữ nghĩa) giúp kết quả có tính đối sánh và kiểm chứng cao.
              </Paragraph>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card
            hoverable
            style={{ borderRadius: "16px", height: "100%" }}
            bodyStyle={{ padding: 24 }}
          >
            <Space direction="vertical" size={12}>
              <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: "#DCFCE7", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <RobotOutlined style={{ fontSize: 24, color: "#16A34A" }} />
              </div>
              <Text strong style={{ fontSize: 18 }}>Luật kết hợp Apriori</Text>
              <Paragraph style={{ color: "#475569" }}>
                Khai phá dữ liệu từ Ngân hàng ứng viên nhằm phát hiện các mối tương quan kỹ năng ẩn (Association Rule Mining), đưa ra gợi ý thông minh cho nhà tuyển dụng và ứng viên.
              </Paragraph>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card
            hoverable
            style={{ borderRadius: "16px", height: "100%" }}
            bodyStyle={{ padding: 24 }}
          >
            <Space direction="vertical" size={12}>
              <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: "#FEE2E2", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <BookOutlined style={{ fontSize: 24, color: "#DC2626" }} />
              </div>
              <Text strong style={{ fontSize: 18 }}>Mô hình Năng lực ASK</Text>
              <Paragraph style={{ color: "#475569" }}>
                Phân tích CV toàn diện dựa trên 3 trụ cột năng lực tiêu chuẩn quốc tế: **Attitude** (Thái độ), **Skills** (Kỹ năng) và **Knowledge** (Kiến thức) hỗ trợ nhà tuyển dụng lựa chọn ứng viên cân bằng.
              </Paragraph>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default AboutPage;
