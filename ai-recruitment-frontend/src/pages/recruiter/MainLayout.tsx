import { Avatar, Dropdown, Layout, Menu, Space, Typography } from "antd";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import { useEffect, useState } from "react";
import { LogoutOutlined, UserOutlined, SettingOutlined } from "@ant-design/icons";

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      navigate("/login");
    } else {
      setCurrentUser(user);
    }
  }, [navigate]);

  const handleLogout = (e: any) => {
    e.preventDefault();
    authService.logout();
    navigate("/login");
  };

  const userMenuItems = [
    { key: "profile", icon: <UserOutlined />, label: <Link to="/profile">Thông tin tài khoản</Link> },
    { key: "settings", icon: <SettingOutlined />, label: "Cài đặt" },
    { type: "divider" as const },
    { key: "logout", icon: <LogoutOutlined />, label: "Đăng xuất", danger: true, onClick: handleLogout },
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
      key: "/recruiter/talent-pool",
      label: <Link to="/recruiter/talent-pool">Ngân hàng Ứng viên</Link>,
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

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar Slate-900 chuyên nghiệp */}
      <Sider theme="dark" width={260} style={{ backgroundColor: "#0F172A" }}>
        <div
          style={{ padding: "24px 16px", textAlign: "center", borderBottom: "1px solid #1E293B" }}
        >
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
          selectedKeys={[location.pathname]}
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
          
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={["click"]}>
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
