# GỢI Ý CẢI THIỆN GIAO DIỆN CHUYÊN NGHIỆP CHO DỰ ÁN KHÓA LUẬN (AI-RECRUITMENT)

Sau khi kiểm tra cấu trúc mã nguồn dự án **ai-recruitment-frontend** hiện tại của bạn, tôi nhận thấy dự án đã sử dụng bộ thư viện UI rất mạnh mẽ là **Ant Design (antd)** và cấu hình cơ bản các Token màu sắc (`appTheme`) khá hiện đại.

Tuy nhiên, lý do khiến giao diện trông vẫn giống "đồ án" là do **cách bố trí bố cục (Layout), độ tương phản màu nền và cách hiển thị dữ liệu chưa tối ưu**. Dưới đây là các gợi ý và đoạn mã cụ thể giúp bạn "lột xác" giao diện dự án này thành một ứng dụng SaaS/Doanh nghiệp thực thụ.

---

## 1. Tối ưu hóa Layout chung (MainLayout.tsx)
Đây là phần quan trọng nhất. Hiện tại, toàn bộ trang con hiển thị trong một khung trắng lớn (`background: "#fff"` trong phần `Content` của **MainLayout.tsx**). Điều này làm biến mất toàn bộ bóng đổ (box-shadow) và viền bo góc của các thẻ `<Card>` bên trong, khiến giao diện bị "phẳng dẹt" và rối mắt.

### Gợi ý thay đổi trong **MainLayout.tsx**:
* Đổi màu nền của Sider sang màu tối **Slate-900** (khớp với cấu hình theme trong `main.tsx`).
* Đổi nền vùng chứa nội dung (`Content`) sang màu xám nhạt (`#F8FAFC`) và chuyển màu nền của các Component con (Card, Table) thành màu trắng tinh để tạo chiều sâu nổi bật (Elevation).
* Nâng cấp giao diện Header: Thêm Avatar người dùng, chức năng cài đặt, phân cấp thông tin rõ ràng.

### Code đề xuất cập nhật cho **MainLayout.tsx**:

```tsx
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

  const handleLogout = () => {
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
    { key: "/recruiter/dashboard", label: <Link to="/recruiter/dashboard">Dashboard Thống Kê</Link> },
    { key: "/recruiter/jobs", label: <Link to="/recruiter/jobs">Quản lý Tin Tuyển Dụng</Link> },
    { key: "/recruiter/applications", label: <Link to="/recruiter/applications">Hồ sơ & Xếp hạng AI</Link> },
    { key: "/recruiter/talent-pool", label: <Link to="/recruiter/talent-pool">Ngân hàng Ứng viên</Link> },
  ];

  const adminMenuItems = [
    { key: "/admin/dashboard", label: <Link to="/admin/dashboard">Admin Dashboard</Link> },
    { key: "/admin/approval", label: <Link to="/admin/approval">Duyệt Tin Tuyển Dụng</Link> },
    { key: "/admin/users", label: <Link to="/admin/users">Quản lý HR & Người Dùng</Link> },
    { key: "/admin/branches", label: <Link to="/admin/branches">Quản lý Chi Nhánh</Link> },
    { key: "/admin/categories", label: <Link to="/admin/categories">Quản lý Lĩnh Vực</Link> },
    { key: "/admin/job-levels", label: <Link to="/admin/job-levels">Quản lý Cấp Bậc</Link> },
    { key: "/admin/job-positions", label: <Link to="/admin/job-positions">Quản lý Vị Trí</Link> },
    { key: "/admin/roles", label: <Link to="/admin/roles">Phân Quyền & Vai Trò</Link> },
    { key: "/admin/reports", label: <Link to="/admin/reports">Báo cáo Hệ thống</Link> },
  ];

  const menuItems = isAdminRoute ? adminMenuItems : hrMenuItems;

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar màu tối Slate-900 chuyên nghiệp */}
      <Sider theme="dark" width={260} style={{ backgroundColor: "#0F172A" }}>
        <div style={{ padding: "24px 16px", textAlign: "center", borderBottom: "1px solid #1E293B" }}>
          <Title level={4} style={{ margin: 0, color: "#3B82F6", fontWeight: 800, letterSpacing: "0.5px" }}>
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
        <Header style={{ background: "#FFFFFF", padding: "0 32px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2E8F0" }}>
          <Text strong style={{ fontSize: 16, color: "#334155" }}>
            {isAdminRoute ? "Hệ thống quản trị" : "Không gian tuyển dụng"}
          </Text>
          
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={["click"]}>
            <Space style={{ cursor: "pointer" }}>
              <Avatar style={{ backgroundColor: "#3B82F6" }} icon={<UserOutlined />} />
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                <Text strong style={{ fontSize: 14 }}>{currentUser?.fullName || "Thành viên"}</Text>
                <Text type="secondary" style={{ fontSize: 11 }}>{isAdminRoute ? "Administrator" : "Recruiter"}</Text>
              </div>
            </Space>
          </Dropdown>
        </Header>
        
        {/* Nền trong suốt để lộ màu xám nhạt của Layout, giúp các Card màu trắng bên trong nổi bật lên */}
        <Content style={{ margin: "32px", background: "transparent", minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default MainLayout;
```

---

## 2. Nâng cấp hiển thị các bảng dữ liệu (Table & Card)
Khi nền bên ngoài đã chuyển sang màu xám nhẹ `#F8FAFC`, các `<Card>` chứa bảng của bạn sẽ tự động nổi bật lên nhờ hiệu ứng bóng đổ mờ. Tuy nhiên, nội dung trong bảng cần được định dạng lại để trông chuyên nghiệp hơn.

