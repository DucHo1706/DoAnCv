import {
  BarChartOutlined,
  BranchesOutlined,
  DashboardOutlined,
  FileSearchOutlined,
  SafetyCertificateOutlined,
  SolutionOutlined,
  TagsOutlined,
  TeamOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { Breadcrumb, Layout } from "antd";
import type { ItemType } from "antd/es/menu/interface";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import AppHeader from "../components/common/AppHeader";
import AppSidebar from "../components/common/AppSidebar";

const { Content } = Layout;

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems: ItemType[] = [
    { key: "/admin/dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
    { key: "/admin/users", icon: <TeamOutlined />, label: "Quản lý người dùng" },
    { key: "/admin/job-approvals", icon: <FileSearchOutlined />, label: "Quản lý & Duyệt Tin tuyển dụng" },

    // Lôi 3 mục này ra khỏi dropdown "Danh mục"
    { key: "/admin/branches", icon: <BranchesOutlined />, label: "Quản lý Chi nhánh" },
    { key: "/admin/categories", icon: <TagsOutlined />, label: "Quản lý Lĩnh vực" },
    { key: "/admin/job-positions", icon: <SolutionOutlined />, label: "Quản lý Vị trí" },

    { key: "/admin/roles", icon: <SafetyCertificateOutlined />, label: "Phân quyền" },
    { key: "/admin/reports", icon: <BarChartOutlined />, label: "Báo cáo" },
    { key: "/admin/audit-logs", icon: <HistoryOutlined />, label: "Nhật ký hoạt động" },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <AppSidebar brand="Admin Panel" items={menuItems} />

      <Layout>
        <AppHeader
          title="System Administration"
          userName="Admin User"
          roleLabel="Administrator"
          onLogout={() => navigate("/login")}
        />

        <Content style={{ margin: 24 }}>
          <Breadcrumb
            items={[{ title: "Admin" }, { title: location.pathname }]}
            style={{ marginBottom: 16 }}
          />

          <div
            style={{
              minHeight: 360,
              background: "#FFFFFF",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default AdminLayout;
