import { Layout, Menu, Typography } from "antd";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import { useEffect, useState } from "react";

const { Header, Content, Footer, Sider } = Layout;
const { Title } = Typography;

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
  };

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
  let selectedMenuKey = location.pathname;

  if (location.pathname.startsWith("/recruiter/ranking")) {
    selectedMenuKey = "/recruiter/applications";
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider theme="light" width={260}>
        <div
          style={{ padding: "20px 16px", textAlign: "center", borderBottom: "1px solid #E2E8F0" }}
        >
          <Title
            level={4}
            style={{ margin: 0, color: "#2563EB", fontWeight: 800, letterSpacing: "0.5px" }}
          >
            {isAdminRoute ? "Admin Portal" : "HR Portal"}
          </Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedMenuKey]}
          items={menuItems}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{ background: "#fff", padding: "0 24px", borderBottom: "1px solid #E2E8F0" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              height: "100%",
            }}
          >
            <span style={{ marginRight: "16px", fontWeight: 600, color: "#334155" }}>
              Xin chào, {currentUser?.fullName || "Người dùng"}
            </span>
            <a href="#" onClick={handleLogout} style={{ color: "#EF4444", fontWeight: 600 }}>
              Đăng xuất
            </a>
          </div>
        </Header>
        <Content style={{ margin: "24px 16px", padding: 24, background: "#fff", minHeight: 280 }}>
          {/* Outlet là nơi các trang con (JobManagement, JobApproval...) sẽ được hiển thị */}
          <Outlet />
        </Content>
        <Footer style={{ textAlign: "center" }}>
          Khóa luận tốt nghiệp ©2026 - Ứng dụng AI trong tuyển dụng
        </Footer>
      </Layout>
    </Layout>
  );
}

export default MainLayout;
