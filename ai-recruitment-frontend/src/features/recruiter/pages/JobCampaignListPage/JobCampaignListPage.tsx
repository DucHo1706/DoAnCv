import React from "react";
import { useNavigate } from "react-router-dom";
import {
  SearchOutlined,
  RotateLeftOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Divider,
  Input,
  Pagination,
  Row,
  Select,
  Skeleton,
  Space,
  Tag,
  Typography,
  Alert,
} from "antd";
import PageContainer from "../../../../components/common/PageContainer";
import EmptyState from "../../../../components/common/EmptyState";
import AiCoreIcon from "../../../../components/common/AiCoreIcon";
import { useJobCampaigns } from "./hooks/useJobCampaigns";
import { formatJobDate } from "../../../../utils/jobLifecycle";

const { Text, Title } = Typography;

function getCampaignStatusMeta(status: string) {
  if (status === "Recruiting") return { label: "Đang tuyển", color: "success" };
  if (status === "Scheduled") return { label: "Sắp mở tuyển", color: "processing" };
  if (status === "Expired") return { label: "Đã hết hạn", color: "error" };
  if (status === "Pending") return { label: "Chờ duyệt", color: "gold" };
  if (status === "Rejected") return { label: "Bị từ chối", color: "error" };
  if (status === "Closed") return { label: "Đã tạm ẩn", color: "default" };
  if (status === "Archived") return { label: "Đã lưu trữ", color: "default" };
  if (status === "Flagged") return { label: "Đang kiểm duyệt", color: "warning" };
  return { label: status || "Chưa xác định", color: "default" };
}

