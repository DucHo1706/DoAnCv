import { Card, Table, Tag, Space, Button, Select, Typography, Avatar, Modal, Form, Input, message, Popconfirm } from "antd";
import { LockOutlined, EditOutlined, PlusOutlined, UnlockOutlined, DeleteOutlined } from "@ant-design/icons";
import { useState } from "react";
import PageContainer from "../../components/common/PageContainer";
import TableToolbar from "../../components/common/TableToolbar";
import { userService } from "../../services/userService";
import { branchService } from "../../services/jobService";
import { useEffect } from "react";

const { Text } = Typography;

function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [form] = Form.useForm();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers();
      // Đảm bảo data là một mảng trước khi dùng .map() (Xử lý trường hợp C# bọc bằng $values)
      const actualData = Array.isArray(data) ? data : (data?.$values || []);
      // Map dữ liệu từ Backend C# sang đúng cấu trúc Frontend đang dùng
      const formattedData = actualData.map((item: any) => ({
        id: item.id,
        name: item.fullName || "Chưa cập nhật",
        email: item.email,
        role: item.role,
        status: item.status,
        branches: item.branchIds || []
      }));
      setUsers(formattedData);
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi tải danh sách người dùng!");
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const data = await branchService.getBranches();
      setBranches(data);
    } catch (e) { }
  };

  useEffect(() => {
    fetchUsers();
    fetchBranches();
  }, []);

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
        const payload = {
          name: values.name,
          branchIds: values.branches || []
        };
        await userService.updateUser(editingUser.id, payload);
        message.success("Cập nhật thông tin tài khoản thành công!");
        setIsModalOpen(false);
        fetchUsers(); // Tải lại danh sách
      } else {
        const payload = {
          name: values.name,
          email: values.email,
          password: values.password,
          role: values.role,
          branchIds: values.branches || []
        };
        await userService.createUser(payload);
        message.success("Tạo tài khoản thành công! Dữ liệu đã được lưu vào hệ thống.");
        setIsModalOpen(false);
        fetchUsers(); // Refresh danh sách
      }
    } catch (error) {
      message.error((error as any).response?.data?.message || "Lỗi khi lưu dữ liệu");
    }
  };

  // Xử lý Khóa/Mở khóa tài khoản
  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const result = await userService.toggleUserStatus(id);
      setUsers(users.map((u) => (u.id === id ? { ...u, status: result.newStatus } : u)));
      message.success(result.message || "Thao tác thành công!");
    } catch (error: any) {
      message.error(error.response?.data?.message || "Lỗi khi thay đổi trạng thái!");
    }
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
      render: (branchIds: string[], record: any) => {
        if (record.role !== "Recruiter") return <Text type="secondary">Không áp dụng</Text>;
        if (!branchIds || branchIds.length === 0) return <Text type="secondary">Chưa phân công</Text>;
        return <Space wrap size={[0, 4]}>
          {branchIds.map((id) => {
            const bName = branches.find(b => b.id === id)?.name || "Chi nhánh ẩn";
            return <Tag key={id} color="blue">{bName}</Tag>;
          })}
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
          loading={loading}
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
          <Input placeholder="Nhập địa chỉ email..." disabled={!!editingUser} />
          </Form.Item>
          {!editingUser && (
            <Form.Item label="Mật khẩu" name="password" rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}>
              <Input.Password placeholder="Nhập mật khẩu..." />
            </Form.Item>
          )}
          <Form.Item label="Vai trò" name="role" rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}>
          <Select placeholder="Chọn vai trò" disabled={!!editingUser}>
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
                    {branches.filter(b => b.isActive).map(b => (
                      <Select.Option key={b.id} value={b.id}>{b.name}</Select.Option>
                    ))}
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