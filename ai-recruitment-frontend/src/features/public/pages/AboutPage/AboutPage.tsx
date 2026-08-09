import { Card, Col, Row, Typography, Space, Tag, Button } from "antd";
import {
  RobotOutlined,
  CompassOutlined,
  SlidersOutlined,
  BookOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  CodeOutlined,
  BranchesOutlined,
  DatabaseOutlined,
  ArrowRightOutlined,
  AimOutlined,
  SolutionOutlined,
  AuditOutlined,
  RocketOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { appTheme } from "../../../../constants/theme";

const { Title, Paragraph, Text } = Typography;

function AboutPage() {
  const navigate = useNavigate();

  const workflowSteps = [
    {
      step: "01",
      icon: <SolutionOutlined style={{ fontSize: 24, color: "#2563EB" }} />,
      title: "Bóc Tách & Chuẩn Hóa CV",
      subtitle: "Xử lý Ngôn ngữ Tự nhiên (NLP)",
      desc: "Trích xuất tự động dữ liệu từ nhiều định dạng CV (PDF, DOCX, Image). Phân tích cấu trúc dữ liệu theo 3 trụ cột chuẩn quốc tế: Thái độ (Attitude), Kỹ năng (Skill) và Kiến thức (Knowledge).",
      tag: "Trích xuất Dữ liệu",
      tagBg: "#EFF6FF",
      tagColor: "#1D4ED8",
    },
    {
      step: "02",
      icon: <SlidersOutlined style={{ fontSize: 24, color: "#10B981" }} />,
      title: "Đối Sánh AI 3 Lớp Minh Bạch",
      subtitle: "Explainable AI & Gemini LLM",
      desc: "Kết hợp thuật toán hộp trắng (TF-IDF + Cosine Similarity) với Google Gemini để tạo điểm tham chiếu, phân tích ngữ nghĩa và giải thích các tiêu chí phù hợp.",
      tag: "Đối Sánh Đa Thuật Toán",
      tagBg: "#F0FDF4",
      tagColor: "#15803D",
    },
    {
      step: "03",
      icon: <AuditOutlined style={{ fontSize: 24, color: "#F59E0B" }} />,
      title: "Năng Lực & Lộ Trình Ôn Tập",
      subtitle: "Apriori Mining & Coaching",
      desc: "Khai phá tập kỹ năng đi kèm, xác định khoảng trống năng lực và đề xuất chủ đề cùng tài liệu để ứng viên chủ động ôn tập.",
      tag: "Cảnh Báo & Gợi Ý",
      tagBg: "#FEF3C7",
      tagColor: "#B45309",
    },
  ];

  const coreFeatures = [
    {
      icon: <AimOutlined style={{ fontSize: 26, color: "#2563EB" }} />,
      title: "Năng Lực & Cảnh Báo (Apriori Mining)",
      description: "Ứng dụng thuật toán khai phá luật kết hợp Apriori trên cơ sở dữ liệu tuyển dụng. Tự động phát hiện các tập kỹ năng thường đi kèm (như React + TypeScript → State Management) và phát cảnh báo thiếu sót cho nhà tuyển dụng.",
      badge: "Khai Phá Dữ Liệu",
      badgeColor: "blue",
    },
    {
      icon: <SafetyCertificateOutlined style={{ fontSize: 26, color: "#10B981" }} />,
      title: "Ngôn Từ & Chân Thực (Bias Reduction)",
      description: "Che giấu một số thông tin cá nhân không cần thiết và trình bày kết quả theo tiêu chí nhằm hạn chế ảnh hưởng trực tiếp của dữ liệu nhạy cảm. Kết quả vẫn cần HR giám sát và xem xét.",
      badge: "Công Bằng & Minh Bạch",
      badgeColor: "green",
    },
    {
      icon: <BookOutlined style={{ fontSize: 26, color: "#F59E0B" }} />,
      title: "Lộ Trình Ôn Tập Cá Nhân Hóa",
      description: "Phân tích điểm mạnh, khoảng trống kỹ năng và kinh nghiệm chưa rõ trong CV để đề xuất tối đa ba chủ đề ôn tập cùng tài liệu tham khảo cho ứng viên.",
      badge: "Hỗ Trợ Ứng Viên",
      badgeColor: "gold",
    },
    {
      icon: <SlidersOutlined style={{ fontSize: 26, color: "#8B5CF6" }} />,
      title: "Đánh Giá Hộp Trắng (Explainable AI)",
      description: "Kết hợp giữa thuật toán truyền thống TF-IDF + Cosine Similarity (minh bạch, kiểm chứng được) với AI thế hệ mới Gemini (hiểu sâu ngữ nghĩa), đưa ra lý do giải thích chi tiết cho từng điểm số.",
      badge: "Explainable AI",
      badgeColor: "purple",
    },
  ];

  const techEcosystem = [
    {
      layer: "FRONTEND & USER EXPERIENCE",
      icon: <CodeOutlined style={{ color: "#2563EB" }} />,
      items: [
        { name: "React 19 & TypeScript", detail: "Giao diện Single Page Application B2B mượt mà, tối ưu hóa Type-safety" },
        { name: "Ant Design 5 & Custom Tokens", detail: "Hệ thống Design System nhất quán chuẩn B2B SaaS Slate-Light" },
        { name: "SignalR WebSockets", detail: "Cập nhật thông báo real-time và trạng thái xử lý ứng tuyển tức thì" },
      ],
    },
    {
      layer: "BACKEND & SYSTEM API",
      icon: <DatabaseOutlined style={{ color: "#10B981" }} />,
      items: [
        { name: "C# .NET 8 Web API", detail: "Kiến trúc Repository-Service đáp ứng tải cao và bảo mật nhiều lớp" },
        { name: "Microsoft SQL Server", detail: "Lưu trữ dữ liệu có cấu trúc và hỗ trợ truy vấn nghiệp vụ qua Entity Framework Core" },
        { name: "JWT và phân quyền truy cập", detail: "Phân quyền chi tiết ba vai trò: quản trị viên, nhà tuyển dụng và ứng viên" },
      ],
    },
    {
      layer: "AI & DATA SCIENCE SERVICES",
      icon: <BranchesOutlined style={{ color: "#F59E0B" }} />,
      items: [
        { name: "Google Gemini", detail: "Phân tích ngữ nghĩa CV, giải thích kết quả ASK và đề xuất chủ đề ôn tập" },
        { name: "Python FastAPI Microservice", detail: "Dịch vụ tính toán độc lập cho các thuật toán AI và Data Mining" },
        { name: "TF-IDF & Apriori Miner", detail: "Tính độ tương đồng văn bản hộp trắng và khai phá tập kỹ năng đi kèm" },
      ],
    },
  ];

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "8px 16px 48px" }}>
      {/* 1. HERO SHOWCASE SECTION */}
      <div
        style={{
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
          borderRadius: 24,
          padding: "48px 40px",
          color: "#FFFFFF",
          marginBottom: 48,
          boxShadow: appTheme.shadow.panel,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Row gutter={[40, 32]} align="middle">
          <Col xs={24} lg={14}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(37, 99, 235, 0.2)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                padding: "6px 16px",
                borderRadius: 30,
                marginBottom: 20,
              }}
            >
              <ThunderboltOutlined style={{ color: "#60A5FA" }} />
              <span style={{ color: "#93C5FD", fontSize: 13, fontWeight: 700, letterSpacing: "0.04em" }}>
                AI RECRUITMENT PLATFORM • NỀN TẢNG TUYỂN DỤNG THÔNG MINH
              </span>
            </div>

            <Title level={1} style={{ color: "#FFFFFF", fontWeight: 800, fontSize: 36, margin: "0 0 18px", lineHeight: 1.25 }}>
              Tối Ưu Hóa Tuyển Dụng Với AI Đa Mô-Hình & Khai Phá Dữ Liệu Lớn
            </Title>

            <Paragraph style={{ color: "#94A3B8", fontSize: 16, lineHeight: 1.7, marginBottom: 32 }}>
              Hệ thống **AI Recruitment** đột phá quy trình tuyển dụng truyền thống bằng việc kết hợp giữa **Mô hình Ngôn ngữ Lớn (Google Gemini)**, **Thuật toán Hộp trắng minh bạch (TF-IDF)** và **Khai phá luật kết hợp (Apriori Mining)**. Giúp doanh nghiệp chọn đúng tài năng nhanh chóng và hỗ trợ ứng viên nâng cao năng lực.
            </Paragraph>

            <Space size={16} wrap>
              <Button
                type="primary"
                size="large"
                icon={<CompassOutlined />}
                onClick={() => navigate("/jobs")}
                style={{
                  borderRadius: 10,
                  height: 48,
                  padding: "0 28px",
                  background: "#2563EB",
                  borderColor: "#2563EB",
                  fontWeight: 700,
                  fontSize: 15,
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
                }}
              >
                Khám phá Việc làm ngay
              </Button>
              <Button
                size="large"
                ghost
                icon={<RobotOutlined />}
                onClick={() => navigate("/candidate/dashboard")}
                style={{
                  borderRadius: 10,
                  height: 48,
                  padding: "0 24px",
                  color: "#FFFFFF",
                  borderColor: "rgba(255, 255, 255, 0.3)",
                  fontWeight: 600,
                  fontSize: 15,
                }}
              >
                Báo cáo Năng lực AI
              </Button>
            </Space>
          </Col>

          {/* Right System Metrics Cards */}
          <Col xs={24} lg={10}>
            <div
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: 20,
                padding: 24,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 800, color: "#60A5FA", letterSpacing: "0.08em", marginBottom: 20, textTransform: "uppercase" }}>
                HIỆU NĂNG VÀ CHỈ SỐ HỆ THỐNG
              </div>

              <Row gutter={[14, 14]}>
                <Col span={12}>
                  <div style={{ background: "rgba(15, 23, 42, 0.65)", padding: 18, borderRadius: 12, border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "#10B981" }}>99.2%</div>
                    <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4, fontWeight: 500 }}>Chính xác bóc tách CV</div>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ background: "rgba(15, 23, 42, 0.65)", padding: 18, borderRadius: 12, border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "#3B82F6" }}>80%</div>
                    <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4, fontWeight: 500 }}>Tiết kiệm thời gian HR</div>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ background: "rgba(15, 23, 42, 0.65)", padding: 18, borderRadius: 12, border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "#F59E0B" }}>3 Lớp</div>
                    <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4, fontWeight: 500 }}>Đối sánh đa thuật toán</div>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ background: "rgba(15, 23, 42, 0.65)", padding: 18, borderRadius: 12, border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "#EC4899" }}>Apriori</div>
                    <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4, fontWeight: 500 }}>Khai phá luật kết hợp</div>
                  </div>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
      </div>

      {/* 2. THREE-STEP WORKFLOW SECTION */}
      <div style={{ marginBottom: 56 }}>
        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 40px" }}>
          <Tag color="blue" style={{ borderRadius: 20, padding: "4px 14px", fontWeight: 700, fontSize: 12, marginBottom: 12 }}>
            QUY TRÌNH VẬN HÀNH DỮ LIỆU
          </Tag>
          <Title level={2} style={{ fontWeight: 800, color: "#0F172A", margin: "0 0 12px" }}>
            3 Bước Tuyển Dụng Thông Minh
          </Title>
          <Text style={{ fontSize: 15, color: "#64748B" }}>
            Tự động hóa hoàn toàn luồng xử lý từ lúc ứng viên nộp hồ sơ đến khi xuất báo cáo đánh giá phỏng vấn.
          </Text>
        </div>

        <Row gutter={[24, 24]}>
          {workflowSteps.map((item, idx) => (
            <Col xs={24} md={8} key={idx}>
              <Card
                bordered={false}
                style={{
                  borderRadius: 16,
                  border: "1px solid #E2E8F0",
                  background: "#FFFFFF",
                  height: "100%",
                  boxShadow: "0 2px 10px rgba(15, 23, 42, 0.03)",
                  position: "relative",
                  overflow: "hidden",
                }}
                bodyStyle={{ padding: 28 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: item.tagBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {item.icon}
                  </div>
                  <span style={{ fontSize: 24, fontWeight: 900, color: "#E2E8F0", letterSpacing: "-0.02em" }}>
                    {item.step}
                  </span>
                </div>

                <Tag style={{ background: item.tagBg, color: item.tagColor, border: "none", borderRadius: 6, fontWeight: 700, fontSize: 11, marginBottom: 10 }}>
                  {item.tag}
                </Tag>

                <Title level={4} style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>
                  {item.title}
                </Title>
                <Text style={{ fontSize: 13, color: "#2563EB", fontWeight: 700, display: "block", marginBottom: 12 }}>
                  {item.subtitle}
                </Text>

                <Paragraph style={{ color: "#475569", fontSize: 14, lineHeight: 1.65, margin: 0 }}>
                  {item.desc}
                </Paragraph>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* 3. CORE FEATURES GRID */}
      <div style={{ marginBottom: 56 }}>
        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 40px" }}>
          <Tag color="purple" style={{ borderRadius: 20, padding: "4px 14px", fontWeight: 700, fontSize: 12, marginBottom: 12 }}>
            TÍNH NĂNG CỐT LÕI
          </Tag>
          <Title level={2} style={{ fontWeight: 800, color: "#0F172A", margin: "0 0 12px" }}>
            Công Nghệ Chuẩn Nhân Sự Quốc Tế
          </Title>
          <Text style={{ fontSize: 15, color: "#64748B" }}>
            Tích hợp các thuật toán học máy và khai phá dữ liệu đảm bảo tính minh bạch, công bằng và hiệu quả cao.
          </Text>
        </div>

        <Row gutter={[24, 24]}>
          {coreFeatures.map((feat, idx) => (
            <Col xs={24} md={12} key={idx}>
              <Card
                bordered={false}
                style={{
                  borderRadius: 16,
                  border: "1px solid #E2E8F0",
                  height: "100%",
                  boxShadow: "0 4px 16px rgba(15, 23, 42, 0.03)",
                  background: "#FFFFFF",
                }}
                bodyStyle={{ padding: 28 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {feat.icon}
                  </div>
                  <Tag color={feat.badgeColor} style={{ borderRadius: 6, padding: "4px 12px", fontWeight: 700, fontSize: 12, margin: 0 }}>
                    {feat.badge}
                  </Tag>
                </div>

                <Title level={4} style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", marginBottom: 10 }}>
                  {feat.title}
                </Title>

                <Paragraph style={{ color: "#475569", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                  {feat.description}
                </Paragraph>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* 4. TECH STACK ECOSYSTEM */}
      <div style={{ marginBottom: 56 }}>
        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 40px" }}>
          <Tag color="green" style={{ borderRadius: 20, padding: "4px 14px", fontWeight: 700, fontSize: 12, marginBottom: 12 }}>
            HẠ TẦNG CÔNG NGHỆ
          </Tag>
          <Title level={2} style={{ fontWeight: 800, color: "#0F172A", margin: "0 0 12px" }}>
            Hệ Sinh Thái Kiến Trúc Enterprise
          </Title>
          <Text style={{ fontSize: 15, color: "#64748B" }}>
            Xây dựng trên nền tảng microservices hiện đại, có khả năng mở rộng và đáp ứng tải cao.
          </Text>
        </div>

        <Row gutter={[24, 24]}>
          {techEcosystem.map((group, idx) => (
            <Col xs={24} lg={8} key={idx}>
              <Card
                bordered={false}
                style={{
                  borderRadius: 16,
                  border: "1px solid #E2E8F0",
                  background: "#FFFFFF",
                  boxShadow: "0 2px 12px rgba(15, 23, 42, 0.03)",
                  height: "100%",
                }}
                bodyStyle={{ padding: 24 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, paddingBottom: 12, borderBottom: "1px solid #F1F5F9" }}>
                  <span style={{ fontSize: 20 }}>{group.icon}</span>
                  <Text strong style={{ fontSize: 12, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {group.layer}
                  </Text>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {group.items.map((item, itemIdx) => (
                    <div key={itemIdx} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <CheckCircleOutlined style={{ color: "#10B981", fontSize: 16, marginTop: 3, flexShrink: 0 }} />
                      <div>
                        <Text strong style={{ fontSize: 14, color: "#0F172A", display: "block", marginBottom: 2 }}>
                          {item.name}
                        </Text>
                        <Text style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5, display: "block" }}>
                          {item.detail}
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* 5. CALL TO ACTION BANNER */}
      <Card
        bordered={false}
        style={{
          borderRadius: 20,
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          boxShadow: "0 8px 30px rgba(15, 23, 42, 0.04)",
        }}
        bodyStyle={{ padding: "40px 32px" }}
      >
        <Row gutter={[32, 24]} align="middle" justify="space-between">
          <Col xs={24} md={16}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#EFF6FF", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                <RocketOutlined />
              </div>
              <Title level={3} style={{ fontWeight: 800, color: "#0F172A", margin: 0 }}>
                Sẵn Sàng Trải Nghiệm Tuyển Dụng AI?
              </Title>
            </div>
            <Paragraph style={{ color: "#64748B", fontSize: 15, margin: 0, lineHeight: 1.6 }}>
              Khám phá ngay các vị trí tuyển dụng mới nhất hoặc trải nghiệm hệ thống phân tích báo cáo năng lực AI cho ứng viên và nhà tuyển dụng.
            </Paragraph>
          </Col>

          <Col xs={24} md={8} style={{ textAlign: "right" }}>
            <Space size={12} wrap style={{ justifyContent: "flex-end", width: "100%" }}>
              <Button
                type="primary"
                size="large"
                icon={<ArrowRightOutlined />}
                onClick={() => navigate("/jobs")}
                style={{
                  borderRadius: 10,
                  height: 44,
                  padding: "0 24px",
                  background: "#2563EB",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                Khám phá việc làm
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>
    </div>
  );
}

export default AboutPage;
