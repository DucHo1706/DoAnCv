import {
  CheckCircleFilled,
  RobotOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Layout, Space, Typography } from "antd";
import { Outlet } from "react-router-dom";

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

function AuthLayout() {
  const featureItems = [
    {
      icon: <RobotOutlined />,
      title: "AI Screening",
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
      <Content
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 1200,
            minHeight: 680,
            background: "#FFFFFF",
            borderRadius: 24,
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(15, 23, 42, 0.12)",
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
          }}
        >
          <div
            style={{
              position: "relative",
              padding: 48,
              background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
              color: "#FFFFFF",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.16)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 24,
                  fontSize: 24,
                }}
              >
                <RobotOutlined />
              </div>

              <Title level={1} style={{ color: "#FFFFFF", marginBottom: 16 }}>
                AI Recruitment System
              </Title>

              <Paragraph
                style={{
                  color: "rgba(255,255,255,0.88)",
                  fontSize: 16,
                  lineHeight: 1.8,
                  maxWidth: 480,
                }}
              >
                Nền tảng hỗ trợ tuyển dụng thông minh, giúp nhà tuyển dụng đánh giá CV hiệu quả hơn
                và hỗ trợ ứng viên tiếp cận cơ hội phù hợp.
              </Paragraph>
            </div>

            <Space direction="vertical" size={20} style={{ width: "100%" }}>
              {featureItems.map((item) => (
                <div
                  key={item.title}
                  style={{
                    display: "flex",
                    gap: 16,
                    padding: 16,
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.12)",
                    backdropFilter: "blur(6px)",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.18)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      flexShrink: 0,
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
                    <Text style={{ color: "rgba(255,255,255,0.84)" }}>{item.description}</Text>
                  </div>
                </div>
              ))}
            </Space>

            <div
              style={{
                marginTop: 24,
                padding: 18,
                borderRadius: 16,
                background: "rgba(255,255,255,0.12)",
              }}
            >
              <Space align="start">
                <CheckCircleFilled style={{ color: "#BFDBFE", marginTop: 4 }} />
                <Text style={{ color: "rgba(255,255,255,0.9)" }}>
                  Giao diện base được thiết kế để dễ mở rộng cho recruiter, candidate và admin ở các
                  bước tiếp theo.
                </Text>
              </Space>
            </div>
          </div>

          <div
            style={{
              padding: 48,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#FFFFFF",
            }}
          >
            <div style={{ width: "100%", maxWidth: 420 }}>
              <Outlet />
            </div>
          </div>
        </div>
      </Content>
    </Layout>
  );
}

export default AuthLayout;
