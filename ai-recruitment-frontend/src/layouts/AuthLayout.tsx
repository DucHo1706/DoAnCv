import {
  ArrowLeftOutlined,
  CheckCircleFilled,
  SafetyCertificateOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Layout, Space, Typography } from "antd";
import { Link, Outlet } from "react-router-dom";

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

// A modern, clean hexagonal geometric prism SVG icon that fits professional SaaS branding
const AiCoreIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="saasGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2563EB" />
        <stop offset="50%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#10B981" />
      </linearGradient>
    </defs>
    {/* Outer hexagonal outline */}
    <path
      d="M12 2.5L4 7v10l8 4.5 8-4.5V7l-8-4.5z"
      stroke="url(#saasGrad)"
      strokeWidth="2"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Inner decorative delta shape */}
    <path
      d="M12 7.5L7.5 10v4l4.5 2.5 4.5-2.5v-4L12 7.5z"
      fill="url(#saasGrad)"
      opacity="0.15"
    />
    <path
      d="M12 7.5L7.5 10v4l4.5 2.5 4.5-2.5v-4L12 7.5z"
      stroke="url(#saasGrad)"
      strokeWidth="1.5"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Center core point */}
    <circle cx="12" cy="12" r="2" fill="url(#saasGrad)" />
  </svg>
);

function AuthLayout() {
  const authResponsiveStyles = `
    @media (max-width: 992px) {
      .auth-shell {
        grid-template-columns: 1fr !important;
        min-height: auto !important;
      }
      .auth-left-panel {
        display: none !important;
      }
      .auth-right-panel {
        padding: 56px 20px 32px !important;
      }
      .auth-back-wrap {
        left: 20px !important;
      }
    }
  `;

  const featureItems = [
    {
      icon: <AiCoreIcon size={20} />,
      title: "Sàng lọc CV bằng AI",
      description: "Tự động hỗ trợ đánh giá và sàng lọc hồ sơ ứng viên.",
    },
    {
      icon: <TeamOutlined />,
      title: "Tối ưu tuyển dụng",
      description: "Quản lý ứng viên, vị trí tuyển dụng và quy trình tập trung.",
    },
    {
      icon: <SafetyCertificateOutlined />,
      title: "Trực quan & chuyên nghiệp",
      description: "Thiết kế hiện đại, phù hợp với hệ thống quản trị tuyển dụng.",
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh", background: "#F8FAFC" }}>
      <style dangerouslySetInnerHTML={{ __html: authResponsiveStyles }} />
      <Content
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div
          className="auth-shell"
          style={{
            width: "100%",
            maxWidth: 1200,
            minHeight: 680,
            background: "#FFFFFF",
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(15, 23, 42, 0.08)",
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
          }}
        >
          {/* Left panel */}
          <div
            className="auth-left-panel"
            style={{
              position: "relative",
              padding: 48,
              background: "#0F172A",
              color: "#FFFFFF",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              overflow: "hidden",
            }}
          >
            {/* Glow effects */}
            <div
              style={{
                position: "absolute",
                top: "-20%",
                left: "-20%",
                width: "80%",
                height: "80%",
                background: "radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, transparent 70%)",
                filter: "blur(50px)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "-20%",
                right: "-20%",
                width: "80%",
                height: "80%",
                background: "radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)",
                filter: "blur(50px)",
                pointerEvents: "none",
              }}
            />

            <div style={{ position: "relative", zIndex: 2 }}>
              <Link to="/" style={{ display: "inline-block" }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 24,
                    transition: "all 0.2s ease-in-out",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                  }}
                >
                  <AiCoreIcon size={32} />
                </div>
              </Link>

              <Title level={1} style={{ color: "#FFFFFF", marginBottom: 16, fontSize: 32, fontWeight: 800 }}>
                AI Recruitment System
              </Title>

              <Paragraph
                style={{
                  color: "#94A3B8",
                  fontSize: 15,
                  lineHeight: 1.8,
                  maxWidth: 480,
                }}
              >
                Nền tảng hỗ trợ tuyển dụng thông minh, giúp nhà tuyển dụng đánh giá CV hiệu quả hơn
                và hỗ trợ ứng viên tiếp cận cơ hội phù hợp.
              </Paragraph>
            </div>

            <Space direction="vertical" size={16} style={{ width: "100%", position: "relative", zIndex: 2 }}>
              {featureItems.map((item) => (
                <div
                  key={item.title}
                  style={{
                    display: "flex",
                    gap: 16,
                    padding: 16,
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      flexShrink: 0,
                      color: "#38BDF8",
                    }}
                  >
                    {item.icon}
                  </div>

                  <div>
                    <Text
                      strong
                      style={{
                        display: "block",
                        color: "#FFFFFF",
                        marginBottom: 4,
                        fontSize: 15,
                      }}
                    >
                      {item.title}
                    </Text>
                    <Text style={{ color: "#94A3B8", fontSize: 13.5 }}>{item.description}</Text>
                  </div>
                </div>
              ))}
            </Space>

            <div
              style={{
                marginTop: 24,
                padding: 18,
                borderRadius: 16,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.05)",
                position: "relative",
                zIndex: 2,
              }}
            >
              <Space align="start">
                <CheckCircleFilled style={{ color: "#38BDF8", marginTop: 4 }} />
                <Text style={{ color: "#94A3B8", fontSize: 13.5 }}>
                  Giao diện base được thiết kế để dễ mở rộng cho recruiter, candidate và admin ở các
                  bước tiếp theo.
                </Text>
              </Space>
            </div>
          </div>

          {/* Right panel with back button */}
          <div
            className="auth-right-panel"
            style={{
              padding: 48,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              background: "#FFFFFF",
              position: "relative",
            }}
          >
            {/* Back to homepage button */}
            <div className="auth-back-wrap" style={{ position: "absolute", top: 24, left: 48 }}>
              <Link
                to="/"
                style={{
                  color: "#64748B",
                  fontSize: 13,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#2563EB")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}
              >
                <ArrowLeftOutlined /> Quay lại trang chủ
              </Link>
            </div>

            <div style={{ width: "100%", maxWidth: 420, margin: "auto 0" }}>
              <Outlet />
            </div>
          </div>
        </div>
      </Content>
    </Layout>
  );
}

export default AuthLayout;
