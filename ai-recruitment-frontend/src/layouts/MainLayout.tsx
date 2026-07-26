import {
  Avatar,
  Dropdown,
  Layout,
  Menu,
  Space,
  Typography,
  message,
  Drawer,
  Button,
  Badge,
  Breadcrumb,
  Tooltip,
  Tag,
  Popover,
  List,
} from "antd";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { jobService } from "../features/jobs/services/jobService";
import axiosClient from "../services/axiosClient";
import { useEffect, useState, useMemo } from "react";
import {
  LogoutOutlined,
  UserOutlined,
  SettingOutlined,
  MenuOutlined,
  SearchOutlined,
  DashboardOutlined,
  AuditOutlined,
  TeamOutlined,
  TrophyOutlined,
  SafetyCertificateOutlined,
  ApartmentOutlined,
  BranchesOutlined,
  AppstoreOutlined,
  OrderedListOutlined,
  SolutionOutlined,
  SecurityScanOutlined,
  FileTextOutlined,
  UsergroupAddOutlined,
  CalendarOutlined,
  DatabaseOutlined,
  MailOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import GlobalSearchPalette from "../components/common/GlobalSearchPalette";
import { appTheme } from "../constants/theme";

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

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
      strokeLinejoin="round"
      fill="none"
    />
    <circle cx="12" cy="12" r="2" fill="url(#saasGrad)" />
  </svg>
);

// Map route path to human-readable breadcrumb label
const BREADCRUMB_MAP: Record<string, { group: string; label: string }> = {
  "/admin/dashboard": { group: "Tổng quan", label: "Thống kê & Phân tích" },
  "/admin/approval": { group: "Quản lý Nội dung", label: "Duyệt tin tuyển dụng" },
  "/admin/users": { group: "Quản lý Nhân sự", label: "Quản lý người dùng" },
  "/admin/recruiter-performance": { group: "Quản lý Nhân sự", label: "Hiệu suất Recruiter" },
  "/admin/roles": { group: "Quản lý Nhân sự", label: "Vai trò & Phân quyền" },
  "/admin/organization": { group: "Cơ cấu Tổ chức", label: "Danh mục Quản trị Tổ chức" },
  "/admin/branches": { group: "Cơ cấu Tổ chức", label: "Chi nhánh" },
  "/admin/categories": { group: "Cơ cấu Tổ chức", label: "Lĩnh vực ngành nghề" },
  "/admin/job-levels": { group: "Cơ cấu Tổ chức", label: "Cấp bậc công việc" },
  "/admin/job-positions": { group: "Cơ cấu Tổ chức", label: "Vị trí công việc" },
  "/admin/audit-logs": { group: "Hệ thống & Bảo mật", label: "Nhật ký bảo mật" },
  "/admin/settings": { group: "Hệ thống & Bảo mật", label: "Cài đặt hệ thống" },
  "/admin/profile": { group: "Cá nhân", label: "Thông tin tài khoản Admin" },
  "/recruiter/dashboard": { group: "Recruiter Workspace", label: "Tổng quan tuyển dụng" },
  "/recruiter/jobs": { group: "Recruiter Workspace", label: "Tin tuyển dụng" },
  "/recruiter/jobs/create": { group: "Recruiter Workspace", label: "Tạo tin tuyển dụng mới" },
  "/recruiter/applications": { group: "Recruiter Workspace", label: "Quản lý ứng viên" },
  "/recruiter/schedules": { group: "Recruiter Workspace", label: "Lịch phỏng vấn" },
  "/recruiter/talent-pool": { group: "Recruiter Workspace", label: "Kho ứng viên tiềm năng" },
  "/recruiter/email-logs": { group: "Recruiter Workspace", label: "Lịch sử Email" },
  "/recruiter/profile": { group: "Cá nhân", label: "Thông tin tài khoản" },
};

