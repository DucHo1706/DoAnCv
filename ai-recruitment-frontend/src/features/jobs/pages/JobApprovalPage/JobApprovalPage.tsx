import {
  StatusPendingIcon,
  StatusRunningIcon,
  StatusClosedIcon,
} from "../../../../components/common/AppIcons";
import { AppstoreOutlined, CalendarOutlined, CheckCircleOutlined, CheckOutlined, CloseOutlined, DollarOutlined, EyeOutlined, FileTextOutlined, FireOutlined, LockOutlined, SearchOutlined, StopOutlined, UnlockOutlined, UnorderedListOutlined, UserOutlined, DownloadOutlined, FlagOutlined, ClockCircleFilled, CheckCircleFilled, CloseCircleFilled, LockFilled } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  message,
  Modal,
  Row,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
  Input,
  Select,
  Segmented,
  Tooltip,
  Badge,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import PageContainer from "../../../../components/common/PageContainer";
import AppPagination from "../../../../components/common/AppPagination";
import { jobService, categoryService } from "../../services/jobService";
import type { JobDto, JobReviewResponse } from "../../services/jobService";
import { EnvironmentOutlined } from "@ant-design/icons";
import { exportToCsv } from "../../../../utils/exportUtils";

const { Paragraph, Text, Title } = Typography;

type PendingJobTableItem = {
  id: string;
  title: string;
  location: string;
  salaryRange: string;
  createdAt: string;
  deadline?: string | null;
  recruiterName: string;
  recruiterEmail: string;
  raw: JobDto;
};

function formatDate(value?: string | null) {
  if (!value) return "Chưa cập nhật";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("vi-VN");
}

