import {
  Card,
  Table,
  Space,
  Button,
  Select,
  Typography,
  Avatar,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
} from "antd";
import {
  LockOutlined,
  EditOutlined,
  PlusOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import PageContainer from "../../../../components/common/PageContainer";
import TableToolbar from "../../../../components/common/TableToolbar";
import { userService } from "../../services/userService";
import { branchService } from "../../../../services/jobService";
import { useEffect } from "react";

const { Text } = Typography;

function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [form] = Form.useForm();

  const [searchText, setSearchText] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedBranch, setSelectedBranch] = useState("all");

  const filteredUsers = users.filter((u) => {
    const searchKey = searchText.trim().toLowerCase();
    const nameMatch = (u.name || "").toLowerCase().includes(searchKey);
    const emailMatch = (u.email || "").toLowerCase().includes(searchKey);
    const matchesSearch = searchKey.length === 0 || nameMatch || emailMatch;

    let matchesRole = true;
    if (selectedRole !== "all") {
      if (selectedRole === "admin") matchesRole = u.role === "Admin";
      else if (selectedRole === "hr") matchesRole = u.role === "Recruiter";
      else if (selectedRole === "candidate") matchesRole = u.role === "Candidate";
    }

    let matchesBranch = true;
    if (selectedBranch !== "all" && u.role === "Recruiter") {
      matchesBranch = u.branches.includes(selectedBranch);
    }

    return matchesSearch && matchesRole && matchesBranch;
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers();
      // Đảm bảo data là một mảng trước khi dùng .map() (Xử lý trường hợp C# bọc bằng $values)
      const actualData = Array.isArray(data) ? data : data?.$values || [];
      // Map dữ liệu từ Backend C# sang đúng cấu trúc Frontend đang dùng
      const formattedData = actualData.map((item: any) => ({
        id: item.id,
        name: item.fullName || "Chưa cập nhật",
        email: item.email,
        role: item.role,
        status: item.status,
        branches: item.branchIds || [],
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
    } catch (e) {}
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
          branchIds: values.branches || [],
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
          branchIds: values.branches || [],
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
      const actionText = currentStatus === "Active" ? "Khóa" : "Mở khóa";
      message.success(result.message || `${actionText} tài khoản thành công!`);
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
        const avatarColor =
          record.role === "Admin" ? "#f5222d" : record.role === "Recruiter" ? "#1677ff" : "#52c41a";
        return (
          <Space>
            <Avatar style={{ backgroundColor: avatarColor, verticalAlign: "middle" }}>
              {name.charAt(0).toUpperCase()}
            </Avatar>
            <Text strong style={{ color: "#1f2937" }}>
              {name}
            </Text>
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
        const isOpt = role === "Admin" ? { bg: "#FEF2F2", border: "#FECACA", color: "#EF4444" } :
                      role === "Recruiter" ? { bg: "#EFF6FF", border: "#DBEAFE", color: "#2563EB" } :
                      { bg: "#F0FDF4", border: "#BBF7D0", color: "#10B981" };
        return (
          <span
            style={{
              display: "inline-block",
              padding: "4px 10px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 600,
              backgroundColor: isOpt.bg,
              border: `1px solid ${isOpt.border}`,
              color: isOpt.color,
            }}
          >
            {role === "Admin" ? "Admin Portal" : role === "Recruiter" ? "Recruiter (HR)" : "Candidate"}
          </span>
        );
      },
    },
    {
      title: "Chi nhánh phụ trách",
      dataIndex: "branches",
      key: "branches",
      render: (branchIds: string[], record: any) => {
        if (record.role !== "Recruiter") return <Text type="secondary">Không áp dụng</Text>;
        if (!branchIds || branchIds.length === 0)
          return <Text type="secondary">Chưa phân công</Text>;
        return (
          <Space wrap size={[0, 4]}>
            {branchIds.map((id) => {
              const bName = branches.find((b) => b.id === id)?.name || "Chi nhánh ẩn";
              return (
                <span
                  key={id}
                  style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 500,
                    backgroundColor: "#F1F5F9",
                    border: "1px solid #E2E8F0",
                    color: "#475569",
                  }}
                >
                  {bName}
                </span>
              );
            })}
          </Space>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const isActive = status === "Active";
        return (
          <span
            style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: 600,
              color: isActive ? "#166534" : "#991B1B",
              backgroundColor: isActive ? "#DCFCE7" : "#FEE2E2",
              border: isActive ? "1px solid #BBF7D0" : "1px solid #FCA5A5",
            }}
          >
            {isActive ? "Hoạt động" : "Đã khóa"}
          </span>
        );
      },
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            icon={<EditOutlined />}
            type="text"
            size="small"
            style={{ 
              color: "#2563EB", 
              display: "flex", 
              alignItems: "center",
              borderRadius: "6px",
              padding: "4px 8px",
            }}
            onClick={() => handleOpenEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title={
              record.status === "Active"
                ? "Bạn có chắc muốn khóa tài khoản này?"
                : "Mở khóa tài khoản này?"
            }
            onConfirm={() => handleToggleStatus(record.id, record.status)}
            okText="Đồng ý"
            cancelText="Hủy"
          >
            <Button
              icon={record.status === "Active" ? <LockOutlined /> : <UnlockOutlined />}
              type="text"
              size="small"
              danger={record.status === "Active"}
              style={{ 
                color: record.status === "Active" ? "#EF4444" : "#10B981",
                display: "flex", 
                alignItems: "center",
                borderRadius: "6px",
                padding: "4px 8px",
              }}
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
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
          Tạo tài khoản HR mới
        </Button>
      }
    >
      <Card>
        <TableToolbar
          searchPlaceholder="Tìm theo tên, email..."
          searchValue={searchText}
          onSearchChange={setSearchText}
          extra={
            <>
              <Select
                placeholder="Vai trò"
                style={{ width: 170 }}
                value={selectedRole}
                onChange={setSelectedRole}
                options={[
                  { label: "Tất cả vai trò", value: "all" },
                  { label: "Admin Portal", value: "admin" },
                  { label: "Recruiter (HR)", value: "hr" },
                  { label: "Ứng viên (Candidate)", value: "candidate" },
                ]}
              />
              <Select
                placeholder="Lọc theo Chi nhánh"
                style={{ width: 220 }}
                value={selectedBranch}
                onChange={setSelectedBranch}
                options={[
                  { label: "Tất cả chi nhánh", value: "all" },
                  ...branches.map((b: any) => ({ label: b.name || b.branchName, value: b.id || b.branchID })),
                ]}
              />
            </>
          }
        />
        <Table
          columns={columns}
          dataSource={filteredUsers}
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
          <Form.Item
            label="Họ và tên"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
          >
            <Input placeholder="Nhập họ và tên..." />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, type: "email", message: "Vui lòng nhập email hợp lệ" }]}
          >
            <Input placeholder="Nhập địa chỉ email..." disabled={!!editingUser} />
          </Form.Item>
          {!editingUser && (
            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
            >
              <Input.Password placeholder="Nhập mật khẩu..." />
            </Form.Item>
          )}
          <Form.Item
            label="Vai trò"
            name="role"
            rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}
          >
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
                <Form.Item
                  label="Chi nhánh phụ trách (Có thể chọn nhiều)"
                  name="branches"
                  rules={[{ required: true, message: "Vui lòng chọn ít nhất 1 chi nhánh" }]}
                >
                  <Select mode="multiple" placeholder="Chọn chi nhánh">
                    {branches
                      .filter((b) => b.isActive)
                      .map((b) => (
                        <Select.Option key={b.id} value={b.id}>
                          {b.name}
                        </Select.Option>
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
