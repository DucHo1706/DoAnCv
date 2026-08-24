import React from "react";
import { Avatar, Card, Progress, Tag, Typography, Upload } from "antd";
import {
  CameraOutlined,
  UserOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

export interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
}

interface CandidateProfileSidebarProps {
  profile: any;
  user: any;
  applicationsCount: number;
  profileCompletion: number;
  activeNavKey: string;
  navItems: NavItem[];
  onSelectNav: (key: string) => void;
  onAvatarUpload: (info: any) => void;
}

export function CandidateProfileSidebar({
  profile,
  user,
  applicationsCount,
  profileCompletion,
  activeNavKey,
  navItems,
  onSelectNav,
  onAvatarUpload,
}: CandidateProfileSidebarProps) {
  return (
    <>
      <Card
        style={{
          textAlign: "center",
          borderRadius: 16,
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        }}
      >
        {/* Visual Hover-to-Upload Avatar container */}
        <div 
          style={{ 
            position: "relative", 
            width: 100, 
            height: 100, 
            margin: "0 auto 16px", 
            cursor: "pointer",
            borderRadius: "50%",
            overflow: "hidden",
            border: "2px solid #2563EB"
          }}
          className="avatar-hover-container"
        >
          <Upload
            showUploadList={false}
            beforeUpload={() => false}
            onChange={onAvatarUpload}
            accept="image/*"
          >
            <div style={{ position: "relative", width: 100, height: 100 }}>
              {profile?.avatarUrl ? (
                <Avatar
                  size={100}
                  src={profile.avatarUrl}
                  style={{ border: "none" }}
                />
              ) : (
                <Avatar
                  size={100}
                  icon={<UserOutlined />}
                  style={{ backgroundColor: "#2563EB", border: "none" }}
                />
              )}
              {/* Dark hover overlay */}
              <div 
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  background: "rgba(15, 23, 42, 0.65)",
                  color: "#FFFFFF",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  opacity: 0,
                  transition: "opacity 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "0";
                }}
              >
                <CameraOutlined style={{ fontSize: 18, marginBottom: 4 }} />
                <span style={{ fontSize: 11, fontWeight: 500 }}>Thay ảnh</span>
              </div>
            </div>
          </Upload>
        </div>

        <Title level={4} style={{ margin: "12px 0 4px" }}>
          {profile?.fullName || user?.fullName || "Ứng viên"}
        </Title>
        <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
          {user?.email || "Chưa cập nhật email"}
        </Text>

        {/* AI Profile Completion tracker */}
        <div style={{ margin: "16px 0 24px", padding: "0 8px", textAlign: "left" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>Hoàn thiện hồ sơ AI</Text>
            <Text strong style={{ fontSize: 12, color: "#2563EB" }}>{profileCompletion}%</Text>
          </div>
          <Progress 
            percent={profileCompletion} 
            showInfo={false} 
            strokeColor="#2563EB" 
            trailColor="#E2E8F0" 
            size="small" 
            style={{ margin: 0 }}
          />
        </div>

        <div
          style={{
            marginTop: 16,
            textAlign: "left",
            background: "#F8FAFC",
            padding: "12px 16px",
            borderRadius: 12,
            border: "1px solid #F1F5F9"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <Text type="secondary" style={{ fontSize: 13 }}>Loại tài khoản</Text>
            <Tag color="blue" style={{ margin: 0, fontWeight: 600 }}>
              Ứng viên
            </Tag>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Text type="secondary" style={{ fontSize: 13 }}>Đã ứng tuyển</Text>
            <Text strong style={{ fontSize: 13 }}>{applicationsCount} công việc</Text>
          </div>
        </div>
      </Card>

      {/* Card 2: Sidebar Navigation (Desktop Only) */}
      <Card
        className="desktop-sidebar-card"
        style={{
          borderRadius: 16,
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          boxShadow: "0 4px 20px rgba(15, 23, 42, 0.03)",
        }}
        bodyStyle={{ padding: "12px" }}
      >
        <div style={{ padding: "8px 12px 10px", fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          DANH MỤC HỒ SƠ
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {navItems.map((item) => (
            <div
              key={item.key}
              onClick={() => onSelectNav(item.key)}
              className={`saas-sidebar-item ${activeNavKey === item.key ? "active" : ""}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
