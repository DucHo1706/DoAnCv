import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  TagsOutlined,
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
import { categoryService } from "../../services/jobService";
import type { CategoryDto } from "../../services/jobService";

function CategoryManagementPage() {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(null);
  const [form] = Form.useForm();

  // ── Fetch ──────────────────────────────────────────────
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch {
      message.error("Không tải được danh sách lĩnh vực");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ── Modal handlers ─────────────────────────────────────
  const handleOpenCreate = () => {
    setEditingCategory(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: CategoryDto) => {
    setEditingCategory(record);
    form.setFieldsValue({ name: record.name });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (editingCategory) {
        const updated = await categoryService.updateCategory(editingCategory.id, {
          name: values.name,
        });
        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategory.id ? updated : c))
        );
        message.success("Cập nhật lĩnh vực thành công!");
      } else {
        const created = await categoryService.createCategory({ name: values.name });
        setCategories((prev) => [...prev, created]);
        message.success("Thêm mới lĩnh vực thành công!");
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
      await categoryService.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      message.success("Đã xóa lĩnh vực!");
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
      title: "Tên lĩnh vực",
      dataIndex: "name",
      key: "name",
      render: (text: string) => (
        <Typography.Text strong>
          <TagsOutlined style={{ marginRight: 6, color: "#1677ff" }} />
          {text}
        </Typography.Text>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 160,
      render: (_: unknown, record: CategoryDto) => (
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
            title="Bạn có chắc muốn xóa lĩnh vực này?"
            description="Lĩnh vực đang được dùng trong tin tuyển dụng sẽ không thể xóa."
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
      title="Quản lý Lĩnh vực"
      subtitle="Thêm, sửa, xóa các lĩnh vực để HR chọn khi tạo tin tuyển dụng."
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenCreate}
        >
          Thêm Lĩnh vực
        </Button>
      }
    >
      <Card>
        <TableToolbar searchPlaceholder="Tìm kiếm lĩnh vực..." />
        <Table
          columns={columns}
          dataSource={categories}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingCategory ? "Cập nhật Lĩnh vực" : "Thêm Lĩnh vực mới"}
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
            label="Tên lĩnh vực"
            name="name"
            rules={[
              { required: true, message: "Vui lòng nhập tên lĩnh vực" },
              { whitespace: true, message: "Tên không được chỉ có khoảng trắng" },
            ]}
          >
            <Input placeholder="Ví dụ: Công nghệ thông tin" />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
}

export default CategoryManagementPage;