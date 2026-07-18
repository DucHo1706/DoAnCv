import {
  EyeOutlined,
  FilePdfOutlined,
  RobotOutlined,
  UserOutlined,
  MailOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  TeamOutlined,
  CloseOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Drawer,
  Empty,
  Row,
  Space,
  Table,
  Tag,
  Typography,
  Select,
  Progress,
  Alert,
  Radio,
  Avatar,
  Modal,
  Input,
  message,
  Tooltip,
} from "antd";
import type { TableProps } from "antd";
import React from "react";
import PageContainer from "../../../components/common/PageContainer";
import StatCard from "../../../components/common/StatCard";
import TableToolbar from "../../../components/common/TableToolbar";
import { useApplicationManagement } from "./hooks/useApplicationManagement";
import type { ApplicationDto } from "../../../services/recruitmentService";

const { Paragraph, Text, Title } = Typography;

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

  if (label.length === 0) {
    return null;
  }

  return (
    <Tooltip title={application.aiDataMessage || label}>
      <Tag color={color}>{label}</Tag>
    </Tooltip>
  );
}

export default function ApplicationManagementPage() {
  const {
    navigate,
    setApplications,
    jobs,
    selectedJobId,
    handleSelectedJobChange,
    searchQuery,
    setSearchQuery,
    filterClassification,
    setFilterClassification,
    loading,
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
    filteredApplications,
    kanbanData,
    openRejectModal,
    handleConfirmReject,
    handleViewDetail,
    parseSkills,
    handleDragStart,
    handleDrop,
    rejectTargetApplication,
    setRejectTargetApplication,
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
  } = useApplicationManagement();

  // Helper to parse AI reason JSON
  const getParsedAnalysis = (app: any) => {
    if (!app || !app.aiReason) return null;
    if (typeof app.aiReason === "object" && !Array.isArray(app.aiReason)) return app.aiReason;
    try {
      let reasonStr = String(app.aiReason).trim();
      const firstBrace = reasonStr.indexOf("{");
      if (firstBrace > 0) reasonStr = reasonStr.substring(firstBrace);
      if (reasonStr.startsWith("{")) {
        return JSON.parse(reasonStr);
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  // Helper safe wrapper for parseSkills
  const safeParseSkills = (value: string | string[] | undefined) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return parseSkills(value);
  };

  const columns: NonNullable<TableProps<ApplicationDto>["columns"]> = [
    {
      title: "Ứng viên",
      dataIndex: "candidateName",
      key: "candidateName",
      width: 220,
      render: (text: string, record: ApplicationDto) => (
        <div style={{ maxWidth: 200 }}>
          <Text strong ellipsis style={{ display: "block" }}>
            {text}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
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
        if (a.aiScore == null || b.aiScore == null) {
          return 0;
        }

        return a.aiScore - b.aiScore;
      },
      render: (score: number | null, record: ApplicationDto) => {
        let scoreTag = <Tag>Chưa có đánh giá AI</Tag>;

        if (score != null) {
          let color = "success";
          if (score < 50) {
            color = "error";
          } else if (score < 75) {
            color = "warning";
          }

          scoreTag = (
            <Tag color={color} style={{ fontSize: "14px", padding: "4px 8px" }}>
              <RobotOutlined style={{ marginRight: 4 }} />
              {score}/100
            </Tag>
          );
        }

        return (
          <Space direction="vertical" size={4}>
            {scoreTag}
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
            onChange={async (newStatus) => {
              if (newStatus === "Rejected") {
                openRejectModal(record);
                return;
              }

              try {
                const { recruitmentService } = await import("../../../services/recruitmentService");
                await recruitmentService.updateApplicationStatus(record.id, newStatus);

                setApplications((previousApplications) =>
                  previousApplications.map((application) => {
                    if (application.id === record.id) {
                      return {
                        ...application,
                        status: newStatus,
                      };
                    }
                    return application;
                  })
                );
                message.success("Cập nhật trạng thái thành công.");
              } catch (error: any) {
                const errorMessage =
                  error?.response?.data?.message || "Không thể cập nhật trạng thái.";
                message.error(errorMessage);
              }
            }}
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
          <Button icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            Xem nhanh AI
          </Button>

          <Button
            icon={<MailOutlined />}
            onClick={() => navigate(`/recruiter/candidates/${record.id}/email`)}
          >
            Email
          </Button>

          <Button
            type="primary"
            icon={<UserOutlined />}
            onClick={() => navigate(`/recruiter/candidates/${record.id}`)}
          >
            Hồ sơ chi tiết
          </Button>
        </Space>
      ),
    },
  ];

  if (selectedJobId != null) {
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
          return <Tag color="gold"><TrophyOutlined /> Hạng 1</Tag>;
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
            (criterion) =>
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

          return <Tag color="blue">{criterionResult.score}/{maxScore}</Tag>;
        },
      });
    }
  }

  const isEligibleForComparison = (application: ApplicationDto) => {
    if (application.aiDataStatus === "ready") {
      return true;
    }

    if (application.aiDataStatus !== "partial") {
      return false;
    }

    if (application.aiScore != null) {
      return true;
    }

    return (
      application.criteriaResults?.some((criterion) => {
        const maxScore = criterion.maxScore ?? criterion.max_score ?? 0;
        return (
          criterion.hasData === true &&
          criterion.score != null &&
          maxScore > 0
        );
      }) === true
    );
  };

  const getIneligibleComparisonReason = (application: ApplicationDto): string => {
    if (application.aiDataStatus === "partial") {
      return "Dữ liệu AI chưa đầy đủ và chưa có điểm tổng hoặc tiêu chí hợp lệ để so sánh.";
    }

    if (application.aiDataStatus === "missing") {
      return "Hồ sơ chưa được AI phân tích.";
    }

    if (application.aiDataStatus === "error") {
      return "Không thể lấy kết quả phân tích AI. Vui lòng thử đánh giá lại.";
    }

    if (application.aiDataStatus === "invalid") {
      return "Dữ liệu phân tích AI không hợp lệ.";
    }

    return application.aiDataMessage || "Hồ sơ chưa có đủ dữ liệu AI để so sánh.";
  };

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

  const handleCompareCandidates = () => {
    if (selectedJobId == null || selectedApplicationIds.length < 2) {
      return;
    }

    const encodedJobId = encodeURIComponent(selectedJobId);
    const encodedApplicationIds = selectedApplicationIds
      .map((applicationId) => encodeURIComponent(applicationId))
      .join(",");

    navigate(
      `/recruiter/ranking/compare?jobId=${encodedJobId}&applicationIds=${encodedApplicationIds}`
    );
  };

  const getSelectionDisabledReason = (): string | undefined => {
    if (selectedJobId == null) {
      return "Vui lòng chọn một công việc cụ thể trước.";
    }

    if (rankingCandidateCount < 2) {
      return "Cần ít nhất 2 ứng viên để thực hiện so sánh.";
    }

    if (eligibleComparisonCandidateCount < 2) {
      return "Cần ít nhất 2 ứng viên có dữ liệu AI sử dụng được để thực hiện so sánh.";
    }

    return undefined;
  };

  const getEmptyDescription = (): string => {
    if (searchQuery.trim().length > 0 || filterClassification != null) {
      return "Không tìm thấy hồ sơ phù hợp với bộ lọc hiện tại.";
    }

    if (selectedJobId != null) {
      return "Chưa có ứng viên nào ứng tuyển vào công việc này.";
    }

    return "Chưa có hồ sơ ứng tuyển nào.";
  };

  const selectionDisabledReason = getSelectionDisabledReason();

  const renderKanbanBoard = () => {
    return (
      <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 16 }}>
        {applicationStatusStages.map((stageItem) => {
          const stage = stageItem.label;

          return (
            <div
              key={stage}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, stage)}
              style={{
                minWidth: 300,
                background: "#f5f7fa",
                padding: 16,
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                minHeight: 400,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <Text strong style={{ fontSize: 16 }}>
                  {stage}
                </Text>
                <Tag color="blue">{kanbanData[stage]?.length || 0}</Tag>
              </div>

              <Space direction="vertical" style={{ width: "100%" }}>
                {kanbanData[stage]?.map((app) => (
                  <Card
                    key={app.id}
                    size="small"
                    draggable
                    onDragStart={(e) => handleDragStart(e, app.id, stage)}
                    style={{
                      borderRadius: 8,
                      cursor: "grab",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                    }}
                  >
                    <div
                      style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}
                    >
                      <Avatar icon={<UserOutlined />} />
                      <div>
                        <Text strong style={{ display: "block" }}>
                          {app.candidateName}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {app.jobTitle}
                        </Text>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      {app.aiScore == null ? (
                        <Tag>Chưa có điểm AI</Tag>
                      ) : (
                        <Tag
                          color={app.aiScore >= 80 ? "green" : app.aiScore >= 60 ? "gold" : "red"}
                        >
                          AI: {app.aiScore}đ
                        </Tag>
                      )}
                      <Space size="small">
                        <Button
                          size="small"
                          type="text"
                          icon={<EyeOutlined />}
                          onClick={() => handleViewDetail(app)}
                        />
                        <Button
                          size="small"
                          type="text"
                          icon={<MailOutlined />}
                          onClick={() => navigate(`/recruiter/candidates/${app.id}/email`)}
                        />
                      </Space>
                    </div>
                  </Card>
                ))}
                {(!kanbanData[stage] || kanbanData[stage].length === 0) && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "20px 0",
                      color: "#bfbfbf",
                      border: "1px dashed #d9d9d9",
                      borderRadius: 8,
                    }}
                  >
                    Kéo thả ứng viên vào đây
                  </div>
                )}
              </Space>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <PageContainer
      title="Quản lý Hồ sơ Ứng tuyển"
      subtitle="Xem danh sách ứng viên, lọc theo chiến dịch và phân tích kết quả từ AI."
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <StatCard
            title="Tổng số CV đã nhận"
            value={filteredApplications.length}
            subtitle={selectedJobId ? "Chiến dịch đã chọn" : "Tất cả các chiến dịch"}
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
          searchPlaceholder="Tìm ứng viên theo tên, email..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          extra={
            <Space wrap>
              <Select
                placeholder="Lọc theo tin tuyển dụng..."
                style={{ width: 280 }}
                allowClear
                value={selectedJobId}
                onChange={handleSelectedJobChange}
                showSearch
                filterOption={(input, option) =>
                  ((option?.label as string) ?? "").toLowerCase().includes(input.toLowerCase())
                }
                options={Object.entries(
                  jobs.reduce((acc: any, j: any) => {
                    const catName = j.category?.name || "Lĩnh vực khác";
                    if (!acc[catName]) acc[catName] = [];
                    acc[catName].push({
                      label: `${j.position?.name || "Vị trí"} (${j.branch?.name || "Chi nhánh"})`,
                      value: j.id,
                    });
                    return acc;
                  }, {})
                ).map(([catName, jobsGroup]: [string, any]) => ({
                  label: catName,
                  options: jobsGroup,
                }))}
              />
              <Select
                placeholder="Lọc phân loại AI"
                style={{ width: 170 }}
                allowClear
                value={filterClassification}
                onChange={setFilterClassification}
                options={[
                  { label: "Phù hợp", value: "Phù hợp" },
                  { label: "Nên xem xét", value: "Nên xem xét" },
                  { label: "Chưa phù hợp", value: "Chưa phù hợp" },
                ]}
              />
              <Select
                aria-label="Xếp hạng theo"
                style={{ width: 180 }}
                value={selectedSortType}
                disabled={selectedJobId == null}
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
                  style={{ width: 210 }}
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
              <Tooltip
                title={selectionDisabledReason}
              >
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
                  <UnorderedListOutlined /> Bảng
                </Radio.Button>
                <Radio.Button value="kanban" disabled={selectionMode}>
                  <AppstoreOutlined /> Kanban
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
        {selectedJobId != null &&
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
        {rankingError.length > 0 ? null : loading === false && filteredApplications.length === 0 ? (
          <Empty
            description={getEmptyDescription()}
            style={{ padding: "40px 16px" }}
          />
        ) : viewMode === "table" ? (
          <Table
            columns={columns}
            dataSource={filteredApplications}
            rowKey="id"
            rowSelection={rowSelection}
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1050 }}
            tableLayout="fixed"
            locale={{ emptyText: getEmptyDescription() }}
          />
        ) : (
          renderKanbanBoard()
        )}
      </Card>

      {/* Drawer hiển thị chi tiết chấm điểm của AI */}
      <Drawer
        title={
          <span>
            <RobotOutlined style={{ color: "#1677ff", marginRight: 8 }} /> Báo cáo Phân tích từ AI
          </span>
        }
        placement="right"
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        extra={
          <Button
            type="primary"
            icon={<FilePdfOutlined />}
            href={selectedApp?.cvUrl}
            target="_blank"
          >
            Xem CV
          </Button>
        }
        width={760}
      >
        {selectedApp && (
          <div>
            <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 24, marginTop: 16 }}>
              <Col span={6} style={{ textAlign: "center" }}>
                {selectedApp.aiScore == null ? (
                  <Tag>Chưa có điểm AI</Tag>
                ) : (
                  <Progress
                    type="dashboard"
                    percent={selectedApp.aiScore}
                    strokeColor={
                      selectedApp.aiScore >= 80
                        ? "#52c41a"
                        : selectedApp.aiScore >= 60
                          ? "#faad14"
                          : "#ff4d4f"
                    }
                    format={(percent) => `${percent} Điểm`}
                  />
                )}
              </Col>
              <Col span={18}>
                <Title level={4} style={{ margin: 0 }}>
                  {selectedApp.candidateName}
                </Title>
                <Text type="secondary" style={{ display: "block" }}>
                  {selectedApp.email}
                </Text>
                <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
                  Vị trí ứng tuyển: <Text strong>{selectedApp.jobTitle}</Text>
                </Text>
                <div>
                  Phân loại:{" "}
                  <Tag
                    color={
                      selectedApp.classification === "Phù hợp" ||
                      selectedApp.classification === "Phù hợp cao"
                        ? "green"
                        : selectedApp.classification === "Nên xem xét"
                          ? "orange"
                          : "red"
                    }
                  >
                    {selectedApp.classification || "Chưa phân loại"}
                  </Tag>
                </div>
              </Col>
            </Row>

            {(() => {
              const parsed = getParsedAnalysis(selectedApp);
              const summaryText = parsed?.summary || parsed?.score_analysis?.summary || selectedApp.aiReason || "Chưa có nhận xét từ AI";
              return (
                <Alert
                  message="Trí tuệ nhân tạo (AI) nhận xét tổng quan:"
                  description={summaryText}
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />
              );
            })()}

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={12}>
                <Text strong>✅ Kỹ năng đáp ứng được (CV có):</Text>
                <div style={{ marginTop: 8 }}>
                  {safeParseSkills(selectedApp.matchedSkills).length > 0 ? (
                    safeParseSkills(selectedApp.matchedSkills).map((skill: string) => (
                      <Tag color="green" key={skill} style={{ marginBottom: 4 }}>
                        {skill}
                      </Tag>
                    ))
                  ) : (
                    <Text type="secondary">Không có</Text>
                  )}
                </div>
              </Col>
              <Col span={12}>
                <Text strong>❌ Kỹ năng còn thiếu (JD yêu cầu):</Text>
                <div style={{ marginTop: 8 }}>
                  {safeParseSkills(selectedApp.missingSkills).length > 0 ? (
                    safeParseSkills(selectedApp.missingSkills).map((skill: string) => (
                      <Tag color="red" key={skill} style={{ marginBottom: 4 }}>
                        {skill}
                      </Tag>
                    ))
                  ) : (
                    <Text type="secondary">Không thiếu kỹ năng nào</Text>
                  )}
                </div>
              </Col>
            </Row>

            <Title level={5}>Điểm chi tiết theo từng tiêu chí</Title>
            <Table
              dataSource={(selectedApp as any).criteriaResults || []}
              rowKey={(record: any) => record.criterionName || record.criterion_name}
              pagination={false}
              size="small"
              bordered
              columns={[
                {
                  title: "Tiêu chí đánh giá",
                  key: "criterionName",
                  width: "30%",
                  render: (_: any, record: any) =>
                    record.criterionName || record.criterion_name || "Chưa có tên",
                },
                {
                  title: "Trọng số",
                  key: "weight",
                  width: "10%",
                  render: (_: any, record: any) => `${record.weight || 0}%`,
                },
                {
                  title: "Điểm",
                  key: "score",
                  width: "15%",
                  render: (_: any, record: any) => (
                    <strong>
                      {record.score || 0} / {record.maxScore || record.max_score || 0}
                    </strong>
                  ),
                },
                {
                  title: "AI Giải thích",
                  dataIndex: "comment",
                  key: "comment",
                  width: "45%",
                },
              ]}
              locale={{ emptyText: "Không có dữ liệu tiêu chí đánh giá" }}
            />
          </div>
        )}
      </Drawer>

      <Modal
        title="Xác nhận từ chối & Ghi chú"
        open={rejectModalOpen}
        onOk={handleConfirmReject}
        onCancel={() => {
          setRejectModalOpen(false);
          setRejectTargetApplication(null);
          setRejectReasonType(undefined);
          setRejectNote("");
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
            <div style={{ marginTop: 4 }}>
              {rejectTargetApplication?.jobTitle || "Chưa cập nhật"}
            </div>
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
              onChange={(event) => setRejectNote(event.target.value)}
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
    </PageContainer>
  );
}
