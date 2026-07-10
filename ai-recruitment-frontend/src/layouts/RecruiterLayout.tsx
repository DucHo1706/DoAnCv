import {
  DashboardOutlined,
  FileSearchOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { Breadcrumb, Layout } from "antd";
import type { ItemType } from "antd/es/menu/interface";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import AppHeader from "../components/common/AppHeader";
import AppSidebar from "../components/common/AppSidebar";

const { Content } = Layout;

function RecruiterLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems: ItemType[] = [
    { key: "/recruiter/dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
    { key: "/recruiter/jobs", icon: <FileTextOutlined />, label: "Tin tuyển dụng" },
    { key: "/recruiter/cv-ranking", icon: <FileSearchOutlined />, label: "Xếp hạng CV" },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <AppSidebar brand="AI Recruitment" items={menuItems} />

      <Layout>
        <AppHeader
          title="Recruiter Workspace"
          userName="Nguyễn Văn A"
          roleLabel="Recruiter"
          onLogout={() => navigate("/login")}
        />

        <Content style={{ margin: 24 }}>
          <Breadcrumb
            items={[{ title: "Recruiter" }, { title: location.pathname }]}
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

export default RecruiterLayout;