export default function JobCampaignListPage() {
  const navigate = useNavigate();
  const {
    loading,
    error,
    refetch,
    jobSearchQuery,
    setJobSearchQuery,
    jobCategoryFilter,
    setJobCategoryFilter,
    jobStatusFilter,
    setJobStatusFilter,
    jobSortKey,
    setJobSortKey,
    jobCurrentPage,
    setJobCurrentPage,
    jobCategories,
    filteredAndSortedJobs,
    paginatedJobs,
    handleResetJobFilters,
  } = useJobCampaigns();

  const hasJobFilters = Boolean(jobSearchQuery || jobCategoryFilter || jobStatusFilter);

  return (
    <PageContainer title="Quản lý chiến dịch tuyển dụng">
      {error && (
        <Alert
          type="error"
          showIcon
          message="Lỗi tải dữ liệu"
          description={error}
          action={
            <Button size="small" type="primary" onClick={refetch}>
              Thử lại
            </Button>
          }
          style={{ marginBottom: 20 }}
        />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Search and Sort Toolbar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
            background: "#FFFFFF",
            padding: "16px 24px",
            borderRadius: 16,
            border: "1px solid #E2E8F0",
          }}
        >
          <Input
            placeholder="Tìm kiếm chiến dịch theo vị trí, lĩnh vực..."
            style={{ width: 300, borderRadius: 8 }}
            value={jobSearchQuery}
            onChange={(e) => {
              setJobSearchQuery(e.target.value);
              setJobCurrentPage(1);
            }}
            allowClear
            prefix={<SearchOutlined style={{ color: "#BFBFBF" }} />}
          />
          <Space wrap>
            <Select
              placeholder="Lọc lĩnh vực"
              style={{ width: 170 }}
              allowClear
              value={jobCategoryFilter}
              onChange={(value) => {
                setJobCategoryFilter(value);
                setJobCurrentPage(1);
              }}
              options={jobCategories.map((c) => ({ label: c, value: c }))}
            />
            <Select
              placeholder="Lọc trạng thái"
              style={{ width: 150 }}
              allowClear
              value={jobStatusFilter}
              onChange={(value) => {
                setJobStatusFilter(value);
                setJobCurrentPage(1);
              }}
              options={[
                { label: "Đang tuyển", value: "Recruiting" },
                { label: "Đã hết hạn", value: "Expired" },
                { label: "Sắp mở tuyển", value: "Scheduled" },
                { label: "Chờ duyệt", value: "Pending" },
                { label: "Đã tạm ẩn", value: "Closed" },
                { label: "Bị từ chối", value: "Rejected" },
              ]}
            />
            {hasJobFilters && (
              <Button
                icon={<RotateLeftOutlined />}
                onClick={handleResetJobFilters}
                style={{ borderRadius: 8 }}
              >
                Xóa lọc
              </Button>
            )}
            <span style={{ color: "#64748B", fontSize: 13 }}>Sắp xếp theo:</span>
            <Select
              style={{ width: 180 }}
              value={jobSortKey}
              onChange={(value) => {
                setJobSortKey(value);
                setJobCurrentPage(1);
              }}
              options={[
                { label: "Mới đăng tuyển", value: "newest" },
                { label: "Có hồ sơ mới nộp", value: "new_cvs" },
                { label: "Nhiều lượt xem", value: "most_viewed" },
                { label: "Nhiều hồ sơ nhất", value: "most_applications" },
              ]}
            />
          </Space>
        </div>

        {/* Campaign Cards Grid */}
        {loading ? (
          <Row gutter={[20, 20]} style={{ marginTop: 8 }}>
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <Col xs={24} md={12} xl={8} key={idx}>
                <Card style={{ borderRadius: 16, border: "1px solid #E2E8F0" }}>
                  <Skeleton active paragraph={{ rows: 4 }} />
                </Card>
              </Col>
            ))}
          </Row>
        ) : paginatedJobs.length > 0 ? (
          <Row gutter={[20, 20]} style={{ marginTop: 8 }}>
            {paginatedJobs.map((job: any) => {
              const stats = job.stats;
              const statusMeta = getCampaignStatusMeta(job.lifecycleStatus);
              return (
                <Col xs={24} md={12} xl={8} key={job.id}>
                  <Card
                    hoverable
                    className="hover-card"
                    style={{
                      borderRadius: 16,
                      border: "1px solid #E2E8F0",
                      boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
                      background: "#FFFFFF",
                    }}
                    bodyStyle={{ padding: 24 }}
                    onClick={() => {
                      navigate(`/recruiter/applications/${job.id}`);
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 12,
                      }}
                    >
                      <div>
                        <Title level={4} style={{ margin: 0, fontSize: 18, color: "#0F172A" }}>
                          {job.position?.name || "Chưa cập nhật"}
                        </Title>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          {job.category?.name || "Lĩnh vực khác"} | {job.branch?.name || "Chưa cập nhật"}
                        </Text>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {stats.newApps > 0 && (
                          <Tag
                            color="error"
                            style={{
                              borderRadius: 12,
                              fontWeight: 700,
                              padding: "2px 10px",
                              fontSize: 11,
                              background: "#FEF2F2",
                              borderColor: "#FECACA",
                              color: "#EF4444",
                              margin: 0,
                            }}
                          >
                            ● {stats.newApps} CV mới chưa đọc
                          </Tag>
                        )}
                        <Tag color={statusMeta.color} style={{ borderRadius: 8, margin: 0 }}>
                          {statusMeta.label}
                        </Tag>
                      </div>
                    </div>

                    <Divider style={{ margin: "16px 0" }} />

                    <Text type="secondary" style={{ display: "block", marginBottom: 12, fontSize: 12 }}>
                      Hạn nhận hồ sơ: {formatJobDate(job.deadline)}
                      {job.recruitmentRound > 1 ? ` · Đợt ${job.recruitmentRound}` : ""}
                    </Text>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        gap: 8,
                        background: "#F8FAFC",
                        borderRadius: 12,
                        padding: "12px 6px",
                        border: "1px solid #E2E8F0",
                        textAlign: "center",
                        marginBottom: 20,
                      }}
                    >
                      <div>
                        <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
                          Tổng CV
                        </Text>
                        <Text strong style={{ fontSize: 16, color: "#0F172A" }}>
                          {stats.total}
                        </Text>
                      </div>
                      <div
                        style={{
                          background: stats.newApps > 0 ? "#FEF2F2" : "transparent",
                          borderRadius: 8,
                          padding: "2px 0",
                          border: stats.newApps > 0 ? "1px solid #FECACA" : "none",
                        }}
                      >
                        <Text type="secondary" style={{ fontSize: 11, display: "block", color: stats.newApps > 0 ? "#DC2626" : undefined, fontWeight: stats.newApps > 0 ? 600 : 400 }}>
                          Mới nộp
                        </Text>
                        <Text strong style={{ fontSize: 16, color: stats.newApps > 0 ? "#EF4444" : "#2563EB" }}>
                          {stats.newApps}
                        </Text>
                      </div>
                      <div>
                        <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
                          Phỏng vấn
                        </Text>
                        <Text strong style={{ fontSize: 16, color: "#7C3AED" }}>
                          {stats.interviewing}
                        </Text>
                      </div>
                      <div>
                        <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
                          Đã tuyển
                        </Text>
                        <Text strong style={{ fontSize: 16, color: "#10B981" }}>
                          {stats.hired}
                        </Text>
                      </div>
                    </div>

                    <Button
                      type="primary"
                      block
                      icon={<AiCoreIcon size={16} style={{ filter: "brightness(0) invert(1)" }} />}
                      style={{
                        borderRadius: 8,
                        background: "#2563EB",
                        borderColor: "#2563EB",
                        height: 38,
                        fontWeight: 600,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/recruiter/applications/${job.id}`);
                      }}
                    >
                      Quản lý ứng viên
                    </Button>
                  </Card>
                </Col>
              );
            })}
          </Row>
        ) : (
          <Card style={{ padding: "32px 24px", borderRadius: 16, border: "1px solid #E2E8F0", marginTop: 12 }}>
            <EmptyState
              description={
                hasJobFilters
                  ? "Không tìm thấy chiến dịch tuyển dụng nào khớp với điều kiện lọc"
                  : "Chưa có chiến dịch tuyển dụng nào"
              }
              hint={
                hasJobFilters
                  ? "Thử tìm kiếm từ khóa khác hoặc bấm Xóa lọc để hiển thị toàn bộ."
                  : "Bạn chưa tạo chiến dịch nào hoặc tin tuyển dụng đang chờ duyệt."
              }
              action={
                hasJobFilters ? (
                  <Button
                    type="primary"
                    icon={<RotateLeftOutlined />}
                    onClick={handleResetJobFilters}
                    style={{ borderRadius: 8 }}
                  >
                    Xóa bộ lọc & Hiện lại tất cả
                  </Button>
                ) : null
              }
            />
          </Card>
        )}

        {/* Pagination Controls */}
        {filteredAndSortedJobs.length > 6 && (
          <div style={{ textAlign: "center", marginTop: 24 }}>
            <Pagination
              current={jobCurrentPage}
              pageSize={6}
              total={filteredAndSortedJobs.length}
              onChange={(page) => setJobCurrentPage(page)}
              showSizeChanger={false}
            />
          </div>
        )}
      </div>
    </PageContainer>
  );
}