function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Q2: Sidebar collapsible state
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("sidebar_collapsed") === "true";
  });

  // Q1: Pending jobs count badge
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Notification state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const unreadNotifCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const fetchNotifications = async () => {
    try {
      setLoadingNotifs(true);
      const res = await axiosClient.get("/Notifications");
      if (Array.isArray(res.data)) {
        setNotifications(res.data);
      }
    } catch (err) {
      // Silently catch
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await axiosClient.put("/Notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      message.success("Đã đánh dấu tất cả thông báo là đã đọc!");
    } catch (err) {
      message.error("Lỗi khi cập nhật thông báo.");
    }
  };

  const handleNotificationClick = async (notif: any) => {
    if (!notif.isRead) {
      try {
        await axiosClient.put(`/Notifications/${notif.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
      } catch (err) {}
    }
    if (notif.redirectUrl) {
      if (notif.redirectUrl.startsWith("http")) {
        try {
          const url = new URL(notif.redirectUrl);
          if (url.origin === window.location.origin) {
            navigate(url.pathname + url.search);
          } else {
            window.open(notif.redirectUrl, "_blank");
          }
        } catch (e) {
          navigate(notif.redirectUrl);
        }
      } else {
        navigate(notif.redirectUrl);
      }
    }
  };

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar_collapsed", String(next));
      return next;
    });
  };

  // Fetch pending jobs count for Admin
  useEffect(() => {
    if (!isAdminRoute) return;
    let isMounted = true;
    const fetchPendingCount = async () => {
      try {
        const jobs = await jobService.getPendingJobs();
        if (isMounted && Array.isArray(jobs)) {
          setPendingCount(jobs.length);
        }
      } catch (err) {
        // Silently catch errors if API fails or user lacks permission
      }
    };
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 30000); // refresh every 30s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAdminRoute]);

  // Global Search: Shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    if (!isAdminRoute) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAdminRoute]);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
    } else {
      setCurrentUser(user);
    }
  }, [navigate, location]);

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

  // Section Group Header Component
  const renderGroupLabel = (title: string) => {
    if (collapsed) return null;
    return (
      <div style={{ padding: "12px 0 4px 4px", textTransform: "uppercase", letterSpacing: "0.8px" }}>
        <Text style={{ fontSize: 10, fontWeight: 700, color: "#64748B" }}>
          {title}
        </Text>
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
            <Link to="/admin/approval" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
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
          label: <Link to="/admin/organization">Cơ cấu tổ chức</Link>,
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
  if (
    location.pathname === "/admin/branches" ||
    location.pathname === "/admin/categories" ||
    location.pathname === "/admin/job-levels" ||
    location.pathname === "/admin/job-positions"
  ) {
    selectedMenuKey = "/admin/organization";
  }

  // Dynamic breadcrumb text
  const currentBreadcrumb = useMemo(() => {
    const matched = BREADCRUMB_MAP[location.pathname];
    if (matched) return matched;

    if (location.pathname.startsWith("/admin/jobs/")) {
      return { group: "Nội dung", label: "Chi tiết tin tuyển dụng" };
    }
    if (location.pathname.startsWith("/recruiter/jobs/")) {
      return { group: "Recruiter Workspace", label: "Chi tiết công việc" };
    }
    return { group: isAdminRoute ? "Quản trị hệ thống" : "Không gian làm việc", label: "Trang hiện tại" };
  }, [location.pathname, isAdminRoute]);

  const responsiveStyles = `
    @media (max-width: 992px) {
      .main-sider-responsive {
        display: none !important;
      }
      .mobile-menu-trigger {
        display: inline-flex !important;
      }
    }

    /* Polish Sider menu item styles per AGENTS.md */
    .admin-custom-sider .ant-menu-dark {
      background-color: #0F172A !important;
    }
    .admin-custom-sider .ant-menu-dark .ant-menu-item-selected {
      background-color: rgba(37, 99, 235, 0.15) !important;
      color: #60A5FA !important;
      border-left: 3px solid #2563EB !important;
      border-radius: 0 8px 8px 0 !important;
    }
    .admin-custom-sider .ant-menu-dark .ant-menu-item:hover {
      background-color: rgba(255, 255, 255, 0.05) !important;
      color: #93C5FD !important;
    }
    .admin-custom-sider .ant-menu-dark .ant-menu-item-group-title {
      padding-left: 12px !important;
      margin-top: 10px !important;
      margin-bottom: 2px !important;
    }
  `;

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <style dangerouslySetInnerHTML={{ __html: responsiveStyles }} />

      {/* Sider Slate-900 chuyên nghiệp with Collapse support */}
      <Sider
        theme="dark"
        width={265}
        collapsedWidth={80}
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        className="main-sider-responsive admin-custom-sider"
        style={{
          backgroundColor: "#0F172A",
          borderRight: "1px solid #1E293B",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            height: 64,
            padding: "0 16px",
            borderBottom: "1px solid #1E293B",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <AiCoreIcon size={24} />
            {!collapsed && (
              <div>
                <Title
                  level={4}
                  style={{ margin: 0, color: appTheme.colors.primary, fontWeight: 800, letterSpacing: "0.5px", fontSize: 16 }}
                >
                  {isAdminRoute ? "AI RECRUIT" : "RECRUITER"}
                </Title>
                <Text style={{ fontSize: 10, color: "#64748B", display: "block", marginTop: -2, fontWeight: 600 }}>
                  {isAdminRoute ? "Hệ thống Quản trị" : "Cổng Nhà tuyển dụng"}
                </Text>
              </div>
            )}
          </div>

          {!collapsed && (
            <Tooltip title="Thu gọn menu" placement="right">
              <Button
                type="text"
                size="small"
                icon={<MenuFoldOutlined style={{ color: "#64748B", fontSize: 16 }} />}
                onClick={toggleCollapse}
                style={{ borderRadius: 6 }}
              />
            </Tooltip>
          )}
        </div>

        {/* Collapsed expand button */}
        {collapsed && (
          <div style={{ textAlign: "center", padding: "12px 0 4px" }}>
            <Tooltip title="Mở rộng menu" placement="right">
              <Button
                type="text"
                size="small"
                icon={<MenuUnfoldOutlined style={{ color: "#64748B", fontSize: 16 }} />}
                onClick={toggleCollapse}
                style={{ borderRadius: 6 }}
              />
            </Tooltip>
          </div>
        )}

        {/* Menu Items */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedMenuKey]}
          items={menuItems}
          style={{ borderRight: 0, backgroundColor: "#0F172A", paddingTop: 8, paddingBottom: 24 }}
        />
      </Sider>

      <Layout style={{ backgroundColor: appTheme.colors.background }}>
        <Header
          style={{
            background: "#FFFFFF",
            padding: "0 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #E2E8F0",
            height: appTheme.layout.headerHeight,
            boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
          }}
        >
          {/* Header Left: Breadcrumb & Title */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <Button
              className="mobile-menu-trigger"
              type="text"
              icon={<MenuOutlined style={{ fontSize: 20, color: "#0F172A" }} />}
              onClick={() => setMobileMenuOpen(true)}
              style={{ display: "none", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            />

            <Breadcrumb
              items={[
                { title: <Text type="secondary" style={{ fontSize: 13 }}>{currentBreadcrumb.group}</Text> },
                { title: <Text strong style={{ fontSize: 14, color: "#0F172A" }}>{currentBreadcrumb.label}</Text> },
              ]}
            />
          </div>

          {/* Header Right: Global Search & User Profile */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
            {isAdminRoute && (
              <Button
                onClick={() => setSearchOpen(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  height: 36,
                  borderRadius: 8,
                  color: "#64748B",
                  borderColor: "#E2E8F0",
                  background: "#F8FAFC",
                  padding: "0 12px",
                  fontSize: 13,
                  cursor: "pointer",
                  boxShadow: "none",
                }}
              >
                <Space size={6} align="center" style={{ lineHeight: 1 }}>
                  <SearchOutlined style={{ color: "#94A3B8", fontSize: 14 }} />
                  <span className="user-info-responsive" style={{ fontSize: 13, color: "#64748B" }}>
                    Tìm kiếm...
                  </span>
                </Space>
                <Tag
                  bordered={false}
                  style={{
                    margin: 0,
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: "#E2E8F0",
                    color: "#475569",
                    lineHeight: "14px",
                  }}
                >
                  Ctrl K
                </Tag>
              </Button>
            )}

            {/* Notification Bell Popover */}
            <Popover
              content={
                <div style={{ width: 340, maxHeight: 420, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, borderBottom: "1px solid #E2E8F0" }}>
                    <Space>
                      <Text strong style={{ fontSize: 15, color: "#0F172A" }}>Thông báo</Text>
                      {unreadNotifCount > 0 && <Tag color="blue">{unreadNotifCount} mới</Tag>}
                    </Space>
                    {unreadNotifCount > 0 && (
                      <Button type="text" size="small" icon={<CheckOutlined />} onClick={handleMarkAllRead} style={{ fontSize: 12, color: "#2563EB" }}>
                        Đọc tất cả
                      </Button>
                    )}
                  </div>

                  <div style={{ overflowY: "auto", maxHeight: 340, paddingTop: 8 }}>
                    {notifications.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "24px 0", color: "#94A3B8" }}>
                        <BellOutlined style={{ fontSize: 28, marginBottom: 8, opacity: 0.5 }} />
                        <div style={{ fontSize: 13 }}>Không có thông báo mới</div>
                      </div>
                    ) : (
                      <List
                        itemLayout="horizontal"
                        dataSource={notifications}
                        renderItem={(item) => (
                          <List.Item
                            onClick={() => handleNotificationClick(item)}
                            style={{
                              padding: "10px 12px",
                              borderRadius: 8,
                              cursor: "pointer",
                              background: item.isRead ? "transparent" : "#EFF6FF",
                              marginBottom: 4,
                              transition: "background 150ms ease",
                            }}
                          >
                            <List.Item.Meta
                              avatar={
                                <Badge dot={!item.isRead} color="blue">
                                  <Avatar size="small" icon={<BellOutlined />} style={{ background: item.isRead ? "#94A3B8" : "#2563EB" }} />
                                </Badge>
                              }
                              title={<Text strong style={{ fontSize: 13, color: "#0F172A" }}>{item.title}</Text>}
                              description={
                                <div>
                                  <div style={{ fontSize: 12, color: "#475569" }}>{item.content}</div>
                                  <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 4 }}>
                                    {item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : ""}
                                  </div>
                                </div>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    )}
                  </div>
                </div>
              }
              trigger="click"
              placement="bottomRight"
            >
              <Tooltip title="Thông báo hệ thống">
                <Badge count={unreadNotifCount} size="small" offset={[-2, 4]}>
                  <Button
                    type="text"
                    icon={<BellOutlined style={{ fontSize: 18, color: "#475569" }} />}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  />
                </Badge>
              </Tooltip>
            </Popover>

            <Dropdown menu={{ items: userMenuItems, onClick: handleMenuClick }} placement="bottomRight" trigger={["click"]}>
              <Space style={{ cursor: "pointer", flexShrink: 0 }} size={10}>
                <Avatar style={{ backgroundColor: appTheme.colors.primary }} icon={<UserOutlined />}>
                  {currentUser?.fullName?.charAt(0)?.toUpperCase()}
                </Avatar>
                <div className="user-info-responsive" style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                  <Text strong style={{ fontSize: 14, color: appTheme.colors.textPrimary }}>
                    {currentUser?.fullName || "Thành viên"}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {isAdminRoute ? "Quản trị viên" : "Nhà tuyển dụng"}
                  </Text>
                </div>
              </Space>
            </Dropdown>
          </div>
        </Header>

        {/* Mobile Slide-out Drawer Menu */}
        <Drawer
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <AiCoreIcon size={22} />
              <span style={{ fontWeight: 800, color: "#0F172A" }}>
                {isAdminRoute ? "ADMIN" : "RECRUITER"}
              </span>
            </div>
          }
          placement="left"
          onClose={() => setMobileMenuOpen(false)}
          open={mobileMenuOpen}
          width={280}
          styles={{ body: { padding: 0 } }}
        >
          <Menu
            mode="inline"
            selectedKeys={[selectedMenuKey]}
            items={menuItems}
            onClick={() => setMobileMenuOpen(false)}
            style={{ borderRight: 0 }}
          />
        </Drawer>

        {/* Page Content */}
        <Content style={{ margin: "24px 32px", background: "transparent", minHeight: 280 }}>
          <Outlet />
        </Content>

        {isAdminRoute && <GlobalSearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />}
      </Layout>
    </Layout>
  );
}

export default MainLayout;
