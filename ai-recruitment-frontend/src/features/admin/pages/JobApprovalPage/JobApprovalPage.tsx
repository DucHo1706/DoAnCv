import {
  StatusPendingIcon,
  StatusRunningIcon,
  StatusClosedIcon,
} from "../../../../components/common/AppIcons";
import { AppstoreOutlined, CalendarOutlined, CheckCircleOutlined, CheckOutlined, CloseOutlined, DollarOutlined, EyeOutlined, FileTextOutlined, FireOutlined, LockOutlined, SearchOutlined, StopOutlined, UnlockOutlined, UnorderedListOutlined, UserOutlined, DownloadOutlined, FlagOutlined, ClockCircleFilled, CheckCircleFilled, CloseCircleFilled, LockFilled, InboxOutlined, UndoOutlined } from "@ant-design/icons";
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
  Alert,
  Skeleton,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "../../../../components/common/PageContainer";
import EmptyState from "../../../../components/common/EmptyState";
import AppPagination from "../../../../components/common/AppPagination";
import { jobService, categoryService } from "../../services/jobService";
import type { JobDto } from "../../services/jobService";
import { EnvironmentOutlined } from "@ant-design/icons";
import { exportToCsv } from "../../../../utils/exportUtils";
import { RejectModal } from "./components/RejectModal";
import { JobGridView } from "./components/JobGridView";
import { JobTableView } from "./components/JobTableView";
import { JobApprovalToolbar } from "./components/JobApprovalToolbar";

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
  const navigate = useNavigate();
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


  // Reject modal state
  const [rejectTarget, setRejectTarget] = useState<PendingJobTableItem | null>(null);
  const [rejectReasonText, setRejectReasonText] = useState("");
  const [rejecting, setRejecting] = useState(false);

  // Bulk approve state
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [bulkApproving, setBulkApproving] = useState(false);

  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchAdminJobs = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const data: any = await jobService.getAdminJobs();
      setJobs(Array.isArray(data) ? data : data?.$values || []);
    } catch (error) {
      console.error(error);
      setFetchError("Không tải được danh sách tin tuyển dụng. Vui lòng kiểm tra kết nối và thử lại.");
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

  // Mặc định mở tab chờ duyệt khi có tin mới.
  useEffect(() => {
    if (jobs.length > 0) {
      const hasPending = jobs.some((j) => j.status === "Pending");
      if (hasPending && selectedStatus === "all") {
        setSelectedStatus("pending");
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
        (selectedStatus === "pending" && job.status === "Pending") ||
        (selectedStatus === "active" && job.status === "Published") ||
        (selectedStatus === "archived" && job.status === "Archived") ||
        (selectedStatus === "closed" &&
          (job.status === "Closed" || job.status === "Locked"));

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

  const handleViewJob = (record: PendingJobTableItem) => navigate(`/admin/jobs/${record.id}`);

  const handleApproveJob = async (record: PendingJobTableItem) => {
    if (approvingId) return;
    setApprovingId(record.id);

    try {
      const response = await jobService.approveJob(record.id);
      message.success(response?.message || "Duyệt tin tuyển dụng thành công");
      fetchAdminJobs();
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
    } catch (error: any) {
      message.error("Lỗi khi thay đổi trạng thái!");
    }
  };

  const handleArchive = async (id: string) => {
    try {
      const response = await jobService.archiveJob(id);
      message.success(response?.message || "Đã lưu trữ tin tuyển dụng");
      fetchAdminJobs();
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Không thể lưu trữ tin tuyển dụng");
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const response = await jobService.restoreJob(id);
      message.success(response?.message || "Đã khôi phục tin tuyển dụng");
      fetchAdminJobs();
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Không thể khôi phục tin tuyển dụng");
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
  const archivedJobsCount = jobs.filter((j) => j.status === "Archived").length;

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
        if (st === "Archived") {
          return <Tag icon={<InboxOutlined />} color="default">Đã lưu trữ</Tag>;
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
      width: 400,
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
          {record.raw.status === "Archived" ? (
            <Popconfirm title="Khôi phục tin và chuyển về chờ duyệt?" onConfirm={() => handleRestore(record.id)} okText="Khôi phục" cancelText="Hủy">
              <Button icon={<UndoOutlined />} size="middle">Khôi phục</Button>
            </Popconfirm>
          ) : (
            <Popconfirm title="Lưu trữ tin này?" description="Dữ liệu ứng viên và kết quả AI vẫn được giữ nguyên." onConfirm={() => handleArchive(record.id)} okText="Lưu trữ" cancelText="Hủy">
              <Button icon={<InboxOutlined />} size="middle">Lưu trữ</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title="Quản lý và duyệt tin tuyển dụng"
    >
      {fetchError && (
        <Alert
          type="error"
          showIcon
          message="Lỗi tải dữ liệu"
          description={fetchError}
          action={
            <Button size="small" type="primary" onClick={fetchAdminJobs}>
              Thử lại
            </Button>
          }
          style={{ marginBottom: 20 }}
        />
      )}
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
      <JobApprovalToolbar
        searchText={searchText}
        setSearchText={setSearchText}
        selectedRecruiterEmail={selectedRecruiterEmail}
        setSelectedRecruiterEmail={setSelectedRecruiterEmail}
        selectedBranchName={selectedBranchName}
        setSelectedBranchName={setSelectedBranchName}
        selectedCategoryId={selectedCategoryId}
        setSelectedCategoryId={setSelectedCategoryId}
        statusTab={selectedStatus}
        setStatusTab={setSelectedStatus}
        viewMode={viewMode}
        setViewMode={setViewMode}
        uniqueRecruiters={uniqueRecruiters}
        uniqueBranches={uniqueBranches}
        categories={categories}
        counts={{
          pending: pendingJobsCount,
          active: publishedJobsCount,
          closed: closedJobsCount,
          archived: archivedJobsCount,
          all: totalJobsCount,
        }}
        onExportCsv={handleExportJobsCsv}
      />

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
        <JobTableView
          loading={loading}
          tableData={tableData}
          columns={columns}
          selectedRowKeys={selectedRowKeys}
          onSelectedRowKeysChange={(keys) => setSelectedRowKeys(keys)}
        />
      ) : (
        <JobGridView
          loading={loading}
          tableData={tableData}
          paginatedGridData={paginatedGridData}
          gridPage={gridPage}
          gridPageSize={gridPageSize}
          approvingId={approvingId}
          onPageChange={(page, pSize) => {
            setGridPage(page);
            setGridPageSize(pSize);
          }}
          onViewJob={handleViewJob}
          onApproveJob={handleApproveJob}
          onOpenReject={handleOpenReject}
          onToggleStatus={(item) => handleToggleStatus(item.id)}
          onArchive={(item) => handleArchive(item.id)}
          onRestore={(item) => handleRestore(item.id)}
        />
      )}

      {/* Reject Reason Modal */}
      <RejectModal
        target={rejectTarget}
        reasonText={rejectReasonText}
        rejecting={rejecting}
        onReasonChange={setRejectReasonText}
        onConfirm={handleConfirmReject}
        onCancel={() => {
          if (rejecting) return;
          setRejectTarget(null);
          setRejectReasonText("");
        }}
      />
    </PageContainer>
  );
}

export default JobApprovalPage;