### Cải tiến bảng người dùng trong **UserManagementPage.tsx**:
* **Avatar & Tên:** Thay vì hiển thị Avatar là chữ cái đơn điệu, bạn nên render một khối tinh tế hơn hoặc sử dụng các biểu tượng tinh giản.
* **Badge trạng thái (Status Tag):** Sử dụng các thẻ Badge có góc bo tròn lớn (dạng Pill), màu sắc nhẹ nhàng (Soft colors) thay vì màu đặc.
  * Hoạt động: Chữ xanh lá đậm trên nền xanh nhạt (`bg-success-light`).
  * Khóa: Chữ đỏ sẫm trên nền đỏ nhạt (`bg-error-light`).
* **Cột Thao tác (Actions):** Tránh sử dụng quá nhiều nút dạng Text có màu sắc sặc sỡ liền kề nhau. Hãy sử dụng các Icon Button gọn gàng, hoặc gom các thao tác ít dùng vào một Menu Dropdown phụ.

### Code đề xuất cải tiến cột Trạng thái & Thao tác trong **UserManagementPage.tsx**:

```tsx
// 1. Đối với thẻ trạng thái hoạt động:
{
  title: "Trạng thái",
  dataIndex: "status",
  key: "status",
  render: (status: string) => {
    const isActive = status === "Active";
    return (
      <span
        style={{
          display: "inline-block",
          padding: "4px 12px",
          borderRadius: "999px",
          fontSize: "12px",
          fontWeight: 600,
          color: isActive ? "#166534" : "#991B1B",
          backgroundColor: isActive ? "#DCFCE7" : "#FEE2E2",
          border: isActive ? "1px solid #BBF7D0" : "1px solid #FCA5A5",
        }}
      >
        {isActive ? "Hoạt động" : "Đã khóa"}
      </span>
    );
  }
}

// 2. Đối với nút Thao tác (Gọn gàng, tinh tế):
{
  title: " Thao tác",
  key: "action",
  render: (_: any, record: any) => (
    <Space size="small">
      <Button
        icon={<EditOutlined />}
        type="text"
        size="small"
        style={{ color: "#2563EB", display: "flex", alignItems: "center" }}
        onClick={() => handleOpenEdit(record)}
      >
        Sửa
      </Button>
      
      <Popconfirm
        title={record.status === "Active" ? "Khóa tài khoản này?" : "Mở khóa tài khoản?"}
        onConfirm={() => handleToggleStatus(record.id, record.status)}
        okText="Xác nhận"
        cancelText="Hủy"
      >
        <Button
          icon={record.status === "Active" ? <LockOutlined /> : <UnlockOutlined />}
          type="text"
          size="small"
          danger={record.status === "Active"}
          style={{ 
            color: record.status === "Active" ? "#DC2626" : "#16A34A",
            display: "flex", 
            alignItems: "center" 
          }}
        >
          {record.status === "Active" ? "Khóa" : "Mở"}
        </Button>
      </Popconfirm>
    </Space>
  )
}
```

---

## 3. Tạo Dashboard chuyên nghiệp (Sử dụng Stat Cards & Plots)
Dự án của bạn đã có các thành phần rất đẹp như `MetricCard`, `ActivityTrendChart`, `CategoryDonutChart`. Để dashboard trông giống một sản phẩm thương mại:
* Hãy nhóm các chỉ số thống kê quan trọng nhất (ví dụ: Tổng người dùng, CV đã nộp, CV đạt chuẩn AI, Tỷ lệ duyệt) lên hàng đầu dưới dạng các ô thông tin hình vuông hoặc hình chữ nhật bo tròn góc lớn (`borderRadius: 16`), sử dụng icon thiết kế tối giản dạng Line (như Lucide hoặc Ant Icons) đặt trong nền có màu nhạt tương ứng với trạng thái.
* Cần có khoảng cách rõ ràng (`gutter={[24, 24]}`) giữa các Card để tạo độ thông thoáng (White space).

### Gợi ý hiển thị khối metric tổng quát:
```tsx
<Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
  <Col xs={24} sm={12} lg={6}>
    <div style={{ background: "#FFF", padding: 24, borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
      <Space direction="vertical" size={8} style={{ width: "100%" }}>
        <Text type="secondary" style={{ fontSize: 14, fontWeight: 500 }}>Tỷ lệ CV vượt qua lọc AI</Text>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <Title level={2} style={{ margin: 0, fontWeight: 700 }}>78.4%</Title>
          <span style={{ color: "#16A34A", fontSize: 13, fontWeight: 600 }}>+2.4% so với tuần trước</span>
        </div>
      </Space>
    </div>
  </Col>
</Row>
```

---

## 📌 Các bước bạn có thể triển khai ngay:
1. Mở file **MainLayout.tsx** và thay thế nội dung bằng cấu trúc Layout mới đề xuất ở trên.
2. Kiểm tra giao diện và bạn sẽ thấy toàn bộ các trang Admin / HR lập tức trở nên có chiều sâu và sang trọng hơn nhờ màu nền `#F8FAFC` bổ trợ cho các Card trắng.
3. Cải tiến dần các thẻ trạng thái `Tag` trong các trang quản lý danh mục, chi nhánh thành dạng pill-status mềm mại.
