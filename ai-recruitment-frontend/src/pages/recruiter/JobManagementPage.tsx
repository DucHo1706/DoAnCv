import { EditOutlined, EyeOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
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
import { useEffect, useMemo, useState } from "react";
import PageContainer from "../../components/common/PageContainer";
import StatCard from "../../components/common/StatCard";
import TableToolbar from "../../components/common/TableToolbar";
import { jobService } from "../../services/jobService";
import type {
  CategoryDto,
  CreateJobPayload,
  JobDto,
  JobReviewResponse,
} from "../../services/jobService";

const { Paragraph, Text } = Typography;
type JobStatus = "approved" | "pending";

type JobTableItem = {
  id: string;
  title: string;
  field: string;
  location: string;
  type: string;
  applications: number;
  status: JobStatus;
  raw: JobDto;
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
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [form] = Form.useForm();

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [jobDetail, setJobDetail] = useState<JobReviewResponse | null>(null);
  const [categories, setCategories] = useState<CategoryDto[]>([]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data: any = await jobService.getJobs();
      // Bảo vệ giao diện: Chống sập White Screen nếu API trả về Object lỗi
      setJobs(Array.isArray(data) ? data : (data?.$values || []));
    } catch (error) {
      console.error(error);
      message.error("Không tải được danh sách tin tuyển dụng");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
  try {
    const data = await jobService.getCategories();
    setCategories(data);
  } catch (error) {
    console.error(error);
    message.error("Không tải được danh sách lĩnh vực");
  }
  };

  useEffect(() => {
  fetchJobs();
  fetchCategories();
  }, []);

  const tableData: JobTableItem[] = useMemo(() => {
  return jobs.map((job) => {
    const status: JobStatus = job.isApproved ? "approved" : "pending";

    return {
      id: job.id,
      title: job.position?.name || "Chưa cập nhật vị trí",
      field: "Chưa hoàn thiện",
      location: job.branch?.name || "Chưa cập nhật chi nhánh",
      type: "Chưa hoàn thiện",
      applications: 0,
      status,
      raw: job,
    };
  });
  }, [jobs]);

  const approvedJobs = tableData.filter((job) => job.status === "approved").length;
  const pendingJobs = tableData.filter((job) => job.status === "pending").length;
  const totalApplications = tableData.reduce(
    (sum, job) => sum + job.applications,
    0,
  );

  const handleCreateJob = async () => {
    try {
      const values = await form.validateFields();

      const payload: CreateJobPayload = {
      title: values.title,
      description: values.description,
      requirements: values.requirements,
      location: values.location,
      salaryRange: values.salaryRange,
      startDate: values.startDate || null,
      deadline: values.deadline || null,
      maxCandidates: values.maxCandidates ?? null,
      categoryIds: values.categoryIds || [],
      };

      setSubmitting(true);
      await jobService.createJob(payload);
      message.success("Tạo tin tuyển dụng thành công, bài đang chờ duyệt");

      form.resetFields();
      setOpenModal(false);
      await fetchJobs();
    } catch (error) {
      console.error(error);
      message.error("Tạo tin tuyển dụng thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewJob = async (record: JobTableItem) => {
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
      title: "Loại hình",
      dataIndex: "type",
      key: "type",
      render: (value: string) => <Text type="secondary">{value}</Text>,
    },
    {
      title: "Hồ sơ",
      dataIndex: "applications",
      key: "applications",
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

  return (
    <PageContainer
      title="Quản lý tin tuyển dụng"
      subtitle="Tạo, cập nhật và theo dõi hiệu quả các vị trí tuyển dụng đang mở."
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpenModal(true)}>
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
            title="Tổng hồ sơ nhận được"
            value={totalApplications}
            subtitle="Toàn bộ tin tuyển dụng"
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
                options={[
                  { label: "Tất cả", value: "all" },
                  { label: "Đã duyệt", value: "approved" },
                  { label: "Chờ duyệt", value: "pending" },
                ]}
              />
              <Select
                placeholder="Lĩnh vực"
                style={{ width: 220 }}
                options={categories.map((category) => ({
                  label: category.name,
                  value: category.id,
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

      <Modal
        title="Tạo tin tuyển dụng"
        open={openModal}
        onCancel={() => setOpenModal(false)}
        onOk={handleCreateJob}
        confirmLoading={submitting}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Tên vị trí"
            name="title"
            rules={[{ required: true, message: "Vui lòng chọn vị trí tuyển dụng" }]}
          >
            <Select placeholder="Chọn vị trí tuyển dụng" showSearch>
              <Select.Option value="Frontend Developer">Frontend Developer</Select.Option>
              <Select.Option value="Backend Developer">Backend Developer</Select.Option>
              <Select.Option value="Fullstack Developer">Fullstack Developer</Select.Option>
              <Select.Option value="Business Analyst">Business Analyst</Select.Option>
              <Select.Option value="Tester / QA">Tester / QA</Select.Option>
              <Select.Option value="UI/UX Designer">UI/UX Designer</Select.Option>
              <Select.Option value="Project Manager">Project Manager</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Lĩnh vực"
            name="categoryIds"
            // rules={[{ required: true, message: "Vui lòng chọn ít nhất 1 lĩnh vực" }]} //bỏ validate để không bắt buộc chọn lĩnh vực, vì chưa có lĩnh vực nào được tạo sẵn trong hệ thống
          >
            <Select
              mode="multiple"
              placeholder="Chọn lĩnh vực"
              options={categories.map((category) => ({
                label: category.name,
                value: category.id,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Chi nhánh (Địa điểm)"
            name="location"
            rules={[{ required: true, message: "Vui lòng chọn chi nhánh" }]}
          >
            <Select placeholder="Chọn chi nhánh làm việc">
              <Select.Option value="Trụ sở Hồ Chí Minh">Trụ sở Hồ Chí Minh</Select.Option>
              <Select.Option value="Chi nhánh Hà Nội">Chi nhánh Hà Nội</Select.Option>
              <Select.Option value="Chi nhánh Đà Nẵng">Chi nhánh Đà Nẵng</Select.Option>
              <Select.Option value="Remote (Làm việc từ xa)">Remote (Làm việc từ xa)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Mức lương"
            name="salaryRange"
            rules={[{ required: true, message: "Vui lòng nhập mức lương" }]}
          >
            <Input placeholder="Ví dụ: 15 - 25 triệu" />
          </Form.Item>

          <Form.Item label="Ngày bắt đầu" name="startDate">
            <Input placeholder="Ví dụ: 2026-03-18T00:00:00" />
          </Form.Item>

          <Form.Item label="Ngày kết thúc" name="deadline">
            <Input placeholder="Ví dụ: 2026-04-01T00:00:00" />
          </Form.Item>

          <Form.Item label="Số lượng ứng viên tối đa" name="maxCandidates">
            <InputNumber style={{ width: "100%" }} min={1} placeholder="Ví dụ: 20" />
          </Form.Item>

          <Form.Item
            label="Yêu cầu"
            name="requirements"
            rules={[{ required: true, message: "Vui lòng nhập yêu cầu" }]}
          >
            <Input.TextArea rows={4} placeholder="Nhập yêu cầu công việc..." />
          </Form.Item>

          <Form.Item
            label="Mô tả công việc"
            name="description"
            rules={[{ required: true, message: "Vui lòng nhập mô tả công việc" }]}
          >
            <Input.TextArea rows={4} placeholder="Nhập mô tả công việc..." />
          </Form.Item>
        </Form>
      </Modal>

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
        {jobDetail && (
          <>
            <Space style={{ marginBottom: 16 }}>
              <Tag color={detailStatusMeta.color}>{detailStatusMeta.label}</Tag>
              <Text type="secondary">
                Tạo lúc: {formatDate(jobDetail.jobInfo.createdAt)}
              </Text>
            </Space>

            <Descriptions bordered column={2} size="middle">
              <Descriptions.Item label="Tên vị trí" span={2}>
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
              <Descriptions.Item label="Ngày kết thúc">
                {formatDate(jobDetail.jobInfo.deadline)}
              </Descriptions.Item>
              <Descriptions.Item label="Số lượng ứng viên tối đa" span={2}>
                {jobDetail.jobInfo.maxCandidates ?? "Chưa cập nhật"}
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