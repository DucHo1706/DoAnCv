import { Avatar, Dropdown, Layout, Menu, Space, Typography, message } from "antd";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import { useEffect, useState } from "react";
import { LogoutOutlined, UserOutlined, SettingOutlined } from "@ant-design/icons";

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

const AiCoreIcon = ({ size = 24 }: { size?: number }) => (
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

function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
    } else {
      setCurrentUser(user);
    }
  }, [navigate, location]);

  const handleMenuClick = (info: any) => {
    if (info.key === "logout") {
      authService.logout();
      navigate("/login");
    } else if (info.key === "settings") {
      message.info("Chức năng Cài đặt đang được cập nhật.");
    }
  };

  const userMenuItems = [
    { 
      key: "profile", 
      icon: <UserOutlined />, 
      label: <Link to={currentUser?.role === "Recruiter" ? "/recruiter/profile" : "/profile"}>Thông tin tài khoản</Link> 
    },
    { key: "settings", icon: <SettingOutlined />, label: "Cài đặt" },
    { type: "divider" as const },
    { key: "logout", icon: <LogoutOutlined />, label: "Đăng xuất", danger: true },
  ];

  const hrMenuItems = [
    {
      key: "/recruiter/dashboard",
      label: <Link to="/recruiter/dashboard">Dashboard Thống Kê</Link>,
    },
    {
      key: "/recruiter/jobs",
      label: <Link to="/recruiter/jobs">Quản lý Tin Tuyển Dụng</Link>,
    },
    {
      key: "/recruiter/applications",
      label: <Link to="/recruiter/applications">Hồ sơ & Xếp hạng AI</Link>,
    },
    {
      key: "/recruiter/schedules",
      label: <Link to="/recruiter/schedules">Lịch phỏng vấn</Link>,
    },
    {
      key: "/recruiter/talent-pool",
      label: <Link to="/recruiter/talent-pool">Ngân hàng Ứng viên</Link>,
    },
    {
      key: "/recruiter/email-logs",
      label: <Link to="/recruiter/email-logs">Nhật ký gửi mail</Link>,
    },
  ];

  const adminMenuItems = [
    {
      key: "/admin/dashboard",
      label: <Link to="/admin/dashboard">Admin Dashboard</Link>,
    },
    {
      key: "/admin/approval",
      label: <Link to="/admin/approval">Duyệt Tin Tuyển Dụng</Link>,
    },
    {
      key: "/admin/users",
      label: <Link to="/admin/users">Quản lý HR & Người Dùng</Link>,
    },
    {
      key: "/admin/branches",
      label: <Link to="/admin/branches">Quản lý Chi Nhánh</Link>,
    },
    {
      key: "/admin/categories",
      label: <Link to="/admin/categories">Quản lý Lĩnh Vực</Link>,
    },
    {
      key: "/admin/job-levels",
      label: <Link to="/admin/job-levels">Quản lý Cấp Bậc</Link>,
    },
    {
      key: "/admin/job-positions",
      label: <Link to="/admin/job-positions">Quản lý Vị Trí</Link>,
    },
    {
      key: "/admin/roles",
      label: <Link to="/admin/roles">Phân Quyền & Vai Trò</Link>,
    },
    {
      key: "/admin/reports",
      label: <Link to="/admin/reports">Báo cáo Hệ thống</Link>,
    },
  ];

  const menuItems = isAdminRoute ? adminMenuItems : hrMenuItems;
  let selectedMenuKey = location.pathname;

  if (location.pathname.startsWith("/recruiter/ranking")) {
    selectedMenuKey = "/recruiter/applications";
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar Slate-900 chuyên nghiệp */}
      <Sider theme="dark" width={260} style={{ backgroundColor: "#0F172A" }}>
        <div
          style={{ 
            padding: "24px 16px", 
            borderBottom: "1px solid #1E293B",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10
          }}
        >
          <AiCoreIcon size={24} />
          <Title
            level={4}
            style={{ margin: 0, color: "#3B82F6", fontWeight: 800, letterSpacing: "0.5px" }}
          >
            {isAdminRoute ? "ADMIN PORTAL" : "HR PORTAL"}
          </Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedMenuKey]}
          items={menuItems}
          style={{ borderRight: 0, backgroundColor: "#0F172A", paddingTop: 16 }}
        />
      </Sider>
      
      <Layout style={{ backgroundColor: "#F8FAFC" }}>
        <Header
          style={{
            background: "#FFFFFF",
            padding: "0 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #E2E8F0",
          }}
        >
          <Text strong style={{ fontSize: 16, color: "#334155" }}>
            {isAdminRoute ? "Hệ thống quản trị" : "Không gian tuyển dụng"}
          </Text>
          
          <Dropdown menu={{ items: userMenuItems, onClick: handleMenuClick }} placement="bottomRight" trigger={["click"]}>
            <Space style={{ cursor: "pointer" }}>
              <Avatar style={{ backgroundColor: "#3B82F6" }} icon={<UserOutlined />} />
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                <Text strong style={{ fontSize: 14 }}>
                  {currentUser?.fullName || "Thành viên"}
                </Text>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {isAdminRoute ? "Administrator" : "Recruiter"}
                </Text>
              </div>
            </Space>
          </Dropdown>
        </Header>
        
        {/* Nền trong suốt để các Card trắng hiển thị bóng đổ nổi bật */}
        <Content style={{ margin: "32px", background: "transparent", minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default MainLayout;
