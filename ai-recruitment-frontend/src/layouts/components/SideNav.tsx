import React from "react";
import { Layout, Menu, Typography, Badge, Button, Drawer } from "antd";
import { Link, useLocation } from "react-router-dom";
import {
  DashboardOutlined,
  FileTextOutlined,
  UsergroupAddOutlined,
  CalendarOutlined,
  DatabaseOutlined,
  MailOutlined,
  AuditOutlined,
  TeamOutlined,
  TrophyOutlined,
  SafetyCertificateOutlined,
  ApartmentOutlined,
  SecurityScanOutlined,
  SettingOutlined,
  SearchOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { appTheme } from "../../constants/theme";

const { Sider } = Layout;
const { Text, Title } = Typography;

const AiCoreIcon = ({ size = 24 }: { size?: number }) => (
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
    />
  </svg>
);

interface SideNavProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  isAdminRoute: boolean;
  pendingCount: number;
  mobileMenuOpen: boolean;
  onMobileMenuClose: () => void;
}

export function SideNav({
  collapsed,
  onToggleCollapse,
  isAdminRoute,
  pendingCount,
  mobileMenuOpen,
  onMobileMenuClose,
}: SideNavProps) {
  const location = useLocation();

  const renderGroupLabel = (title: string) => {
    if (collapsed) return null;
    return (
      <div style={{ padding: "12px 0 4px 4px", textTransform: "uppercase", letterSpacing: "0.8px" }}>
        <Text style={{ fontSize: 10, fontWeight: 700, color: "#64748B" }}>{title}</Text>
      </div>
    );
  };

  const hrMenuItems = [
    {
      type: "group" as const,
      label: renderGroupLabel("Tổng quan"),
      children: [
        {
          key: "/recruiter/dashboard",
          icon: <DashboardOutlined style={{ color: appTheme.colors.primary, fontSize: 16 }} />,
          label: <Link to="/recruiter/dashboard">Tổng quan tuyển dụng</Link>,
        },
      ],
    },
    {
      type: "group" as const,
      label: renderGroupLabel("Vận hành Tuyển dụng"),
      children: [
        {
          key: "/recruiter/jobs",
          icon: <FileTextOutlined style={{ color: "#3B82F6", fontSize: 16 }} />,
          label: <Link to="/recruiter/jobs">Tin tuyển dụng</Link>,
        },
        {
          key: "/recruiter/applications",
          icon: <UsergroupAddOutlined style={{ color: "#10B981", fontSize: 16 }} />,
          label: <Link to="/recruiter/applications">Quản lý ứng viên</Link>,
        },
        {
          key: "/recruiter/schedules",
          icon: <CalendarOutlined style={{ color: "#F59E0B", fontSize: 16 }} />,
          label: <Link to="/recruiter/schedules">Lịch phỏng vấn</Link>,
        },
      ],
    },
    {
      type: "group" as const,
      label: renderGroupLabel("Tài năng & Tương tác"),
      children: [
        {
          key: "/recruiter/talent-pool",
          icon: <DatabaseOutlined style={{ color: "#8B5CF6", fontSize: 16 }} />,
          label: <Link to="/recruiter/talent-pool">Kho ứng viên tiềm năng</Link>,
        },
        {
          key: "/recruiter/candidate-search",
          icon: <SearchOutlined style={{ color: "#0EA5E9", fontSize: 16 }} />,
          label: <Link to="/recruiter/candidate-search">Tìm ứng viên</Link>,
        },
        {
          key: "/recruiter/email-logs",
          icon: <MailOutlined style={{ color: "#EC4899", fontSize: 16 }} />,
          label: <Link to="/recruiter/email-logs">Lịch sử Email</Link>,
        },
      ],
    },
  ];

  const adminMenuItems = [
    {
      type: "group" as const,
      label: renderGroupLabel("Tổng quan"),
      children: [
        {
          key: "/admin/dashboard",
          icon: <DashboardOutlined style={{ color: appTheme.colors.primary, fontSize: 16 }} />,
          label: <Link to="/admin/dashboard">Thống kê & Phân tích</Link>,
        },
      ],
    },
    {
      type: "group" as const,
      label: renderGroupLabel("Quản lý Nội dung"),
      children: [
        {
          key: "/admin/approval",
          icon: <AuditOutlined style={{ color: appTheme.colors.accent, fontSize: 16 }} />,
          label: (
            <Link
              to="/admin/approval"
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}
            >
              <span>Duyệt tin tuyển dụng</span>
              {pendingCount > 0 && (
                <Badge
                  count={pendingCount}
                  overflowCount={99}
                  style={{
                    backgroundColor: appTheme.colors.accent,
                    boxShadow: "none",
                    fontWeight: 700,
                    fontSize: 11,
                  }}
                />
              )}
            </Link>
          ),
        },
      ],
    },
    {
      type: "group" as const,
      label: renderGroupLabel("Quản lý Nhân sự"),
      children: [
        {
          key: "/admin/users",
          icon: <TeamOutlined style={{ color: "#60A5FA", fontSize: 16 }} />,
          label: <Link to="/admin/users">Quản lý người dùng</Link>,
        },
        {
          key: "/admin/recruiter-performance",
          icon: <TrophyOutlined style={{ color: "#FBBF24", fontSize: 16 }} />,
          label: <Link to="/admin/recruiter-performance">Hiệu suất Recruiter</Link>,
        },
        {
          key: "/admin/roles",
          icon: <SafetyCertificateOutlined style={{ color: appTheme.colors.success, fontSize: 16 }} />,
          label: <Link to="/admin/roles">Vai trò & Phân quyền</Link>,
        },
      ],
    },
    {
      type: "group" as const,
      label: renderGroupLabel("Cơ cấu Tổ chức"),
      children: [
        {
          key: "/admin/organization",
          icon: <ApartmentOutlined style={{ color: "#818CF8", fontSize: 16 }} />,
          label: <Link to="/admin/organization">Danh mục tuyển dụng</Link>,
        },
      ],
    },
    {
      type: "group" as const,
      label: renderGroupLabel("Hệ thống & Bảo mật"),
      children: [
        {
          key: "/admin/audit-logs",
          icon: <SecurityScanOutlined style={{ color: appTheme.colors.error, fontSize: 16 }} />,
          label: <Link to="/admin/audit-logs">Nhật ký bảo mật</Link>,
        },
        {
          key: "/admin/settings",
          icon: <SettingOutlined style={{ color: "#9CA3AF", fontSize: 16 }} />,
          label: <Link to="/admin/settings">Cài đặt hệ thống</Link>,
        },
      ],
    },
  ];

  const menuItems = isAdminRoute ? adminMenuItems : hrMenuItems;

  let selectedMenuKey = location.pathname;
  if (location.pathname.startsWith("/recruiter/ranking")) {
    selectedMenuKey = "/recruiter/applications";
  }

  const sidebarContent = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Brand Header */}
      <div
        style={{
          padding: collapsed ? "20px 0" : "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <AiCoreIcon size={26} />
          {!collapsed && (
            <div>
              <Title level={4} style={{ color: "#FFFFFF", margin: 0, fontSize: 17, fontWeight: 800 }}>
                RecruitInsight <span style={{ color: "#3B82F6" }}>AI</span>
              </Title>
              <Text style={{ fontSize: 10, color: "#64748B", display: "block", textTransform: "uppercase" }}>
                {isAdminRoute ? "Admin Console" : "Recruiter OS"}
              </Text>
            </div>
          )}
        </Link>
        {!collapsed && (
          <Button
            type="text"
            icon={<MenuFoldOutlined style={{ color: "#94A3B8" }} />}
            onClick={onToggleCollapse}
            style={{ width: 32, height: 32 }}
          />
        )}
      </div>

      {collapsed && (
        <div style={{ textAlign: "center", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <Button
            type="text"
            icon={<MenuUnfoldOutlined style={{ color: "#94A3B8" }} />}
            onClick={onToggleCollapse}
            style={{ width: 32, height: 32 }}
          />
        </div>
      )}

      {/* Menu list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 8px" }}>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedMenuKey]}
          items={menuItems}
          style={{ background: "transparent", borderRight: 0 }}
        />
      </div>
    </div>
  );

  return (
    <>
      <Sider
        width={260}
        collapsedWidth={80}
        collapsed={collapsed}
        className="admin-custom-sider main-sider-responsive"
        style={{
          background: "#0F172A",
          borderRight: "1px solid rgba(255, 255, 255, 0.08)",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          zIndex: 10,
        }}
      >
        {sidebarContent}
      </Sider>

      <Drawer
        placement="left"
        onClose={onMobileMenuClose}
        open={mobileMenuOpen}
        bodyStyle={{ padding: 0, background: "#0F172A" }}
        width={260}
      >
        {sidebarContent}
      </Drawer>
    </>
  );
}
