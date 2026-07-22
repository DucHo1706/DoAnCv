import { LogoutOutlined, SettingOutlined, UserOutlined, BellOutlined, CheckOutlined, MailOutlined } from "@ant-design/icons";
import { Avatar, Dropdown, Space, Typography, Badge, Popover, List, Button, message, notification as antdNotification } from "antd";
import type { MenuProps } from "antd";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import axiosClient from "../../services/axiosClient";

const { Text } = Typography;

type AppHeaderProps = {
  title: string;
  userName: string;
  roleLabel: string;
  onLogout?: () => void;
};

interface NotificationItem {
  id: string;
  title: string;
  content: string;
  redirectUrl?: string;
  isRead: boolean;
  createdAt: string;
}

function AppHeader({ title, userName, roleLabel, onLogout }: AppHeaderProps) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [bellRinging, setBellRinging] = useState(false);

  // Extract accountId from stored user
  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : null;
  const accountId = userObj?.accountId || userObj?.AccountId;

  // 1. Fetch initial notifications
  const fetchNotifications = async () => {
    try {
      const response = await axiosClient.get("/notifications");
      if (Array.isArray(response.data)) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error("Lỗi khi tải thông báo:", error);
    }
  };

  useEffect(() => {
    if (accountId) {
      fetchNotifications();
    }
  }, [accountId]);

  // 2. Set up SignalR connection
  useEffect(() => {
    if (!accountId) return;

    const apiUrl = import.meta.env.VITE_API_URL || "https://recruitinsightai.com/api";
    const hubUrl = apiUrl.replace("/api", "/hubs/notifications");

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => localStorage.getItem("token") || ""
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    const startConnection = async () => {
      try {
        await connection.start();
        console.log("Đã kết nối SignalR NotificationHub.");
        
        // Join group corresponding to accountId
        await connection.invoke("JoinGroup", accountId);

        // Listen to notification events
        connection.on("ReceiveNotification", (newNotif: any) => {
          // Format payload keys to match local state
          const formattedNotif: NotificationItem = {
            id: newNotif.id || newNotif.NotificationID,
            title: newNotif.title || newNotif.Title,
            content: newNotif.content || newNotif.Content,
            redirectUrl: newNotif.redirectUrl || newNotif.RedirectUrl,
            isRead: newNotif.isRead || newNotif.IsRead || false,
            createdAt: newNotif.createdAt || newNotif.CreatedAt || new Date().toISOString()
          };

          // Trigger ring animation
          setBellRinging(true);
          setTimeout(() => setBellRinging(false), 1000);

          // Update state
          setNotifications((prev) => [formattedNotif, ...prev]);

          // Show Toast alert
          antdNotification.info({
            message: formattedNotif.title,
            description: formattedNotif.content,
            placement: "bottomRight",
            onClick: () => {
              handleNotifClick(formattedNotif);
            },
            style: {
              cursor: "pointer",
              borderRadius: "8px",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
            }
          });
        });
      } catch (err) {
        console.error("SignalR Connection Error:", err);
      }
    };

    startConnection();

    return () => {
      connection.stop();
    };
  }, [accountId]);

  const handleNotifClick = async (notif: NotificationItem) => {
    setPopoverOpen(false);
    
    // Mark as read if unread
    if (!notif.isRead) {
      try {
        await axiosClient.put(`/notifications/${notif.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
      } catch (err) {
        console.error("Lỗi khi đánh dấu đã đọc:", err);
      }
    }

    // Redirect user if redirectUrl exists
    if (notif.redirectUrl) {
      navigate(notif.redirectUrl);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axiosClient.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      message.success("Đã đánh dấu đọc tất cả thông báo.");
    } catch (err) {
      console.error("Lỗi khi đánh dấu đọc tất cả:", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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

  // Render notification Popover content
  const notifPopoverContent = (
    <div style={{ width: 350, maxHeight: 450, display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingBottom: 10,
          borderBottom: "1px solid #F1F5F9",
          marginBottom: 10
        }}
      >
        <Text strong style={{ fontSize: 15, color: "#0F172A" }}>
          Thông báo ({unreadCount})
        </Text>
        {unreadCount > 0 && (
          <Button
            type="text"
            size="small"
            icon={<CheckOutlined style={{ fontSize: 12 }} />}
            onClick={handleMarkAllRead}
            style={{ color: "#2563EB", fontSize: 12, padding: "0 4px" }}
          >
            Đọc tất cả
          </Button>
        )}
      </div>

      <div style={{ overflowY: "auto", flex: 1, maxHeight: 350 }}>
        {notifications.length === 0 ? (
          <div style={{ padding: "30px 0", textAlign: "center", color: "#94A3B8" }}>
            <MailOutlined style={{ fontSize: 32, marginBottom: 8, display: "block" }} />
            Không có thông báo mới
          </div>
        ) : (
          <List
            dataSource={notifications}
            itemLayout="horizontal"
            renderItem={(item) => (
              <List.Item
                onClick={() => handleNotifClick(item)}
                style={{
                  padding: "10px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  backgroundColor: item.isRead ? "transparent" : "#F8FAFC",
                  transition: "all 0.2s ease",
                  marginBottom: 4,
                  borderBottom: "none"
                }}
                className="hover-bg-slate"
              >
                <div style={{ display: "flex", width: "100%", position: "relative" }}>
                  {!item.isRead && (
                    <span
                      style={{
                        position: "absolute",
                        left: -8,
                        top: 8,
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: "#2563EB"
                      }}
                    />
                  )}
                  <div style={{ paddingLeft: 6, flex: 1 }}>
                    <Text
                      strong={!item.isRead}
                      style={{
                        fontSize: 13,
                        color: item.isRead ? "#475569" : "#0F172A",
                        display: "block",
                        lineHeight: 1.3
                      }}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#64748B",
                        display: "block",
                        marginTop: 2,
                        lineHeight: 1.4
                      }}
                    >
                      {item.content}
                    </Text>
                    <span style={{ fontSize: 10, color: "#94A3B8", marginTop: 4, display: "inline-block" }}>
                      {new Date(item.createdAt).toLocaleString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit"
                      })}
                    </span>
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );

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

      <Space size={20}>
        {/* Real-time Notification Bell */}
        {accountId && (
          <Popover
            content={notifPopoverContent}
            title={null}
            trigger="click"
            open={popoverOpen}
            onOpenChange={setPopoverOpen}
            placement="bottomRight"
            overlayStyle={{
              position: "fixed"
            }}
          >
            <Badge count={unreadCount} size="small" offset={[2, 2]}>
              <Button
                type="text"
                shape="circle"
                icon={<BellOutlined style={{ fontSize: 20, color: "#64748B" }} />}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                  transform: bellRinging ? "scale(1.15) rotate(15deg)" : "scale(1)",
                }}
              />
            </Badge>
          </Popover>
        )}

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
      </Space>
    </div>
  );
}

export default AppHeader;
