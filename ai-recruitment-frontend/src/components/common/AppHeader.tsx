import { LogoutOutlined, SettingOutlined, UserOutlined } from "@ant-design/icons";
import { Avatar, Dropdown, Space, Typography } from "antd";
import type { MenuProps } from "antd";
import { useNavigate } from "react-router-dom";

const { Text } = Typography;

type AppHeaderProps = {
  title: string;
  userName: string;
  roleLabel: string;
  onLogout?: () => void;
};

function AppHeader({ title, userName, roleLabel, onLogout }: AppHeaderProps) {
  const navigate = useNavigate();

  const userMenuItems: MenuProps["items"] = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Thông tin tài khoản",
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Cài đặt",
    },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      danger: true,
    },
  ];

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (key === "logout" && onLogout) {
      onLogout();
    } else if (key === "profile") {
      if (roleLabel === "Recruiter") {
        navigate("/recruiter/profile");
      } else if (roleLabel === "Candidate") {
        navigate("/candidate/profile");
      } else {
        navigate("/admin/dashboard");
      }
    }
  };

  return (
    <div
      style={{
        background: "#FFFFFF",
        padding: "0 24px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #E2E8F0",
      }}
    >
      <Text strong style={{ fontSize: 16 }}>
        {title}
      </Text>

      <Dropdown
        menu={{ items: userMenuItems, onClick: handleMenuClick }}
        placement="bottomRight"
        trigger={["click"]}
      >
        <Space style={{ cursor: "pointer" }}>
          <Avatar icon={<UserOutlined />} />
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
            <Text strong>{userName}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {roleLabel}
            </Text>
          </div>
        </Space>
      </Dropdown>
    </div>
  );
}

export default AppHeader;
