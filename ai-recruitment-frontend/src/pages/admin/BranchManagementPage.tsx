import { Card, Table, Tag, Space, Button, Modal, Form, Input, message, Popconfirm, Select, Typography } from "antd";
import { EditOutlined, PlusOutlined, DeleteOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { useState } from "react";
import PageContainer from "../../components/common/PageContainer";
import TableToolbar from "../../components/common/TableToolbar";

const mockBranches = [
  { id: "1", name: "Trụ sở Hồ Chí Minh", address: "Quận 1, TP. HCM", phone: "028-1234-5678", status: "Active" },
  { id: "2", name: "Chi nhánh Hà Nội", address: "Cầu Giấy, Hà Nội", phone: "024-8765-4321", status: "Active" },
  { id: "3", name: "Chi nhánh Đà Nẵng", address: "Hải Châu, Đà Nẵng", phone: "0236-333-4444", status: "Inactive" },
];

function BranchManagementPage() {
  const [branches, setBranches] = useState(mockBranches);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [form] = Form.useForm();

  const handleOpenCreate = () => {
    setEditingBranch(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: any) => {
    setEditingBranch(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingBranch) {
        setBranches(branches.map((b) => (b.id === editingBranch.id ? { ...b, ...values } : b)));
        message.success("Cập nhật chi nhánh thành công!");
      } else {
        const newBranch = { id: Date.now().toString(), ...values };
        setBranches([...branches, newBranch]);
        message.success("Thêm mới chi nhánh thành công!");
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Validation Failed:", error);
    }
  };

  const handleDelete = (id: string) => {
    setBranches(branches.filter(b => b.id !== id));
    message.success("Đã xóa chi nhánh!");
  };

  const columns = [
    {
      title: "Tên chi nhánh",
      dataIndex: "name",
      key: "name",
      render: (text: string) => <Typography.Text strong><EnvironmentOutlined style={{ marginRight: 6, color: "#1677ff" }} />{text}</Typography.Text>
    },
    {
      title: "Địa chỉ",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "Active" ? "success" : "error"} style={{ borderRadius: "12px", padding: "2px 10px" }}>
          {status === "Active" ? "Hoạt động" : "Tạm ngưng"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} type="text" style={{ color: "#1677ff", background: "#e6f4ff" }} onClick={() => handleOpenEdit(record)}>Sửa</Button>
          <Popconfirm title="Bạn có chắc muốn xóa chi nhánh này?" onConfirm={() => handleDelete(record.id)} okText="Xóa" cancelText="Hủy">
            <Button icon={<DeleteOutlined />} type="text" danger style={{ background: "#fff2f0" }}>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="Quản lý Chi Nhánh" subtitle="Thêm, sửa, xóa thông tin các chi nhánh của công ty để gán cho các tài khoản HR." extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>Thêm Chi nhánh</Button>}>
      <Card>
        <TableToolbar searchPlaceholder="Tìm kiếm chi nhánh..." />
        <Table columns={columns} dataSource={branches} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title={editingBranch ? "Cập nhật Chi nhánh" : "Thêm Chi nhánh mới"} open={isModalOpen} onOk={handleSave} onCancel={() => setIsModalOpen(false)} okText="Lưu" cancelText="Hủy" destroyOnClose>
        <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item label="Tên chi nhánh" name="name" rules={[{ required: true, message: "Vui lòng nhập tên chi nhánh" }]}><Input placeholder="Ví dụ: Chi nhánh Cần Thơ..." /></Form.Item>
          <Form.Item label="Địa chỉ" name="address" rules={[{ required: true, message: "Vui lòng nhập địa chỉ" }]}><Input placeholder="Nhập địa chỉ cụ thể..." /></Form.Item>
          <Form.Item label="Số điện thoại" name="phone"><Input placeholder="Nhập số điện thoại liên hệ..." /></Form.Item>
          <Form.Item label="Trạng thái" name="status" initialValue="Active" rules={[{ required: true }]}>
            <Select options={[{ label: "Hoạt động", value: "Active" }, { label: "Tạm ngưng", value: "Inactive" }]} />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
}
export default BranchManagementPage;