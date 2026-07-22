import {
  EyeOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  LockOutlined,
  UnlockOutlined,
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
type JobStatus = "approved" | "pending" | "closed";

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
    return { label: "Đang hiển thị", color: "green" as const };
  }
  if (status === "closed") {
    return { label: "Tạm ẩn", color: "red" as const };
  }
  return { label: "Chờ duyệt", color: "gold" as const };
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
  const [categories, setCategories] = useState<CategoryDto[]>([]); // For filter dropdown

  // ── Fetch danh sách tin ────────────────────────────────
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data: any = await jobService.getMyJobs(); // Chỉ lấy công việc của HR này
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
    }
    const categoryNames = job.category?.name || "Chưa cập nhật";
    const isExpired = job.deadline ? new Date(job.deadline) < new Date() : false;

    return {
      id: job.id,
      title: job.position?.name || "Chưa cập nhật",
      field: categoryNames,
      location: job.branch?.name || "Chưa cập nhật",
      status,
      isExpired,
      raw: job,
    };
  });

  const approvedJobs = tableData.filter((j) => j.status === "approved" && !j.isExpired).length;
  const expiredJobs = tableData.filter((j) => j.isExpired).length;
  const pendingJobs = tableData.filter((j) => j.status === "pending").length;

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

  // ── Xem chi tiết ──────────────────────────────────────
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
      render: (text: string) => <Text strong style={{ color: "#0F172A" }}>{text}</Text>
    },
    {
      title: "Lĩnh vực",
      dataIndex: "field",
      key: "field",
      render: (value: string) => <Tag color="blue" style={{ borderRadius: 6 }}>{value}</Tag>,
    },
    {
      title: "Địa điểm làm việc",
      dataIndex: "location",
      key: "location",
      render: (text: string) => <Text type="secondary">{text}</Text>
    },
    {
      title: "Trạng thái duyệt",
      dataIndex: "status",
      key: "status",
      render: (value: JobStatus) => {
        const meta = getStatusMeta(value);
        return <Tag color={meta.color} style={{ borderRadius: 6 }}>{meta.label}</Tag>;
      },
    },
    {
      title: "Hạn tuyển dụng",
      key: "activity",
      render: (_: unknown, record: JobTableItem) => {
        return record.isExpired ? (
          <Tag color="error" icon={<ClockCircleOutlined />} style={{ borderRadius: 6 }}>Hết hạn</Tag>
        ) : (
          <Tag color="success" icon={<CheckCircleOutlined />} style={{ borderRadius: 6 }}>Đang tuyển</Tag>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_: unknown, record: JobTableItem) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => handleViewJob(record)}>
            Xem chi tiết
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
                icon={record.status === "approved" ? <LockOutlined /> : <UnlockOutlined />}
                danger={record.status === "approved"}
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
      subtitle="Tạo, cập nhật và theo dõi hiệu quả các vị trí tuyển dụng đang mở."
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
        <Col xs={24} sm={8}>
          <StatCard title="Tin đang tuyển" value={approvedJobs} subtitle="Đã duyệt & Đang tuyển dụng" />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard title="Tin chờ duyệt" value={pendingJobs} subtitle="Đang chờ Admin xét duyệt" />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="Tin đã hết hạn"
            value={expiredJobs}
            subtitle="Đã qua hạn nộp hồ sơ"
          />
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
          searchPlaceholder="Tìm theo tên vị trí..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          extra={
            <Space wrap>
              <Select
                showSearch
                placeholder="Lọc theo Lĩnh vực"
                style={{ width: 200 }}
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
                ]}
              />
              <Select
                placeholder="Trạng thái tuyển"
                style={{ width: 150 }}
                allowClear
                value={filterActivity}
                onChange={setFilterActivity}
                options={[
                  { label: "Đang tuyển", value: "active" },
                  { label: "Hết hạn", value: "expired" },
                ]}
              />
            </Space>
          }
        />

        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredTableData}
          loading={loading}
          pagination={{ pageSize: 5 }}
          style={{ marginTop: 8 }}
        />
      </Card>
    </PageContainer>
  );
}

export default JobManagementPage;
