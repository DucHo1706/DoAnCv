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
  Tag,
  Typography,
  Alert,
  DatePicker,
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
    refreshing,
    error,
    refetch,
    jobSearchQuery,
    setJobSearchQuery,
    jobCategoryFilter,
    setJobCategoryFilter,
    jobStatusFilter,
    setJobStatusFilter,
    jobBranchFilter,
    setJobBranchFilter,
    jobLevelFilter,
    setJobLevelFilter,
    jobPositionFilter,
    setJobPositionFilter,
    jobRoundFilter,
    setJobRoundFilter,
    jobCvFilter,
    setJobCvFilter,
    jobDeadlineRange,
    setJobDeadlineRange,
    jobSortKey,
    setJobSortKey,
    jobCurrentPage,
    setJobCurrentPage,
    jobCategories,
    jobBranches,
    jobLevels,
    jobPositions,
    jobRounds,
    totalCampaigns,
    filteredAndSortedJobs,
    paginatedJobs,
    handleResetJobFilters,
  } = useJobCampaigns();

  const hasJobFilters = Boolean(
    jobSearchQuery || jobCategoryFilter || jobStatusFilter || jobBranchFilter ||
    jobLevelFilter || jobPositionFilter || jobRoundFilter || jobCvFilter || jobDeadlineRange,
  );

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
        {/* Bộ lọc chiến dịch */}
        <div
          style={{
            background: "#FFFFFF",
            padding: "16px 24px",
            borderRadius: 16,
            border: "1px solid #E2E8F0",
          }}
        >
          <Row gutter={[12, 12]}>
            <Col xs={24} md={12} xl={8}>
              <Input
                placeholder="Tìm theo vị trí, lĩnh vực, cấp bậc hoặc chi nhánh"
                style={{ width: "100%", borderRadius: 8 }}
                value={jobSearchQuery}
                onChange={(event) => {
                  setJobSearchQuery(event.target.value);
                  setJobCurrentPage(1);
                }}
                allowClear
                prefix={<SearchOutlined style={{ color: "#94A3B8" }} />}
              />
            </Col>
            <Col xs={24} sm={12} md={6} xl={4}>
              <Select showSearch optionFilterProp="label" placeholder="Vị trí tuyển dụng" style={{ width: "100%" }} allowClear value={jobPositionFilter} onChange={(value) => { setJobPositionFilter(value); setJobCurrentPage(1); }} options={jobPositions.map((value) => ({ label: value, value }))} />
            </Col>
            <Col xs={24} sm={12} md={6} xl={4}>
              <Select showSearch optionFilterProp="label" placeholder="Lĩnh vực" style={{ width: "100%" }} allowClear value={jobCategoryFilter} onChange={(value) => { setJobCategoryFilter(value); setJobCurrentPage(1); }} options={jobCategories.map((value) => ({ label: value, value }))} />
            </Col>
            <Col xs={24} sm={12} md={6} xl={4}>
              <Select showSearch optionFilterProp="label" placeholder="Cấp bậc" style={{ width: "100%" }} allowClear value={jobLevelFilter} onChange={(value) => { setJobLevelFilter(value); setJobCurrentPage(1); }} options={jobLevels.map((value) => ({ label: value, value }))} />
            </Col>
            <Col xs={24} sm={12} md={6} xl={4}>
              <Select showSearch optionFilterProp="label" placeholder="Chi nhánh" style={{ width: "100%" }} allowClear value={jobBranchFilter} onChange={(value) => { setJobBranchFilter(value); setJobCurrentPage(1); }} options={jobBranches.map((value) => ({ label: value, value }))} />
            </Col>
            <Col xs={24} sm={12} md={6} xl={4}>
              <Select placeholder="Trạng thái chiến dịch" style={{ width: "100%" }} allowClear value={jobStatusFilter} onChange={(value) => { setJobStatusFilter(value); setJobCurrentPage(1); }} options={[
                { label: "Đang tuyển", value: "Recruiting" },
                { label: "Sắp mở tuyển", value: "Scheduled" },
                { label: "Đã hết hạn", value: "Expired" },
                { label: "Chờ duyệt", value: "Pending" },
                { label: "Đã tạm ẩn", value: "Closed" },
                { label: "Bị từ chối", value: "Rejected" },
                { label: "Đang kiểm duyệt", value: "Flagged" },
                { label: "Đã lưu trữ", value: "Archived" },
              ]} />
            </Col>
            <Col xs={24} sm={12} md={6} xl={4}>
              <Select placeholder="Tình trạng hồ sơ" style={{ width: "100%" }} allowClear value={jobCvFilter} onChange={(value) => { setJobCvFilter(value); setJobCurrentPage(1); }} options={[
                { label: "Có hồ sơ mới", value: "has-new" },
                { label: "Đã có hồ sơ", value: "has-applications" },
                { label: "Chưa có hồ sơ", value: "no-applications" },
              ]} />
            </Col>
            <Col xs={24} sm={12} md={6} xl={4}>
              <Select placeholder="Đợt tuyển dụng" style={{ width: "100%" }} allowClear value={jobRoundFilter} onChange={(value) => { setJobRoundFilter(value); setJobCurrentPage(1); }} options={jobRounds.map((value) => ({ label: `Đợt ${value}`, value }))} />
            </Col>
            <Col xs={24} md={12} xl={8}>
              <DatePicker.RangePicker placeholder={["Hạn từ ngày", "Đến ngày"]} format="DD/MM/YYYY" style={{ width: "100%" }} value={jobDeadlineRange} onChange={(value) => { setJobDeadlineRange(value); setJobCurrentPage(1); }} />
            </Col>
            <Col xs={24} sm={12} md={6} xl={4}>
              <Select style={{ width: "100%" }} value={jobSortKey} onChange={(value) => { setJobSortKey(value); setJobCurrentPage(1); }} options={[
                { label: "Mới tạo trước", value: "newest" },
                { label: "Cũ tạo trước", value: "oldest" },
                { label: "Sắp hết hạn", value: "deadline" },
                { label: "Nhiều hồ sơ mới", value: "new_cvs" },
                { label: "Nhiều lượt xem", value: "most_viewed" },
                { label: "Nhiều hồ sơ nhất", value: "most_applications" },
                { label: "Tên vị trí A–Z", value: "title" },
              ]} />
            </Col>
          </Row>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Hiển thị {filteredAndSortedJobs.length}/{totalCampaigns} chiến dịch{refreshing ? " · Đang đồng bộ dữ liệu mới" : ""}
            </Text>
            {hasJobFilters && <Button icon={<RotateLeftOutlined />} onClick={handleResetJobFilters}>Xóa bộ lọc</Button>}
          </div>
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
