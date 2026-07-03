import React from "react";
import {
  Typography,
  Card,
  Row,
  Col,
  Input,
  Select,
  Table,
  Tag,
  Button,
  Drawer,
  Spin,
  Progress,
} from "antd";
import {
  ClockCircleOutlined,
  SearchOutlined,
  EyeOutlined,
  LoadingOutlined,
  RobotOutlined,
  FileDoneOutlined,
} from "@ant-design/icons";
import { useApplicationStatus } from "./hooks/useApplicationStatus";
import PageContainer from "../../../components/common/PageContainer";
import AiDetailedTabs from "../../../components/ai-report/AiDetailedTabs";
import { appTheme } from "../../../constants/theme";

const { Title, Text } = Typography;

export default function ApplicationStatusPage() {
  const {
    applications,
    loading,
    isDetailModalOpen,
    setIsDetailModalOpen,
    setSelectedApp,
    searchText,
    setSearchText,
    statusFilter,
    setStatusFilter,
    isAiReady,
    isAiError,
    handleViewDetail,
    parsed,
  } = useApplicationStatus();

  const getScoreColor = (score: number) => {
    if (score >= 75) return appTheme.colors.success;
    if (score >= 50) return appTheme.colors.warning;
    return appTheme.colors.error;
  };

  const renderScoreCircle = (score: number, variant: "table" | "drawer" = "table") => {
    const finalScore = Math.round(Number(score || 0));
    const color = getScoreColor(finalScore);
    const size = variant === "drawer" ? 128 : 78;
    const strokeWidth = variant === "drawer" ? 7 : 6;
    const fontSize = variant === "drawer" ? 30 : 22;

    return (
      <Progress
        type="circle"
        percent={finalScore}
        size={size}
        strokeWidth={strokeWidth}
        strokeColor={color}
        trailColor="#e5e7eb"
        format={() => (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
              transform: "translateY(-1px)",
            }}
          >
            <span style={{ fontWeight: 700, fontSize: fontSize, color: color, display: "inline-block" }}>
              {finalScore}
            </span>
          </div>
        )}
      />
    );
  };

  const renderApplicationStatus = (record: any) => {
    if (isAiError(record) === true) {
      return (
        <Tag color="red" style={{ padding: "6px 12px", borderRadius: 8 }}>
          <RobotOutlined style={{ marginRight: 6 }} />
          AI lỗi
        </Tag>
      );
    }
    if (isAiReady(record) === false) {
      return (
        <Tag color="processing" style={{ padding: "6px 12px", borderRadius: 8 }}>
          <LoadingOutlined style={{ marginRight: 6 }} />
          AI đang phân tích
        </Tag>
      );
    }
    return (
      <Tag color="blue" style={{ padding: "6px 12px", borderRadius: 8 }}>
        <FileDoneOutlined style={{ marginRight: 6 }} />
        Đã gửi HR
      </Tag>
    );
  };

  const columns = [
    {
      title: "Thông tin ứng tuyển",
      key: "applicationInfo",
      render: (_: any, record: any) => (
        <div>
          <Text strong style={{ fontSize: 16, color: "#0f172a" }}>
            {record.jobTitle || "Chưa cập nhật vị trí"}
          </Text>
          <div style={{ marginTop: 10 }}>
            <Text type="secondary">
              <ClockCircleOutlined style={{ marginRight: 6 }} />
              Đã nộp: {record.appliedAt ? new Date(record.appliedAt).toLocaleDateString("vi-VN") : "Chưa có thời gian"}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 180,
      render: (_: any, record: any) => renderApplicationStatus(record),
    },
    {
      title: "Điểm AI",
      dataIndex: "aiScore",
      key: "aiScore",
      width: 160,
      align: "center" as const,
      render: (score: number, record: any) => {
        if (isAiError(record) === true) {
          return <Tag color="red" style={{ padding: "6px 12px", borderRadius: 8 }}>AI lỗi</Tag>;
        }
        if (isAiReady(record) === false) {
          return <Spin indicator={<LoadingOutlined spin />} />;
        }
        return renderScoreCircle(score, "table");
      },
    },
    {
      title: "Hành động",
      key: "action",
      width: 220,
      align: "center" as const,
      render: (_: any, record: any) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
          style={{
            height: 40,
            borderRadius: 12,
            fontWeight: 600,
            padding: "0 22px",
            background: appTheme.colors.primary,
            borderColor: appTheme.colors.primary,
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.15)",
            fontFamily: appTheme.font.family,
          }}
        >
          {isAiReady(record) ? "Xem AI đánh giá" : "Theo dõi AI"}
        </Button>
      ),
    },
  ];

  const filteredApplications = applications.filter((application) => {
    const keyword = searchText.trim().toLowerCase();
    const jobTitle = application?.jobTitle?.toLowerCase() || "";
    const matchesSearch = keyword.length === 0 || jobTitle.includes(keyword);
    let matchesStatus = true;

    if (statusFilter === "processing") {
      matchesStatus = isAiReady(application) === false && isAiError(application) === false;
    }
    if (statusFilter === "completed") {
      matchesStatus = isAiReady(application) === true;
    }
    if (statusFilter === "failed") {
      matchesStatus = isAiError(application) === true;
    }
    return matchesSearch && matchesStatus;
  });

  return (
    <PageContainer title="" subtitle="">
      <div
        style={{
          background: "#F8FAFC",
          margin: "-24px",
          padding: "48px 40px 80px",
          minHeight: "calc(100vh - 80px)",
        }}
      >
        <div style={{ marginBottom: 28 }}>
          <Title level={2} style={{ marginBottom: 8, color: "#0f172a" }}>Lịch sử ứng tuyển</Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Theo dõi các công việc bạn đã nộp CV và xem lại phân tích mức độ phù hợp từ AI.
          </Text>
        </div>

        <Card
          style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 8px 32px 0 rgba(148, 163, 184, 0.08)",
            marginBottom: 24,
          }}
          bodyStyle={{ padding: 28 }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={16}>
              <Input
                size="large"
                allowClear
                prefix={<SearchOutlined style={{ color: "#64748b" }} />}
                placeholder="Tìm kiếm theo tên vị trí ứng tuyển..."
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                style={{ height: 48, borderRadius: 14 }}
              />
            </Col>
            <Col xs={24} md={8}>
              <Select
                size="large"
                value={statusFilter}
                onChange={(value) => setStatusFilter(value)}
                style={{ width: "100%", height: 48 }}
                options={[
                  { value: "all", label: "Tất cả trạng thái" },
                  { value: "processing", label: "AI đang phân tích" },
                  { value: "completed", label: "AI đã hoàn tất" },
                  { value: "failed", label: "AI lỗi" },
                ]}
              />
            </Col>
          </Row>
        </Card>

        <Card
          style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 8px 32px 0 rgba(148, 163, 184, 0.08)",
          }}
          bodyStyle={{ padding: "28px 28px 36px" }}
        >
          <Table
            columns={columns}
            dataSource={filteredApplications}
            rowKey={(record: any) => record.id || record.applicationId}
            loading={loading}
            pagination={{
              pageSize: 5,
              showSizeChanger: false,
              position: ["bottomRight"],
            }}
            locale={{ emptyText: "Bạn chưa nộp CV vào vị trí nào." }}
            style={{ overflow: "hidden", borderRadius: 14 }}
          />
        </Card>
      </div>

      <Drawer
        title={<Title level={4} style={{ margin: 0, fontSize: 20 }}>Báo cáo phân tích chi tiết từ AI</Title>}
        placement="right"
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedApp(null);
        }}
        open={isDetailModalOpen}
        width={750}
      >
        {parsed ? (
          <AiDetailedTabs parsedAnalysis={parsed} />
        ) : (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Spin tip="Đang đọc dữ liệu phân tích..." />
          </div>
        )}
      </Drawer>
    </PageContainer>
  );
}
