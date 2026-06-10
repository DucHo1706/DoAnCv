import { EditOutlined, EyeOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Divider,
  message,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "../../components/common/PageContainer";
import StatCard from "../../components/common/StatCard";
import TableToolbar from "../../components/common/TableToolbar";
import {
  jobService,
  jobPositionService,
  branchService,
} from "../../services/jobService";
import type {
  BranchDto,
  CategoryDto,
  JobDto,
  JobPositionDto,
  JobReviewResponse,
} from "../../services/jobService";

const { Paragraph, Text } = Typography;
type JobStatus = "approved" | "pending";

// Thêm categories vào JobDto (bổ sung phía frontend)
type JobDtoExtended = JobDto & {
  category?: { name: string };
};

type JobTableItem = {
  id: string;
  title: string;
  field: string;
  location: string;
  status: JobStatus;
  raw: JobDtoExtended;
};

function formatDate(value?: string | null) {
  if (!value) return "Chưa cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN");
}

function getStatusMeta(status: JobStatus) {
  if (status === "approved") {
    return { label: "Đã duyệt", color: "green" as const };
  }
  return { label: "Chờ duyệt", color: "gold" as const };
}

function JobManagementPage() {
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<JobDtoExtended[]>([]);
  const navigate = useNavigate();

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [jobDetail, setJobDetail] = useState<JobReviewResponse | null>(null);

  // Dropdown data từ API
  const [categories, setCategories] = useState<CategoryDto[]>([]); // For filter dropdown

  // ── Fetch danh sách tin ────────────────────────────────
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data: any = await jobService.getMyJobs(); // Chỉ lấy công việc của HR này
      setJobs(Array.isArray(data) ? data : (data?.$values || []));
    } catch {
      message.error("Không tải được danh sách tin tuyển dụng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // Fetch categories for filter dropdown
    jobService.getCategories().then(data => setCategories(data)).catch(() => message.error("Lỗi tải danh sách lĩnh vực"));
  }, []);

  // ── Table data ─────────────────────────────────────────
  const tableData: JobTableItem[] = jobs.map((job) => {
    const status: JobStatus = job.isApproved ? "approved" : "pending";
    const categoryNames = job.category?.name || "Chưa cập nhật";

    return {
      id: job.id,
      title: job.position?.name || "Chưa cập nhật",
      field: categoryNames,
      location: job.branch?.name || "Chưa cập nhật",
      status,
      raw: job,
    };
  });

  const approvedJobs = tableData.filter((j) => j.status === "approved").length;
  const pendingJobs = tableData.filter((j) => j.status === "pending").length;

  // ── Xem chi tiết ──────────────────────────────────────
  const handleViewJob = async (record: JobTableItem) => {
    try {
      setDetailOpen(true);
      setDetailLoading(true);
      const data = await jobService.getJobReview(record.id);
      setJobDetail(data);
    } catch {
      message.error("Không tải được chi tiết tin tuyển dụng");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // ── Columns ───────────────────────────────────────────
  const columns = [
    {
      title: "Vị trí",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Lĩnh vực",
      dataIndex: "field",
      key: "field",
      render: (value: string) => <Text type="secondary">{value}</Text>,
    },
    {
      title: "Địa điểm",
      dataIndex: "location",
      key: "location",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (value: JobStatus) => {
        const meta = getStatusMeta(value);
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_: unknown, record: JobTableItem) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => handleViewJob(record)}>
            Xem
          </Button>
          <Button icon={<EditOutlined />} disabled>
            Sửa
          </Button>
        </Space>
      ),
    },
  ];

  const detailStatus = jobDetail?.jobInfo?.isApproved ? "approved" : "pending";
  const detailStatusMeta = getStatusMeta(detailStatus);

  // ── Render ────────────────────────────────────────────
  return (
    <PageContainer
      title="Quản lý tin tuyển dụng"
      subtitle="Tạo, cập nhật và theo dõi hiệu quả các vị trí tuyển dụng đang mở."
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/recruiter/jobs/create")}
        >
          Tạo tin tuyển dụng
        </Button>
      }
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <StatCard
            title="Tin công khai"
            value={approvedJobs}
            subtitle="Đã được Admin duyệt"
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="Tin chờ duyệt"
            value={pendingJobs}
            subtitle="Đang chờ Admin xét duyệt"
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="Tổng tin tuyển dụng"
            value={tableData.length}
            subtitle="Toàn bộ tin đang hoạt động"
          />
        </Col>
      </Row>

      <Card>
        <TableToolbar
          searchPlaceholder="Tìm theo tên vị trí..."
          extra={
            <>
              <Select
                placeholder="Lọc trạng thái"
                style={{ width: 180 }}
                allowClear
                options={[
                  { label: "Đã duyệt", value: "approved" },
                  { label: "Chờ duyệt", value: "pending" },
                ]}
              />
              <Select
                placeholder="Lọc lĩnh vực"
                style={{ width: 220 }}
                allowClear
                options={categories.map((c) => ({
                  label: c.name,
                  value: c.id,
                }))}
              />
            </>
          }
        />

        <Table
          rowKey="id"
          columns={columns}
          dataSource={tableData}
          loading={loading}
          pagination={{ pageSize: 5 }}
        />
      </Card>

      {/* ── Modal xem chi tiết ── */}
      <Modal
        title="Chi tiết tin tuyển dụng"
        open={detailOpen}
        onCancel={() => {
          setDetailOpen(false);
          setJobDetail(null);
        }}
        footer={null}
        width={820}
        confirmLoading={detailLoading}
      >
        {detailLoading && (
          <Text type="secondary">Đang tải dữ liệu...</Text>
        )}

        {jobDetail && (
          <>
            <Space style={{ marginBottom: 16 }}>
              <Tag color={detailStatusMeta.color}>{detailStatusMeta.label}</Tag>
              <Text type="secondary">
                Tạo lúc: {formatDate(jobDetail.jobInfo.createdAt)}
              </Text>
            </Space>

            <Descriptions bordered column={2} size="middle">
              <Descriptions.Item label="Vị trí" span={2}>
                {jobDetail.jobInfo.position?.name || "Chưa cập nhật"}
              </Descriptions.Item>
              <Descriptions.Item label="Địa điểm">
                {jobDetail.jobInfo.branch?.name || "Chưa cập nhật"}
              </Descriptions.Item>
              <Descriptions.Item label="Mức lương">
                {jobDetail.jobInfo.salaryRange || "Chưa cập nhật"}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày bắt đầu">
                {formatDate(jobDetail.jobInfo.startDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Hạn chót">
                {formatDate(jobDetail.jobInfo.deadline)}
              </Descriptions.Item>
              <Descriptions.Item label="Số lượng cần tuyển" span={2}>
                {jobDetail.jobInfo.maxCandidates ?? "Không giới hạn"}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <div style={{ marginBottom: 16 }}>
              <Text strong>Mô tả công việc</Text>
              <Paragraph style={{ marginTop: 8, whiteSpace: "pre-line" }}>
                {jobDetail.jobInfo.description || "Chưa có mô tả"}
              </Paragraph>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong>Yêu cầu</Text>
              <Paragraph style={{ marginTop: 8, whiteSpace: "pre-line" }}>
                {jobDetail.jobInfo.requirements || "Chưa có yêu cầu"}
              </Paragraph>
            </div>

            <div>
              <Text strong>Từ khóa mới AI phát hiện</Text>
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
                  <Text type="secondary">Không có từ khóa mới</Text>
                )}
              </div>
            </div>

            {/* Hiển thị tiêu chí đánh giá nếu có */}
            {(jobDetail.jobInfo as any).criteria?.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <Text strong>Tiêu chí đánh giá AI (Trọng số %)</Text>
                <div style={{ marginTop: 8 }}>
                  <Table 
                    size="small" 
                    columns={[
                      { title: "Tên tiêu chí", dataIndex: "name", key: "name" },
                      { title: "Trọng số", dataIndex: "weight", key: "weight", render: (val) => <Tag color="blue">{val}%</Tag> }
                    ]} 
                    dataSource={(jobDetail.jobInfo as any).criteria} 
                    rowKey="name" 
                    pagination={false} 
                    bordered
                  />
                </div>
              </div>
            )}
          </>
        )}
      </Modal>
    </PageContainer>
  );
}

export default JobManagementPage;