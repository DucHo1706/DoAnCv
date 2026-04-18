import { Card, Table, Tag, Space, Button, Select, Typography, Avatar, Modal, Form, Input, message, Popconfirm } from "antd";
import { LockOutlined, EditOutlined, PlusOutlined, UnlockOutlined, DeleteOutlined } from "@ant-design/icons";
import { useState } from "react";
import PageContainer from "../../components/common/PageContainer";
import TableToolbar from "../../components/common/TableToolbar";

const { Text } = Typography;

const mockUsers = [
  { id: "1", name: "Nguyễn Văn Admin", email: "admin@recruitment.com", role: "Admin", status: "Active", branches: [] },
  { id: "2", name: "Trần Thị HR", email: "hr_tran@company.com", role: "Recruiter", status: "Active", branches: ["Trụ sở Hồ Chí Minh", "Chi nhánh Đà Nẵng"] },
  { id: "3", name: "Lê Minh HR 2", email: "leminh_hr@company.com", role: "Recruiter", status: "Active", branches: ["Chi nhánh Hà Nội"] },
  { id: "4", name: "Phạm Văn Tuyển Dụng", email: "phamvan@hr.com", role: "Recruiter", status: "Banned", branches: ["Chi nhánh Đà Nẵng"] },
  { id: "5", name: "Hoàng Ứng Viên", email: "hoang_candidate@gmail.com", role: "Candidate", status: "Active", branches: [] },
];

