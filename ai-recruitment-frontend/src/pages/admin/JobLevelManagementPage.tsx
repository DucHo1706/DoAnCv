import { DeleteOutlined, PlusOutlined, LockOutlined, UnlockOutlined, SaveOutlined, FolderOutlined, FolderOpenOutlined } from "@ant-design/icons";
import { Button, Card, Col, Empty, Form, Input, message, Modal, Popconfirm, Row, Space, Tag, Tree, TreeSelect, Typography } from "antd";
import { useEffect, useState, useMemo } from "react";
import PageContainer from "../../components/common/PageContainer";
import axiosClient from "../../services/axiosClient";

const { Title, Text } = Typography;

function JobLevelManagementPage() {
  const [levels, setLevels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const fetchLevels = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get("/JobLevels");
      const data = Array.isArray(response.data) ? response.data : (response.data?.$values || []);
      setLevels(data);
      if (selectedId && !data.find((c: any) => c.id === selectedId)) {
        setSelectedId(null);
      }
    } catch (error) {
      message.error("Lỗi khi tải danh sách cấp bậc");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLevels();
  }, []);

  const buildTreeData = (items: any[], parentId: string | null = null): any[] => {
    return items
      .filter((item) => item.parentId === parentId)
      .map((item) => {
        const children = buildTreeData(items, item.id);
        return {
          key: item.id,
          title: (
            <Space>
              <Text style={{ color: item.isActive ? "inherit" : "#999", textDecoration: item.isActive ? "none" : "line-through" }}>
                {item.name}
              </Text>
              {!item.isActive && <Tag color="error" style={{ fontSize: '10px', padding: '0 4px', lineHeight: '14px', border: 0 }}>Đã khóa</Tag>}
            </Space>
          ),
          icon: children.length > 0 ? <FolderOpenOutlined style={{ color: '#fa8c16' }} /> : <FolderOutlined style={{ color: '#ffd591' }} />,
          children: children.length > 0 ? children : undefined,
        };
      });
  };

  const buildTreeSelectData = (items: any[], parentId: string | null = null, forceDisable: boolean = false, editingId: string | null = null): any[] => {
    return items
      .filter((item) => item.parentId === parentId)
      .map((item) => {
        const isCurrentEditNode = item.id === editingId;
        const shouldDisable = forceDisable || isCurrentEditNode;
        const children = buildTreeSelectData(items, item.id, shouldDisable, editingId);
        return {
          value: item.id,
          title: item.name,
          disabled: shouldDisable,
          children: children.length > 0 ? children : undefined,
        };
      });
  };

  const treeData = buildTreeData(levels);
  const selectedLevel = useMemo(() => levels.find(c => c.id === selectedId), [levels, selectedId]);

  const handleSelectNode = (selectedKeys: React.Key[]) => {
    if (selectedKeys.length > 0) {
      const id = selectedKeys[0] as string;
      setSelectedId(id);
      const lvl = levels.find(c => c.id === id);
      if (lvl) {
        editForm.setFieldsValue({
          name: lvl.name,
          parentId: lvl.parentId
        });
      }
    } else {
      setSelectedId(null);
    }
  };

  const handleOpenCreate = (parentId: string | null = null) => {
    createForm.resetFields();
    createForm.setFieldsValue({ parentId });
    setIsCreateModalOpen(true);
  };

  const handleCreateSave = async () => {
    try {
      const values = await createForm.validateFields();
      await axiosClient.post("/JobLevels", { name: values.name, parentId: values.parentId || null });
      message.success("Thêm mới thành công!");
      setIsCreateModalOpen(false);
      fetchLevels();
    } catch (error: any) {
      message.error(error.response?.data || "Có lỗi xảy ra khi thêm mới");
    }
  };

  const handleEditSave = async () => {
    if (!selectedId) return;
    try {
      const values = await editForm.validateFields();
      await axiosClient.put(`/JobLevels/${selectedId}`, { name: values.name, parentId: values.parentId || null });
      message.success("Cập nhật cấp bậc thành công!");
      fetchLevels();
    } catch (error: any) {
      message.error(error.response?.data || "Có lỗi xảy ra khi cập nhật");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axiosClient.delete(`/JobLevels/${id}`);
      message.success("Xóa thành công!");
      if (selectedId === id) setSelectedId(null);
      fetchLevels();
    } catch (error: any) {
      message.error(error.response?.data || "Không thể xóa!");
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const res = await axiosClient.put(`/JobLevels/${id}/toggle-status`);
      message.success(res.data.message || "Đổi trạng thái thành công!");
      fetchLevels();
    } catch (error: any) {
      message.error("Có lỗi xảy ra khi đổi trạng thái");
    }
  };

  const treeSelectDataForCreate = buildTreeSelectData(levels, null, false, null);
  const treeSelectDataForEdit = buildTreeSelectData(levels, null, false, selectedId);

  return (
    <PageContainer
      title="Cấu trúc Cấp Bậc (Job Levels)"
      subtitle="Quản lý các cấp bậc phân loại nhân sự. Ví dụ: Fresher, Junior, Middle, Senior..."
    >
      <Row gutter={24}>
        {/* CỘT TRÁI: CÂY THƯ MỤC */}
        <Col xs={24} md={10} lg={9}>
          <Card title="Danh sách Cấp bậc" extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => handleOpenCreate(null)}>Thêm Nhóm Cấp</Button>} bodyStyle={{ padding: "16px", maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
            {levels.length === 0 && !loading ? (
              <Empty description="Chưa có dữ liệu" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Tree showLine showIcon defaultExpandAll treeData={treeData} selectedKeys={selectedId ? [selectedId] : []} onSelect={handleSelectNode} style={{ fontSize: '15px' }} />
            )}
          </Card>
        </Col>

        {/* CỘT PHẢI: CHI TIẾT VÀ CHỈNH SỬA */}
        <Col xs={24} md={14} lg={15}>
          <Card title={selectedLevel ? `Chi tiết: ${selectedLevel.name}` : "Chi tiết Cấp bậc"}>
            {!selectedLevel ? (
              <div style={{ padding: '60px 0' }}><Empty description={<Text type="secondary">Vui lòng chọn một cấp bậc ở cột bên trái để xem và chỉnh sửa</Text>} /></div>
            ) : (
              <Form form={editForm} layout="vertical" onFinish={handleEditSave}>
                <Row gutter={16}>
                  <Col span={24}><Form.Item label="Tên cấp bậc" name="name" rules={[{ required: true, message: "Vui lòng nhập tên" }]}><Input placeholder="Nhập tên..." size="large" /></Form.Item></Col>
                  <Col span={24}>
                    <Form.Item label="Chuyển vào nhóm cấp cha (Để trống nếu là cấp độc lập)" name="parentId">
                      <TreeSelect showSearch size="large" style={{ width: '100%' }} dropdownStyle={{ maxHeight: 400, overflow: 'auto' }} placeholder="Không có (Độc lập)" allowClear treeDefaultExpandAll treeData={treeSelectDataForEdit} />
                    </Form.Item>
                  </Col>
                </Row>
                <div style={{ marginTop: 24, display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>Lưu Thay Đổi</Button>
                  <Button icon={<PlusOutlined />} onClick={() => handleOpenCreate(selectedId)}>Thêm cấp con</Button>
                  <div style={{ flex: 1 }}></div>
                  <Popconfirm title={selectedLevel.isActive ? "Khóa cấp này?" : "Mở khóa cấp này?"} onConfirm={() => handleToggleStatus(selectedId)}>
                    <Button icon={selectedLevel.isActive ? <LockOutlined /> : <UnlockOutlined />} danger={selectedLevel.isActive} style={!selectedLevel.isActive ? { color: "#52c41a", borderColor: "#52c41a" } : {}}>{selectedLevel.isActive ? "Khóa" : "Mở khóa"}</Button>
                  </Popconfirm>
                  <Popconfirm title="Bạn có chắc chắn muốn xóa cấp bậc này?" onConfirm={() => handleDelete(selectedId)}>
                    <Button danger icon={<DeleteOutlined />}>Xóa</Button>
                  </Popconfirm>
                </div>
              </Form>
            )}
          </Card>
        </Col>
      </Row>

      <Modal title="Thêm Cấp bậc mới" open={isCreateModalOpen} onOk={handleCreateSave} onCancel={() => setIsCreateModalOpen(false)} destroyOnClose>
        <Form form={createForm} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item label="Tên cấp bậc" name="name" rules={[{ required: true, message: "Vui lòng nhập tên" }]}><Input placeholder="Ví dụ: Senior..." /></Form.Item>
          <Form.Item label="Thuộc nhóm cấp" name="parentId"><TreeSelect showSearch style={{ width: '100%' }} dropdownStyle={{ maxHeight: 400, overflow: 'auto' }} placeholder="Không có (Độc lập)" allowClear treeDefaultExpandAll treeData={treeSelectDataForCreate} /></Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
}

export default JobLevelManagementPage;