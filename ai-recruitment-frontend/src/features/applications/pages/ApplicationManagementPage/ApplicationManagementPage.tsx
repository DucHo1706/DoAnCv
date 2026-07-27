import {
  SkillMatchedIcon,
} from "../../../../components/common/AppIcons";
import {
  FilePdfOutlined,
  UserOutlined,
  MailOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  ArrowLeftOutlined,
  SearchOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  CalendarOutlined,
  TeamOutlined,
  InfoCircleOutlined,
  CloseOutlined,
  TrophyOutlined,
  EyeOutlined,
  RotateLeftOutlined,
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
  Divider,
  Pagination,
  DatePicker,
  Form,
  Tooltip,
} from "antd";
import type { TableProps } from "antd";
import dayjs from "dayjs";
import { useState, useMemo, useEffect } from "react";
import React from "react";
import PageContainer from "../../../../components/common/PageContainer";
import StatCard from "../../../../components/common/StatCard";
import TableToolbar from "../../../../components/common/TableToolbar";
import AiCoreIcon from "../../../../components/common/AiCoreIcon";
import { recruitmentService } from "../../services/recruitmentService";
import { useApplicationManagement } from "./hooks/useApplicationManagement";
import type { ApplicationDto } from "../../services/recruitmentService";

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
  const [form] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState<any[]>([]);

  // Job campaign search, sort, and pagination states
  const [jobSearchQuery, setJobSearchQuery] = useState("");
  const [jobSortKey, setJobSortKey] = useState("newest");
  const [jobCurrentPage, setJobCurrentPage] = useState(1);

  const {
    navigate,
    setApplications,
    jobs,
    jobsWithStats,
    selectedJobId,
    setSelectedJobId,
    handleSelectedJobChange,
    searchQuery,
    setSearchQuery,
    filterClassification,
    setFilterClassification,
    filterStatus,
    setFilterStatus,
    handleResetFilters,
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
    scheduleModalOpen,
    setScheduleModalOpen,
    scheduleTargetApplication,
    scheduleSubmitting,
    handleConfirmSchedule,
    openScheduleModal,
    rankingError,
    rankingCandidateCount,
    eligibleComparisonCandidateCount,
    selectedSortType,
    selectedCriterion,
    setSelectedCriterion,
    availableCriteria,
    handleSortTypeChange,
    selectionMode,
    setSelectionMode,
    selectedApplicationIds,
    setSelectedApplicationIds,
    handleEnableSelection,
    handleCancelSelection,
  } = useApplicationManagement();

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

  const handleStatusChange = async (record: ApplicationDto, newStatus: string) => {
    if (newStatus === "Rejected") {
      openRejectModal(record);
      return;
    }

    try {
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
      message.success("Cập nhật trạng thái ứng viên thành công. 🎉");
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "Không thể cập nhật trạng thái.";
      message.error(errorMessage);
    }
  };

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
          const isOpt = score >= 75 ? { bg: "#F0FDF4", border: "#BBF7D0", color: "#10B981" } :
                        score >= 50 ? { bg: "#FFFBEB", border: "#FDE68A", color: "#F59E0B" } :
                        { bg: "#FEF2F2", border: "#FECACA", color: "#EF4444" };

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
          <Button 
            icon={<EyeOutlined />} 
            onClick={() => handleViewDetail(record)}
            style={{ borderRadius: 8 }}
          >
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

  const renderKanbanBoard = () => {
    const getStageColor = (status: string) => {
      switch (status) {
        case "Applied": return "#3B82F6";
        case "Reviewing": return "#8B5CF6";
        case "Interview": return "#F59E0B";
        case "Offer": return "#10B981";
        case "Rejected": return "#EF4444";
        default: return "#64748B";
      }
    };

    return (
      <div style={{ display: "flex", gap: 20, overflowX: "auto", paddingBottom: 24, paddingTop: 8 }}>
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
                  padding: "0 4px"
                }}
              >
                <Space size={8}>
                  <span 
                    style={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: "50%", 
                      backgroundColor: colColor,
                      display: "inline-block" 
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

              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
                {stageApps.map((app) => {
                  const scoreBorderColor = app.aiScore == null
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
                      style={{
                        background: "#FFFFFF",
                        padding: 16,
                        borderRadius: 12,
                        border: "1px solid #E2E8F0",
                        borderLeft: `4px solid ${scoreBorderColor}`,
                        cursor: "grab",
                        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
                        transition: "all 0.2s ease-in-out",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(15, 23, 42, 0.08)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.boxShadow = "0 1px 3px rgba(15, 23, 42, 0.04)";
                      }}
                    >
                      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
                        <Avatar 
                          style={{ backgroundColor: app.aiScore != null && app.aiScore >= 75 ? "#EFF6FF" : "#F8FAFC", color: "#2563EB" }}
                          icon={<UserOutlined />} 
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <Text strong style={{ display: "block", color: "#0F172A", fontSize: 14 }} ellipsis>
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
                            whiteSpace: "nowrap"
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
                          marginTop: 8
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: app.aiScore == null ? "#64748B" : app.aiScore >= 75 ? "#10B981" : app.aiScore >= 50 ? "#F59E0B" : "#EF4444",
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
                                onClick={() => openScheduleModal(app)}
                              />
                            </Tooltip>
                          )}
                          <Tooltip title="Xem nhanh AI">
                            <Button
                              size="small"
                              type="text"
                              style={{ borderRadius: 6 }}
                              icon={<EyeOutlined style={{ color: "#64748B" }} />}
                              onClick={() => handleViewDetail(app)}
                            />
                          </Tooltip>
                          <Tooltip title="Email ứng viên">
                            <Button
                              size="small"
                              type="text"
                              style={{ borderRadius: 6 }}
                              icon={<MailOutlined style={{ color: "#64748B" }} />}
                              onClick={() => navigate(`/recruiter/candidates/${app.id}/email`)}
                            />
                          </Tooltip>
                          <Tooltip title="Hồ sơ chi tiết">
                            <Button
                              size="small"
                              type="text"
                              style={{ borderRadius: 6 }}
                              icon={<UserOutlined style={{ color: "#2563EB" }} />}
                              onClick={() => navigate(`/recruiter/candidates/${app.id}`)}
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
                            textAlign: "left"
                          }}
                          dropdownStyle={{ borderRadius: 8 }}
                          onChange={(newStatus) => handleStatusChange(app, newStatus)}
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
  };

  // ── Job Campaign filtering, sorting, and pagination logic ──
  const filteredAndSortedJobs = useMemo(() => {
    let result = jobsWithStats.filter((job: any) => {
      const title = (job.position?.name || "").toLowerCase();
      const cat = (job.category?.name || "").toLowerCase();
      const branch = (job.branch?.name || "").toLowerCase();
      const query = jobSearchQuery.toLowerCase();
      return title.includes(query) || cat.includes(query) || branch.includes(query);
    });

    result = [...result].sort((a: any, b: any) => {
      if (jobSortKey === "new_cvs") {
        return (b.stats?.newApps || 0) - (a.stats?.newApps || 0);
      }
      if (jobSortKey === "most_viewed") {
        return (b.viewCount || 0) - (a.viewCount || 0);
      }
      if (jobSortKey === "most_applications") {
        return (b.stats?.total || 0) - (a.stats?.total || 0);
      }
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return result;
  }, [jobsWithStats, jobSearchQuery, jobSortKey]);

  const paginatedJobs = useMemo(() => {
    const start = (jobCurrentPage - 1) * 6;
    return filteredAndSortedJobs.slice(start, start + 6);
  }, [filteredAndSortedJobs, jobCurrentPage]);

  const renderJobCampaigns = () => {
    return (
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
            style={{ width: 320, borderRadius: 8 }}
            value={jobSearchQuery}
            onChange={(e) => {
              setJobSearchQuery(e.target.value);
              setJobCurrentPage(1);
            }}
            allowClear
            prefix={<SearchOutlined style={{ color: "#BFBFBF" }} />}
          />
          <Space wrap>
            {jobSearchQuery && (
              <Button
                icon={<RotateLeftOutlined />}
                onClick={() => {
                  setJobSearchQuery("");
                  setJobSortKey("newest");
                  setJobCurrentPage(1);
                }}
                style={{ borderRadius: 8 }}
              >
                Xóa lọc
              </Button>
            )}
            <span style={{ color: "#64748B", fontSize: 13 }}>Sắp xếp theo:</span>
            <Select
              style={{ width: 220 }}
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
        {paginatedJobs.length > 0 ? (
          <Row gutter={[20, 20]} style={{ marginTop: 8 }}>
            {paginatedJobs.map((job: any) => {
              const stats = job.stats;
              return (
                <Col xs={24} md={12} xl={8} key={job.id}>
                  <Card
                    hoverable
                    style={{
                      borderRadius: 16,
                      border: "1px solid #E2E8F0",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                      background: "#FFFFFF",
                    }}
                    bodyStyle={{ padding: 24 }}
                    onClick={() => {
                      setSelectedJobId(job.id);
                      navigate(`/recruiter/applications?jobId=${job.id}`, { replace: true });
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div>
                        <Title level={4} style={{ margin: 0, fontSize: 18, color: "#0F172A" }}>
                          {job.position?.name || "Chưa cập nhật"}
                        </Title>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          {job.category?.name || "Lĩnh vực khác"} | {job.branch?.name || "Chưa cập nhật"}
                        </Text>
                      </div>
                      <Tag color={job.isApproved ? "success" : "gold"} style={{ borderRadius: 6 }}>
                        {job.isApproved ? "Đang chạy" : "Chờ duyệt"}
                      </Tag>
                    </div>

                    <Divider style={{ margin: "16px 0" }} />

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
                        <Text type="secondary" style={{ fontSize: 11, display: "block" }}>Tổng CV</Text>
                        <Text strong style={{ fontSize: 16, color: "#0F172A" }}>{stats.total}</Text>
                      </div>
                      <div>
                        <Text type="secondary" style={{ fontSize: 11, display: "block" }}>Mới nộp</Text>
                        <Text strong style={{ fontSize: 16, color: "#2563EB" }}>{stats.newApps}</Text>
                      </div>
                      <div>
                        <Text type="secondary" style={{ fontSize: 11, display: "block" }}>Phỏng vấn</Text>
                        <Text strong style={{ fontSize: 16, color: "#7C3AED" }}>{stats.interviewing}</Text>
                      </div>
                      <div>
                        <Text type="secondary" style={{ fontSize: 11, display: "block" }}>Đã tuyển</Text>
                        <Text strong style={{ fontSize: 16, color: "#10B981" }}>{stats.hired}</Text>
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
                        setSelectedJobId(job.id);
                        navigate(`/recruiter/applications?jobId=${job.id}`, { replace: true });
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
          <Card style={{ textAlign: "center", padding: "48px 0", borderRadius: 16, border: "1px solid #E2E8F0", marginTop: 12 }}>
            <Text type="secondary">Không tìm thấy chiến dịch tuyển dụng nào khớp với điều kiện lọc.</Text>
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
    );
  };

  return (
    <PageContainer
      title={selectedJobId ? "Quản lý Ứng viên" : "Quản lý Hồ sơ Ứng tuyển"}
    >
      {selectedJobId === null ? (
        renderJobCampaigns()
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => {
                setSelectedJobId(null);
                setSelectedRowKeys([]);
                setSelectedApplicationIds([]);
                setSelectionMode(false);
                navigate("/recruiter/applications", { replace: true });
              }}
              style={{ borderRadius: 8 }}
            >
              Quay lại danh sách chiến dịch
            </Button>
          </div>

          {/* Job Context Summary Card */}
          {(() => {
            const currentJob = jobs.find((j) => j.id === selectedJobId);
            if (!currentJob) return null;

            const deadlineDate = currentJob.deadline ? new Date(currentJob.deadline) : null;
            const isExpired = deadlineDate ? deadlineDate < new Date() : false;
            const formatDate = (d: string | null | undefined) => {
              if (!d) return "Không giới hạn";
              return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
            };

            return (
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
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <Title level={5} style={{ margin: 0, color: "#0F172A", fontSize: 16 }}>
                        Chiến dịch: {currentJob.position?.name}
                      </Title>
                      {currentJob.status === "Published" ? (
                        <Tag color="success" style={{ borderRadius: 6 }}>Đang tuyển</Tag>
                      ) : (
                        <Tag color="warning" style={{ borderRadius: 6 }}>Chờ duyệt</Tag>
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
                        <Text strong style={{ fontSize: 12, color: "#0F172A" }}>Yêu cầu: </Text>
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
            );
          })()}

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
              renderKanbanBoard()
            )}
          </Card>
        </>
      )}

      {/* Drawer hiển thị chi tiết chấm điểm của AI */}
      <Drawer
        title={
          <span style={{ display: "inline-flex", alignItems: "center" }}>
            <AiCoreIcon size={20} style={{ marginRight: 8 }} /> Báo cáo Phân tích từ AI
          </span>
        }
        placement="right"
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        extra={
          <Button
            type="primary"
            icon={<FilePdfOutlined />}
            href={selectedApp?.cvUrl ? selectedApp.cvUrl.replace(/https?:\/\/localhost:(7006|5286)/gi, "https://recruitinsightai.com") : "#"}
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
                <div
                  style={{
                    padding: 16,
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderLeft: "4px solid #2563EB",
                    borderRadius: 8,
                    marginBottom: 24,
                  }}
                >
                  <Text strong style={{ display: "block", marginBottom: 6, color: "#1E293B" }}>
                    🤖 Trí tuệ nhân tạo (AI) nhận xét tổng quan:
                  </Text>
                  <Paragraph style={{ color: "#475569", margin: 0, fontSize: 13, lineHeight: 1.6 }}>
                    {summaryText}
                  </Paragraph>
                </div>
              );
            })()}

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={12}>
                <div
                  style={{
                    padding: 16,
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderLeft: "4px solid #10B981",
                    borderRadius: 8,
                    height: "100%",
                  }}
                >
                  <Space style={{ display: "flex", marginBottom: 8 }}>
                    <SkillMatchedIcon size={14} />
                    <Text strong style={{ color: "#0F172A" }}>
                      Kỹ năng đáp ứng được (CV có):
                    </Text>
                  </Space>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {safeParseSkills(selectedApp.matchedSkills).length > 0 ? (
                      safeParseSkills(selectedApp.matchedSkills).map((skill: string) => (
                        <Tag color="green" key={skill} style={{ margin: 0 }}>
                          {skill}
                        </Tag>
                      ))
                    ) : (
                      <Text type="secondary">Không có</Text>
                    )}
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div
                  style={{
                    padding: 16,
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderLeft: "4px solid #EF4444",
                    borderRadius: 8,
                    height: "100%",
                  }}
                >
                  <Text strong style={{ display: "block", marginBottom: 8, color: "#0F172A" }}>
                    ❌ Kỹ năng còn thiếu (JD yêu cầu):
                  </Text>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {safeParseSkills(selectedApp.missingSkills).length > 0 ? (
                      safeParseSkills(selectedApp.missingSkills).map((skill: string) => (
                        <Tag color="red" key={skill} style={{ margin: 0 }}>
                          {skill}
                        </Tag>
                      ))
                    ) : (
                      <Text type="secondary">Không thiếu kỹ năng nào</Text>
                    )}
                  </div>
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

      <Modal
        title={scheduleTargetApplication?.status === "Interview" ? "Chỉnh sửa lịch phỏng vấn & Gửi Email" : "Lập lịch phỏng vấn & Gửi Email"}
        open={scheduleModalOpen}
        onCancel={() => {
          setScheduleModalOpen(false);
        }}
        footer={null}
        destroyOnClose
        width={720}
      >
        {(() => {
          // Hook up loading of existing schedule
          // We can run an effect to prefill the fields
          useEffect(() => {
            if (scheduleModalOpen && scheduleTargetApplication && scheduleTargetApplication.status === "Interview") {
              const loadExistingSchedule = async () => {
                try {
                  const scheduleData = await recruitmentService.getInterviewSchedule(scheduleTargetApplication.id);
                  if (scheduleData) {
                    form.setFieldsValue({
                      interviewDate: scheduleData.interviewDate ? dayjs(scheduleData.interviewDate) : null,
                      format: scheduleData.format || "Online",
                      locationOrLink: scheduleData.locationOrLink || "",
                      meetingId: scheduleData.meetingId || "",
                      passcode: scheduleData.passcode || "",
                      notes: scheduleData.notes || "",
                    });
                  }
                } catch (error) {
                  console.error("Lỗi khi tải lịch phỏng vấn cũ:", error);
                }
              };
              loadExistingSchedule();
            } else {
              form.resetFields();
            }
          }, [scheduleModalOpen, scheduleTargetApplication]);

          return (
            <Form
              form={form}
              layout="vertical"
              onFinish={handleConfirmSchedule}
              initialValues={{
                format: "Online",
              }}
            >
              <div style={{ marginBottom: 16 }}>
                <Text strong>Ứng viên: </Text>
                <Text>{scheduleTargetApplication?.candidateName}</Text>
              </div>
              <div style={{ marginBottom: 16 }}>
                <Text strong>Vị trí ứng tuyển: </Text>
                <Text>{scheduleTargetApplication?.jobTitle}</Text>
              </div>

              <Form.Item
                label="Thời gian phỏng vấn"
                name="interviewDate"
                rules={[{ required: true, message: "Vui lòng chọn thời gian phỏng vấn!" }]}
              >
                <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item
                label="Hình thức phỏng vấn"
                name="format"
                rules={[{ required: true, message: "Vui lòng chọn hình thức!" }]}
              >
                <Select
                  options={[
                    { value: "Online", label: "Trực tuyến (Google Meet/Zoom)" },
                    { value: "Offline", label: "Trực tiếp tại văn phòng" },
                  ]}
                />
              </Form.Item>

              <Form.Item
                label="Địa điểm hoặc Đường dẫn phòng họp"
                name="locationOrLink"
                rules={[{ required: true, message: "Vui lòng nhập địa điểm hoặc link cuộc họp!" }]}
              >
                <Input placeholder="Nhập địa chỉ văn phòng hoặc link Zoom/Meet..." />
              </Form.Item>

              <Form.Item label="Meeting ID (nếu có)" name="meetingId">
                <Input placeholder="Nhập Meeting ID..." />
              </Form.Item>

              <Form.Item label="Mật khẩu phòng họp (nếu có)" name="passcode">
                <Input placeholder="Nhập mật khẩu..." />
              </Form.Item>

              <Form.Item label="Ghi chú dặn dò ứng viên" name="notes">
                <Input.TextArea rows={3} placeholder="Nhập các dặn dò như chuẩn bị laptop, trang phục..." />
              </Form.Item>

              <Alert
                type="info"
                showIcon
                message="Hệ thống sẽ tự động dùng AI soạn thư mời phỏng vấn chứa thông tin cuộc hẹn và gửi trực tiếp tới email ứng viên."
                style={{ marginBottom: 20 }}
              />

              <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
                <Space>
                  <Button onClick={() => setScheduleModalOpen(false)}>Hủy</Button>
                  <Button type="primary" htmlType="submit" loading={scheduleSubmitting} style={{ backgroundColor: "#2563EB" }}>
                    Xác nhận & Gửi Email
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          );
        })()}
      </Modal>

      {/* compareModalOpen has been replaced by CandidateComparisonPage */}
    </PageContainer>
  );
}
