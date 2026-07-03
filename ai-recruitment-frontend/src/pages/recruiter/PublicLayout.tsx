import { Button, Layout, Typography, Space, Dropdown, Row, Col } from "antd";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import CandidateChatbot from "../../components/common/CandidateChatbot";
import {
  SearchOutlined,
  HeartOutlined,
  SendOutlined,
  CheckCircleOutlined,
  BuildOutlined,
  StarOutlined,
  AppstoreOutlined,
  FireOutlined,
  FileTextOutlined,
  CloudUploadOutlined,
  BookOutlined,
} from "@ant-design/icons";

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

function PublicLayout() {
  const user = authService.getCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  // Danh sách các trang cần hiển thị Full-width (không bị giới hạn 1200px ở Layout ngoài cùng)
  const isFullWidthPage = location.pathname === "/" || location.pathname.startsWith("/jobs");

  // Mega Menu cho Việc Làm
  const jobsDropdownContent = () => (
    <div
      style={{
        background: "#fff",
        padding: "24px",
        borderRadius: "12px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
        width: "850px",
        cursor: "default",
      }}
    >
      <Row gutter={[40, 24]}>
        <Col span={8}>
          <Title level={5} style={{ marginBottom: 16, color: "#1677ff" }}>
            Việc Làm
          </Title>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Link
              to="/jobs"
              style={{
                color: "#595959",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "15px",
              }}
            >
              <SearchOutlined style={{ fontSize: 18 }} /> Tìm việc làm
            </Link>
            <Link
              to="/jobs"
              style={{
                color: "#595959",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "15px",
              }}
            >
              <HeartOutlined style={{ fontSize: 18 }} /> Việc làm đã lưu
            </Link>
            <Link
              to="/my-applications"
              style={{
                color: "#595959",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "15px",
              }}
            >
              <SendOutlined style={{ fontSize: 18 }} /> Việc làm đã ứng tuyển
            </Link>
            <Link
              to="/jobs"
              style={{
                color: "#595959",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "15px",
              }}
            >
              <CheckCircleOutlined style={{ fontSize: 18 }} /> Việc làm phù hợp
            </Link>
          </Space>

          <Title level={5} style={{ marginTop: 32, marginBottom: 16, color: "#1677ff" }}>
            Công Ty
          </Title>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Link
              to="/jobs"
              style={{
                color: "#595959",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "15px",
              }}
            >
              <BuildOutlined style={{ fontSize: 18 }} /> Danh sách công ty
            </Link>
            <Link
              to="/jobs"
              style={{
                color: "#595959",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "15px",
              }}
            >
              <StarOutlined style={{ fontSize: 18 }} /> Top công ty
            </Link>
          </Space>
        </Col>

        <Col span={8}>
          <Title level={5} style={{ marginBottom: 16, color: "#1677ff" }}>
            Việc Làm Theo Vị Trí
          </Title>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Link to="/jobs" style={{ color: "#595959", fontSize: "15px" }}>
              Nhân viên kinh doanh
            </Link>
            <Link to="/jobs" style={{ color: "#595959", fontSize: "15px" }}>
              Kế toán
            </Link>
            <Link to="/jobs" style={{ color: "#595959", fontSize: "15px" }}>
              Marketing
            </Link>
            <Link to="/jobs" style={{ color: "#595959", fontSize: "15px" }}>
              Hành chính nhân sự
            </Link>
            <Link to="/jobs" style={{ color: "#595959", fontSize: "15px" }}>
              Chăm sóc khách hàng
            </Link>
            <Link to="/jobs" style={{ color: "#595959", fontSize: "15px" }}>
              Ngân hàng
            </Link>
            <Link to="/jobs" style={{ color: "#595959", fontSize: "15px" }}>
              IT
            </Link>
            <Link to="/jobs" style={{ color: "#595959", fontSize: "15px" }}>
              Thiết kế đồ hoạ
            </Link>
          </Space>
        </Col>

        <Col span={8}>
          <Title level={5} style={{ marginBottom: 16, color: "#1677ff" }}>
            Việc Làm Theo Lĩnh Vực
          </Title>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Link to="/jobs" style={{ color: "#595959", fontSize: "15px" }}>
              Sản xuất
            </Link>
            <Link to="/jobs" style={{ color: "#595959", fontSize: "15px" }}>
              Bán lẻ - Hàng tiêu dùng
            </Link>
            <Link to="/jobs" style={{ color: "#595959", fontSize: "15px" }}>
              IT - Phần mềm
            </Link>
            <Link to="/jobs" style={{ color: "#595959", fontSize: "15px" }}>
              Xây dựng
            </Link>
            <Link to="/jobs" style={{ color: "#595959", fontSize: "15px" }}>
              Giáo dục/Đào tạo
            </Link>
          </Space>
        </Col>
      </Row>
    </div>
  );

  // Mega Menu cho Tạo CV
  const cvDropdownContent = () => (
    <div
      style={{
        background: "#fff",
        padding: "24px",
        borderRadius: "12px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
        width: "650px",
        cursor: "default",
      }}
    >
      <Row gutter={[40, 24]}>
        <Col span={12}>
          <Title level={5} style={{ marginBottom: 16, color: "#1677ff" }}>
            Mẫu CV Theo Style
          </Title>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Link
              to="/profile"
              style={{
                color: "#595959",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "15px",
              }}
            >
              <AppstoreOutlined style={{ fontSize: 18 }} /> Mẫu CV Đơn giản
            </Link>
            <Link
              to="/profile"
              style={{
                color: "#595959",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "15px",
              }}
            >
              <FireOutlined style={{ fontSize: 18 }} /> Mẫu CV Ấn tượng
            </Link>
            <Link
              to="/profile"
              style={{
                color: "#595959",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "15px",
              }}
            >
              <StarOutlined style={{ fontSize: 18 }} /> Mẫu CV Chuyên nghiệp
            </Link>
            <Link
              to="/profile"
              style={{
                color: "#595959",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "15px",
              }}
            >
              <BuildOutlined style={{ fontSize: 18 }} /> Mẫu CV Harvard
            </Link>
          </Space>

          <Title level={5} style={{ marginTop: 32, marginBottom: 16, color: "#1677ff" }}>
            Mẫu CV Theo Vị Trí
          </Title>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Link to="/profile" style={{ color: "#595959", fontSize: "15px" }}>
              Nhân viên kinh doanh
            </Link>
            <Link to="/profile" style={{ color: "#595959", fontSize: "15px" }}>
              Lập trình viên
            </Link>
            <Link to="/profile" style={{ color: "#595959", fontSize: "15px" }}>
              Nhân viên kế toán
            </Link>
            <Link to="/profile" style={{ color: "#595959", fontSize: "15px" }}>
              Chuyên viên marketing
            </Link>
          </Space>
        </Col>

        <Col span={12}>
          <Title level={5} style={{ marginBottom: 16, color: "#1677ff" }}>
            Công Cụ
          </Title>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Link
              to="/profile"
              style={{
                color: "#595959",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "15px",
              }}
            >
              <FileTextOutlined style={{ fontSize: 18 }} /> Quản lý CV
            </Link>
            <Link
              to="/profile"
              style={{
                color: "#595959",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "15px",
              }}
            >
              <CloudUploadOutlined style={{ fontSize: 18 }} /> Tải CV lên
            </Link>
            <Link
              to="/profile"
              style={{
                color: "#595959",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "15px",
              }}
            >
              <BookOutlined style={{ fontSize: 18 }} /> Hướng dẫn viết CV
            </Link>
            <Link
              to="/profile"
              style={{
                color: "#595959",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "15px",
              }}
            >
              <FileTextOutlined style={{ fontSize: 18 }} /> Quản lý Cover Letter
            </Link>
            <Link
              to="/profile"
              style={{
                color: "#595959",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "15px",
              }}
            >
              <AppstoreOutlined style={{ fontSize: 18 }} /> Mẫu Cover Letter
            </Link>
          </Space>
        </Col>
      </Row>
    </div>
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          background: "#fff",
          padding: 0,
          height: "80px",
          lineHeight: "80px",
          borderBottom: "1px solid #f0f0f0",
          position: "sticky",
          top: 0,
          zIndex: 1000,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
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
            <Title level={3} style={{ margin: 0 }}>
              <Link to="/" style={{ color: "#1677ff", fontWeight: 800 }}>
                Tuyển Dụng AI
              </Link>
            </Title>
            <Space size={4}>
              <Dropdown dropdownRender={jobsDropdownContent} placement="bottomLeft">
                <Link
                  to="/jobs"
                  style={{
                    display: "inline-block",
                    height: "80px",
                    lineHeight: "80px",
                    padding: "0 16px",
                    color: "#1f2937",
                    fontWeight: 600,
                    fontSize: "16px",
                  }}
                >
                  Việc làm
                </Link>
              </Dropdown>
              <Dropdown dropdownRender={cvDropdownContent} placement="bottomLeft">
                <Link
                  to="/profile"
                  style={{
                    display: "inline-block",
                    height: "80px",
                    lineHeight: "80px",
                    padding: "0 16px",
                    color: "#1f2937",
                    fontWeight: 600,
                    fontSize: "16px",
                  }}
                >
                  Tạo CV
                </Link>
              </Dropdown>
            </Space>
          </Space>

          {/* Nhóm phải: User Actions */}
          <Space size="middle">
            {user && user.role === "Candidate" ? (
              <>
                <Link to="/my-applications">
                  <Button type="text" style={{ fontSize: "15px", fontWeight: 500 }}>
                    Lịch sử ứng tuyển
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button type="text" style={{ fontSize: "15px", fontWeight: 500 }}>
                    Hồ sơ cá nhân
                  </Button>
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
                  style={{ borderRadius: "8px", fontWeight: 600 }}
                >
                  Đăng nhập / Đăng ký
                </Button>
              </Link>
            )}
          </Space>
        </div>
      </Header>
      <Content
        style={{
          padding: isFullWidthPage ? 0 : "40px 20px",
          background: "#f5f7fa",
          minHeight: "calc(100vh - 144px)",
        }}
      >
        <div style={{ maxWidth: isFullWidthPage ? "100%" : "1200px", margin: "0 auto" }}>
          <Outlet />
        </div>
      </Content>
      <Footer style={{ textAlign: "center", background: "#fff", borderTop: "1px solid #f0f0f0" }}>
        Khóa luận tốt nghiệp ©2026 - Hệ thống AI hỗ trợ tuyển dụng
      </Footer>
      <CandidateChatbot />
    </Layout>
  );
}

export default PublicLayout;
