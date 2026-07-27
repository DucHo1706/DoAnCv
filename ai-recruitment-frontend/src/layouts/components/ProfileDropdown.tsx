import React from "react";
import { Avatar, Dropdown, Space, Typography } from "antd";
import { UserOutlined, SettingOutlined, LogoutOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";

const { Text } = Typography;

interface ProfileDropdownProps {
  currentUser: any;
  isAdminRoute: boolean;
}

export function ProfileDropdown({ currentUser, isAdminRoute }: ProfileDropdownProps) {
  const navigate = useNavigate();

  const handleMenuClick = (info: any) => {
    if (info.key === "logout") {
      authService.logout();
      navigate("/login");
    } else if (info.key === "settings") {
      navigate(isAdminRoute ? "/admin/settings" : "/recruiter/profile");
    }
  };

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: (
        <Link
          to={
            currentUser?.role === "Recruiter"
              ? "/recruiter/profile"
              : isAdminRoute
              ? "/admin/profile"
              : "/profile"
          }
        >
          Thông tin tài khoản
        </Link>
      ),
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: isAdminRoute ? <Link to="/admin/settings">Cài đặt hệ thống</Link> : "Cài đặt",
    },
    { type: "divider" as const },
    { key: "logout", icon: <LogoutOutlined />, label: "Đăng xuất", danger: true },
  ];

  return (
    <Dropdown menu={{ items: userMenuItems, onClick: handleMenuClick }} trigger={["click"]} placement="bottomRight">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: "pointer",
          padding: "6px 10px",
          borderRadius: 10,
          transition: "background 0.2s",
        }}
        className="hover-bg-slate"
      >
        <Avatar
          style={{ backgroundColor: "#2563EB", fontWeight: 700 }}
          icon={!currentUser?.name ? <UserOutlined /> : undefined}
        >
          {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : null}
        </Avatar>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Text strong style={{ fontSize: 13, color: "#0F172A", lineHeight: 1.2 }}>
            {currentUser?.name || "Người dùng"}
          </Text>
          <Text type="secondary" style={{ fontSize: 11, color: "#64748B" }}>
            {currentUser?.role === "Admin" ? "Quản trị viên" : "Tuyển dụng HR"}
          </Text>
        </div>
      </div>
    </Dropdown>
  );
}
