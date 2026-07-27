import React from "react";
import { Avatar, Button, Select, Space, Tooltip, Typography } from "antd";
import {
  UserOutlined,
  EyeOutlined,
  MailOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import type { ApplicationDto } from "../../../services/recruitmentService";
import AiCoreIcon from "../../../../../components/common/AiCoreIcon";

const { Text } = Typography;

interface KanbanBoardProps {
  applicationStatusStages: { status: string; label: string }[];
  kanbanData: Record<string, ApplicationDto[]>;
  onStatusChange: (app: ApplicationDto, newStatus: string) => void;
  onViewDetail: (app: ApplicationDto) => void;
  onNavigateEmail: (appId: string) => void;
  onNavigateDetail: (appId: string) => void;
  onOpenScheduleModal: (app: ApplicationDto) => void;
  onOpenRejectModal: (app: ApplicationDto) => void;
}

export function KanbanBoard({
  applicationStatusStages,
  kanbanData,
  onStatusChange,
  onViewDetail,
  onNavigateEmail,
  onNavigateDetail,
  onOpenScheduleModal,
  onOpenRejectModal,
}: KanbanBoardProps) {
  const getStageColor = (status: string) => {
    switch (status) {
      case "Applied":
        return "#3B82F6";
      case "Reviewing":
        return "#8B5CF6";
      case "Interview":
        return "#F59E0B";
      case "Offer":
        return "#10B981";
      case "Rejected":
        return "#EF4444";
      default:
        return "#64748B";
    }
  };

  const handleDragStart = (e: React.DragEvent, appId: string, sourceStage: string) => {
    e.dataTransfer.setData("appId", appId);
    e.dataTransfer.setData("sourceStage", sourceStage);
  };

  const getStatusByStageLabel = (label: string) => {
    const found = applicationStatusStages.find((stage) => stage.label === label);
    return found ? found.status : "Applied";
  };

  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData("appId");
    const sourceStage = e.dataTransfer.getData("sourceStage");

    if (sourceStage === targetStage || !appId) return;

    const targetStatus = getStatusByStageLabel(targetStage);

    // Find application object across kanban data
    let foundApp: ApplicationDto | null = null;
    Object.values(kanbanData).forEach((list) => {
      const match = list.find((a) => a.id === appId);
      if (match) foundApp = match;
    });

    if (!foundApp) return;

    if (targetStatus === "Rejected") {
      onOpenRejectModal(foundApp);
      return;
    }

    if (targetStatus === "Interview") {
      onOpenScheduleModal(foundApp);
      return;
    }

    onStatusChange(foundApp, targetStatus);
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 20,
        overflowX: "auto",
        paddingBottom: 24,
        paddingTop: 8,
      }}
    >
      {applicationStatusStages.map((stageItem) => {
        const stage = stageItem.label;
        const statusVal = stageItem.status;
        const colColor = getStageColor(statusVal);
        const stageApps = kanbanData[stage] || [];

        return (
          <div
            key={stage}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, stage)}
            style={{
              minWidth: 320,
              maxWidth: 320,
              background: "#F1F5F9",
              padding: "20px 16px",
              borderRadius: 16,
              border: "1px solid #E2E8F0",
              minHeight: 500,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
                padding: "0 4px",
              }}
            >
              <Space size={8}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: colColor,
                    display: "inline-block",
                  }}
                />
                <Text strong style={{ fontSize: 15, color: "#0F172A" }}>
                  {stage}
                </Text>
              </Space>
              <span
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  color: "#475569",
                  borderRadius: "20px",
                  padding: "2px 10px",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                {stageApps.length}
              </span>
            </div>

            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                overflowY: "auto",
              }}
            >
              {stageApps.map((app) => {
                const scoreBorderColor =
                  app.aiScore == null
                    ? "#E2E8F0"
                    : app.aiScore >= 75
                    ? "#10B981"
                    : app.aiScore >= 50
                    ? "#F59E0B"
                    : "#EF4444";

                return (
                  <div
                    key={app.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, app.id, stage)}
                    className="hover-card"
                    style={{
                      background: "#FFFFFF",
                      padding: 16,
                      borderRadius: 12,
                      border: "1px solid #E2E8F0",
                      borderLeft: `4px solid ${scoreBorderColor}`,
                      cursor: "grab",
                      boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      <Avatar
                        style={{
                          backgroundColor:
                            app.aiScore != null && app.aiScore >= 75 ? "#EFF6FF" : "#F8FAFC",
                          color: "#2563EB",
                        }}
                        icon={<UserOutlined />}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <Text
                          strong
                          style={{ display: "block", color: "#0F172A", fontSize: 14 }}
                          ellipsis
                        >
                          {app.candidateName}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 11, color: "#64748B" }} ellipsis>
                          {app.email}
                        </Text>
                      </div>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <span
                        style={{
                          fontSize: 12,
                          color: "#475569",
                          backgroundColor: "#F1F5F9",
                          padding: "2px 8px",
                          borderRadius: 6,
                          display: "inline-block",
                          maxWidth: "100%",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {app.jobTitle}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderTop: "1px solid #F1F5F9",
                        paddingTop: 12,
                        marginTop: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color:
                            app.aiScore == null
                              ? "#64748B"
                              : app.aiScore >= 75
                              ? "#10B981"
                              : app.aiScore >= 50
                              ? "#F59E0B"
                              : "#EF4444",
                          display: "inline-flex",
                          alignItems: "center",
                        }}
                      >
                        {app.aiScore == null ? (
                          "Chưa có AI"
                        ) : (
                          <>
                            <AiCoreIcon size={12} style={{ marginRight: 4 }} />
                            {app.aiScore}đ
                          </>
                        )}
                      </span>

                      <Space size={4}>
                        {app.status === "Interview" && (
                          <Tooltip title="Chỉnh sửa lịch phỏng vấn">
                            <Button
                              size="small"
                              type="text"
                              style={{ borderRadius: 6 }}
                              icon={<CalendarOutlined style={{ color: "#2563EB" }} />}
                              onClick={() => onOpenScheduleModal(app)}
                            />
                          </Tooltip>
                        )}
                        <Tooltip title="Xem nhanh AI">
                          <Button
                            size="small"
                            type="text"
                            style={{ borderRadius: 6 }}
                            icon={<EyeOutlined style={{ color: "#64748B" }} />}
                            onClick={() => onViewDetail(app)}
                          />
                        </Tooltip>
                        <Tooltip title="Email ứng viên">
                          <Button
                            size="small"
                            type="text"
                            style={{ borderRadius: 6 }}
                            icon={<MailOutlined style={{ color: "#64748B" }} />}
                            onClick={() => onNavigateEmail(app.id)}
                          />
                        </Tooltip>
                        <Tooltip title="Hồ sơ chi tiết">
                          <Button
                            size="small"
                            type="text"
                            style={{ borderRadius: 6 }}
                            icon={<UserOutlined style={{ color: "#2563EB" }} />}
                            onClick={() => onNavigateDetail(app.id)}
                          />
                        </Tooltip>
                      </Space>
                    </div>

                    <div style={{ marginTop: 10 }}>
                      <Select
                        size="small"
                        bordered={false}
                        value={app.status || "Applied"}
                        style={{
                          width: "100%",
                          background: "#F8FAFC",
                          borderRadius: 6,
                          border: "1px solid #E2E8F0",
                          fontSize: 11,
                          fontWeight: 500,
                          textAlign: "left",
                        }}
                        dropdownStyle={{ borderRadius: 8 }}
                        onChange={(newStatus) => onStatusChange(app, newStatus)}
                        options={[
                          { value: "Applied", label: "Mới nộp" },
                          { value: "Reviewing", label: "Đang xem xét" },
                          { value: "Interview", label: "Phỏng vấn" },
                          { value: "Offer", label: "Nhận việc (Offer)" },
                          { value: "Rejected", label: "Đã từ chối" },
                        ]}
                      />
                    </div>
                  </div>
                );
              })}

              {stageApps.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "36px 16px",
                    color: "#94A3B8",
                    border: "1px dashed #CBD5E1",
                    borderRadius: 12,
                    background: "#FFFFFF",
                    fontSize: 13,
                  }}
                >
                  Kéo thả ứng viên vào đây
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
