import React from "react";
import { Card, Row, Col, Typography, Space, Tag, Button, Popconfirm, Tooltip, Divider, Skeleton } from "antd";
import {
  UserOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  CalendarOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  LockOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import AppPagination from "../../../../../components/common/AppPagination";
import EmptyState from "../../../../../components/common/EmptyState";

const { Text, Title } = Typography;

function formatDate(value?: string | null) {
  if (!value) return "Chưa cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN");
}

interface JobGridViewProps {
  loading: boolean;
  tableData: any[];
  paginatedGridData: any[];
  gridPage: number;
  gridPageSize: number;
  approvingId: string | null;
  onPageChange: (page: number, pageSize: number) => void;
  onViewJob: (item: any) => void;
  onApproveJob: (item: any) => void;
  onOpenReject: (item: any) => void;
  onToggleStatus: (item: any) => void;
}

export function JobGridView({
  loading,
  tableData,
  paginatedGridData,
  gridPage,
  gridPageSize,
  onPageChange,
  onViewJob,
  onApproveJob,
  onOpenReject,
  onToggleStatus,
  approvingId,
}: JobGridViewProps) {
  if (loading) {
    return (
      <Row gutter={[20, 20]}>
        {[1, 2, 3, 4, 5, 6].map((idx) => (
          <Col xs={24} sm={12} lg={8} key={idx}>
            <Card style={{ borderRadius: 16, border: "1px solid #E2E8F0" }}>
              <Skeleton active paragraph={{ rows: 5 }} />
            </Card>
          </Col>
        ))}
      </Row>
    );
  }

  if (tableData.length === 0) {
    return (
      <Card style={{ borderRadius: 16, border: "1px solid #E2E8F0" }}>
        <EmptyState
          description="Không tìm thấy tin tuyển dụng nào phù hợp"
          hint="Thử thay đổi từ khóa tìm kiếm hoặc lọc theo trạng thái khác."
        />
      </Card>
    );
  }

  return (
    <>
      <Row gutter={[20, 20]}>
        {paginatedGridData.map((item) => (
          <Col xs={24} sm={12} lg={8} key={item.id}>
            <Card
              hoverable
              className="hover-card"
              style={{
                borderRadius: 16,
                border: "1px solid #E2E8F0",
                boxShadow: "0 2px 8px rgba(148, 163, 184, 0.05)",
                background: "#FFFFFF",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
              bodyStyle={{ padding: 20, display: "flex", flexDirection: "column", height: "100%" }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <Title level={4} style={{ margin: 0, fontSize: 16, color: "#0F172A", flex: 1, paddingRight: 8 }}>
                    {item.title}
                  </Title>

                  {item.raw.status === "Published" ? (
                    <Tag color="success" style={{ borderRadius: 6, fontWeight: 700 }}>
                      Đang chạy
                    </Tag>
                  ) : item.raw.status === "Closed" ? (
                    <Tag color="default" style={{ borderRadius: 6 }}>
                      Đã đóng
                    </Tag>
                  ) : item.raw.status === "Rejected" ? (
                    <Tooltip title={item.raw.rejectReason || "Không có lý do cụ thể"}>
                      <Tag color="error" style={{ borderRadius: 6, fontWeight: 700, cursor: "help" }}>
                        Đã từ chối
                      </Tag>
                    </Tooltip>
                  ) : (
                    <Tag
                      color="warning"
                      style={{ borderRadius: 6, fontWeight: 800, backgroundColor: "#FFF7ED", color: "#C2410C" }}
                    >
                      Chờ duyệt
                    </Tag>
                  )}
                </div>

                <div style={{ marginBottom: 14 }}>
                  <Space size={6} style={{ marginBottom: 4, display: "flex" }}>
                    <UserOutlined style={{ color: "#2563EB" }} />
                    <Text strong style={{ fontSize: 13, color: "#334155" }}>
                      {item.recruiterName}
                    </Text>
                  </Space>
                  <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
                    {item.recruiterEmail}
                  </Text>
                </div>

                <Space direction="vertical" size={6} style={{ width: "100%", marginBottom: 14, fontSize: 13 }}>
                  <Space>
                    <EnvironmentOutlined style={{ color: "#64748B" }} />
                    <Text type="secondary">{item.location}</Text>
                  </Space>
                  <Space>
                    <DollarOutlined style={{ color: "#16A34A" }} />
                    <Text strong style={{ color: "#16A34A" }}>
                      {item.salaryRange}
                    </Text>
                  </Space>
                  <Space>
                    <CalendarOutlined style={{ color: "#64748B" }} />
                    <Text type="secondary">Tạo lúc: {formatDate(item.createdAt)}</Text>
                  </Space>
                </Space>
              </div>

              <Divider style={{ margin: "12px 0" }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Button icon={<EyeOutlined />} onClick={() => onViewJob(item)}>
                  Chi tiết
                </Button>

                {item.raw.status === "Pending" ? (
                  <Space size={8}>
                    <Button danger icon={<CloseOutlined />} onClick={() => onOpenReject(item)}>
                      Từ chối
                    </Button>
                    <Button
                      type="primary"
                      icon={<CheckOutlined />}
                      loading={approvingId === item.id}
                      disabled={approvingId !== null}
                      onClick={() => onApproveJob(item)}
                      style={{ background: "#F97316", borderColor: "#F97316", fontWeight: 700 }}
                    >
                      Duyệt
                    </Button>
                  </Space>
                ) : (
                  <Popconfirm
                    title={
                      item.raw.status === "Published"
                        ? "Bạn có chắc muốn tạm ẩn tin này?"
                        : "Bạn có chắc muốn mở lại tin này?"
                    }
                    onConfirm={() => onToggleStatus(item)}
                    okText="Đồng ý"
                    cancelText="Hủy"
                  >
                    <Button
                      icon={item.raw.status === "Published" ? <LockOutlined /> : <UnlockOutlined />}
                      danger={item.raw.status === "Published"}
                    >
                      {item.raw.status === "Published" ? "Tạm ẩn" : "Mở lại"}
                    </Button>
                  </Popconfirm>
                )}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <AppPagination
        current={gridPage}
        pageSize={gridPageSize}
        total={tableData.length}
        onChange={onPageChange}
        pageSizeOptions={["9", "18", "36"]}
      />
    </>
  );
}
