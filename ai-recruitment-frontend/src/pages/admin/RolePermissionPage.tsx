import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Modal,
  Form,
  Input,
  message,
  Select,
  Typography,
  Popconfirm,
} from "antd";
import { EditOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { useState } from "react";
import PageContainer from "../../components/common/PageContainer";
import TableToolbar from "../../components/common/TableToolbar";



const mockRoles = [
  {
    id: "1",
    name: "Admin",
    description: "Quản trị viên toàn quyền hệ thống",
    permissions: ["manage_users", "approve_jobs", "manage_branches", "view_reports"],
  },
  {
    id: "2",
    name: "Recruiter",
    description: "Nhà tuyển dụng (HR)",
    permissions: ["create_jobs", "view_candidates", "view_ai_scores"],
  },
  {
    id: "3",
    name: "Candidate",
    description: "Ứng viên tìm việc",
    permissions: ["apply_jobs", "view_jobs", "manage_profile"],
  },
];

const allPermissions = [
  { value: "manage_users", label: "Quản lý người dùng" },
  { value: "approve_jobs", label: "Duyệt tin tuyển dụng" },
  { value: "manage_branches", label: "Quản lý chi nhánh" },
  { value: "view_reports", label: "Xem báo cáo" },
  { value: "create_jobs", label: "Tạo tin tuyển dụng" },
  { value: "view_candidates", label: "Xem hồ sơ ứng viên" },
  { value: "view_ai_scores", label: "Xem điểm AI" },
  { value: "apply_jobs", label: "Ứng tuyển việc làm" },
  { value: "view_jobs", label: "Xem việc làm" },
  { value: "manage_profile", label: "Quản lý hồ sơ cá nhân" },
];

function RolePermissionPage() {
  const [roles, setRoles] = useState(mockRoles);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [form] = Form.useForm();

  const handleOpenCreate = () => {
    setEditingRole(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: any) => {
    setEditingRole(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingRole) {
        setRoles(roles.map((r) => (r.id === editingRole.id ? { ...r, ...values } : r)));
        message.success("Cập nhật vai trò thành công!");
      } else {
        const newRole = { id: Date.now().toString(), ...values };
        setRoles([...roles, newRole]);
        message.success("Thêm mới vai trò thành công!");
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Validation Failed:", error);
    }
  };

  const handleDelete = (id: string) => {
    setRoles(roles.filter((r) => r.id !== id));
    message.success("Đã xóa vai trò!");
  };

  const columns = [
    {
      title: "Tên vai trò",
      dataIndex: "name",
      key: "name",
      render: (text: string) => <Typography.Text strong>{text}</Typography.Text>,
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Danh sách quyền (Permissions)",
      dataIndex: "permissions",
      key: "permissions",
      render: (perms: string[]) => (
        <Space wrap size={[0, 4]}>
          {perms?.map((p) => {
            const permLabel = allPermissions.find((ap) => ap.value === p)?.label || p;
            return (
              <Tag key={p} color="cyan">
                {permLabel}
              </Tag>
            );
          })}
        </Space>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: any, record: any) => (
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
            title="Bạn có chắc muốn xóa vai trò này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button icon={<DeleteOutlined />} type="text" danger style={{ background: "#fff2f0" }}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title="Phân quyền & Vai trò"
      subtitle="Tạo và quản lý các vai trò trong hệ thống, thiết lập quyền hạn truy cập chức năng."
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
          Tạo Vai trò mới
        </Button>
      }
    >
      <Card>
        <TableToolbar searchPlaceholder="Tìm kiếm vai trò..." />
        <Table columns={columns} dataSource={roles} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>

      <Modal
        title={editingRole ? "Cập nhật Vai trò" : "Thêm Vai trò mới"}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnClose
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item
            label="Tên vai trò"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập tên" }]}
          >
            <Input placeholder="Ví dụ: Editor, Reviewer..." />
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <Input.TextArea placeholder="Mô tả quyền hạn..." rows={2} />
          </Form.Item>
          <Form.Item
            label="Quyền hạn (Permissions)"
            name="permissions"
            rules={[{ required: true, message: "Vui lòng chọn ít nhất 1 quyền" }]}
          >
            <Select mode="multiple" placeholder="Chọn các quyền" options={allPermissions} />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
}

export default RolePermissionPage;
