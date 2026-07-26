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
} from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "../../../../components/common/PageContainer";
import StatCard from "../../../../components/common/StatCard";
import TableToolbar from "../../../../components/common/TableToolbar";
import { jobService } from "../../services/jobService";
import type {
  CategoryDto,
  JobDto,
} from "../../services/jobService";
import { appTheme } from "../../../../constants/theme";

const { Text } = Typography;
type JobStatus = "approved" | "pending" | "closed" | "rejected";

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
  raw: JobDtoExtended;
};

function getStatusMeta(status: JobStatus) {
  if (status === "approved") {
    return { label: "Đang hiển thị", color: "success" as const, icon: <CheckCircleFilled /> };
  }
  if (status === "closed") {
    return { label: "Tạm ẩn", color: "default" as const, icon: <LockFilled /> };
  }
  if (status === "rejected") {
    return { label: "Bị từ chối", color: "error" as const, icon: <CloseCircleFilled /> };
  }
  return { label: "Chờ duyệt", color: "warning" as const, icon: <ClockCircleFilled /> };
}

function JobManagementPage() {
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<JobDtoExtended[]>([]);
  const navigate = useNavigate();

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [filterCategory, setFilterCategory] = useState<string | undefined>(undefined);
  const [filterActivity, setFilterActivity] = useState<string | undefined>(undefined);

  // Dropdown data từ API
  const [categories, setCategories] = useState<CategoryDto[]>([]);

  // ── Fetch danh sách tin ────────────────────────────────
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data: any = await jobService.getMyJobs();
      setJobs(Array.isArray(data) ? data : data?.$values || []);
    } catch {
      message.error("Không tải được danh sách tin tuyển dụng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    jobService
      .getCategories()
      .then((data) => setCategories(data))
      .catch(() => message.error("Lỗi tải danh sách lĩnh vực"));
  }, []);

  // ── Table data ─────────────────────────────────────────
  const tableData: JobTableItem[] = jobs.map((job) => {
    let status: JobStatus = "pending";
    if (job.status === "Published") {
      status = "approved";
    } else if (job.status === "Closed") {
      status = "closed";
    } else if (job.status === "Rejected") {
      status = "rejected";
    }
    const categoryNames = job.category?.name || "Chưa cập nhật";
    const isExpired = job.deadline ? new Date(job.deadline) < new Date() : false;

    return {
      id: job.id,
      title: job.position?.name || "Chưa cập nhật",
      field: categoryNames,
      location: job.branch?.name || "Toàn quốc",
      status,
      isExpired,
      raw: job,
    };
  });

  const approvedJobs = tableData.filter((j) => j.status === "approved" && !j.isExpired).length;
  const pendingJobs = tableData.filter((j) => j.status === "pending").length;
  const rejectedJobs = tableData.filter((j) => j.status === "rejected").length;
  const expiredJobs = tableData.filter((j) => j.isExpired).length;

  const hasActiveFilters = searchQuery !== "" || filterStatus !== undefined || filterCategory !== undefined || filterActivity !== undefined;

  const handleResetFilters = () => {
    setSearchQuery("");
    setFilterStatus(undefined);
    setFilterCategory(undefined);
    setFilterActivity(undefined);
  };

  const filteredTableData = tableData.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus ? item.status === filterStatus : true;
    const matchesCategory = filterCategory ? item.field === filterCategory : true;
    
    let matchesActivity = true;
    if (filterActivity === "active") {
      matchesActivity = !item.isExpired;
    } else if (filterActivity === "expired") {
      matchesActivity = item.isExpired;
    }

    return matchesSearch && matchesStatus && matchesCategory && matchesActivity;
  });

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
        <Tag color="geekblue" style={{ borderRadius: 6, fontWeight: 500 }}>
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
        const meta = getStatusMeta(value);
        const tag = (
          <Tag color={meta.color} icon={meta.icon} style={{ borderRadius: 6, fontWeight: 500 }}>
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
        return record.isExpired ? (
          <Tag color="error" icon={<ClockCircleOutlined />} style={{ borderRadius: 6 }}>
            Hết hạn
          </Tag>
        ) : (
          <Tag color="success" icon={<CheckCircleOutlined />} style={{ borderRadius: 6 }}>
            Đang tuyển
          </Tag>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 200,
      fixed: "right" as const,
      render: (_: unknown, record: JobTableItem) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewJob(record)}
            style={{ borderRadius: 6 }}
          >
            Chi tiết
          </Button>
          {(record.status === "approved" || record.status === "closed") && (
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
                style={{ borderRadius: 6 }}
              >
                {record.status === "approved" ? "Tạm ẩn" : "Hiển thị"}
              </Button>
            </Popconfirm>
          )}
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
          <StatCard title="Tin đang hiển thị" value={approvedJobs} subtitle="Đã duyệt & Đang tuyển" accent="success" index={0} />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard title="Tin chờ duyệt" value={pendingJobs} subtitle="Đang chờ Admin duyệt" accent="warning" index={1} />
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
          searchPlaceholder="Tìm theo tên vị trí tuyển dụng..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          extra={
            <Space wrap>
              <Select
                showSearch
                placeholder="Lọc theo Lĩnh vực"
                style={{ width: 190 }}
                allowClear
                value={filterCategory}
                onChange={setFilterCategory}
                optionFilterProp="label"
                options={categories.map((c) => ({
                  label: c.name,
                  value: c.name,
                }))}
              />
              <Select
                placeholder="Trạng thái duyệt"
                style={{ width: 150 }}
                allowClear
                value={filterStatus}
                onChange={setFilterStatus}
                options={[
                  { label: "Đang hiển thị", value: "approved" },
                  { label: "Tạm ẩn", value: "closed" },
                  { label: "Chờ duyệt", value: "pending" },
                  { label: "Bị từ chối", value: "rejected" },
                ]}
              />
              <Select
                placeholder="Hạn tuyển dụng"
                style={{ width: 150 }}
                allowClear
                value={filterActivity}
                onChange={setFilterActivity}
                options={[
                  { label: "Đang tuyển", value: "active" },
                  { label: "Hết hạn", value: "expired" },
                ]}
              />

              {hasActiveFilters && (
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleResetFilters}
                  style={{ borderRadius: 8 }}
                >
                  Xóa lọc
                </Button>
              )}
            </Space>
          }
        />

        <Table
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
