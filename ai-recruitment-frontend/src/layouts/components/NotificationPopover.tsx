import React from "react";
import { Badge, Button, List, Popover, Typography } from "antd";
import { BellOutlined, CheckOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface NotificationPopoverProps {
  notifications: any[];
  unreadNotifCount: number;
  loadingNotifs: boolean;
  onMarkAllRead: () => void;
  onNotificationClick: (notif: any) => void;
}

export function NotificationPopover({
  notifications,
  unreadNotifCount,
  loadingNotifs,
  onMarkAllRead,
  onNotificationClick,
}: NotificationPopoverProps) {
  const notifContent = (
    <div style={{ width: 340, maxHeight: 420, display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          borderBottom: "1px solid #E2E8F0",
        }}
      >
        <Text strong style={{ fontSize: 15, color: "#0F172A" }}>
          Thông báo {unreadNotifCount > 0 && `(${unreadNotifCount})`}
        </Text>
        {unreadNotifCount > 0 && (
          <Button
            type="text"
            size="small"
            icon={<CheckOutlined />}
            onClick={onMarkAllRead}
            style={{ fontSize: 12, color: "#2563EB" }}
          >
            Đọc tất cả
          </Button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
        {notifications.length === 0 ? (
          <div style={{ padding: "32px 16px", textAlign: "center", color: "#94A3B8" }}>
            Chưa có thông báo nào
          </div>
        ) : (
          <List
            loading={loadingNotifs}
            dataSource={notifications}
            renderItem={(item: any) => (
              <List.Item
                onClick={() => onNotificationClick(item)}
                style={{
                  padding: "12px 16px",
                  cursor: "pointer",
                  background: item.isRead ? "#FFFFFF" : "#EFF6FF",
                  borderBottom: "1px solid #F1F5F9",
                  transition: "background 0.2s",
                }}
                className="hover-bg-slate"
              >
                <List.Item.Meta
                  title={
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Text
                        strong={!item.isRead}
                        style={{ fontSize: 13, color: item.isRead ? "#334155" : "#0F172A" }}
                      >
                        {item.title}
                      </Text>
                      {!item.isRead && (
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "#2563EB",
                            display: "inline-block",
                          }}
                        />
                      )}
                    </div>
                  }
                  description={
                    <div>
                      <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
                        {item.message}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 10, color: "#94A3B8", marginTop: 4, display: "block" }}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : ""}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );

  return (
    <Popover
      content={notifContent}
      trigger="click"
      placement="bottomRight"
      overlayInnerStyle={{ padding: 0, borderRadius: 12, overflow: "hidden" }}
    >
      <Badge count={unreadNotifCount} overflowCount={99} size="small" offset={[-2, 4]}>
        <Button
          type="text"
          icon={<BellOutlined style={{ fontSize: 18, color: "#475569" }} />}
          style={{ width: 40, height: 40, borderRadius: 10 }}
        />
      </Badge>
    </Popover>
  );
}
