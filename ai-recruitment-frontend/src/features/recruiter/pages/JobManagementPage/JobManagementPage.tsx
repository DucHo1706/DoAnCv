import {
  EyeOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  LockOutlined,
  UnlockOutlined,
  ReloadOutlined,
  CheckCircleFilled,
  ClockCircleFilled,
  CloseCircleFilled,
  LockFilled,
  EnvironmentOutlined,
  EditOutlined,
  InboxOutlined,
  UndoOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  message,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Popconfirm,
  Tooltip,
  DatePicker,
} from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs, { type Dayjs } from "dayjs";
import PageContainer from "../../../../components/common/PageContainer";
import StatCard from "../../../../components/common/StatCard";
import TableToolbar from "../../../../components/common/TableToolbar";
import { jobService } from "../../services/jobService";
import type { JobDto } from "../../services/jobService";
import { appTheme } from "../../../../constants/theme";
import { formatJobDate, resolveJobLifecycle, type JobLifecycleStatus } from "../../../../utils/jobLifecycle";
import { removeVietnameseTones } from "../../../../utils/exportUtils";
import { useRealtimeResourceRefresh } from "../../../../hooks/useRealtimeRefresh";

const { Text } = Typography;
type JobStatus = "approved" | "pending" | "closed" | "rejected" | "archived" | "flagged";

type JobDtoExtended = JobDto & {
  category?: { name: string };
};

type JobTableItem = {
  id: string;
  title: string;
  field: string;
  location: string;
  status: JobStatus;
  isExpired: boolean;
  activityState: "active" | "expired" | "not-open" | "closed";
  lifecycleStatus: JobLifecycleStatus;
  deadline?: string | null;
  raw: JobDtoExtended;
};

function getStatusMeta(status: JobStatus, lifecycleStatus: JobLifecycleStatus) {
  if (lifecycleStatus === "Expired") {
    return { label: "Đã duyệt · Hết hạn", color: "error" as const, icon: <ClockCircleFilled /> };
  }
  if (lifecycleStatus === "Scheduled") {
    return { label: "Đã duyệt · Sắp mở", color: "processing" as const, icon: <ClockCircleFilled /> };
  }
  if (status === "approved") {
    return { label: "Đã duyệt · Đang tuyển", color: "success" as const, icon: <CheckCircleFilled /> };
  }
  if (status === "closed") {
    return { label: "Đã duyệt · Tạm ẩn", color: "default" as const, icon: <LockFilled /> };
  }
  if (status === "rejected") {
    return { label: "Bị từ chối", color: "error" as const, icon: <CloseCircleFilled /> };
  }
  if (status === "archived") {
    return { label: "Đã lưu trữ", color: "default" as const, icon: <InboxOutlined /> };
  }
  if (status === "flagged") {
    return { label: "Đang kiểm duyệt", color: "warning" as const, icon: <ClockCircleFilled /> };
  }
  return { label: "Chờ duyệt", color: "warning" as const, icon: <ClockCircleFilled /> };
}

