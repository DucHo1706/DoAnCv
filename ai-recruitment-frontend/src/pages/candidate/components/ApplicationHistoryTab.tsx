import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { List, Card, Row, Col, Progress, Tag, Space, Typography, Spin, Button, Input, Select, Divider } from "antd";
import { 
  EyeOutlined, 
  SearchOutlined, 
  ClockCircleOutlined,
  FileDoneOutlined,
  LoadingOutlined,
  InfoCircleOutlined,
  TrophyOutlined,
  AppstoreOutlined
} from "@ant-design/icons";
import EmptyState from "../../../components/common/EmptyState";

const { Text } = Typography;

interface ApplicationHistoryTabProps {
  loading: boolean;
  applications: any[];
  onViewReport: (app: any) => void;
  onReEvaluate?: (applicationId: string) => void;
}

export const ApplicationHistoryTab: React.FC<ApplicationHistoryTabProps> = ({
  loading,
  applications,
  onViewReport,
  onReEvaluate,
}) => {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const navigate = useNavigate();

  const getApplicationStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case "applied":
        return { text: "Đã gửi hồ sơ (Chờ duyệt)", color: "blue" };
      case "reviewed":
        return { text: "HR đang xem xét", color: "purple" };
      case "shortlisted":
        return { text: "Hồ sơ đạt yêu cầu", color: "cyan" };
      case "interviewing":
        return { text: "Được chọn phỏng vấn", color: "orange" };
      case "accepted":
        return { text: "Đã nhận việc 🎉", color: "green" };
      case "rejected":
        return { text: "Chưa phù hợp", color: "red" };
      default:
        return { text: status || "Đã gửi hồ sơ", color: "blue" };
    }
  };

  const isAiReady = (app: any) => {
    return app.aiStatus === "Completed" || (app.aiScore !== undefined && app.aiScore !== null && app.aiScore > 0);
  };

  const isAiError = (app: any) => {
    return app.aiStatus === "Failed";
  };

  // Helper selectors for summary stats
  const totalAppsCount = applications.length;
  const readyApps = applications.filter((app) => isAiReady(app));
  const avgScore = readyApps.length
    ? Math.round(readyApps.reduce((acc, app) => acc + (app.aiScore || 0), 0) / readyApps.length)
    : 0;
  const processingCount = applications.filter(
    (app) => !isAiReady(app) && !isAiError(app)
  ).length;

  const filteredApplications = useMemo(() => {
    return applications.filter((application) => {
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
  }, [applications, searchText, statusFilter]);

  const paginatedApplications = useMemo(() => {
    return filteredApplications.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    );
  }, [filteredApplications, currentPage]);

  const totalPages = Math.ceil(filteredApplications.length / pageSize);

  const getScoreColor = (score: number) => {
    if (score >= 75) return "#10B981";
    if (score >= 50) return "#F59E0B";
    return "#EF4444";
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <Spin size="large" tip="Đang tải lịch sử ứng tuyển..." />
      </div>
    );

  return (
    <div style={{ marginTop: 8 }}>
      {/* 1. Quick Stats Grid */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card
            style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "12px",
            }}
            bodyStyle={{ padding: "16px 20px" }}
          >
            <Space size="middle">
              <div style={{ fontSize: 24, color: "#2563EB", background: "rgba(37, 99, 235, 0.06)", padding: 8, borderRadius: 8 }}>
                <AppstoreOutlined />
              </div>
              <div>
                <Text type="secondary" style={{ display: "block", fontSize: 13 }}>Đã nộp</Text>
                <Text strong style={{ fontSize: 18 }}>{totalAppsCount} vị trí</Text>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "12px",
            }}
            bodyStyle={{ padding: "16px 20px" }}
          >
            <Space size="middle">
              <div style={{ fontSize: 24, color: "#10B981", background: "rgba(16, 185, 129, 0.06)", padding: 8, borderRadius: 8 }}>
                <TrophyOutlined />
              </div>
              <div>
                <Text type="secondary" style={{ display: "block", fontSize: 13 }}>Điểm AI trung bình</Text>
                <Text strong style={{ fontSize: 18 }}>{avgScore}% khớp</Text>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "12px",
            }}
            bodyStyle={{ padding: "16px 20px" }}
          >
            <Space size="middle">
              <div style={{ fontSize: 24, color: "#F59E0B", background: "rgba(245, 158, 11, 0.06)", padding: 8, borderRadius: 8 }}>
                <LoadingOutlined />
              </div>
              <div>
                <Text type="secondary" style={{ display: "block", fontSize: 13 }}>Đang phân tích</Text>
                <Text strong style={{ fontSize: 18 }}>{processingCount} hồ sơ</Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 2. Filters Toolbar */}
      <Card
        style={{
          border: "1px solid #E2E8F0",
          borderRadius: "12px",
          marginBottom: 20,
          background: "#FFFFFF",
        }}
        bodyStyle={{ padding: 16 }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={16}>
            <Input
              placeholder="Tìm kiếm theo vị trí công việc..."
              prefix={<SearchOutlined style={{ color: "#94A3B8" }} />}
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setCurrentPage(1);
              }}
              style={{ borderRadius: 8, height: 40 }}
              allowClear
            />
          </Col>
          <Col xs={24} md={8}>
            <Select
              style={{ width: "100%", height: 40 }}
              placeholder="Lọc trạng thái AI"
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
              options={[
                { value: "all", label: "Tất cả trạng thái AI" },
                { value: "processing", label: "AI đang phân tích" },
                { value: "completed", label: "AI đã hoàn tất" },
                { value: "failed", label: "AI lỗi phân tích" },
              ]}
            />
          </Col>
        </Row>
      </Card>

      {/* 3. Paginated Card List */}
      {filteredApplications.length === 0 ? (
        <EmptyState description="Không tìm thấy lịch sử ứng tuyển phù hợp." />
      ) : (
        <div>
          <List
            grid={{ gutter: 16, xs: 1, sm: 1, md: 1, lg: 1, xl: 1, xxl: 1 }}
            dataSource={paginatedApplications}
            renderItem={(app) => {
              const ready = isAiReady(app);
              const error = isAiError(app);
              return (
                <List.Item>
                  <Card
                    style={{
                      borderRadius: 12,
                      border: "1px solid #E2E8F0",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                    }}
                  >
                    <Row gutter={[24, 16]} align="middle">
                      <Col xs={24} md={16}>
                        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 8,
                              background: error
                                ? "rgba(239, 68, 68, 0.06)"
                                : ready
                                ? "rgba(16, 185, 129, 0.06)"
                                : "rgba(37, 99, 235, 0.06)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 18,
                              color: error ? "#EF4444" : ready ? "#10B981" : "#2563EB",
                            }}
                          >
                            {error ? <InfoCircleOutlined /> : ready ? <FileDoneOutlined /> : <LoadingOutlined spin />}
                          </div>
                          <div>
                            <Text strong style={{ fontSize: 16, color: "#0F172A", display: "block" }}>
                              {app.jobTitle}
                            </Text>
                            <Button
                              type="link"
                              size="small"
                              onClick={() => navigate(`/jobs/${app.jobId}`)}
                              style={{ padding: 0, height: "auto", display: "block", marginTop: 4, textAlign: "left", fontSize: "13.5px" }}
                            >
                              Xem chi tiết tin tuyển dụng
                            </Button>
                            <Space split={<Divider type="vertical" />} style={{ marginTop: 6, fontSize: 13 }}>
                              <Text type="secondary">
                                <ClockCircleOutlined /> {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString("vi-VN") : "N/A"}
                              </Text>
                              {error ? (
                                <Tag color="error">AI gặp lỗi</Tag>
                              ) : ready ? (
                                <Tag color="success">AI hoàn tất</Tag>
                              ) : (
                                <Tag color="processing">AI đang chấm điểm...</Tag>
                              )}
                              {(() => {
                                const statusInfo = getApplicationStatusLabel(app.status);
                                return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
                              })()}
                            </Space>
                          </div>
                        </div>
                      </Col>
                      <Col xs={24} md={8} style={{ textAlign: "right" }}>
                        {ready && (
                          <Space size="middle" style={{ width: "100%", justifyContent: "flex-end" }}>
                            <div style={{ textAlign: "center" }}>
                              <Progress
                                type="circle"
                                percent={app.aiScore}
                                size={50}
                                strokeColor={getScoreColor(app.aiScore)}
                                format={(p) => <span style={{ fontSize: 12, fontWeight: "bold" }}>{p}%</span>}
                              />
                            </div>
                            <Button
                              type="primary"
                              ghost
                              icon={<EyeOutlined />}
                              onClick={() => onViewReport(app)}
                              style={{ borderRadius: 8 }}
                            >
                              Xem AI đánh giá
                            </Button>
                          </Space>
                        )}
                        {!ready && !error && (
                          <Text type="secondary" style={{ fontStyle: "italic", fontSize: 13 }}>
                            AI đang thực hiện tính toán độ tương hợp...
                          </Text>
                        )}
                        {error && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                            <Text type="danger" style={{ fontStyle: "italic", fontSize: 13 }}>
                              Hệ thống AI gặp trục trặc khi đọc file.
                            </Text>
                            {onReEvaluate && (
                              <Button
                                type="primary"
                                danger
                                ghost
                                size="small"
                                onClick={() => onReEvaluate(app.id)}
                                style={{ borderRadius: 8, fontWeight: 600 }}
                              >
                                Thử lại đánh giá AI
                              </Button>
                            )}
                          </div>
                        )}
                      </Col>
                    </Row>
                  </Card>
                </List.Item>
              );
            }}
          />

          {/* 4. Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <Button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  size="small"
                  style={{ borderRadius: 6 }}
                >
                  Trang trước
                </Button>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <Button
                    key={idx}
                    type={currentPage === idx + 1 ? "primary" : "default"}
                    onClick={() => setCurrentPage(idx + 1)}
                    size="small"
                    style={{ borderRadius: 6 }}
                  >
                    {idx + 1}
                  </Button>
                ))}
                <Button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  size="small"
                  style={{ borderRadius: 6 }}
                >
                  Trang sau
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
