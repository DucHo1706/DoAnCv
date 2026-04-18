import { Button, Layout, Typography } from "antd";
import { Link, Outlet } from "react-router-dom";

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

function PublicLayout() {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", padding: "0 50px", borderBottom: "1px solid #f0f0f0" }}>
        <Title level={3} style={{ margin: 0, color: "#1890ff" }}>
          <Link to="/">Tuyển Dụng AI</Link>
        </Title>
        <div>
          <Link to="/login">
            <Button type="primary" size="large">Đăng nhập (Dành cho HR / Admin)</Button>
          </Link>
        </div>
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