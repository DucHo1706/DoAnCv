import { Layout, Menu, Typography } from "antd";
import { Link, Outlet, useLocation } from "react-router-dom";

const { Header, Content, Footer, Sider } = Layout;
const { Title } = Typography;

function MainLayout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

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
      key: "/recruiter/candidates",
      label: <Link to="/recruiter/candidates">Danh sách Ứng viên</Link>,
    },
    {
      key: "/recruiter/ranking",
      label: <Link to="/recruiter/ranking">Xếp hạng CV (AI)</Link>,
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
      <Sider theme="light" width={260}>
        <div style={{ padding: "16px", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>
          <Title level={4} style={{ margin: 0, color: "#1890ff" }}>
            {isAdminRoute ? "Admin Portal" : "HR Portal"}
          </Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header style={{ background: "#fff", padding: "0 24px", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", height: "100%" }}>
            <span style={{ marginRight: "16px" }}>Xin chào, Người dùng</span>
            <Link to="/login" style={{ color: "#ff4d4f" }}>Đăng xuất</Link>
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