import { Button, Layout, Typography, Space, Row, Col, Divider, Badge, Popover, List, message, notification as antdNotification, Avatar } from "antd";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import CandidateChatbot from "../../components/common/CandidateChatbot";
import {
  GlobalOutlined,
  BellOutlined,
  CheckOutlined,
  MailOutlined,
  DashboardOutlined,
  SolutionOutlined,
  StarOutlined,
  ProfileOutlined,
  UploadOutlined,
  FileSearchOutlined,
  UserOutlined
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import axiosClient from "../../services/axiosClient";

const { Header, Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;

const AiCoreIcon = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="saasGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2563EB" />
        <stop offset="50%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#10B981" />
      </linearGradient>
    </defs>
    <path
      d="M12 2.5L4 7v10l8 4.5 8-4.5V7l-8-4.5z"
      stroke="url(#saasGrad)"
      strokeWidth="2"
      strokeLinejoin="round"
      fill="none"
    />
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
    <circle cx="12" cy="12" r="2" fill="url(#saasGrad)" />
  </svg>
);

function PublicLayout() {
  const user = authService.getCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [bellRinging, setBellRinging] = useState(false);

  const accountId = user?.accountId || user?.AccountId;

  // 1. Fetch initial notifications
  const fetchNotifications = async () => {
    try {
      const response = await axiosClient.get("/notifications");
      if (Array.isArray(response.data)) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error("Lỗi khi tải thông báo:", error);
    }
  };

  useEffect(() => {
    if (accountId) {
      fetchNotifications();
    }
  }, [accountId]);

  // 2. Set up SignalR connection
  useEffect(() => {
    if (!accountId) return;

    const apiUrl = import.meta.env.VITE_API_URL || "https://localhost:7006/api";
    const hubUrl = apiUrl.replace("/api", "/hubs/notifications");

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => localStorage.getItem("token") || ""
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    const startConnection = async () => {
      try {
        await connection.start();
        console.log("Đã kết nối SignalR NotificationHub (Public).");
        
        await connection.invoke("JoinGroup", accountId);

        connection.on("ReceiveNotification", (newNotif: any) => {
          const formattedNotif = {
            id: newNotif.id || newNotif.NotificationID,
            title: newNotif.title || newNotif.Title,
            content: newNotif.content || newNotif.Content,
            redirectUrl: newNotif.redirectUrl || newNotif.RedirectUrl,
            isRead: newNotif.isRead || newNotif.IsRead || false,
            createdAt: newNotif.createdAt || newNotif.CreatedAt || new Date().toISOString()
          };

          setBellRinging(true);
          setTimeout(() => setBellRinging(false), 1000);

          setNotifications((prev) => [formattedNotif, ...prev]);

          antdNotification.info({
            message: formattedNotif.title,
            description: formattedNotif.content,
            placement: "bottomRight",
            onClick: () => {
              handleNotifClick(formattedNotif);
            },
            style: {
              cursor: "pointer",
              borderRadius: "8px",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
            }
          });
        });
      } catch (err) {
        console.error("SignalR Connection Error (Public):", err);
      }
    };

    startConnection();

    return () => {
      connection.stop();
    };
  }, [accountId]);

  const handleNotifClick = async (notif: any) => {
    setPopoverOpen(false);
    
    if (!notif.isRead) {
      try {
        await axiosClient.put(`/notifications/${notif.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
      } catch (err) {
        console.error("Lỗi khi đánh dấu đã đọc:", err);
      }
    }

    if (notif.redirectUrl) {
      navigate(notif.redirectUrl);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axiosClient.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      message.success("Đã đánh dấu đọc tất cả thông báo.");
    } catch (err) {
      console.error("Lỗi khi đánh dấu đọc tất cả:", err);
    }
  };

  const candidateWorkspacePaths = [
    "/candidate/dashboard",
    "/candidate/saved-jobs",
    "/profile"
  ];
  const isWorkspace = candidateWorkspacePaths.some(path => location.pathname === path);

  const subNavItems = [
    { path: "/candidate/dashboard", label: "Báo cáo năng lực", icon: <DashboardOutlined /> },
    { path: "/candidate/saved-jobs", label: "Việc làm đã lưu", icon: <StarOutlined /> },
    { path: "/profile", label: "Hồ sơ cá nhân", icon: <ProfileOutlined /> }
  ];

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  // Render notification Popover content
  const notifPopoverContent = (
    <div style={{ width: 350, maxHeight: 450, display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingBottom: 10,
          borderBottom: "1px solid #F1F5F9",
          marginBottom: 10
        }}
      >
        <Text strong style={{ fontSize: 15, color: "#0F172A" }}>
          Thông báo ({unreadCount})
        </Text>
        {unreadCount > 0 && (
          <Button
            type="text"
            size="small"
            icon={<CheckOutlined style={{ fontSize: 12 }} />}
            onClick={handleMarkAllRead}
            style={{ color: "#2563EB", fontSize: 12, padding: "0 4px" }}
          >
            Đọc tất cả
          </Button>
        )}
      </div>

      <div style={{ overflowY: "auto", flex: 1, maxHeight: 350 }}>
        {notifications.length === 0 ? (
          <div style={{ padding: "30px 0", textAlign: "center", color: "#94A3B8" }}>
            <MailOutlined style={{ fontSize: 32, marginBottom: 8, display: "block" }} />
            Không có thông báo mới
          </div>
        ) : (
          <List
            dataSource={notifications}
            itemLayout="horizontal"
            renderItem={(item) => (
              <List.Item
                onClick={() => handleNotifClick(item)}
                style={{
                  padding: "10px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  backgroundColor: item.isRead ? "transparent" : "#F8FAFC",
                  transition: "all 0.2s ease",
                  marginBottom: 4,
                  borderBottom: "none"
                }}
                className="hover-bg-slate"
              >
                <div style={{ display: "flex", width: "100%", position: "relative" }}>
                  {!item.isRead && (
                    <span
                      style={{
                        position: "absolute",
                        left: -8,
                        top: 8,
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: "#2563EB"
                      }}
                    />
                  )}
                  <div style={{ paddingLeft: 6, flex: 1 }}>
                    <Text
                      strong={!item.isRead}
                      style={{
                        fontSize: 13,
                        color: item.isRead ? "#475569" : "#0F172A",
                        display: "block",
                        lineHeight: 1.3
                      }}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#64748B",
                        display: "block",
                        marginTop: 2,
                        lineHeight: 1.4
                      }}
                    >
                      {item.content}
                    </Text>
                    <span style={{ fontSize: 10, color: "#94A3B8", marginTop: 4, display: "inline-block" }}>
                      {new Date(item.createdAt).toLocaleString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit"
                      })}
                    </span>
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );

  // Danh sách các trang cần hiển thị Full-width (không bị giới hạn 1200px ở Layout ngoài cùng)
  const isFullWidthPage = location.pathname === "/" || location.pathname.startsWith("/jobs") || location.pathname.startsWith("/candidate");

  const customStyles = `
    .header-nav-link {
      color: #475569 !important;
      font-weight: 500;
      transition: all 0.2s ease-in-out;
    }
    .header-nav-link:hover {
      color: #2563EB !important;
    }
    .logo-link {
      color: #2563EB !important;
      font-weight: 800;
      transition: opacity 0.2s;
    }
    .logo-link:hover {
      opacity: 0.9;
    }
    .btn-primary-custom {
      background-color: #2563EB !important;
      border-color: #2563EB !important;
      transition: all 0.2s ease-in-out !important;
    }
    .btn-primary-custom:hover {
      background-color: #1D4ED8 !important;
      border-color: #1D4ED8 !important;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
    }
    .btn-primary-custom:active {
      transform: translateY(0);
      transform: scale(0.98);
    }
    .footer-link {
      color: #64748B !important;
      transition: all 0.2s ease-in-out;
      display: inline-block;
    }
    .footer-link:hover {
      color: #FFFFFF !important;
      transform: translateX(4px);
    }
  `;

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <Header
        style={{
          background: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(20px)",
          padding: 0,
          height: "80px",
          lineHeight: "80px",
          borderBottom: "1px solid rgba(226, 232, 240, 0.8)",
          position: "sticky",
          top: 0,
          zIndex: 1000,
          boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.05)",
        }}
      >
        <div
          style={{
            maxWidth: "1300px",
            margin: "0 auto",
            padding: "0 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            height: "100%",
          }}
        >
          {/* Nhóm trái: Logo + Navigation (Tạo CV & Việc Làm) */}
          <Space size={32}>
            <Title level={3} style={{ margin: 0, display: "flex", alignItems: "center" }}>
              <Link to="/" className="logo-link" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <AiCoreIcon size={28} />
                <span style={{ fontSize: "20px", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.03em" }}>
                  AI Tuyển Dụng
                </span>
              </Link>
            </Title>
            <Space size={4}>
              <Link
                to="/jobs"
                className="header-nav-link"
                style={{
                  display: "inline-block",
                  height: "80px",
                  lineHeight: "80px",
                  padding: "0 16px",
                  fontWeight: 600,
                  fontSize: "16px",
                }}
              >
                Tìm việc làm
              </Link>
              <Link
                to="/about"
                className="header-nav-link"
                style={{
                  display: "inline-block",
                  height: "80px",
                  lineHeight: "80px",
                  padding: "0 16px",
                  fontWeight: 600,
                  fontSize: "16px",
                }}
              >
                Giới thiệu
              </Link>
            </Space>
          </Space>

          {/* Nhóm phải: User Actions */}
          <Space size="middle" style={{ alignItems: "center" }}>
            {user && user.role === "Candidate" ? (
              <>
                {/* Real-time Notification Bell */}
                <Popover
                  content={notifPopoverContent}
                  title={null}
                  trigger="click"
                  open={popoverOpen}
                  onOpenChange={setPopoverOpen}
                  placement="bottomRight"
                >
                  <Badge count={unreadCount} size="small" offset={[2, 2]} style={{ cursor: "pointer" }}>
                    <Button
                      type="text"
                      shape="circle"
                      icon={<BellOutlined style={{ fontSize: 20, color: "#64748B" }} />}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s ease",
                        transform: bellRinging ? "scale(1.15) rotate(15deg)" : "scale(1)",
                        marginRight: 16
                      }}
                    />
                  </Badge>
                </Popover>

                <Link to="/profile" style={{ display: "flex", alignItems: "center" }}>
                  <Space size={12} style={{ marginRight: 8, cursor: "pointer" }}>
                    <Avatar icon={<UserOutlined />} style={{ backgroundColor: "#2563EB" }} />
                    <Text strong style={{ color: "#475569", fontSize: "14px" }}>
                      {user.fullName || user.FullName || "Ứng viên"}
                    </Text>
                  </Space>
                </Link>

                <Button
                  type="primary"
                  danger
                  ghost
                  onClick={handleLogout}
                  style={{ borderRadius: "8px", fontWeight: 500 }}
                >
                  Đăng xuất
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button
                  type="primary"
                  size="large"
                  className="btn-primary-custom"
                  style={{ borderRadius: "8px", fontWeight: 600 }}
                >
                  Đăng nhập / Đăng ký
                </Button>
              </Link>
            )}
          </Space>
        </div>
      </Header>

      {/* Sub-Header Horizontal Navigation for Candidate Workspace */}
      {user && user.role === "Candidate" && isWorkspace && (
        <div
          style={{
            background: "#FFFFFF",
            borderBottom: "1px solid #E2E8F0",
            height: "54px",
            lineHeight: "54px",
            position: "sticky",
            top: "80px",
            zIndex: 999,
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)"
          }}
        >
          <div
            style={{
              maxWidth: "1300px",
              margin: "0 auto",
              padding: "0 20px",
              display: "flex",
              gap: "28px",
              height: "100%",
              overflowX: "auto"
            }}
            className="custom-scrollbar"
          >
            {subNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: isActive ? "#2563EB" : "#64748B",
                    fontWeight: isActive ? 600 : 500,
                    fontSize: "14px",
                    borderBottom: isActive ? "3px solid #2563EB" : "3px solid transparent",
                    height: "100%",
                    padding: "0 4px",
                    transition: "all 0.2s"
                  }}
                  className="sub-nav-link"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <Content
        style={{
          padding: isFullWidthPage ? 0 : "40px 20px",
          background: "#F8FAFC",
          minHeight: "calc(100vh - 144px)",
        }}
      >
        <div style={{ maxWidth: isFullWidthPage ? "100%" : "1300px", margin: "0 auto" }}>
          <Outlet />
        </div>
      </Content>
      <Footer style={{ background: "#0F172A", color: "#94A3B8", padding: "80px 20px 40px", borderTop: "1px solid #1E293B" }}>
        <div style={{ maxWidth: "1300px", margin: "0 auto" }}>
          <Row gutter={[40, 40]}>
            <Col xs={24} md={8}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <AiCoreIcon size={32} />
                <span style={{ fontSize: "20px", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
                  AI Tuyển Dụng
                </span>
              </div>
              <Paragraph style={{ color: "#64748B", fontSize: "14px", lineHeight: 1.6, maxWidth: "280px" }}>
                Hệ thống hỗ trợ tuyển dụng thế mới, tối ưu hóa hồ sơ & nâng tầm năng lực cho ứng viên và doanh nghiệp.
              </Paragraph>
            </Col>

            <Col xs={12} md={4}>
              <Text strong style={{ color: "#FFFFFF", display: "block", marginBottom: "20px", fontSize: "15px" }}>
                Giải pháp
              </Text>
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <a href="#" className="footer-link">Phân tích CV bằng AI</a>
                <a href="#" className="footer-link">Năng lực & Cảnh báo</a>
                <a href="#" className="footer-link">Gợi ý phỏng vấn</a>
                <a href="#" className="footer-link">Ngôn từ & Chân thực</a>
              </Space>
            </Col>

            <Col xs={12} md={4}>
              <Text strong style={{ color: "#FFFFFF", display: "block", marginBottom: "20px", fontSize: "15px" }}>
                Cho Ứng Viên
              </Text>
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <Link to="/jobs" className="footer-link">Tìm việc làm</Link>
                <Link to="/profile" className="footer-link">Tạo CV chuyên nghiệp</Link>
                <Link to="/my-applications" className="footer-link">Việc làm đã nộp</Link>
                <Link to="/jobs" className="footer-link">Việc làm phù hợp</Link>
              </Space>
            </Col>

            <Col xs={12} md={4}>
              <Text strong style={{ color: "#FFFFFF", display: "block", marginBottom: "20px", fontSize: "15px" }}>
                Cho Nhà Tuyển Dụng
              </Text>
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <Link to="/recruiter/jobs" className="footer-link">Đăng tin tuyển dụng</Link>
                <Link to="/recruiter/applications" className="footer-link">Quản lý ứng viên</Link>
                <Link to="/recruiter/ranking" className="footer-link">Xếp hạng CV bằng AI</Link>
                <Link to="/recruiter/talent-pool" className="footer-link">Talent Pool</Link>
              </Space>
            </Col>

            <Col xs={24} md={4}>
              <Text strong style={{ color: "#FFFFFF", display: "block", marginBottom: "20px", fontSize: "15px" }}>
                Hỗ Trợ & Liên Hệ
              </Text>
              <Space direction="vertical" size={12} style={{ width: "100%", color: "#64748B", fontSize: "14px" }}>
                <div>Email: support@tuyendungai.com</div>
                <div>Hotline: 1900 1234</div>
                <div style={{ lineHeight: "1.5" }}>Địa chỉ: Khu công nghệ phần mềm, Tp. Hồ Chí Minh, Việt Nam</div>
              </Space>
            </Col>
          </Row>

          <Divider style={{ margin: "50px 0 30px", borderColor: "rgba(255, 255, 255, 0.05)" }} />

          <Row justify="space-between" align="middle" gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Text style={{ color: "#64748B", fontSize: "13px" }}>
                Khóa luận tốt nghiệp © {new Date().getFullYear()} Tuyển Dụng AI. Tất cả quyền được bảo lưu.
              </Text>
            </Col>
            <Col xs={24} md={12} style={{ textAlign: "right" }}>
              <Space size="large">
                <Link to="/" style={{ color: "#64748B", fontSize: "13px" }}>Điều khoản</Link>
                <Link to="/" style={{ color: "#64748B", fontSize: "13px" }}>Bảo mật</Link>
                <Link to="/" style={{ color: "#64748B", fontSize: "13px" }}>Hướng dẫn</Link>
                <Space size={4} style={{ marginLeft: 16 }}>
                  <GlobalOutlined style={{ color: "#64748B", fontSize: 14 }} />
                  <Text style={{ color: "#64748B", fontSize: "13px" }}>Tiếng Việt (Việt Nam)</Text>
                </Space>
              </Space>
            </Col>
          </Row>
        </div>
      </Footer>
      <CandidateChatbot />
    </Layout>
  );
}

export default PublicLayout;
