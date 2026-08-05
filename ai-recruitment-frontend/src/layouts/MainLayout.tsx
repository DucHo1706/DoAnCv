import { useEffect, useState, useMemo } from "react";
import { Layout, Button, Breadcrumb, Typography, Tag, Space, message, notification as antdNotification } from "antd";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { MenuOutlined, SearchOutlined } from "@ant-design/icons";
import { authService } from "../services/authService";
import { jobService } from "../features/jobs/services/jobService";
import axiosClient from "../services/axiosClient";
import GlobalSearchPalette from "../components/common/GlobalSearchPalette";
import { appTheme } from "../constants/theme";
import { SideNav } from "./components/SideNav";
import { NotificationPopover } from "./components/NotificationPopover";
import { ProfileDropdown } from "./components/ProfileDropdown";

const { Header, Content } = Layout;
const { Text } = Typography;

// Map route path to human-readable breadcrumb label
const BREADCRUMB_MAP: Record<string, { group: string; label: string }> = {
  "/admin/dashboard": { group: "Tổng quan", label: "Thống kê & Phân tích" },
  "/admin/approval": { group: "Quản lý Nội dung", label: "Duyệt tin tuyển dụng" },
  "/admin/users": { group: "Quản lý Nhân sự", label: "Quản lý người dùng" },
  "/admin/recruiter-performance": { group: "Quản lý Nhân sự", label: "Hiệu suất Recruiter" },
  "/admin/roles": { group: "Quản lý Nhân sự", label: "Vai trò & Phân quyền" },
  "/admin/organization": { group: "Dữ liệu tuyển dụng", label: "Danh mục tuyển dụng" },
  "/admin/branches": { group: "Dữ liệu tuyển dụng", label: "Chi nhánh" },
  "/admin/categories": { group: "Dữ liệu tuyển dụng", label: "Lĩnh vực ngành nghề" },
  "/admin/job-levels": { group: "Dữ liệu tuyển dụng", label: "Cấp bậc công việc" },
  "/admin/job-positions": { group: "Dữ liệu tuyển dụng", label: "Vị trí công việc" },
  "/admin/audit-logs": { group: "Hệ thống & Bảo mật", label: "Nhật ký bảo mật" },
  "/admin/settings": { group: "Hệ thống & Bảo mật", label: "Cài đặt hệ thống" },
  "/admin/profile": { group: "Cá nhân", label: "Thông tin tài khoản Admin" },
  "/recruiter/dashboard": { group: "Recruiter Workspace", label: "Tổng quan tuyển dụng" },
  "/recruiter/jobs": { group: "Recruiter Workspace", label: "Tin tuyển dụng" },
  "/recruiter/jobs/create": { group: "Recruiter Workspace", label: "Tạo tin tuyển dụng mới" },
  "/recruiter/applications": { group: "Recruiter Workspace", label: "Quản lý Chiến dịch Tuyển dụng" },
  "/recruiter/schedules": { group: "Recruiter Workspace", label: "Lịch phỏng vấn" },
  "/recruiter/talent-pool": { group: "Recruiter Workspace", label: "Kho ứng viên tiềm năng" },
  "/recruiter/email-logs": { group: "Recruiter Workspace", label: "Lịch sử Email" },
  "/recruiter/profile": { group: "Cá nhân", label: "Thông tin tài khoản" },
};

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("sidebar_collapsed") === "true";
  });

  const [pendingCount, setPendingCount] = useState<number>(0);
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
    } catch {
      // Silent error
    } finally {
      setLoadingNotifs(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axiosClient.put("/Notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      message.success("Đã đánh dấu tất cả thông báo là đã đọc!");
    } catch {
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
      } catch {}
    }
    if (notif.redirectUrl) {
      const targetUrl = notif.redirectUrl;
      if (targetUrl.startsWith("http")) {
        try {
          const url = new URL(targetUrl);
          if (url.origin === window.location.origin) {
            navigate(url.pathname + url.search);
          } else {
            window.open(targetUrl, "_blank");
          }
        } catch {
          navigate(targetUrl);
        }
      } else {
        navigate(targetUrl);
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);

    let connection: any = null;
    let cancelled = false;

    const user = authService.getCurrentUser();
    const accountId = user?.accountId || user?.accountID || user?.id;

    if (accountId) {
      (async () => {
        try {
          const signalR = await import("@microsoft/signalr");
          if (cancelled) return;

          const apiUrl = import.meta.env.VITE_API_URL || "/api";
          const hubUrl = apiUrl.replace("/api", "/hubs/notifications");

          connection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, {
              accessTokenFactory: () => localStorage.getItem("token") || ""
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Warning)
            .build();

          await connection.start();
          await connection.invoke("JoinGroup", accountId);

          connection.on("ReceiveNotification", (newNotif: any) => {
            const formattedNotif = {
              id: newNotif.id || newNotif.NotificationID,
              title: newNotif.title || newNotif.Title,
              content: newNotif.content || newNotif.Content,
              redirectUrl: newNotif.redirectUrl || newNotif.RedirectUrl,
              isRead: newNotif.isRead || newNotif.IsRead || false,
              createdAt: newNotif.createdAt || newNotif.CreatedAt || new Date().toISOString()
            };

            setNotifications((prev) => [formattedNotif, ...prev]);

            antdNotification.info({
              message: formattedNotif.title,
              description: formattedNotif.content,
              placement: "bottomRight",
              onClick: () => {
                handleNotificationClick(formattedNotif);
              },
              style: {
                cursor: "pointer",
                borderRadius: "8px",
                boxShadow: "0 10px 15px -3px rgba(15, 23, 42, 0.1)",
              },
            });
          });
        } catch (err) {
          console.error("Lỗi kết nối SignalR (MainLayout):", err);
        }
      })();
    }

    return () => {
      cancelled = true;
      clearInterval(interval);
      connection?.stop();
    };
  }, []);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar_collapsed", String(next));
      return next;
    });
  };

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);

    if (isAdminRoute) {
      jobService
        .getAdminJobs()
        .then((data: any) => {
          const list = Array.isArray(data) ? data : data?.$values || [];
          const count = list.filter((j: any) => j.status === "Pending").length;
          setPendingCount(count);
        })
        .catch((err) => console.error("Lỗi khi tải số tin chờ duyệt:", err));
    }
  }, [isAdminRoute]);

  // Global Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const currentBreadcrumb = useMemo(() => {
    const matched = BREADCRUMB_MAP[location.pathname];
    if (matched) return matched;

    if (location.pathname.startsWith("/admin/jobs/")) {
      return { group: "Nội dung", label: "Chi tiết tin tuyển dụng" };
    }
    if (location.pathname.startsWith("/recruiter/jobs/")) {
      return { group: "Recruiter Workspace", label: "Chi tiết công việc" };
    }
    if (location.pathname.startsWith("/recruiter/applications/")) {
      return { group: "Recruiter Workspace", label: "Quản lý Ứng viên Chiến dịch" };
    }
    return {
      group: isAdminRoute ? "Quản trị hệ thống" : "Không gian làm việc",
      label: "Trang hiện tại",
    };
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
  `;

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <style dangerouslySetInnerHTML={{ __html: responsiveStyles }} />

      <SideNav
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        isAdminRoute={isAdminRoute}
        pendingCount={pendingCount}
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuClose={() => setMobileMenuOpen(false)}
      />

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
          {/* Header Left */}
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

          {/* Header Right */}
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
                }}
              >
                <Space size={6} align="center" style={{ lineHeight: 1 }}>
                  <SearchOutlined style={{ color: "#94A3B8", fontSize: 14 }} />
                  <span style={{ fontSize: 13, color: "#64748B" }}>Tìm kiếm...</span>
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
                  }}
                >
                  Ctrl K
                </Tag>
              </Button>
            )}

            <NotificationPopover
              notifications={notifications}
              unreadNotifCount={unreadNotifCount}
              loadingNotifs={loadingNotifs}
              onMarkAllRead={handleMarkAllRead}
              onNotificationClick={handleNotificationClick}
            />

            <ProfileDropdown currentUser={currentUser} isAdminRoute={isAdminRoute} />
          </div>
        </Header>

        <Content style={{ margin: "24px 32px", background: "transparent", minHeight: 280 }}>
          <Outlet />
        </Content>

        {isAdminRoute && <GlobalSearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />}
      </Layout>
    </Layout>
  );
}
