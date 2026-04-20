import { EditOutlined, EyeOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Divider,
  Form,
  Input,
  InputNumber,
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
import { useEffect, useMemo, useState } from "react";
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
  CreateJobPayload,
  JobDto,
  JobPositionDto,
  JobReviewResponse,
} from "../../services/jobService";

const { Paragraph, Text } = Typography;
type JobStatus = "approved" | "pending";

// Thêm categories vào JobDto (bổ sung phía frontend)
type JobDtoExtended = JobDto & {
  categories?: CategoryDto[];
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
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [jobs, setJobs] = useState<JobDtoExtended[]>([]);
  const [form] = Form.useForm();

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [jobDetail, setJobDetail] = useState<JobReviewResponse | null>(null);

  // Dropdown data từ API
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [positions, setPositions] = useState<JobPositionDto[]>([]);
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);

  // ── Fetch danh sách tin ────────────────────────────────
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data: any = await jobService.getJobs();
      setJobs(Array.isArray(data) ? data : (data?.$values || []));
    } catch {
      message.error("Không tải được danh sách tin tuyển dụng");
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch dropdown data khi mở modal tạo tin ──────────
  const fetchDropdownData = async () => {
    try {
      setDropdownLoading(true);
      const [posData, branchData, cateData] = await Promise.all([
        jobPositionService.getJobPositions(),
        branchService.getBranches(),
        jobService.getCategories(),
      ]);
      setPositions(posData);
      setBranches(branchData);
      setCategories(cateData);
    } catch {
      message.error("Không tải được dữ liệu dropdown");
    } finally {
      setDropdownLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleOpenCreateModal = () => {
    form.resetFields();
    setOpenModal(true);
    fetchDropdownData();
  };

  // ── Table data ─────────────────────────────────────────
  const tableData: JobTableItem[] = useMemo(() => {
    return jobs.map((job) => {
      const status: JobStatus = job.isApproved ? "approved" : "pending";
      const categoryNames =
        job.categories && job.categories.length > 0
          ? job.categories.map((c) => c.name).join(", ")
          : "Chưa cập nhật";

      return {
        id: job.id,
        title: job.position?.name || "Chưa cập nhật",
        field: categoryNames,
        location: job.branch?.name || "Chưa cập nhật",
        status,
        raw: job,
      };
    });
  }, [jobs]);

  const approvedJobs = tableData.filter((j) => j.status === "approved").length;
  const pendingJobs = tableData.filter((j) => j.status === "pending").length;

  // ── Tạo tin tuyển dụng ────────────────────────────────
  const handleCreateJob = async () => {
    try {
      const values = await form.validateFields();

      const payload: CreateJobPayload = {
        positionId: values.positionId,
        branchId: values.branchId,
        description: values.description,
        requirements: values.requirements,
        salaryRange: values.salaryRange,
        startDate: values.startDate
          ? dayjs(values.startDate).toISOString()
          : null,
        deadline: values.deadline
          ? dayjs(values.deadline).toISOString()
          : null,
        maxCandidates: values.maxCandidates ?? null,
        categoryIds: values.categoryIds || [],
      };

      setSubmitting(true);
      await jobService.createJob(payload);
      message.success("Tạo tin tuyển dụng thành công, bài đang chờ duyệt");

      form.resetFields();
      setOpenModal(false);
      await fetchJobs();
    } catch (error: any) {
      if (error?.response) {
        const msg =
          error.response.data?.message ||
          error.response.data ||
          "Tạo tin tuyển dụng thất bại";
        message.error(typeof msg === "string" ? msg : "Tạo tin tuyển dụng thất bại");
      }
    } finally {
      setSubmitting(false);
    }
  };

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
          onClick={handleOpenCreateModal}
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

      {/* ── Modal tạo tin ── */}
      <Modal
        title="Tạo tin tuyển dụng"
        open={openModal}
        onCancel={() => setOpenModal(false)}
        onOk={handleCreateJob}
        confirmLoading={submitting}
        okText="Gửi duyệt"
        cancelText="Hủy"
        width={640}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="Vị trí tuyển dụng"
            name="positionId"
            rules={[{ required: true, message: "Vui lòng chọn vị trí" }]}
          >
            <Select
              placeholder="Chọn vị trí tuyển dụng"
              showSearch
              loading={dropdownLoading}
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={positions.map((p) => ({
                label: p.name,
                value: p.id,
              }))}
            />
          </Form.Item>

          <Form.Item label="Lĩnh vực" name="categoryIds">
            <Select
              mode="multiple"
              placeholder="Chọn lĩnh vực (không bắt buộc)"
              loading={dropdownLoading}
              options={categories.map((c) => ({
                label: c.name,
                value: c.id,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Địa điểm"
            name="branchId"
            rules={[{ required: true, message: "Vui lòng chọn chi nhánh" }]}
          >
            <Select
              placeholder="Chọn chi nhánh làm việc"
              loading={dropdownLoading}
              options={branches.map((b) => ({
                label: b.name,
                value: b.id,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Mức lương"
            name="salaryRange"
            rules={[{ required: true, message: "Vui lòng nhập mức lương" }]}
          >
            <Input placeholder="Ví dụ: 15 - 25 triệu" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Ngày bắt đầu nhận CV" name="startDate">
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày bắt đầu"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Hạn chót nộp CV" name="deadline">
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  placeholder="Chọn hạn chót"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Số lượng ứng viên tối đa" name="maxCandidates">
            <InputNumber
              style={{ width: "100%" }}
              min={1}
              placeholder="Ví dụ: 20"
            />
          </Form.Item>

          <Form.Item
            label="Mô tả công việc"
            name="description"
            rules={[{ required: true, message: "Vui lòng nhập mô tả công việc" }]}
          >
            <Input.TextArea rows={4} placeholder="Nhập mô tả công việc..." />
          </Form.Item>

          <Form.Item
            label="Yêu cầu"
            name="requirements"
            rules={[{ required: true, message: "Vui lòng nhập yêu cầu" }]}
          >
            <Input.TextArea rows={4} placeholder="Nhập yêu cầu công việc..." />
          </Form.Item>
        </Form>
      </Modal>

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
              <Descriptions.Item label="Số lượng tối đa" span={2}>
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
          </>
        )}
      </Modal>
    </PageContainer>
  );
}

export default JobManagementPage;