function JobManagementPage() {
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<JobDtoExtended[]>([]);
  const navigate = useNavigate();

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>();
  const [filterCategory, setFilterCategory] = useState<string>();
  const [filterActivity, setFilterActivity] = useState<string>();
  const [filterJobLevel, setFilterJobLevel] = useState<string>();
  const [filterBranch, setFilterBranch] = useState<string>();
  const [filterPosition, setFilterPosition] = useState<string>();
  const [filterRound, setFilterRound] = useState<number>();
  const [deadlineRange, setDeadlineRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [sortKey, setSortKey] = useState("newest");

  // ── Fetch danh sách tin ────────────────────────────────
  const fetchJobs = useCallback(async (background = false) => {
    try {
      if (!background) setLoading(true);
      const data: any = await jobService.getMyJobs();
      setJobs(Array.isArray(data) ? data : data?.$values || []);
    } catch {
      message.error("Không tải được danh sách tin tuyển dụng");
    } finally {
      if (!background) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchJobs();
  }, [fetchJobs]);

  useRealtimeResourceRefresh(["jobs"], () => fetchJobs(true));

  // ── Table data ─────────────────────────────────────────
  const tableData: JobTableItem[] = useMemo(() => jobs.map((job) => {
    let status: JobStatus = "pending";
    if (job.status === "Published") {
      status = "approved";
    } else if (job.status === "Closed") {
      status = "closed";
    } else if (job.status === "Rejected") {
      status = "rejected";
    } else if (job.status === "Archived") {
      status = "archived";
    } else if (job.status === "Flagged") {
      status = "flagged";
    }
    const categoryNames = job.category?.name || "Chưa cập nhật";
    const lifecycleStatus = resolveJobLifecycle(job);
    const isExpired = lifecycleStatus === "Expired";
    const activityState: JobTableItem["activityState"] =
      isExpired
        ? "expired"
        : lifecycleStatus === "Recruiting"
          ? "active"
          : status === "closed" || status === "archived" || status === "rejected"
            ? "closed"
            : "not-open";

    return {
      id: job.id,
      title: job.position?.name || "Chưa cập nhật",
      field: categoryNames,
      location: job.branch?.name || "Toàn quốc",
      status,
      isExpired,
      activityState,
      lifecycleStatus,
      deadline: job.deadline,
      raw: job,
    };
  }), [jobs]);

  const approvedJobs = tableData.filter((j) => j.lifecycleStatus === "Recruiting").length;
  const pendingJobs = tableData.filter((j) => j.status === "pending").length;
  const rejectedJobs = tableData.filter((j) => j.status === "rejected").length;
  const expiredJobs = tableData.filter((j) => j.activityState === "expired").length;

  const hasActiveFilters = Boolean(
    searchQuery || filterStatus || filterCategory || filterActivity || filterJobLevel ||
    filterBranch || filterPosition || filterRound || deadlineRange,
  );

  const handleResetFilters = () => {
    setSearchQuery("");
    setFilterStatus(undefined);
    setFilterCategory(undefined);
    setFilterActivity(undefined);
    setFilterJobLevel(undefined);
    setFilterBranch(undefined);
    setFilterPosition(undefined);
    setFilterRound(undefined);
    setDeadlineRange(null);
    setSortKey("newest");
  };

  const sortedUnique = (values: string[]) => Array.from(new Set(values)).sort((left, right) => left.localeCompare(right, "vi"));
  const categoryOptions = useMemo(() => sortedUnique(tableData.map((item) => item.field)), [tableData]);
  const jobLevelOptions = useMemo(
    () => sortedUnique(tableData.map((item) => item.raw?.jobLevel?.name).filter((name): name is string => Boolean(name))),
    [tableData],
  );
  const branchOptions = useMemo(() => sortedUnique(tableData.map((item) => item.location)), [tableData]);
  const positionOptions = useMemo(() => sortedUnique(tableData.map((item) => item.title)), [tableData]);
  const roundOptions = useMemo(
    () => Array.from(new Set(tableData.map((item) => item.raw.recruitmentRound || 1))).sort((left, right) => left - right),
    [tableData],
  );

  const filteredTableData = useMemo(() => {
    const query = removeVietnameseTones(searchQuery.trim());
    const filtered = tableData.filter((item) => {
    const searchableText = removeVietnameseTones([
      item.title,
      item.field,
      item.location,
      item.raw.jobLevel?.name,
    ].filter(Boolean).join(" "));
    const matchesSearch = !query || searchableText.includes(query);
    const matchesStatus = filterStatus ? item.status === filterStatus : true;
    const matchesCategory = filterCategory ? item.field === filterCategory : true;
    const matchesJobLevel = filterJobLevel ? item.raw?.jobLevel?.name === filterJobLevel : true;
    const matchesBranch = filterBranch ? item.location === filterBranch : true;
    const matchesPosition = filterPosition ? item.title === filterPosition : true;
    const matchesRound = filterRound ? (item.raw.recruitmentRound || 1) === filterRound : true;
    const deadline = item.deadline ? dayjs(item.deadline) : null;
    const matchesDeadline = !deadlineRange || !deadlineRange[0] || !deadlineRange[1] ||
      Boolean(deadline && !deadline.isBefore(deadlineRange[0], "day") && !deadline.isAfter(deadlineRange[1], "day"));

    let matchesActivity = true;
    if (filterActivity === "active") {
      matchesActivity = item.activityState === "active";
    } else if (filterActivity === "expired") {
      matchesActivity = item.activityState === "expired";
    } else if (filterActivity === "scheduled") {
      matchesActivity = item.lifecycleStatus === "Scheduled";
    } else if (filterActivity === "closed") {
      matchesActivity = item.activityState === "closed";
    }

    return matchesSearch && matchesStatus && matchesCategory && matchesActivity && matchesJobLevel &&
      matchesBranch && matchesPosition && matchesRound && matchesDeadline;
    });

    return [...filtered].sort((left, right) => {
      if (sortKey === "oldest") return dayjs(left.raw.createdAt).valueOf() - dayjs(right.raw.createdAt).valueOf();
      if (sortKey === "deadline") return dayjs(left.deadline).valueOf() - dayjs(right.deadline).valueOf();
      if (sortKey === "title") return left.title.localeCompare(right.title, "vi");
      return dayjs(right.raw.createdAt).valueOf() - dayjs(left.raw.createdAt).valueOf();
    });
  }, [
    deadlineRange,
    filterActivity,
    filterBranch,
    filterCategory,
    filterJobLevel,
    filterPosition,
    filterRound,
    filterStatus,
    searchQuery,
    sortKey,
    tableData,
  ]);

  const handleViewJob = (record: JobTableItem) => {
    navigate(`/recruiter/jobs/${record.id}`);
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await jobService.toggleRecruiterJobStatus(id);
      message.success("Cập nhật trạng thái hiển thị thành công!");
      fetchJobs();
    } catch (error: any) {
      message.error(error.response?.data?.message || "Lỗi khi thay đổi trạng thái!");
    }
  };

  const handleArchive = async (id: string) => {
    try {
      const response = await jobService.archiveJob(id);
      message.success(response?.message || "Đã lưu trữ tin tuyển dụng");
      fetchJobs();
    } catch (error: any) {
      message.error(error.response?.data?.message || "Không thể lưu trữ tin tuyển dụng");
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const response = await jobService.restoreJob(id);
      message.success(response?.message || "Đã khôi phục tin tuyển dụng");
      fetchJobs();
    } catch (error: any) {
      message.error(error.response?.data?.message || "Không thể khôi phục tin tuyển dụng");
    }
  };

  // ── Columns ───────────────────────────────────────────
  const columns = [
    {
      title: "Vị trí tuyển dụng",
      dataIndex: "title",
      key: "title",
      width: 260,
      render: (text: string, record: JobTableItem) => (
        <div>
          <Text strong style={{ color: "#0F172A", fontSize: 14, display: "block" }}>
            {text}
          </Text>
          <Text type="secondary" style={{ fontSize: 12, color: "#64748B" }}>
            <EnvironmentOutlined style={{ marginRight: 4 }} />
            {record.location}
          </Text>
        </div>
      ),
    },
    {
      title: "Lĩnh vực",
      dataIndex: "field",
      key: "field",
      width: 180,
      render: (value: string) => (
        <Tag color="geekblue" style={{ borderRadius: 8, fontWeight: 500 }}>
          {value}
        </Tag>
      ),
    },
    {
      title: "Trạng thái duyệt",
      dataIndex: "status",
      key: "status",
      width: 170,
      render: (value: JobStatus, record: JobTableItem) => {
        const meta = getStatusMeta(value, record.lifecycleStatus);
        const tag = (
          <Tag color={meta.color} icon={meta.icon} style={{ borderRadius: 8, fontWeight: 500 }}>
            {meta.label}
          </Tag>
        );
        if (value === "rejected" && record.raw.rejectReason) {
          return (
            <Tooltip title={`Lý do từ chối: ${record.raw.rejectReason}`}>
              <span style={{ cursor: "help" }}>{tag}</span>
            </Tooltip>
          );
        }
        return tag;
      },
    },
    {
      title: "Hạn tuyển dụng",
      key: "activity",
      width: 160,
      render: (_: unknown, record: JobTableItem) => {
        const deadlineText = record.deadline ? formatJobDate(record.deadline) : "Chưa đặt hạn";
        if (record.activityState === "not-open") {
          return <><Text type="secondary" style={{ display: "block", fontSize: 12 }}>{deadlineText}</Text><Tag color="warning" icon={<ClockCircleOutlined />} style={{ borderRadius: 8 }}>Chưa mở tuyển</Tag></>;
        }
        if (record.activityState === "closed") {
          return <><Text type="secondary" style={{ display: "block", fontSize: 12 }}>{deadlineText}</Text><Tag color="default" icon={<LockOutlined />} style={{ borderRadius: 8 }}>Đã đóng</Tag></>;
        }
        return record.activityState === "expired" ? (
          <Tag color="error" icon={<ClockCircleOutlined />} style={{ borderRadius: 8 }}>
            <Text delete style={{ color: "inherit" }}>{deadlineText}</Text> · Hết hạn
          </Tag>
        ) : (
          <><Text type="secondary" style={{ display: "block", fontSize: 12 }}>{deadlineText}</Text><Tag color="success" icon={<CheckCircleOutlined />} style={{ borderRadius: 8 }}>Đang tuyển</Tag></>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 390,
      fixed: "right" as const,
      render: (_: unknown, record: JobTableItem) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewJob(record)}
            style={{ borderRadius: 8 }}
          >
            Chi tiết
          </Button>
          {record.status !== "archived" && record.raw.status !== "Flagged" && !record.isExpired && (
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/recruiter/jobs/${record.id}/edit`)}
              style={{ borderRadius: 8 }}
            >
              Sửa
            </Button>
          )}
          {(record.status === "approved" || record.status === "closed") && !record.isExpired && (
            <Popconfirm
              title={
                record.status === "approved"
                  ? "Bạn có chắc muốn tạm ẩn tin này?"
                  : "Mở hiển thị lại tin này?"
              }
              onConfirm={() => handleToggleStatus(record.id)}
              okText="Đồng ý"
              cancelText="Hủy"
              placement="topRight"
            >
              <Button
                size="small"
                icon={record.status === "approved" ? <LockOutlined /> : <UnlockOutlined />}
                danger={record.status === "approved"}
                style={{ borderRadius: 8 }}
              >
                {record.status === "approved" ? "Tạm ẩn" : "Hiển thị"}
              </Button>
            </Popconfirm>
          )}
          {record.isExpired && (
            <Button
              size="small"
              type="primary"
              icon={<CopyOutlined />}
              onClick={() => navigate(`/recruiter/jobs/${record.id}/repost`)}
              style={{ borderRadius: 8 }}
            >
              Đăng lại
            </Button>
          )}
          {record.raw.status !== "Flagged" && (record.status === "archived" ? (
            <Popconfirm
              title="Khôi phục tin và gửi lại để quản trị viên duyệt?"
              onConfirm={() => handleRestore(record.id)}
              okText="Khôi phục"
              cancelText="Hủy"
            >
              <Button size="small" icon={<UndoOutlined />} style={{ borderRadius: 8 }}>
                Khôi phục
              </Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="Lưu trữ tin tuyển dụng này?"
              description="Tin sẽ ngừng hiển thị nhưng dữ liệu ứng viên và kết quả AI vẫn được giữ."
              onConfirm={() => handleArchive(record.id)}
              okText="Lưu trữ"
              cancelText="Hủy"
            >
              <Button size="small" icon={<InboxOutlined />} style={{ borderRadius: 8 }}>
                Lưu trữ
              </Button>
            </Popconfirm>
          ))}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title="Quản lý tin tuyển dụng"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/recruiter/jobs/create")}
          style={{
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)",
          }}
        >
          Tạo tin tuyển dụng
        </Button>
      }
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <StatCard title="Tin đang tuyển" value={approvedJobs} subtitle="Đã duyệt và còn hạn nhận CV" accent="success" index={0} />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard title="Tin chờ duyệt" value={pendingJobs} subtitle="Đang chờ quản trị viên duyệt" accent="warning" index={1} />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard title="Tin bị từ chối" value={rejectedJobs} subtitle="Cần cập nhật lại" accent="error" index={2} />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard title="Tin đã hết hạn" value={expiredJobs} subtitle="Đã qua hạn nộp CV" accent="info" index={3} />
        </Col>
      </Row>

      <Card
        style={{
          borderRadius: 16,
          boxShadow: appTheme.shadow.card,
          border: `1px solid ${appTheme.colors.border}`,
        }}
      >
        <TableToolbar
          searchPlaceholder="Tìm theo vị trí, lĩnh vực, cấp bậc hoặc chi nhánh..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          extra={
            <Row gutter={[10, 10]} style={{ width: "100%" }}>
              <Col xs={24} sm={12} lg={8} xl={6}><Select showSearch optionFilterProp="label" placeholder="Vị trí tuyển dụng" style={{ width: "100%" }} allowClear value={filterPosition} onChange={setFilterPosition} options={positionOptions.map((value) => ({ label: value, value }))} /></Col>
              <Col xs={24} sm={12} lg={8} xl={6}><Select showSearch optionFilterProp="label" placeholder="Lĩnh vực" style={{ width: "100%" }} allowClear value={filterCategory} onChange={setFilterCategory} options={categoryOptions.map((value) => ({ label: value, value }))} /></Col>
              <Col xs={24} sm={12} lg={8} xl={6}><Select showSearch optionFilterProp="label" placeholder="Cấp bậc" style={{ width: "100%" }} allowClear value={filterJobLevel} onChange={setFilterJobLevel} options={jobLevelOptions.map((value) => ({ label: value, value }))} /></Col>
              <Col xs={24} sm={12} lg={8} xl={6}><Select showSearch optionFilterProp="label" placeholder="Chi nhánh" style={{ width: "100%" }} allowClear value={filterBranch} onChange={setFilterBranch} options={branchOptions.map((value) => ({ label: value, value }))} /></Col>
              <Col xs={24} sm={12} lg={8} xl={6}><Select placeholder="Trạng thái duyệt" style={{ width: "100%" }} allowClear value={filterStatus} onChange={setFilterStatus} options={[
                { label: "Đã duyệt", value: "approved" },
                { label: "Tạm ẩn", value: "closed" },
                { label: "Chờ duyệt", value: "pending" },
                { label: "Bị từ chối", value: "rejected" },
                { label: "Đã lưu trữ", value: "archived" },
                { label: "Đang kiểm duyệt", value: "flagged" },
              ]} /></Col>
              <Col xs={24} sm={12} lg={8} xl={6}><Select placeholder="Vòng đời tuyển dụng" style={{ width: "100%" }} allowClear value={filterActivity} onChange={setFilterActivity} options={[
                { label: "Đang tuyển", value: "active" },
                { label: "Sắp mở tuyển", value: "scheduled" },
                { label: "Đã hết hạn", value: "expired" },
                { label: "Đã đóng / tạm ẩn", value: "closed" },
              ]} /></Col>
              <Col xs={24} sm={12} lg={8} xl={6}><Select placeholder="Đợt tuyển dụng" style={{ width: "100%" }} allowClear value={filterRound} onChange={setFilterRound} options={roundOptions.map((value) => ({ label: `Đợt ${value}`, value }))} /></Col>
              <Col xs={24} sm={12} lg={8} xl={6}><DatePicker.RangePicker placeholder={["Hạn từ ngày", "Đến ngày"]} format="DD/MM/YYYY" style={{ width: "100%" }} value={deadlineRange} onChange={setDeadlineRange} /></Col>
              <Col xs={24} sm={12} lg={8} xl={6}><Select value={sortKey} style={{ width: "100%" }} onChange={setSortKey} options={[
                { label: "Mới tạo trước", value: "newest" },
                { label: "Cũ tạo trước", value: "oldest" },
                { label: "Sắp hết hạn", value: "deadline" },
                { label: "Tên vị trí A–Z", value: "title" },
              ]} /></Col>
              {hasActiveFilters && <Col xs={24} sm={12} lg={8} xl={6}><Button block icon={<ReloadOutlined />} onClick={handleResetFilters}>Xóa bộ lọc</Button></Col>}
            </Row>
          }
        />

        <Text type="secondary" style={{ display: "block", marginBottom: 8, fontSize: 13 }}>
          Hiển thị {filteredTableData.length}/{tableData.length} tin tuyển dụng
        </Text>

        <Table scroll={{ x: "max-content" }}
          rowKey="id"
          columns={columns}
          dataSource={filteredTableData}
          loading={loading}
          pagination={{ pageSize: 8, showSizeChanger: true }}
          style={{ marginTop: 8 }}
        />
      </Card>

    </PageContainer>
  );
}

export default JobManagementPage;
