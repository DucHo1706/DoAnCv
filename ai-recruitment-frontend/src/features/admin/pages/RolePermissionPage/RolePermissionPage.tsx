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
  Row,
  Col,
} from "antd";
import { EditOutlined, PlusOutlined, DeleteOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import PageContainer from "../../../../components/common/PageContainer";
import TableToolbar from "../../../../components/common/TableToolbar";
import StatCard from "../../../../components/common/StatCard";
import { roleService } from "../../services/roleService";
import type { RoleDto } from "../../services/roleService";

const { Text } = Typography;

const allPermissions = [
  { value: "manage_users", label: "Quản lý người dùng" },
  { value: "approve_jobs", label: "Duyệt tin tuyển dụng" },
  { value: "publish_close_jobs", label: "Khóa/Mở hiển thị tin tuyển dụng" },
  { value: "manage_roles", label: "Quản lý vai trò & phân quyền" },
  { value: "view_audit_logs", label: "Xem nhật ký hoạt động" },
  { value: "manage_branches", label: "Quản lý chi nhánh & danh mục" },
  { value: "view_reports", label: "Xem báo cáo thống kê" },
  { value: "create_jobs", label: "Tạo tin tuyển dụng (HR)" },
  { value: "view_candidates", label: "Xem hồ sơ ứng viên" },
  { value: "view_ai_scores", label: "Xem điểm bóc tách AI" },
  { value: "apply_jobs", label: "Ứng tuyển việc làm" },
  { value: "view_jobs", label: "Xem việc làm" },
  { value: "manage_profile", label: "Quản lý hồ sơ cá nhân" },
];

function RolePermissionPage() {
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDto | null>(null);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const data = await roleService.getRoles();
      setRoles(data);
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi tải danh sách vai trò hệ thống!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleOpenCreate = () => {
    setEditingRole(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: RoleDto) => {
    setEditingRole(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      if (editingRole) {
        await roleService.updateRole(editingRole.id, values);
        message.success("Cập nhật vai trò & phân quyền thành công!");
      } else {
        await roleService.createRole(values);
        message.success("Thêm mới vai trò hệ thống thành công!");
      }
      setIsModalOpen(false);
      fetchRoles();
    } catch (error) {
      console.error("Validation Failed:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await roleService.deleteRole(id);
      message.success("Đã xóa vai trò hệ thống!");
      fetchRoles();
    } catch (error) {
      console.error(error);
      message.error("Không thể xóa vai trò này!");
    }
  };

  const filteredRoles = roles.filter((role) => {
    const searchKey = searchText.trim().toLowerCase();
    const nameMatch = (role.name || "").toLowerCase().includes(searchKey);
    const descMatch = (role.description || "").toLowerCase().includes(searchKey);
    return searchKey.length === 0 || nameMatch || descMatch;
  });

  const columns = [
    {
      title: "Tên vai trò (Role)",
      dataIndex: "name",
      key: "name",
      width: 180,
      render: (text: string) => (
        <Space>
          <SafetyCertificateOutlined style={{ color: "#2563EB", fontSize: 16 }} />
          <Text strong style={{ color: "#0F172A", fontSize: 15 }}>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Mô tả vai trò",
      dataIndex: "description",
      key: "description",
      width: 280,
      render: (desc: string) => <Text style={{ color: "#475569" }}>{desc}</Text>,
    },
    {
      title: "Tập quyền truy cập thực tế (Permissions)",
      dataIndex: "permissions",
      key: "permissions",
      render: (perms: string[]) => (
        <Space wrap size={[4, 8]}>
          {perms?.map((p) => {
            const permObj = allPermissions.find((ap) => ap.value === p);
            const label = permObj ? permObj.label : p;
            return (
              <Tag key={p} color="blue" style={{ fontSize: 12, padding: "2px 8px", borderRadius: 8 }}>
                {label}
              </Tag>
            );
          })}
        </Space>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 160,
      render: (_: any, record: RoleDto) => (
        <Space size="middle">
          <Button
            icon={<EditOutlined />}
            type="text"
            style={{ color: "#2563EB", background: "#EFF6FF" }}
            onClick={() => handleOpenEdit(record)}
          >
            Sửa
          </Button>

          {record.name !== "Admin" && record.name !== "Recruiter" && record.name !== "Candidate" && (
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
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title="Phân quyền và vai trò hệ thống"
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8}>
          <StatCard title="Tổng số vai trò" value={roles.length} subtitle="Vai trò khả dụng trong hệ thống" />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <StatCard title="Tập quyền khả dụng" value={allPermissions.length} subtitle="Chức năng đã cấu hình phân quyền" />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <StatCard title="Trạng thái phân quyền" value="Đang áp dụng" subtitle="Đồng bộ CSDL Backend thời gian thực" />
        </Col>
      </Row>

      <Card bodyStyle={{ padding: 24 }}>
        <TableToolbar
          searchPlaceholder="Tìm theo tên vai trò, mô tả..."
          searchValue={searchText}
          onSearchChange={setSearchText}
          action={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
              Tạo vai trò mới
            </Button>
          }
        />

        <Table scroll={{ x: "max-content" }}
          columns={columns}
          dataSource={filteredRoles}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 5 }}
        />
      </Card>

      <Modal
        title={editingRole ? "Cập nhật vai trò & Phân quyền" : "Tạo vai trò mới"}
        open={isModalOpen}
        onOk={handleSave}
        confirmLoading={saving}
        onCancel={() => setIsModalOpen(false)}
        okText="Lưu vai trò"
        cancelText="Hủy"
        width={680}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Tên vai trò"
            rules={[{ required: true, message: "Vui lòng nhập tên vai trò!" }]}
          >
            <Input placeholder="Ví dụ: Recruiter_Lead, System_Auditor..." />
          </Form.Item>

          <Form.Item name="description" label="Mô tả vai trò">
            <Input.TextArea rows={2} placeholder="Mô tả ngắn về trách nhiệm và quyền hạn của vai trò này..." />
          </Form.Item>

          <Form.Item
            name="permissions"
            label="Cấp phát quyền hạn truy cập (Permissions)"
            rules={[{ required: true, message: "Vui lòng chọn ít nhất 1 quyền hạn!" }]}
          >
            <Select
              mode="multiple"
              allowClear
              style={{ width: "100%" }}
              placeholder="Chọn các quyền hạn truy cập..."
              options={allPermissions}
              optionFilterProp="label"
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
}

export default RolePermissionPage;
