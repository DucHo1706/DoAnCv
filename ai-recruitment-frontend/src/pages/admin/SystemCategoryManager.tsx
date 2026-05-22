import {
  EditOutlined,
  LockOutlined,
  PlusOutlined,
  UnlockOutlined,
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
  Tag,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import PageContainer from "../../components/common/PageContainer";
import TableToolbar from "../../components/common/TableToolbar";

interface SystemCategoryManagerProps {
  title: string;
  subtitle: string;
  entityName: string; // VD: "Chi nhánh", "Lĩnh vực"
  icon: React.ReactNode;
  fetchApi: () => Promise<any[]>;
  createApi: (payload: any) => Promise<any>;
  updateApi: (id: string, payload: any) => Promise<any>;
  toggleStatusApi: (id: string) => Promise<any>;
}

export default function SystemCategoryManager({
  title,
  subtitle,
  entityName,
  icon,
  fetchApi,
  createApi,
  updateApi,
  toggleStatusApi,
}: SystemCategoryManagerProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [form] = Form.useForm();

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchApi();
      setData(Array.isArray(res) ? res : (res as any).$values || []);
    } catch {
      message.error(`Không tải được danh sách ${entityName.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: any) => {
    setEditingItem(record);
    form.setFieldsValue({ name: record.name });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (editingItem) {
        await updateApi(editingItem.id, { name: values.name });
        message.success(`Cập nhật ${entityName.toLowerCase()} thành công!`);
      } else {
        await createApi({ name: values.name });
        message.success(`Thêm mới ${entityName.toLowerCase()} thành công!`);
      }

      setIsModalOpen(false);
      loadData();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.response?.data || "Thao tác thất bại";
      message.error(typeof msg === "string" ? msg : "Thao tác thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (record: any) => {
    try {
      const res = await toggleStatusApi(record.id);
      setData((prev) => prev.map((item) => item.id === record.id ? { ...item, isActive: res.isActive } : item));
      message.success(res.message || "Thao tác thành công!");
    } catch (error: any) {
      message.error("Lỗi khi thay đổi trạng thái!");
    }
  };

  const columns = [
    {
      title: `Tên ${entityName.toLowerCase()}`,
      dataIndex: "name",
      key: "name",
      render: (text: string) => (<Typography.Text strong><span style={{ marginRight: 6, color: "#1677ff" }}>{icon}</span>{text}</Typography.Text>),
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (<Tag color={isActive ? "success" : "error"} style={{ borderRadius: "12px", padding: "2px 10px", fontWeight: 500 }}>{isActive ? "Hoạt động" : "Đã khóa"}</Tag>),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 200,
      render: (_: unknown, record: any) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} type="text" style={{ color: "#1677ff", background: "#e6f4ff" }} onClick={() => handleOpenEdit(record)}>Sửa</Button>
          <Popconfirm title={record.isActive ? `Khóa ${entityName.toLowerCase()} này?` : `Mở khóa ${entityName.toLowerCase()} này?`} onConfirm={() => handleToggleStatus(record)} okText="Đồng ý" cancelText="Hủy">
            <Button icon={record.isActive ? <LockOutlined /> : <UnlockOutlined />} type="text" danger={record.isActive} style={!record.isActive ? { color: "#52c41a", background: "#f6ffed" } : { background: "#fff2f0" }}>{record.isActive ? "Khóa" : "Mở"}</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title={title} subtitle={subtitle} extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>Thêm {entityName}</Button>}>
      <Card>
        <TableToolbar searchPlaceholder={`Tìm kiếm ${entityName.toLowerCase()}...`} />
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>
      <Modal title={editingItem ? `Cập nhật ${entityName}` : `Thêm ${entityName} mới`} open={isModalOpen} onOk={handleSave} onCancel={() => setIsModalOpen(false)} confirmLoading={submitting} okText="Lưu" cancelText="Hủy" destroyOnClose>
        <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item label={`Tên ${entityName.toLowerCase()}`} name="name" rules={[{ required: true, message: `Vui lòng nhập tên ${entityName.toLowerCase()}` }, { whitespace: true, message: "Tên không được chỉ có khoảng trắng" }]}><Input placeholder={`Ví dụ tên ${entityName.toLowerCase()}...`} /></Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
}