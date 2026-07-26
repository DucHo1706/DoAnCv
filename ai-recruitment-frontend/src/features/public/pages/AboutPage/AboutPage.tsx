import { Card, Col, Row, Typography, Space, Tag, Divider, Button, Progress } from "antd";
import {
  RobotOutlined,
  CompassOutlined,
  SlidersOutlined,
  BookOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  CodeOutlined,
  ApiOutlined,
  BranchesOutlined,
  DatabaseOutlined,
  ArrowRightOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Paragraph, Text } = Typography;

function AboutPage() {
  const navigate = useNavigate();

  const techStack = [
    { name: "React 19 & TypeScript", category: "Frontend Core", desc: "Giao diện SPA B2B SaaS hiện đại, tối ưu hiệu năng", color: "#2563EB" },
    { name: "C# .NET 8 Web API", category: "Backend Microservices", desc: "Xử lý dữ liệu quy mô lớn, kiến trúc Repository/Service", color: "#10B981" },
    { name: "Python FastAPI", category: "AI Microservice", desc: "Tích hợp Gemini AI & Thuật toán Khai phá dữ liệu", color: "#F59E0B" },
    { name: "Google Gemini 1.5/2.0", category: "Large Language Model", desc: "Phân tích ngữ nghĩa CV, bóc tách ASK và sinh câu hỏi phỏng vấn", color: "#8B5CF6" },
    { name: "Thuật toán Apriori", category: "Data Mining", desc: "Khai phá luật kết hợp kỹ năng từ ngân hàng ứng viên", color: "#EC4899" },
    { name: "TF-IDF + Cosine Similarity", category: "Explainable AI", desc: "Đánh giá hộp trắng kiểm chứng độ tương đồng văn bản", color: "#06B6D4" },
  ];

  const coreFeatures = [
    {
      icon: <SlidersOutlined style={{ fontSize: 26, color: "#2563EB" }} />,
      title: "Đánh giá Hộp Trắng vs Hộp Đen (Explainable AI)",
      description: "Kết hợp giữa thuật toán truyền thống TF-IDF + Cosine Similarity (đảm bảo tính minh bạch, có thể giải thích) với mô hình ngôn ngữ lớn Gemini AI (hiểu ngữ nghĩa chuyên sâu) để đưa ra điểm tương thích khách quan nhất.",
      badge: "Độc quyền AI",
      badgeColor: "blue"
    },
    {
      icon: <BranchesOutlined style={{ fontSize: 26, color: "#10B981" }} />,
      title: "Khai phá Luật kết hợp Apriori & High-Utility",
      description: "Tự động phân tích toàn bộ Ngân hàng CV để tìm ra tập kỹ năng thường đi kèm với nhau (ví dụ: React + TypeScript → Next.js). Từ đó cảnh báo kỹ năng còn thiếu cho ứng viên và nhà tuyển dụng.",
      badge: "Data Mining",
      badgeColor: "green"
    },
    {
      icon: <BookOutlined style={{ fontSize: 26, color: "#F59E0B" }} />,
      title: "Khung Năng lực chuẩn ASK (Attitude - Skill - Knowledge)",
      description: "Phân tích CV theo 3 trụ cột năng lực tiêu chuẩn quốc tế: Thái độ & Định hướng (Attitude), Kỹ năng thực chiến (Skill), và Kiến thức nền tảng (Knowledge), giúp doanh nghiệp chọn đúng nhân sự cân bằng.",
      badge: "Tiêu chuẩn Nhân sự",
      badgeColor: "gold"
    },
    {
      icon: <SafetyCertificateOutlined style={{ fontSize: 26, color: "#8B5CF6" }} />,
      title: "Ngôn từ & Chân thực",
      description: "Tự động loại bỏ các yếu tố gây định kiến vô thức như giới tính, tuổi tác, địa phương hoặc tên trường đại học, đảm bảo quá trình đánh giá ứng viên hoàn toàn dựa trên năng lực thực tế.",
      badge: "Công bằng & Minh bạch",
      badgeColor: "purple"
    }
  ];

  return (
    <div style={{ maxWidth: 1300, margin: "0 auto", padding: "0 4px 40px" }}>
      {/* Hero Showcase Section */}
      <div
        style={{
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
          borderRadius: 24,
          padding: "48px 36px",
          color: "#FFFFFF",
          marginBottom: 40,
          boxShadow: "0 20px 40px -15px rgba(15, 23, 42, 0.25)",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <Row gutter={[32, 32]} align="middle">
          <Col xs={24} lg={14}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(37, 99, 235, 0.2)", border: "1px solid rgba(59, 130, 246, 0.3)", padding: "6px 14px", borderRadius: 30, marginBottom: 16 }}>
              <ThunderboltOutlined style={{ color: "#60A5FA" }} />
              <span style={{ color: "#93C5FD", fontSize: 13, fontWeight: 600, letterSpacing: "0.03em" }}>
                HỆ THỐNG TUYỂN DỤNG THÔNG MINH ỨNG DỤNG AI
              </span>
            </div>

            <Title level={1} style={{ color: "#FFFFFF", fontWeight: 800, fontSize: 36, margin: "0 0 16px", lineHeight: 1.25 }}>
              Kiến trúc Tuyển dụng AI Đa Mô-hình & Khai phá Dữ liệu Lớn
            </Title>

            <Paragraph style={{ color: "#94A3B8", fontSize: 16, lineHeight: 1.7, marginBottom: 28 }}>
              Hệ thống **AI Recruitment** giải quyết các nút thắt trong quy trình tuyển dụng truyền thống bằng cách kết hợp sức mạnh của Mô hình Ngôn ngữ Lớn (LLM), Thuật toán Khai phá Dữ liệu (Apriori Mining) và Đánh giá Hộp trắng minh bạch (TF-IDF).
            </Paragraph>

            <Space size={16} wrap>
              <Button
                type="primary"
                size="large"
                icon={<CompassOutlined />}
                onClick={() => navigate("/jobs")}
                style={{ borderRadius: 10, height: 48, padding: "0 24px", background: "#2563EB", fontWeight: 600, fontSize: 15 }}
              >
                Khám phá Việc làm ngay
              </Button>
              <Button
                size="large"
                ghost
                icon={<RobotOutlined />}
                onClick={() => navigate("/candidate/dashboard")}
                style={{ borderRadius: 10, height: 48, padding: "0 24px", color: "#FFFFFF", borderColor: "rgba(255, 255, 255, 0.3)", fontWeight: 600, fontSize: 15 }}
              >
                Xem Báo cáo Năng lực AI
              </Button>
            </Space>
          </Col>

          {/* Right Metrics Box */}
          <Col xs={24} lg={10}>
            <div style={{ background: "rgba(255, 255, 255, 0.05)", backdropFilter: "blur(20px)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 20, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#60A5FA", letterSpacing: "0.05em", marginBottom: 16, textTransform: "uppercase" }}>
                CHỈ SỐ TỐI ƯU HỆ THỐNG
              </div>

              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: 16, borderRadius: 12, border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "#10B981" }}>99.2%</div>
                    <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>Chính xác bóc tách CV</div>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: 16, borderRadius: 12, border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "#3B82F6" }}>80%</div>
                    <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>Tiết kiệm thời gian HR</div>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: 16, borderRadius: 12, border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "#F59E0B" }}>3 Layer</div>
                    <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>Đối khớp đa thuật toán</div>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: 16, borderRadius: 12, border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "#EC4899" }}>Apriori</div>
                    <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>Khai phá luật kết hợp</div>
                  </div>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
      </div>

      {/* Core Architectural Modules */}
      <div style={{ marginBottom: 44 }}>
        <div style={{ textAlign: "center", maxWidth: 700, margin: "0 auto 36px" }}>
          <Title level={2} style={{ fontWeight: 800, color: "#0F172A", margin: "0 0 10px" }}>
            Các Tính Năng & Thuật Toán Cốt Lõi
          </Title>
          <Text type="secondary" style={{ fontSize: 15 }}>
            Được thiết kế dựa trên tiêu chuẩn nhân sự quốc tế và công nghệ xử lý dữ liệu tiên tiến.
          </Text>
        </div>

        <Row gutter={[24, 24]}>
          {coreFeatures.map((feat, idx) => (
            <Col xs={24} md={12} key={idx}>
              <Card
                hoverable
                style={{
                  borderRadius: 16,
                  border: "1px solid #E2E8F0",
                  height: "100%",
                  boxShadow: "0 4px 16px rgba(15, 23, 42, 0.03)",
                  background: "#FFFFFF"
                }}
                bodyStyle={{ padding: 24 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: "#F8FAFC", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {feat.icon}
                  </div>
                  <Tag color={feat.badgeColor} style={{ borderRadius: 6, padding: "2px 10px", fontWeight: 600, fontSize: 12, margin: 0 }}>
                    {feat.badge}
                  </Tag>
                </div>

                <Text strong style={{ fontSize: 17, color: "#0F172A", display: "block", marginBottom: 8 }}>
                  {feat.title}
                </Text>

                <Paragraph style={{ color: "#475569", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                  {feat.description}
                </Paragraph>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <Divider style={{ margin: "40px 0" }} />

      {/* Tech Stack Ecosystem */}
      <div>
        <div style={{ textAlign: "center", maxWidth: 700, margin: "0 auto 36px" }}>
          <Title level={2} style={{ fontWeight: 800, color: "#0F172A", margin: "0 0 10px" }}>
            Hệ Sinh Thái Công Nghệ Phát Triển
          </Title>
          <Text type="secondary" style={{ fontSize: 15 }}>
            Xây dựng trên nền tảng Full-stack Enterprise đáp ứng tốc độ xử lý cao và mở rộng linh hoạt.
          </Text>
        </div>

        <Row gutter={[20, 20]}>
          {techStack.map((tech, idx) => (
            <Col xs={24} sm={12} lg={8} key={idx}>
              <Card
                bordered={false}
                style={{
                  borderRadius: 16,
                  border: "1px solid #E2E8F0",
                  background: "#FFFFFF",
                  boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
                  height: "100%"
                }}
                bodyStyle={{ padding: 20 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: tech.color }} />
                  <Text strong style={{ fontSize: 16, color: "#0F172A" }}>{tech.name}</Text>
                </div>
                <Tag color="blue" style={{ borderRadius: 6, fontSize: 11, fontWeight: 600, marginBottom: 8 }}>
                  {tech.category}
                </Tag>
                <Paragraph style={{ color: "#64748B", fontSize: 13, margin: 0 }}>
                  {tech.desc}
                </Paragraph>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
}

export default AboutPage;
