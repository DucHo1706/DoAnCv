import {
  FileSearchOutlined,
  ProfileOutlined,
  SolutionOutlined,
  UploadOutlined,
  DashboardOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { Breadcrumb, Layout } from "antd";
import type { ItemType } from "antd/es/menu/interface";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import AppHeader from "../components/common/AppHeader";
import AppSidebar from "../components/common/AppSidebar";
import CandidateChatbot from "../components/common/CandidateChatbot";

const { Content } = Layout;

function CandidateLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : null;
  const userName = userObj?.fullName || userObj?.FullName || "Ứng viên";

  const menuItems: ItemType[] = [
    { key: "/candidate/dashboard", icon: <DashboardOutlined />, label: "Báo cáo năng lực" },
    { key: "/candidate/profile", icon: <ProfileOutlined />, label: "Hồ sơ cá nhân" },
    { key: "/candidate/upload-cv", icon: <UploadOutlined />, label: "Upload CV" },
    { key: "/candidate/job-suggestions", icon: <FileSearchOutlined />, label: "Gợi ý việc làm" },
    {
      key: "/candidate/application-status",
      icon: <SolutionOutlined />,
      label: "Trạng thái ứng tuyển",
    },
    { key: "/candidate/saved-jobs", icon: <StarOutlined />, label: "Việc làm đã lưu" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("tokenExpiry");
    navigate("/login");
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <AppSidebar brand="AI Recruitment" items={menuItems} />

      <Layout>
        <AppHeader
          title="Candidate Workspace"
          userName={userName}
          roleLabel="Candidate"
          onLogout={handleLogout}
        />

        <Content style={{ margin: 24 }}>
          <Breadcrumb
            items={[{ title: "Candidate" }, { title: location.pathname }]}
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
        <CandidateChatbot />
      </Layout>
    </Layout>
  );
}

export default CandidateLayout;
