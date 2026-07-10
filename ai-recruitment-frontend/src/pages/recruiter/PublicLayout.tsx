import { Button, Layout, Typography, Space, Dropdown, Row, Col, Divider } from "antd";
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
  GlobalOutlined,
} from "@ant-design/icons";

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
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(226, 232, 240, 0.8)",
        padding: "24px",
        borderRadius: "12px",
        boxShadow: "0 20px 40px -10px rgba(15, 23, 42, 0.12)",
        width: "850px",
        cursor: "default",
      }}
    >
      <Row gutter={[40, 24]}>
        <Col span={8}>
          <Title level={5} style={{ marginBottom: 16, color: "#2563EB" }}>
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

          <Title level={5} style={{ marginTop: 32, marginBottom: 16, color: "#2563EB" }}>
            Công Ty
          </Title>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Link
              to="/jobs"
              className="header-nav-link"
              style={{
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
              className="header-nav-link"
              style={{
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
          <Title level={5} style={{ marginBottom: 16, color: "#2563EB" }}>
            Việc Làm Theo Vị Trí
          </Title>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Link to="/jobs" className="header-nav-link" style={{ fontSize: "15px" }}>
              Nhân viên kinh doanh
            </Link>
            <Link to="/jobs" className="header-nav-link" style={{ fontSize: "15px" }}>
              Kế toán
            </Link>
            <Link to="/jobs" className="header-nav-link" style={{ fontSize: "15px" }}>
              Marketing
            </Link>
            <Link to="/jobs" className="header-nav-link" style={{ fontSize: "15px" }}>
              Hành chính nhân sự
            </Link>
            <Link to="/jobs" className="header-nav-link" style={{ fontSize: "15px" }}>
              Chăm sóc khách hàng
            </Link>
            <Link to="/jobs" className="header-nav-link" style={{ fontSize: "15px" }}>
              Ngân hàng
            </Link>
            <Link to="/jobs" className="header-nav-link" style={{ fontSize: "15px" }}>
              IT
            </Link>
            <Link to="/jobs" className="header-nav-link" style={{ fontSize: "15px" }}>
              Thiết kế đồ hoạ
            </Link>
          </Space>
        </Col>

        <Col span={8}>
          <Title level={5} style={{ marginBottom: 16, color: "#2563EB" }}>
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
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(226, 232, 240, 0.8)",
        padding: "24px",
        borderRadius: "12px",
        boxShadow: "0 20px 40px -10px rgba(15, 23, 42, 0.12)",
        width: "650px",
        cursor: "default",
      }}
    >
      <Row gutter={[40, 24]}>
        <Col span={12}>
          <Title level={5} style={{ marginBottom: 16, color: "#2563EB" }}>
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

          <Title level={5} style={{ marginTop: 32, marginBottom: 16, color: "#2563EB" }}>
            Mẫu CV Theo Vị Trí
          </Title>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Link to="/profile" className="header-nav-link" style={{ fontSize: "15px" }}>
              Nhân viên kinh doanh
            </Link>
            <Link to="/profile" className="header-nav-link" style={{ fontSize: "15px" }}>
              Lập trình viên
            </Link>
            <Link to="/profile" className="header-nav-link" style={{ fontSize: "15px" }}>
              Nhân viên kế toán
            </Link>
            <Link to="/profile" className="header-nav-link" style={{ fontSize: "15px" }}>
              Chuyên viên marketing
            </Link>
          </Space>
        </Col>

        <Col span={12}>
          <Title level={5} style={{ marginBottom: 16, color: "#2563EB" }}>
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

  const customStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

    * {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    }

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
                  Tuyển Dụng AI
                </span>
              </Link>
            </Title>
            <Space size={4}>
              <Dropdown dropdownRender={jobsDropdownContent} placement="bottomLeft">
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
                  Việc làm
                </Link>
              </Dropdown>
              <Dropdown dropdownRender={cvDropdownContent} placement="bottomLeft">
                <Link
                  to="/profile"
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
                  <Button type="text" style={{ fontSize: "15px", fontWeight: 500 }} className="header-nav-link">
                    Lịch sử ứng tuyển
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button type="text" style={{ fontSize: "15px", fontWeight: 500 }} className="header-nav-link">
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
                  Tuyển Dụng AI
                </span>
              </div>
              <Paragraph style={{ color: "#64748B", fontSize: "14px", lineHeight: 1.6, maxWidth: "280px" }}>
                Hệ thống AI hỗ trợ tuyển dụng thế mới, tối ưu hóa hồ sơ & nâng tầm năng lực cho ứng viên và doanh nghiệp.
              </Paragraph>
            </Col>

            <Col xs={12} md={4}>
              <Text strong style={{ color: "#FFFFFF", display: "block", marginBottom: "20px", fontSize: "15px" }}>
                Giải pháp AI
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