function UserManagementPage() {
  const [users, setUsers] = useState(mockUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form] = Form.useForm();

  // Mở Form Thêm Mới
  const handleOpenCreate = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  // Mở Form Cập Nhật
  const handleOpenEdit = (record: any) => {
    setEditingUser(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  // Xử lý Lưu (Thêm/Sửa)
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingUser) {
        setUsers(users.map((u) => (u.id === editingUser.id ? { ...u, ...values } : u)));
        message.success("Cập nhật thông tin thành công!");
      } else {
        const newUser = { id: Date.now().toString(), status: "Active", ...values };
        setUsers([newUser, ...users]);
        message.success("Tạo tài khoản thành công!");
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Validation Failed:", error);
    }
  };

  // Xử lý Khóa/Mở khóa tài khoản
  const handleToggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "Active" ? "Banned" : "Active";
    setUsers(users.map((u) => (u.id === id ? { ...u, status: newStatus } : u)));
    message.success(`Đã ${newStatus === "Active" ? "mở khóa" : "khóa"} tài khoản!`);
  };

  const columns = [
    {
      title: "Họ và tên",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: any) => {
        // Đổi màu Avatar theo Role cho trực quan
        const avatarColor = record.role === "Admin" ? "#f5222d" : record.role === "Recruiter" ? "#1677ff" : "#52c41a";
        return (
          <Space>
            <Avatar style={{ backgroundColor: avatarColor, verticalAlign: 'middle' }}>
              {name.charAt(0).toUpperCase()}
            </Avatar>
            <Text strong style={{ color: "#1f2937" }}>{name}</Text>
          </Space>
        );
      },
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      render: (role: string) => {
        let color = role === "Admin" ? "volcano" : role === "Recruiter" ? "geekblue" : "cyan";
        return <Tag color={color} style={{ borderRadius: "4px" }}>{role}</Tag>;
      },
    },
    {
      title: "Chi nhánh phụ trách",
      dataIndex: "branches",
      key: "branches",
      render: (branches: string[], record: any) => {
        if (record.role !== "Recruiter") return <Text type="secondary">Không áp dụng</Text>;
        if (!branches || branches.length === 0) return <Text type="secondary">Chưa phân công</Text>;
        return <Space wrap size={[0, 4]}>
          {branches.map((b) => <Tag key={b} color="blue">{b}</Tag>)}
        </Space>;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag 
          color={status === "Active" ? "success" : "error"} 
          style={{ borderRadius: "12px", padding: "2px 10px", fontWeight: 500 }}
        >
          {status === "Active" ? "Hoạt động" : "Đã khóa"}
        </Tag>
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
            title={record.status === "Active" ? "Bạn có chắc muốn khóa tài khoản này?" : "Mở khóa tài khoản này?"}
            onConfirm={() => handleToggleStatus(record.id, record.status)}
            okText="Đồng ý"
            cancelText="Hủy"
          >
            <Button 
              icon={record.status === "Active" ? <LockOutlined /> : <UnlockOutlined />} 
              type="text" 
              danger={record.status === "Active"}
              style={record.status !== "Active" ? { color: "#52c41a", background: "#f6ffed" } : { background: "#fff2f0" }}
            >
              {record.status === "Active" ? "Khóa" : "Mở"}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title="Quản lý HR & Người dùng"
      subtitle="Quản trị tài khoản Nhà tuyển dụng (HR) theo từng chi nhánh, Ứng viên và cấp quyền."
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
          Tạo tài khoản HR mới
        </Button>
      }
    >
      <Card>
        <TableToolbar
          searchPlaceholder="Tìm theo tên, email..."
          extra={
            <>
              <Select
                placeholder="Vai trò"
                style={{ width: 150 }}
                options={[
                  { label: "Tất cả", value: "all" },
                  { label: "Recruiter (HR)", value: "hr" },
                  { label: "Ứng viên", value: "candidate" },
                ]}
              />
              <Select
                placeholder="Chi nhánh"
                style={{ width: 180 }}
                options={[
                  { label: "Trụ sở Hồ Chí Minh", value: "hcm" },
                  { label: "Chi nhánh Hà Nội", value: "hn" },
                  { label: "Chi nhánh Đà Nẵng", value: "dn" },
                ]}
              />
            </>
          }
        />
        <Table 
          columns={columns} 
          dataSource={users} 
          rowKey="id" 
          pagination={{ pageSize: 5 }}
        />
      </Card>

      {/* Modal Thêm/Sửa Người Dùng */}
      <Modal
        title={editingUser ? "Cập nhật thông tin tài khoản" : "Tạo tài khoản HR mới"}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        okText="Lưu thông tin"
        cancelText="Hủy bỏ"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item label="Họ và tên" name="name" rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}>
            <Input placeholder="Nhập họ và tên..." />
          </Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true, type: "email", message: "Vui lòng nhập email hợp lệ" }]}>
            <Input placeholder="Nhập địa chỉ email..." />
          </Form.Item>
          {!editingUser && (
            <Form.Item label="Mật khẩu" name="password" rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}>
              <Input.Password placeholder="Nhập mật khẩu..." />
            </Form.Item>
          )}
          <Form.Item label="Vai trò" name="role" rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}>
            <Select placeholder="Chọn vai trò">
              <Select.Option value="Admin">Quản trị viên (Admin)</Select.Option>
              <Select.Option value="Recruiter">Nhà tuyển dụng (HR)</Select.Option>
              <Select.Option value="Candidate">Ứng viên (Candidate)</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item 
            noStyle 
            shouldUpdate={(prevValues, currentValues) => prevValues.role !== currentValues.role}
          >
            {({ getFieldValue }) =>
              getFieldValue("role") === "Recruiter" ? (
                <Form.Item label="Chi nhánh phụ trách (Có thể chọn nhiều)" name="branches" rules={[{ required: true, message: "Vui lòng chọn ít nhất 1 chi nhánh" }]}>
                  <Select mode="multiple" placeholder="Chọn chi nhánh">
                    <Select.Option value="Trụ sở Hồ Chí Minh">Trụ sở Hồ Chí Minh</Select.Option>
                    <Select.Option value="Chi nhánh Hà Nội">Chi nhánh Hà Nội</Select.Option>
                    <Select.Option value="Chi nhánh Đà Nẵng">Chi nhánh Đà Nẵng</Select.Option>
                  </Select>
                </Form.Item>
              ) : null
            }
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
}

export default UserManagementPage;