function JobApprovalPage() {
  const [loading, setLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // View Mode: 'table' | 'grid'
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Grid & Table Pagination States
  const [gridPage, setGridPage] = useState(1);
  const [gridPageSize, setGridPageSize] = useState(9);

  // Search & filter states
  const [searchText, setSearchText] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [jobDetail, setJobDetail] = useState<JobReviewResponse | null>(null);

  // Reject modal state
  const [rejectTarget, setRejectTarget] = useState<PendingJobTableItem | null>(null);
  const [rejectReasonText, setRejectReasonText] = useState("");
  const [rejecting, setRejecting] = useState(false);

  // Bulk approve state
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [bulkApproving, setBulkApproving] = useState(false);

  const fetchAdminJobs = async () => {
    try {
      setLoading(true);
      const data: any = await jobService.getAdminJobs();
      setJobs(Array.isArray(data) ? data : data?.$values || []);
    } catch (error) {
      console.error(error);
      message.error("Không tải được danh sách tin tuyển dụng");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(Array.isArray(data) ? data : (data as any)?.$values || []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách lĩnh vực: ", error);
    }
  };

  useEffect(() => {
    fetchAdminJobs();
    fetchCategories();
  }, []);

  // Multi-filter states
  const [selectedRecruiterEmail, setSelectedRecruiterEmail] = useState<string>("all");
  const [selectedBranchName, setSelectedBranchName] = useState<string>("all");

  // Extract unique recruiters & branches from jobs
  const uniqueRecruiters = useMemo(() => {
    const map = new Map<string, string>();
    jobs.forEach((j) => {
      if (j.recruiter?.name) {
        map.set(j.recruiter.email || j.recruiter.name, j.recruiter.name);
      }
    });
    return Array.from(map.entries()).map(([email, name]) => ({ email, name }));
  }, [jobs]);

  const uniqueBranches = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((j) => {
      if (j.branch?.name) set.add(j.branch.name);
    });
    return Array.from(set);
  }, [jobs]);

  // Set default status to Pending if pending jobs exist
  useEffect(() => {
    if (jobs.length > 0) {
      const hasPending = jobs.some((j) => j.status === "Pending");
      if (hasPending && selectedStatus === "all") {
        setSelectedStatus("Pending");
      }
    }
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const searchKey = searchText.trim().toLowerCase();
      const titleMatch = (job.position?.name || "").toLowerCase().includes(searchKey);
      const recruiterMatch = (job.recruiter?.name || "").toLowerCase().includes(searchKey) ||
        (job.recruiter?.email || "").toLowerCase().includes(searchKey);
      const branchMatch = (job.branch?.name || "").toLowerCase().includes(searchKey);
      const matchesSearch = searchKey.length === 0 || titleMatch || recruiterMatch || branchMatch;

      const matchesCategory =
        selectedCategoryId === "all" ||
        (job.position as any)?.categoryId === selectedCategoryId ||
        job.category?.id === selectedCategoryId;

      const matchesStatus =
        selectedStatus === "all" ||
        job.status === selectedStatus;

      const matchesRecruiter =
        selectedRecruiterEmail === "all" ||
        job.recruiter?.email === selectedRecruiterEmail ||
        job.recruiter?.name === selectedRecruiterEmail;

      const matchesBranch =
        selectedBranchName === "all" ||
        job.branch?.name === selectedBranchName;

      return matchesSearch && matchesCategory && matchesStatus && matchesRecruiter && matchesBranch;
    });
  }, [jobs, searchText, selectedCategoryId, selectedStatus, selectedRecruiterEmail, selectedBranchName]);

  const tableData: PendingJobTableItem[] = useMemo(() => {
    return filteredJobs.map((job) => ({
      id: job.id,
      title: job.position?.name || "Chưa cập nhật",
      location: job.branch?.name || "Chưa cập nhật",
      salaryRange: job.salaryRange || "Chưa cập nhật",
      createdAt: job.createdAt,
      deadline: job.deadline,
      recruiterName: job.recruiter?.name || "HR Mặc định",
      recruiterEmail: job.recruiter?.email || "hr@system.com",
      raw: job,
    }));
  }, [filteredJobs]);

  // Paginated data for Grid View
  const paginatedGridData = useMemo(() => {
    const startIndex = (gridPage - 1) * gridPageSize;
    return tableData.slice(startIndex, startIndex + gridPageSize);
  }, [tableData, gridPage, gridPageSize]);

  // Reset grid page on filter change
  useEffect(() => {
    setGridPage(1);
  }, [searchText, selectedCategoryId, selectedStatus, selectedRecruiterEmail, selectedBranchName]);

  // Bỏ chọn những dòng không còn hiển thị sau khi filter/reload thay đổi
  useEffect(() => {
    const validIds = new Set(tableData.filter((j) => j.raw.status === "Pending").map((j) => j.id));
    setSelectedRowKeys((prev) => prev.filter((key) => validIds.has(String(key))));
  }, [tableData]);

  const handleViewJob = async (record: PendingJobTableItem) => {
    try {
      setDetailOpen(true);
      setDetailLoading(true);
      const data = await jobService.getJobReview(record.id);
      setJobDetail(data);
    } catch (error) {
      console.error(error);
      message.error("Không tải được chi tiết tin tuyển dụng");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleApproveJob = async (record: PendingJobTableItem) => {
    if (approvingId) return;
    setApprovingId(record.id);

    try {
      const response = await jobService.approveJob(record.id);
      message.success(response?.message || "Duyệt tin tuyển dụng thành công");
      fetchAdminJobs();
      if (jobDetail?.jobInfo.id === record.id) {
        setDetailOpen(false);
        setJobDetail(null);
      }
    } catch (error: any) {
      console.error("Approve error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        "Duyệt tin tuyển dụng thất bại";

      message.error(errorMessage);
    } finally {
      setApprovingId(null);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await jobService.toggleJobStatus(id);
      message.success("Cập nhật trạng thái thành công");
      fetchAdminJobs();
      if (jobDetail?.jobInfo.id === id) {
        setDetailOpen(false);
        setJobDetail(null);
      }
    } catch (error: any) {
      message.error("Lỗi khi thay đổi trạng thái!");
    }
  };

  const handleOpenReject = (record: PendingJobTableItem) => {
    setRejectTarget(record);
    setRejectReasonText("");
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReasonText.trim()) {
      message.warning("Vui lòng nhập lý do từ chối tin tuyển dụng.");
      return;
    }

    setRejecting(true);
    try {
      const response = await jobService.rejectJob(rejectTarget.id, rejectReasonText.trim());
      message.success(response?.message || "Đã từ chối tin tuyển dụng");
      setRejectTarget(null);
      setRejectReasonText("");
      fetchAdminJobs();
      if (jobDetail?.jobInfo.id === rejectTarget.id) {
        setDetailOpen(false);
        setJobDetail(null);
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Từ chối tin tuyển dụng thất bại";
      message.error(errorMessage);
    } finally {
      setRejecting(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedRowKeys.length === 0 || bulkApproving) return;
    setBulkApproving(true);
    try {
      const ids = selectedRowKeys.map((k) => String(k));
      const response = await jobService.bulkApproveJobs(ids);
      message.success(response?.message || `Đã duyệt ${ids.length} tin tuyển dụng`);
      setSelectedRowKeys([]);
      fetchAdminJobs();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Duyệt hàng loạt thất bại";
      message.error(errorMessage);
    } finally {
      setBulkApproving(false);
    }
  };

  // Moderation flag modal state
  const [flagTarget, setFlagTarget] = useState<PendingJobTableItem | null>(null);
  const [flagReasonText, setFlagReasonText] = useState("");
  const [flagging, setFlagging] = useState(false);

  const handleOpenFlag = (record: PendingJobTableItem) => {
    setFlagTarget(record);
    setFlagReasonText("");
  };

  const handleConfirmFlag = async () => {
    if (!flagTarget) return;
    if (!flagReasonText.trim()) {
      message.warning("Vui lòng nhập lý do cảnh báo kiểm duyệt.");
      return;
    }
    setFlagging(true);
    try {
      const res = await jobService.flagJob(flagTarget.id, flagReasonText.trim());
      message.success(res?.message || "Đã gắn cờ kiểm duyệt tin tuyển dụng");
      setFlagTarget(null);
      fetchAdminJobs();
    } catch (err: any) {
      message.error(err?.response?.data?.message || err?.message || "Lỗi khi gắn cờ vi phạm");
    } finally {
      setFlagging(false);
    }
  };

  const handleUnflag = async (record: PendingJobTableItem) => {
    try {
      const res = await jobService.unflagJob(record.id);
      message.success(res?.message || "Đã gỡ cờ vi phạm tin tuyển dụng");
      fetchAdminJobs();
    } catch (err: any) {
      message.error(err?.response?.data?.message || err?.message || "Lỗi khi gỡ cờ vi phạm");
    }
  };

  const handleExportJobsCsv = () => {
    const headers = [
      "ID Tin",
      "Vị trí tuyển dụng",
      "Chi nhánh",
      "Mức lương",
      "Chuyên viên HR",
      "Email HR",
      "Trạng thái",
      "Ngày tạo",
      "Hạn nộp",
    ];

    const rows = filteredJobs.map((j) => [
      j.id,
      j.position?.name || "Chưa cập nhật",
      j.branch?.name || "Chưa cập nhật",
      j.salaryRange || "Chưa cập nhật",
      j.recruiter?.name || "HR",
      j.recruiter?.email || "N/A",
      j.status === "Published"
        ? "Đang chạy"
        : j.status === "Pending"
        ? "Chờ duyệt"
        : j.status === "Rejected"
        ? "Từ chối"
        : j.status === "Flagged"
        ? "Vi phạm / Cảnh báo"
        : "Đã đóng",
      formatDate(j.createdAt),
      formatDate(j.deadline),
    ]);

    exportToCsv("Danh_Sach_Tin_Tuyen_Dung", headers, rows);
    message.success("Đã xuất danh sách tin tuyển dụng ra Excel (CSV) thành công!");
  };

  const totalJobsCount = jobs.length;
  const pendingJobsCount = jobs.filter((j) => j.status === "Pending").length;
  const publishedJobsCount = jobs.filter((j) => j.status === "Published").length;
  const rejectedJobsCount = jobs.filter((j) => j.status === "Rejected").length;
  const closedJobsCount = jobs.filter((j) => j.status === "Closed" || j.status === "Locked").length;

  const columns = [
    {
      title: "Vị trí tuyển dụng",
      dataIndex: "title",
      key: "title",
      width: 280,
      render: (text: string) => (
        <div style={{ wordBreak: "break-word", fontWeight: 700, color: "#0F172A", fontSize: 14 }}>
          {text}
        </div>
      ),
    },
    {
      title: "HR Đăng tuyển",
      key: "recruiter",
      width: 230,
      render: (_: any, record: PendingJobTableItem) => (
        <Space direction="vertical" size={0}>
          <Space size={6}>
            <UserOutlined style={{ color: "#2563EB" }} />
            <Text strong style={{ fontSize: 13, color: "#1E293B" }}>{record.recruiterName}</Text>
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.recruiterEmail}</Text>
        </Space>
      ),
    },
    {
      title: "Chi nhánh",
      dataIndex: "location",
      key: "location",
      width: 140,
      render: (text: string) => (
        <Space size={4}>
          <EnvironmentOutlined style={{ color: "#64748B" }} />
          <Text style={{ color: "#334155" }}>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Mức lương",
      dataIndex: "salaryRange",
      key: "salaryRange",
      width: 160,
      render: (text: string) => (
        <Tag color="blue" style={{ borderRadius: 6, padding: "2px 8px", fontWeight: 600 }}>
          {text}
        </Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 130,
      render: (value: string) => formatDate(value),
    },
    {
      title: "Hạn nộp",
      dataIndex: "deadline",
      key: "deadline",
      width: 130,
      render: (value?: string | null) => formatDate(value),
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 150,
      render: (_: any, record: PendingJobTableItem) => {
        const st = record.raw.status;
        if (st === "Published") {
          return (
            <Tag color="success" style={{ borderRadius: 6, fontWeight: 700, padding: "3px 10px" }}>
              Đang chạy
            </Tag>
          );
        }
        if (st === "Closed" || st === "Locked") {
          return (
            <Tag color="default" style={{ borderRadius: 6, fontWeight: 600, padding: "3px 10px", color: "#64748B" }}>
              Đã đóng
            </Tag>
          );
        }
        if (st === "Rejected") {
          return (
            <Tooltip title={record.raw.rejectReason || "Không có lý do cụ thể"}>
              <Tag color="error" style={{ borderRadius: 6, fontWeight: 700, padding: "3px 10px", cursor: "help" }}>
                Đã từ chối
              </Tag>
            </Tooltip>
          );
        }
        return (
          <Tag color="warning" style={{ borderRadius: 6, fontWeight: 800, padding: "3px 10px", backgroundColor: "#FFF7ED", borderColor: "#FFEDD5", color: "#C2410C" }}>
            Chờ duyệt
          </Tag>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 280,
      fixed: "right" as const,
      render: (_: unknown, record: PendingJobTableItem) => (
        <Space size="small">
          <Button icon={<EyeOutlined />} onClick={() => handleViewJob(record)} size="middle">
            Xem
          </Button>
          {record.raw.status === "Pending" && (
            <>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                loading={approvingId === record.id}
                disabled={approvingId !== null}
                onClick={() => handleApproveJob(record)}
                style={{ background: "#F97316", borderColor: "#F97316", fontWeight: 700 }}
                size="middle"
              >
                Duyệt
              </Button>
              <Button
                danger
                icon={<CloseOutlined />}
                disabled={approvingId !== null}
                onClick={() => handleOpenReject(record)}
                size="middle"
              >
                Từ chối
              </Button>
            </>
          )}
          {(record.raw.status === "Published" || record.raw.status === "Closed") && (
            <Popconfirm
              title={
                record.raw.status === "Published"
                  ? "Bạn có chắc muốn tạm ẩn tin này?"
                  : "Mở hiển thị lại tin này?"
              }
              onConfirm={() => handleToggleStatus(record.id)}
              okText="Đồng ý"
              cancelText="Hủy"
            >
              <Button
                icon={record.raw.status === "Published" ? <LockOutlined /> : <UnlockOutlined />}
                danger={record.raw.status === "Published"}
                size="middle"
              >
                {record.raw.status === "Published" ? "Tạm ẩn" : "Mở"}
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title="Quản lý & Duyệt Tin tuyển dụng"
    >
      {/* Stat Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              background: "#FFFFFF",
              border: "1px solid rgba(226, 232, 240, 0.8)",
              boxShadow: "0 4px 20px rgba(148, 163, 184, 0.06)",
            }}
            bodyStyle={{ padding: 20 }}
          >
            <Space direction="vertical" size={2} style={{ width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>TỔNG TIN TRONG DB</Text>
                <FileTextOutlined style={{ fontSize: 22, color: "#2563EB" }} />
              </div>
              <Title level={2} style={{ margin: 0, fontWeight: 800, color: "#0F172A" }}>{totalJobsCount}</Title>
              <Text type="secondary" style={{ fontSize: 12 }}>Toàn bộ tin trên CSDL</Text>
            </Space>
          </Card>
        </Col>

        {/* 10% Accent Orange Card */}
        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              background: "#FFF7ED",
              border: "1.5px solid #FFEDD5",
              boxShadow: "0 4px 20px rgba(249, 115, 22, 0.08)",
            }}
            bodyStyle={{ padding: 20 }}
          >
            <Space direction="vertical" size={2} style={{ width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: 13, fontWeight: 700, color: "#C2410C" }}>TIN CHỜ DUYỆT</Text>
                <FireOutlined style={{ fontSize: 22, color: "#F97316" }} />
              </div>
              <Title level={2} style={{ margin: 0, fontWeight: 800, color: "#EA580C" }}>{pendingJobsCount}</Title>
              <Text style={{ fontSize: 12, color: "#9A3412", fontWeight: 500 }}>Yêu cầu cần Admin xử lý ngay</Text>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              background: "#FFFFFF",
              border: "1px solid rgba(226, 232, 240, 0.8)",
              boxShadow: "0 4px 20px rgba(148, 163, 184, 0.06)",
            }}
            bodyStyle={{ padding: 20 }}
          >
            <Space direction="vertical" size={2} style={{ width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>ĐANG CHẠY</Text>
                <CheckCircleOutlined style={{ fontSize: 22, color: "#10B981" }} />
              </div>
              <Title level={2} style={{ margin: 0, fontWeight: 800, color: "#0F172A" }}>{publishedJobsCount}</Title>
              <Text type="secondary" style={{ fontSize: 12 }}>Đang công khai tuyển dụng</Text>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              background: "#FFFFFF",
              border: "1px solid rgba(226, 232, 240, 0.8)",
              boxShadow: "0 4px 20px rgba(148, 163, 184, 0.06)",
            }}
            bodyStyle={{ padding: 20 }}
          >
            <Space direction="vertical" size={2} style={{ width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>ĐÃ KHÓA / TẠM ẨN</Text>
                <StopOutlined style={{ fontSize: 22, color: "#94A3B8" }} />
              </div>
              <Title level={2} style={{ margin: 0, fontWeight: 800, color: "#475569" }}>{closedJobsCount}</Title>
              <Text type="secondary" style={{ fontSize: 12 }}>Tin ngưng nhận hồ sơ</Text>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Filter & View Switcher Bar */}
      <Card style={{ marginBottom: 20, borderRadius: 16, border: "1px solid rgba(226, 232, 240, 0.8)" }} bodyStyle={{ padding: "18px 24px" }}>
        {/* Hàng 1: Status Queue Segmented Control */}
        <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <Space size={8} align="center">
            <Text strong style={{ fontSize: 13, color: "#64748B" }}>Hàng chờ duyệt:</Text>
            <Segmented
              value={selectedStatus}
              onChange={(value) => setSelectedStatus(value as string)}
              options={[
                { label: `Tất cả (${totalJobsCount})`, value: "all" },
                {
                  label: (
                    <Space size={6}>
                      <ClockCircleFilled style={{ color: "#F97316" }} />
                      <span style={{ fontWeight: 700, color: selectedStatus === "Pending" ? "#EA580C" : undefined }}>Chờ duyệt</span>
                      {pendingJobsCount > 0 && (
                        <Badge
                          count={pendingJobsCount}
                          overflowCount={99}
                          style={{ backgroundColor: "#F97316", boxShadow: "none", fontWeight: 700 }}
                        />
                      )}
                    </Space>
                  ),
                  value: "Pending",
                },
                {
                  label: (
                    <Space size={6}>
                      <CheckCircleFilled style={{ color: "#10B981" }} />
                      <span>Đang chạy ({publishedJobsCount})</span>
                    </Space>
                  ),
                  value: "Published",
                },
                {
                  label: (
                    <Space size={6}>
                      <CloseCircleFilled style={{ color: "#EF4444" }} />
                      <span>Bị từ chối ({rejectedJobsCount})</span>
                    </Space>
                  ),
                  value: "Rejected",
                },
                {
                  label: (
                    <Space size={6}>
                      <LockFilled style={{ color: "#64748B" }} />
                      <span>Đã đóng ({closedJobsCount})</span>
                    </Space>
                  ),
                  value: "Closed",
                },
              ]}
              style={{ fontWeight: 600 }}
            />
          </Space>

          <Space size={12}>
            <Button icon={<DownloadOutlined />} onClick={handleExportJobsCsv}>
              Xuất Excel
            </Button>
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Chế độ xem:</Text>
            <Segmented
              value={viewMode}
              onChange={(value) => setViewMode(value as "table" | "grid")}
              options={[
                { label: "Bảng (Table)", value: "table", icon: <UnorderedListOutlined /> },
                { label: "Thẻ (Grid)", value: "grid", icon: <AppstoreOutlined /> },
              ]}
            />
          </Space>
        </div>

        <Divider style={{ margin: "12px 0 16px" }} />

        {/* Hàng 2: Multi-filter inputs */}
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={7} lg={7}>
            <Input
              placeholder="Tìm theo vị trí, HR đăng, email..."
              prefix={<SearchOutlined style={{ color: "#94A3B8" }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{ borderRadius: 8 }}
            />
          </Col>

          <Col xs={24} sm={12} md={6} lg={6}>
            <Select
              style={{ width: "100%" }}
              placeholder="Lọc theo Chuyên viên HR"
              value={selectedRecruiterEmail}
              onChange={(value) => setSelectedRecruiterEmail(value)}
              options={[
                { value: "all", label: "Tất cả HR" },
                ...uniqueRecruiters.map((r) => ({
                  value: r.email,
                  label: `${r.name} (${r.email})`,
                })),
              ]}
              dropdownStyle={{ borderRadius: 8 }}
            />
          </Col>

          <Col xs={24} sm={12} md={5} lg={5}>
            <Select
              style={{ width: "100%" }}
              placeholder="Chi nhánh"
              value={selectedBranchName}
              onChange={(value) => setSelectedBranchName(value)}
              options={[
                { value: "all", label: "Tất cả chi nhánh" },
                ...uniqueBranches.map((b) => ({ value: b, label: b })),
              ]}
              dropdownStyle={{ borderRadius: 8 }}
            />
          </Col>

          <Col xs={24} sm={12} md={6} lg={6}>
            <Select
              style={{ width: "100%" }}
              placeholder="Lĩnh vực ngành nghề"
              value={selectedCategoryId}
              onChange={(value) => setSelectedCategoryId(value)}
              options={[
                { value: "all", label: "Tất cả lĩnh vực" },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
              dropdownStyle={{ borderRadius: 8 }}
            />
          </Col>
        </Row>
      </Card>

      {/* Bulk Action Bar - chỉ hiện khi có dòng được chọn */}
      {selectedRowKeys.length > 0 && (
        <Card
          style={{
            marginBottom: 16,
            borderRadius: 12,
            border: "1px solid #BFDBFE",
            background: "#EFF6FF",
          }}
          bodyStyle={{ padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}
        >
          <Text strong style={{ color: "#1D4ED8" }}>
            Đã chọn {selectedRowKeys.length} tin tuyển dụng chờ duyệt
          </Text>
          <Space>
            <Button onClick={() => setSelectedRowKeys([])}>Bỏ chọn</Button>
            <Popconfirm
              title={`Duyệt ${selectedRowKeys.length} tin tuyển dụng đã chọn?`}
              description="Các tin này sẽ được hiển thị công khai ngay lập tức."
              onConfirm={handleBulkApprove}
              okText="Duyệt tất cả"
              cancelText="Hủy"
            >
              <Button
                type="primary"
                icon={<CheckOutlined />}
                loading={bulkApproving}
                style={{ background: "#F97316", borderColor: "#F97316", fontWeight: 700 }}
              >
                Duyệt {selectedRowKeys.length} tin đã chọn
              </Button>
            </Popconfirm>
          </Space>
        </Card>
      )}

      {/* Main Content Render: Table View or Bento Grid View */}
      {viewMode === "table" ? (
        <Card bodyStyle={{ padding: 0 }} style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(226, 232, 240, 0.8)" }}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={tableData}
            loading={loading}
            scroll={{ x: 1100 }}
            pagination={{ pageSize: 8, showSizeChanger: true, pageSizeOptions: ["8", "16", "32"] }}
            rowSelection={{
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys),
              getCheckboxProps: (record: PendingJobTableItem) => ({
                disabled: record.raw.status !== "Pending",
              }),
            }}
          />
        </Card>
      ) : (
        <div>
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>Đang tải dữ liệu...</div>
          ) : tableData.length === 0 ? (
            <Card style={{ borderRadius: 16, textAlign: "center", padding: "60px 0" }}>
              <Text type="secondary">Không tìm thấy tin tuyển dụng nào phù hợp.</Text>
            </Card>
          ) : (
            <>
              <Row gutter={[20, 20]}>
                {paginatedGridData.map((item) => (
                  <Col xs={24} sm={12} lg={8} key={item.id}>
                    <Card
                      hoverable
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
                      bodyStyle={{ padding: 22 }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                          <Title level={5} style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0F172A", maxWidth: "75%" }}>
                            {item.title}
                          </Title>
                          {item.raw.status === "Published" ? (
                            <Tag color="success" style={{ borderRadius: 6, fontWeight: 700 }}>Đang chạy</Tag>
                          ) : item.raw.status === "Closed" ? (
                            <Tag color="default" style={{ borderRadius: 6 }}>Đã đóng</Tag>
                          ) : item.raw.status === "Rejected" ? (
                            <Tooltip title={item.raw.rejectReason || "Không có lý do cụ thể"}>
                              <Tag color="error" style={{ borderRadius: 6, fontWeight: 700, cursor: "help" }}>Đã từ chối</Tag>
                            </Tooltip>
                          ) : (
                            <Tag color="warning" style={{ borderRadius: 6, fontWeight: 800, backgroundColor: "#FFF7ED", color: "#C2410C" }}>Chờ duyệt</Tag>
                          )}
                        </div>

                        <div style={{ marginBottom: 14 }}>
                          <Space size={6} style={{ marginBottom: 4, display: "flex" }}>
                            <UserOutlined style={{ color: "#2563EB" }} />
                            <Text strong style={{ fontSize: 13, color: "#334155" }}>{item.recruiterName}</Text>
                          </Space>
                          <Text type="secondary" style={{ fontSize: 12, display: "block" }}>{item.recruiterEmail}</Text>
                        </div>

                        <Space direction="vertical" size={6} style={{ width: "100%", marginBottom: 14, fontSize: 13 }}>
                          <Space>
                            <EnvironmentOutlined style={{ color: "#64748B" }} />
                            <Text type="secondary">{item.location}</Text>
                          </Space>
                          <Space>
                            <DollarOutlined style={{ color: "#16A34A" }} />
                            <Text strong style={{ color: "#16A34A" }}>{item.salaryRange}</Text>
                          </Space>
                          <Space>
                            <CalendarOutlined style={{ color: "#64748B" }} />
                            <Text type="secondary">Tạo lúc: {formatDate(item.createdAt)}</Text>
                          </Space>
                        </Space>
                      </div>

                      <Divider style={{ margin: "12px 0" }} />

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Button icon={<EyeOutlined />} onClick={() => handleViewJob(item)}>
                          Chi tiết
                        </Button>
                        {item.raw.status === "Pending" ? (
                          <Space size={8}>
                            <Button
                              type="primary"
                              icon={<CheckOutlined />}
                              loading={approvingId === item.id}
                              onClick={() => handleApproveJob(item)}
                              style={{ background: "#F97316", borderColor: "#F97316", fontWeight: 700 }}
                            >
                              Duyệt ngay
                            </Button>
                            <Button danger icon={<CloseOutlined />} onClick={() => handleOpenReject(item)}>
                              Từ chối
                            </Button>
                          </Space>
                        ) : item.raw.status === "Rejected" ? null : (
                          <Popconfirm
                            title={item.raw.status === "Published" ? "Bạn có chắc muốn tạm ẩn tin này?" : "Mở hiển thị lại tin này?"}
                            onConfirm={() => handleToggleStatus(item.id)}
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

              {/* UNIFIED PAGINATION COMPONENT FOR GRID VIEW */}
              <AppPagination
                current={gridPage}
                pageSize={gridPageSize}
                total={tableData.length}
                onChange={(page, pSize) => {
                  setGridPage(page);
                  setGridPageSize(pSize);
                }}
                pageSizeOptions={["9", "18", "36"]}
              />
            </>
          )}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        title="Chi tiết tin tuyển dụng"
        open={detailOpen}
        onCancel={() => {
          setDetailOpen(false);
          setJobDetail(null);
        }}
        footer={
          jobDetail && jobDetail.jobInfo.status === "Pending"
            ? [
              <Button
                key="reject"
                danger
                icon={<CloseOutlined />}
                disabled={approvingId !== null}
                onClick={() =>
                  handleOpenReject({
                    id: jobDetail.jobInfo.id,
                    title: jobDetail.jobInfo.position?.name || "Chưa cập nhật",
                    location: jobDetail.jobInfo.branch?.name || "Chưa cập nhật",
                    salaryRange: jobDetail.jobInfo.salaryRange,
                    createdAt: jobDetail.jobInfo.createdAt,
                    deadline: jobDetail.jobInfo.deadline,
                    recruiterName: jobDetail.jobInfo.recruiter?.name || "HR Mặc định",
                    recruiterEmail: jobDetail.jobInfo.recruiter?.email || "hr@system.com",
                    raw: jobDetail.jobInfo,
                  })
                }
              >
                Từ chối
              </Button>,
              <Button
                key="approve"
                type="primary"
                icon={<CheckOutlined />}
                loading={approvingId === jobDetail.jobInfo.id}
                disabled={approvingId !== null}
                onClick={() =>
                  handleApproveJob({
                    id: jobDetail.jobInfo.id,
                    title: jobDetail.jobInfo.position?.name || "Chưa cập nhật",
                    location: jobDetail.jobInfo.branch?.name || "Chưa cập nhật",
                    salaryRange: jobDetail.jobInfo.salaryRange,
                    createdAt: jobDetail.jobInfo.createdAt,
                    deadline: jobDetail.jobInfo.deadline,
                    recruiterName: jobDetail.jobInfo.recruiter?.name || "HR Mặc định",
                    recruiterEmail: jobDetail.jobInfo.recruiter?.email || "hr@system.com",
                    raw: jobDetail.jobInfo,
                  })
                }
                style={{ background: "#F97316", borderColor: "#F97316", fontWeight: 700 }}
              >
                Duyệt tin tuyển dụng
              </Button>,
            ]
            : null
        }
        width={820}
      >
        {detailLoading && <Text type="secondary">Đang tải dữ liệu...</Text>}

        {jobDetail && (
          <>
            <Space style={{ marginBottom: 16 }}>
              {jobDetail.jobInfo.status === "Published" ? (
                <Tag color="success">Đang chạy</Tag>
              ) : jobDetail.jobInfo.status === "Closed" ? (
                <Tag color="default">Đã đóng</Tag>
              ) : jobDetail.jobInfo.status === "Rejected" ? (
                <Tag color="error" style={{ fontWeight: 700 }}>Đã từ chối</Tag>
              ) : (
                <Tag color="warning" style={{ backgroundColor: "#FFF7ED", borderColor: "#FFEDD5", color: "#C2410C", fontWeight: 700 }}>Chờ duyệt</Tag>
              )}
              <Text type="secondary">Tạo lúc: {formatDate(jobDetail.jobInfo.createdAt)}</Text>
            </Space>

            {jobDetail.jobInfo.status === "Rejected" && (
              <div style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: "#FEF2F2", border: "1px solid #FECACA" }}>
                <Text strong style={{ color: "#EF4444" }}>Lý do từ chối: </Text>
                <Text style={{ color: "#991B1B" }}>{jobDetail.jobInfo.rejectReason || "Không có lý do cụ thể"}</Text>
              </div>
            )}

            <Descriptions bordered column={2} size="middle">
              <Descriptions.Item label="Vị trí tuyển dụng" span={2}>
                <Text strong style={{ fontSize: 16 }}>{jobDetail.jobInfo.position?.name || "Chưa cập nhật"}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="HR Đăng tuyển" span={2}>
                <Text strong style={{ color: "#2563EB" }}>
                  {jobDetail.jobInfo.recruiter?.name || "HR Mặc định"} ({jobDetail.jobInfo.recruiter?.email || "hr@system.com"})
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Địa điểm Chi nhánh">
                {jobDetail.jobInfo.branch?.name || "Chưa cập nhật"}
              </Descriptions.Item>
              <Descriptions.Item label="Mức lương">
                {jobDetail.jobInfo.salaryRange || "Chưa cập nhật"}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày bắt đầu">
                {formatDate(jobDetail.jobInfo.startDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Hạn nộp hồ sơ">
                {formatDate(jobDetail.jobInfo.deadline)}
              </Descriptions.Item>
              <Descriptions.Item label="Chỉ tiêu số lượng" span={2}>
                {jobDetail.jobInfo.maxCandidates ?? "Không giới hạn"}
              </Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: "16px 0" }} />

            <div style={{ marginBottom: 16 }}>
              <Text strong>Mô tả công việc</Text>
              <Paragraph style={{ marginTop: 8, whiteSpace: "pre-line" }}>
                {jobDetail.jobInfo.description || "Chưa có mô tả"}
              </Paragraph>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong>Yêu cầu công việc</Text>
              <Paragraph style={{ marginTop: 8, whiteSpace: "pre-line" }}>
                {jobDetail.jobInfo.requirements || "Chưa có yêu cầu"}
              </Paragraph>
            </div>

            <div>
              <Text strong>Từ khóa AI bóc tách</Text>
              <div style={{ marginTop: 8 }}>
                {jobDetail.wordsToHighlight?.length ? (
                  <Space wrap>
                    {jobDetail.wordsToHighlight.map((word) => (
                      <Tag color="blue" key={word}>
                        {word}
                      </Tag>
                    ))}
                  </Space>
                ) : (
                  <Text type="secondary">Chưa có từ khóa AI</Text>
                )}
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* Reject Reason Modal */}
      <Modal
        title="Từ chối tin tuyển dụng"
        open={rejectTarget !== null}
        onCancel={() => {
          if (rejecting) return;
          setRejectTarget(null);
          setRejectReasonText("");
        }}
        onOk={handleConfirmReject}
        okText="Xác nhận từ chối"
        okButtonProps={{ danger: true, loading: rejecting }}
        cancelText="Hủy"
        width={520}
      >
        <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
          Vui lòng nhập lý do từ chối tin <strong>{rejectTarget?.title}</strong>. Nhà tuyển dụng sẽ nhận được thông báo kèm lý do này.
        </Text>
        <Input.TextArea
          rows={4}
          placeholder="Ví dụ: Mô tả công việc chưa rõ ràng, thiếu thông tin mức lương..."
          value={rejectReasonText}
          onChange={(e) => setRejectReasonText(e.target.value)}
          maxLength={500}
          showCount
        />
      </Modal>
    </PageContainer>
  );
}

export default JobApprovalPage;
