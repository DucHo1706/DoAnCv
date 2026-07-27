import React from "react";
import {
  ArrowLeftOutlined,
  CloseOutlined,
  EyeOutlined,
  MailOutlined,
  RotateLeftOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Input,
  message,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { TableProps } from "antd";
import PageContainer from "../../../../components/common/PageContainer";
import StatCard from "../../../../components/common/StatCard";
import TableToolbar from "../../../../components/common/TableToolbar";
import AiCoreIcon from "../../../../components/common/AiCoreIcon";
import type { ApplicationDto } from "../../services/recruitmentService";
import { useCampaignApplications } from "./hooks/useCampaignApplications";
import { KanbanBoard } from "./components/KanbanBoard";
import { AiReportDrawer } from "./components/AiReportDrawer";
import { ScheduleModalContent } from "./components/ScheduleModalContent";

const { Text, Title, Paragraph } = Typography;

function renderAiDataStatusTag(application: ApplicationDto) {
  let color = "default";
  let label = "";

  if (application.aiDataStatus === "partial") {
    color = "gold";
    label = "AI chưa đầy đủ";
  } else if (application.aiDataStatus === "missing") {
    label = "Chưa phân tích AI";
  } else if (application.aiDataStatus === "error") {
    color = "red";
    label = "AI xử lý lỗi";
  } else if (application.aiDataStatus === "invalid") {
    color = "orange";
    label = "Dữ liệu AI không hợp lệ";
  }

  if (label.length === 0) return null;

  return (
    <Tooltip title={application.aiDataMessage || label}>
      <Tag color={color}>{label}</Tag>
    </Tooltip>
  );
}

export default function CampaignApplicationsPage() {
  const {
    jobId,
    currentJob,
    navigate,
    loading,
    fetchError,
    refetch,
    searchQuery,
    setSearchQuery,
    filterClassification,
    setFilterClassification,
    filterStatus,
    setFilterStatus,
    handleResetFilters,
    isModalOpen,
    setIsModalOpen,
    selectedApp,
    viewMode,
    setViewMode,
    applicationStatusStages,
    rejectModalOpen,
    setRejectModalOpen,
    rejectReasonType,
    setRejectReasonType,
    rejectNote,
    setRejectNote,
    rejectSubmitting,
    rejectReasonOptions,
    rejectTargetApplication,
    handleConfirmReject,
    scheduleModalOpen,
    setScheduleModalOpen,
    scheduleTargetApplication,
    scheduleSubmitting,
    handleConfirmSchedule,
    filteredApplications,
    kanbanData,
    openRejectModal,
    openScheduleModal,
    handleStatusChange,
    handleViewDetail,
    parseSkills,
    rankingError,
    rankingCandidateCount,
    eligibleComparisonCandidateCount,
    selectedSortType,
    selectedCriterion,
    setSelectedCriterion,
    availableCriteria,
    handleSortTypeChange,
    selectionMode,
    selectedApplicationIds,
    setSelectedApplicationIds,
    handleEnableSelection,
    handleCancelSelection,
    handleCompareCandidates,
  } = useCampaignApplications();

  const isEligibleForComparison = (application: ApplicationDto) => {
    if (application.aiDataStatus === "ready") return true;
    if (application.aiDataStatus !== "partial") return false;
    if (application.aiScore != null) return true;
    return (
      application.criteriaResults?.some((criterion: any) => {
        const maxScore = criterion.maxScore ?? criterion.max_score ?? 0;
        return criterion.hasData === true && criterion.score != null && maxScore > 0;
      }) === true
    );
  };

  const getIneligibleComparisonReason = (application: ApplicationDto): string => {
    if (application.aiDataStatus === "partial") {
      return "Dữ liệu AI chưa đầy đủ và chưa có điểm tổng hoặc tiêu chí hợp lệ để so sánh.";
    }
    if (application.aiDataStatus === "missing") return "Hồ sơ chưa được AI phân tích.";
    if (application.aiDataStatus === "error") return "Không thể lấy kết quả phân tích AI. Vui lòng thử đánh giá lại.";
    if (application.aiDataStatus === "invalid") return "Dữ liệu phân tích AI không hợp lệ.";
    return application.aiDataMessage || "Hồ sơ chưa có đủ dữ liệu AI để so sánh.";
  };

  const getSelectionDisabledReason = (): string | undefined => {
    if (!jobId) return "Vui lòng chọn một công việc cụ thể trước.";
    if (rankingCandidateCount < 2) return "Cần ít nhất 2 ứng viên để thực hiện so sánh.";
    if (eligibleComparisonCandidateCount < 2)
      return "Cần ít nhất 2 ứng viên có dữ liệu AI sử dụng được để thực hiện so sánh.";
    return undefined;
  };

  const selectionDisabledReason = getSelectionDisabledReason();

  const rowSelection: TableProps<ApplicationDto>["rowSelection"] = selectionMode
    ? {
        selectedRowKeys: selectedApplicationIds,
        onChange: (selectedRowKeys: React.Key[]) => {
          const normalizedIds = selectedRowKeys.map((key) => String(key));
          if (normalizedIds.length > 4) {
            message.warning("Chỉ được chọn tối đa bốn ứng viên.");
            return;
          }
          setSelectedApplicationIds(normalizedIds);
        },
        getCheckboxProps: (application: ApplicationDto) => {
          const isSelected = selectedApplicationIds.includes(application.id);
          const reachedLimit = selectedApplicationIds.length >= 4 && isSelected === false;
          const isEligible = isEligibleForComparison(application);

          let disabledReason: string | undefined;
          if (isEligible === false) {
            disabledReason = getIneligibleComparisonReason(application);
          } else if (reachedLimit) {
            disabledReason = "Chỉ được chọn tối đa bốn ứng viên.";
          }

          return {
            disabled: isEligible === false || reachedLimit,
            title: disabledReason,
          };
        },
      }
    : undefined;

  const columns: NonNullable<TableProps<ApplicationDto>["columns"]> = [
    {
      title: "Ứng viên",
      dataIndex: "candidateName",
      key: "candidateName",
      width: 220,
      render: (text: string, record: ApplicationDto) => (
        <div style={{ maxWidth: 200 }}>
          <Text strong ellipsis style={{ display: "block", color: "#0F172A" }}>
            {text}
          </Text>
          <Text type="secondary" style={{ fontSize: 12, color: "#64748B" }} ellipsis>
            {record.email}
          </Text>
        </div>
      ),
    },
    {
      title: "Vị trí ứng tuyển",
      dataIndex: "jobTitle",
      key: "jobTitle",
      width: 320,
      render: (text: string) => (
        <Tag
          color="blue"
          style={{
            maxWidth: 290,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            borderRadius: 6,
            fontWeight: 500,
          }}
        >
          {text}
        </Tag>
      ),
    },
    {
      title: "Điểm AI Đánh giá",
      dataIndex: "aiScore",
      key: "aiScore",
      width: 180,
      sorter: (a: ApplicationDto, b: ApplicationDto) => {
        if (a.aiScore == null) return -1;
        if (b.aiScore == null) return 1;
        return a.aiScore - b.aiScore;
      },
      render: (score: number | null, record: ApplicationDto) => {
        let scoreBadge = <Tag style={{ borderRadius: 6 }}>Chưa có điểm AI</Tag>;

        if (score != null) {
          const isOpt =
            score >= 75
              ? { bg: "#F0FDF4", border: "#BBF7D0", color: "#10B981" }
              : score >= 50
              ? { bg: "#FFFBEB", border: "#FDE68A", color: "#F59E0B" }
              : { bg: "#FEF2F2", border: "#FECACA", color: "#EF4444" };

          scoreBadge = (
            <span
              className="ai-score-badge"
              style={{
                padding: "4px 8px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 700,
                backgroundColor: isOpt.bg,
                border: `1px solid ${isOpt.border}`,
                color: isOpt.color,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <AiCoreIcon size={14} style={{ marginRight: 4 }} />
              {score}/100
            </span>
          );
        }

        return (
          <Space direction="vertical" size={4}>
            {scoreBadge}
            {renderAiDataStatusTag(record)}
          </Space>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 220,
      render: (status: string, record: ApplicationDto) => {
        const currentStatus = status || "Applied";
        return (
          <Select
            value={currentStatus}
            style={{ width: 170 }}
            onChange={(newStatus) => handleStatusChange(record, newStatus)}
            options={[
              { value: "Applied", label: "Mới nộp" },
              { value: "Reviewing", label: "Đang xem xét" },
              { value: "Interview", label: "Phỏng vấn" },
              { value: "Offer", label: "Nhận việc (Offer)" },
              { value: "Rejected", label: "Đã từ chối" },
            ]}
          />
        );
      },
    },
    {
      title: "Thao tác",
      key: "action",
      width: 390,
      align: "center" as const,
      render: (_: any, record: ApplicationDto) => (
        <Space size="small" wrap={false}>
          <Button icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} style={{ borderRadius: 8 }}>
            Xem nhanh AI
          </Button>

          <Button
            icon={<MailOutlined />}
            onClick={() => navigate(`/recruiter/candidates/${record.id}/email`)}
            style={{ borderRadius: 8 }}
          >
            Email
          </Button>

          <Button
            type="primary"
            icon={<UserOutlined />}
            onClick={() => navigate(`/recruiter/candidates/${record.id}`)}
            style={{ borderRadius: 8, background: "#2563EB", borderColor: "#2563EB" }}
          >
            Hồ sơ chi tiết
          </Button>
        </Space>
      ),
    },
  ];

  if (jobId != null) {
    columns.unshift({
      title: "Hạng",
      key: "rank",
      width: 120,
      render: (_: any, record: ApplicationDto) => {
        let rank = record.overallRank;
        if (selectedSortType === "criterion") {
          rank = record.selectedCriterionRank;
        }

        if (rank == null) {
          return <Tag>Chưa xếp hạng</Tag>;
        }

        if (rank === 1) {
          return (
            <Tag color="gold">
              <TrophyOutlined /> Hạng 1
            </Tag>
          );
        }

        if (rank === 2) {
          return <Tag color="default">Hạng 2</Tag>;
        }

        if (rank === 3) {
          return <Tag color="orange">Hạng 3</Tag>;
        }

        return <Tag>#{rank}</Tag>;
      },
    });

    if (selectedSortType === "criterion" && selectedCriterion != null) {
      columns.splice(4, 0, {
        title: selectedCriterion,
        key: "selectedCriterionScore",
        width: 170,
        render: (_: any, record: ApplicationDto) => {
          const criterionResult = record.criteriaResults?.find(
            (criterion: any) =>
              (criterion.criterionName || criterion.criterion_name || "").toLowerCase() ===
              selectedCriterion.toLowerCase()
          );

          const maxScore = criterionResult?.maxScore ?? criterionResult?.max_score ?? 0;

          if (
            criterionResult == null ||
            criterionResult.score == null ||
            criterionResult.hasData === false ||
            maxScore <= 0
          ) {
            return <Text type="secondary">Chưa có dữ liệu</Text>;
          }

          return (
            <Tag color="blue">
              {criterionResult.score}/{maxScore}
            </Tag>
          );
        },
      });
    }
  }

  const deadlineDate = currentJob?.deadline ? new Date(currentJob.deadline) : null;
  const isExpired = deadlineDate ? deadlineDate < new Date() : false;
  const formatDate = (d: string | null | undefined) => {
    if (!d) return "Không giới hạn";
    return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <PageContainer title="Quản lý Ứng viên">
      <div style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/recruiter/applications")}
          style={{ borderRadius: 8 }}
        >
          Quay lại danh sách chiến dịch
        </Button>
      </div>

      {fetchError && (
        <Alert
          type="error"
          showIcon
          message="Lỗi tải dữ liệu"
          description={fetchError}
          action={
            <Button size="small" type="primary" onClick={refetch}>
              Thử lại
            </Button>
          }
          style={{ marginBottom: 20 }}
        />
      )}

      {/* Job Context Summary Card */}
      {currentJob && (
        <Card
          style={{
            marginBottom: 20,
            borderRadius: 14,
            border: "1px solid #E2E8F0",
            background: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
          }}
          bodyStyle={{ padding: "20px 24px" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <Title level={5} style={{ margin: 0, color: "#0F172A", fontSize: 16 }}>
                  Chiến dịch: {currentJob.position?.name}
                </Title>
                {currentJob.status === "Published" ? (
                  <Tag color="success" style={{ borderRadius: 6 }}>
                    Đang tuyển
                  </Tag>
                ) : (
                  <Tag color="warning" style={{ borderRadius: 6 }}>
                    Chờ duyệt
                  </Tag>
                )}
                {isExpired && <Tag color="error" style={{ borderRadius: 6 }}>Hết hạn</Tag>}
              </div>

              <Space size={16} wrap style={{ color: "#64748B", fontSize: 13, marginBottom: 12 }}>
                <span>
                  <EnvironmentOutlined style={{ marginRight: 4 }} />
                  {currentJob.branch?.name}
                </span>
                <span>
                  <DollarOutlined style={{ marginRight: 4 }} />
                  Mức lương: {currentJob.salaryRange || "Thỏa thuận"}
                </span>
                <span>
                  <CalendarOutlined style={{ marginRight: 4 }} />
                  Hạn nộp: {formatDate(currentJob.deadline)}
                </span>
              </Space>

              {currentJob.requirements && (
                <Paragraph
                  ellipsis={{ rows: 2, expandable: true, symbol: "Xem thêm" }}
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: "#475569",
                    lineHeight: 1.6,
                    background: "#F8FAFC",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid #F1F5F9",
                  }}
                >
                  <InfoCircleOutlined style={{ marginRight: 6, color: "#2563EB" }} />
                  <Text strong style={{ fontSize: 12, color: "#0F172A" }}>
                    Yêu cầu:{" "}
                  </Text>
                  {currentJob.requirements}
                </Paragraph>
              )}
            </div>

            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/recruiter/jobs/${currentJob.id}`)}
              style={{ color: "#2563EB", fontWeight: 600, fontSize: 13, padding: "4px 0" }}
            >
              Xem chi tiết tin
            </Button>
          </div>
        </Card>
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <StatCard
            title="Tổng số CV đã nhận"
            value={filteredApplications.length}
            subtitle="Chiến dịch đã chọn"
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="Hồ sơ tiềm năng (>75đ)"
            value={filteredApplications.filter((a) => a.aiScore != null && a.aiScore >= 75).length}
            subtitle="AI đánh giá phù hợp cao"
          />
        </Col>
      </Row>

      <Card style={{ overflow: "hidden" }}>
        <TableToolbar
          searchPlaceholder="Tìm theo tên, email, sđt, vị trí..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          extra={
            <Space wrap>
              <Select
                placeholder="Lọc trạng thái"
                style={{ width: 160 }}
                allowClear
                value={filterStatus}
                onChange={setFilterStatus}
                options={[
                  { label: "Mới nộp", value: "Applied" },
                  { label: "Đang xem xét", value: "Reviewing" },
                  { label: "Phỏng vấn", value: "Interview" },
                  { label: "Nhận việc", value: "Offer" },
                  { label: "Đã từ chối", value: "Rejected" },
                ]}
              />
              <Select
                placeholder="Lọc phân loại AI"
                style={{ width: 160 }}
                allowClear
                value={filterClassification}
                onChange={setFilterClassification}
                options={[
                  { label: "Phù hợp", value: "Phù hợp" },
                  { label: "Nên xem xét", value: "Nên xem xét" },
                  { label: "Chưa phù hợp", value: "Chưa phù hợp" },
                ]}
              />
              {(searchQuery || filterStatus || filterClassification) && (
                <Button
                  icon={<RotateLeftOutlined />}
                  onClick={handleResetFilters}
                  style={{ borderRadius: 8 }}
                >
                  Xóa lọc
                </Button>
              )}
              <Select
                aria-label="Xếp hạng theo"
                style={{ width: 170 }}
                value={selectedSortType}
                disabled={!jobId}
                onChange={handleSortTypeChange}
                options={[
                  { label: "Điểm tổng thể", value: "overall" },
                  {
                    label: "Theo tiêu chí",
                    value: "criterion",
                    disabled: availableCriteria.length === 0,
                  },
                ]}
              />
              {selectedSortType === "criterion" ? (
                <Select
                  aria-label="Chọn tiêu chí xếp hạng"
                  placeholder="Chọn tiêu chí"
                  style={{ width: 200 }}
                  value={selectedCriterion}
                  onChange={(criterionName) => {
                    setSelectedCriterion(criterionName);
                    setSelectedApplicationIds([]);
                  }}
                  options={availableCriteria.map((criterion) => ({
                    label: `${criterion.criterionName} (${criterion.weight}%)`,
                    value: criterion.criterionName,
                  }))}
                />
              ) : null}
              <Tooltip title={selectionDisabledReason}>
                <span>
                  <Button
                    type="primary"
                    icon={<TeamOutlined />}
                    disabled={selectionDisabledReason != null || selectionMode}
                    onClick={handleEnableSelection}
                  >
                    Chọn ứng viên
                  </Button>
                </span>
              </Tooltip>
              <Radio.Group
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                optionType="button"
                buttonStyle="solid"
              >
                <Radio.Button value="table">
                  <UserOutlined /> Bảng
                </Radio.Button>
                <Radio.Button value="kanban" disabled={selectionMode}>
                  <TeamOutlined /> Kanban
                </Radio.Button>
              </Radio.Group>
            </Space>
          }
        />

        {rankingError.length > 0 ? (
          <Alert
            type="error"
            showIcon
            message="Không thể tải dữ liệu xếp hạng"
            description={rankingError}
            style={{ marginBottom: 16 }}
          />
        ) : null}

        {jobId != null &&
        rankingError.length === 0 &&
        loading === false &&
        rankingCandidateCount === 1 ? (
          <Alert
            type="info"
            showIcon
            message="Cần ít nhất 2 ứng viên để thực hiện so sánh."
            style={{ marginBottom: 16 }}
          />
        ) : null}

        {selectionMode ? (
          <Card
            size="small"
            style={{
              marginBottom: 16,
              border: "1px solid #E2E8F0",
              borderRadius: 12,
              background: "#F8FAFC",
            }}
          >
            <Row gutter={[16, 12]} align="middle" justify="space-between">
              <Col xs={24} md={8}>
                <Text strong>Đã chọn {selectedApplicationIds.length}/4 ứng viên</Text>
              </Col>
              <Col xs={24} md={16} style={{ textAlign: "right" }}>
                <Space wrap style={{ justifyContent: "flex-end", width: "100%" }}>
                  <Button
                    disabled={selectedApplicationIds.length === 0}
                    onClick={() => setSelectedApplicationIds([])}
                  >
                    Xóa lựa chọn
                  </Button>
                  <Button icon={<CloseOutlined />} onClick={handleCancelSelection}>
                    Hủy chọn
                  </Button>
                  <Button
                    type="primary"
                    icon={<TeamOutlined />}
                    disabled={selectedApplicationIds.length < 2}
                    onClick={handleCompareCandidates}
                  >
                    So sánh ứng viên
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>
        ) : null}

        {viewMode === "table" ? (
          <Table
            rowSelection={rowSelection}
            columns={columns}
            dataSource={filteredApplications}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1050 }}
            tableLayout="fixed"
          />
        ) : (
          <KanbanBoard
            applicationStatusStages={applicationStatusStages}
            kanbanData={kanbanData}
            onStatusChange={handleStatusChange}
            onViewDetail={handleViewDetail}
            onNavigateEmail={(id) => navigate(`/recruiter/candidates/${id}/email`)}
            onNavigateDetail={(id) => navigate(`/recruiter/candidates/${id}`)}
            onOpenScheduleModal={openScheduleModal}
            onOpenRejectModal={openRejectModal}
          />
        )}
      </Card>

      {/* Drawer AI Report */}
      <AiReportDrawer
        open={isModalOpen}
        application={selectedApp}
        onClose={() => setIsModalOpen(false)}
        parseSkills={parseSkills}
      />

      {/* Modal Từ chối */}
      <Modal
        title="Xác nhận từ chối & Ghi chú"
        open={rejectModalOpen}
        onOk={handleConfirmReject}
        onCancel={() => {
          setRejectModalOpen(false);
        }}
        okText="Xác nhận từ chối"
        cancelText="Hủy"
        confirmLoading={rejectSubmitting}
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <div>
            <Text strong>Ứng viên</Text>
            <div style={{ marginTop: 4 }}>
              {rejectTargetApplication?.candidateName || "Chưa chọn ứng viên"}
            </div>
          </div>

          <div>
            <Text strong>Vị trí ứng tuyển</Text>
            <div style={{ marginTop: 4 }}>{rejectTargetApplication?.jobTitle || "Chưa cập nhật"}</div>
          </div>

          <div>
            <Text strong>
              Lý do từ chối <span style={{ color: "red" }}>*</span>
            </Text>

            <Select
              placeholder="Chọn lý do từ chối"
              value={rejectReasonType}
              onChange={setRejectReasonType}
              options={rejectReasonOptions}
              style={{ width: "100%", marginTop: 8 }}
            />
          </div>

          <div>
            <Text strong>Ghi chú thêm</Text>

            <Input.TextArea
              placeholder="Nhập ghi chú để lưu vào Talent Pool..."
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={4}
              style={{ marginTop: 8 }}
            />
          </div>

          <Alert
            type="info"
            showIcon
            message="Sau khi xác nhận, hồ sơ sẽ được chuyển sang trạng thái Đã từ chối và ứng viên sẽ được lưu vào Ngân hàng Ứng viên."
          />
        </Space>
      </Modal>

      {/* Modal Lập lịch phỏng vấn */}
      <Modal
        title={
          scheduleTargetApplication?.status === "Interview"
            ? "Chỉnh sửa lịch phỏng vấn & Gửi Email"
            : "Lập lịch phỏng vấn & Gửi Email"
        }
        open={scheduleModalOpen}
        onCancel={() => setScheduleModalOpen(false)}
        footer={null}
        destroyOnClose
        width={720}
      >
        <ScheduleModalContent
          application={scheduleTargetApplication}
          submitting={scheduleSubmitting}
          onCancel={() => setScheduleModalOpen(false)}
          onConfirm={handleConfirmSchedule}
        />
      </Modal>
    </PageContainer>
  );
}
