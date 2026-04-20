import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SolutionOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Space,
  Table,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import PageContainer from "../../components/common/PageContainer";
import TableToolbar from "../../components/common/TableToolbar";
import { jobPositionService } from "../../services/jobService";
import type { JobPositionDto } from "../../services/jobService";

function JobPositionManagementPage() {
  const [positions, setPositions] = useState<JobPositionDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<JobPositionDto | null>(null);
  const [form] = Form.useForm();

  // ── Fetch ──────────────────────────────────────────────
  const fetchPositions = async () => {
    try {
      setLoading(true);
      const data = await jobPositionService.getJobPositions();
      setPositions(data);
    } catch {
      message.error("Không tải được danh sách vị trí");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  // ── Modal handlers ─────────────────────────────────────
  const handleOpenCreate = () => {
    setEditingPosition(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: JobPositionDto) => {
    setEditingPosition(record);
    form.setFieldsValue({ name: record.name });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (editingPosition) {
        const updated = await jobPositionService.updateJobPosition(editingPosition.id, {
          name: values.name,
        });
        setPositions((prev) =>
          prev.map((p) => (p.id === editingPosition.id ? updated : p))
        );
        message.success("Cập nhật vị trí thành công!");
      } else {
        const created = await jobPositionService.createJobPosition({ name: values.name });
        setPositions((prev) => [...prev, created]);
        message.success("Thêm mới vị trí thành công!");
      }

      setIsModalOpen(false);
    } catch (error: any) {
      if (error?.response) {
        const msg =
          error.response.data?.message ||
          error.response.data ||
          "Thao tác thất bại";
        message.error(typeof msg === "string" ? msg : "Thao tác thất bại");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await jobPositionService.deleteJobPosition(id);
      setPositions((prev) => prev.filter((p) => p.id !== id));
      message.success("Đã xóa vị trí!");
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        "Xóa thất bại";
      message.error(typeof msg === "string" ? msg : "Xóa thất bại");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Columns ────────────────────────────────────────────
  const columns = [
    {
      title: "Tên vị trí",
      dataIndex: "name",
      key: "name",
      render: (text: string) => (
        <Typography.Text strong>
          <SolutionOutlined style={{ marginRight: 6, color: "#1677ff" }} />
          {text}
        </Typography.Text>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 160,
      render: (_: unknown, record: JobPositionDto) => (
        <Space size="middle">
          <Button
            icon={<EditOutlined />}
            type="text"
            style={{ color: "#1677ff", background: "#e6f4ff" }}
            onClick={() => handleOpenEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc muốn xóa vị trí này?"
            description="Vị trí đang được dùng trong tin tuyển dụng sẽ không thể xóa."
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button
              icon={<DeleteOutlined />}
              type="text"
              danger
              style={{ background: "#fff2f0" }}
              loading={deletingId === record.id}
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────
  return (
    <PageContainer
      title="Quản lý Vị trí công việc"
      subtitle="Thêm, sửa, xóa các vị trí để HR chọn khi tạo tin tuyển dụng."
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenCreate}
        >
          Thêm Vị trí
        </Button>
      }
    >
      <Card>
        <TableToolbar searchPlaceholder="Tìm kiếm vị trí..." />
        <Table
          columns={columns}
          dataSource={positions}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingPosition ? "Cập nhật Vị trí" : "Thêm Vị trí mới"}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={submitting}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item
            label="Tên vị trí"
            name="name"
            rules={[
              { required: true, message: "Vui lòng nhập tên vị trí" },
              { whitespace: true, message: "Tên không được chỉ có khoảng trắng" },
            ]}
          >
            <Input placeholder="Ví dụ: Frontend Developer" />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
}

export default JobPositionManagementPage;