import { Button, Layout, Typography, Space } from "antd";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

function PublicLayout() {
  const user = authService.getCurrentUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", padding: "0 50px", borderBottom: "1px solid #f0f0f0" }}>
        <Title level={3} style={{ margin: 0, color: "#1890ff" }}>
          <Link to="/">Tuyển Dụng AI</Link>
        </Title>
        <Space size="middle">
          <Link to="/jobs">
            <Button type="link">Việc Làm</Button>
          </Link>
          {user && user.role === "Candidate" ? (
            <>
              <Link to="/my-applications">
                <Button type="link">Lịch sử ứng tuyển</Button>
              </Link>
              <Button danger onClick={handleLogout}>Đăng xuất</Button>
            </>
          ) : (
            <Link to="/login">
              <Button type="primary" size="large">Đăng nhập / Đăng ký</Button>
            </Link>
          )}
        </Space>
      </Header>
      <Content style={{ padding: "40px 50px", background: "#f0f2f5" }}>
        <Outlet />
      </Content>
      <Footer style={{ textAlign: "center" }}>
        Khóa luận tốt nghiệp ©2026 - Hệ thống AI hỗ trợ tuyển dụng
      </Footer>
    </Layout>
  );
}

export default PublicLayout;