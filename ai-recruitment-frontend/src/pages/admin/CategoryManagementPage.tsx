import {
  DeleteOutlined,
  PlusOutlined,
  LockOutlined,
  UnlockOutlined,
  SaveOutlined,
  FolderOutlined,
  FolderOpenOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Row,
  Space,
  Tree,
  TreeSelect,
  Typography,
} from "antd";
import { useEffect, useState, useMemo } from "react";
import PageContainer from "../../components/common/PageContainer";
import axiosClient from "../../services/axiosClient";

const { Text } = Typography;

function CategoryManagementPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Modal tạo mới
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm();

  // Form chỉnh sửa inline (Bên phải)
  const [editForm] = Form.useForm();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get("/Categories");
      const data = Array.isArray(response.data) ? response.data : response.data?.$values || [];
      setCategories(data);
      // Nếu mục đang chọn bị xóa bởi thao tác khác, reset lại
      if (selectedId && !data.find((c: any) => c.id === selectedId)) {
        setSelectedId(null);
      }
    } catch (error) {
      message.error("Lỗi khi tải danh sách lĩnh vực");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Dữ liệu cho Cây Thư Mục (Bên trái)
  const buildTreeData = (items: any[], parentId: string | null = null): any[] => {
    return items
      .filter((item) => item.parentId === parentId)
      .map((item) => {
        const children = buildTreeData(items, item.id);
        return {
          key: item.id,
          title: (
            <Space>
              <Text
                style={{
                  color: item.isActive ? "inherit" : "#999",
                  textDecoration: item.isActive ? "none" : "line-through",
                }}
              >
                {item.name}
              </Text>
              {!item.isActive && (
                <span
                  style={{
                    display: "inline-block",
                    padding: "1px 6px",
                    borderRadius: "999px",
                    fontSize: "11px",
                    fontWeight: 600,
                    backgroundColor: "#FEE2E2",
                    border: "1px solid #FCA5A5",
                    color: "#991B1B",
                    lineHeight: "12px",
                  }}
                >
                  Đã khóa
                </span>
              )}
            </Space>
          ),
          icon:
            children.length > 0 ? (
              <FolderOpenOutlined style={{ color: "#1677ff" }} />
            ) : (
              <FolderOutlined style={{ color: "#bae0ff" }} />
            ),
          children: children.length > 0 ? children : undefined,
        };
      });
  };

  // Dữ liệu cho TreeSelect (Dropdown chọn Cha)
  const buildTreeSelectData = (
    items: any[],
    parentId: string | null = null,
    forceDisable: boolean = false,
    editingId: string | null = null
  ): any[] => {
    return items
      .filter((item) => item.parentId === parentId)
      .map((item) => {
        // Chặn không cho chọn chính nó hoặc con cháu của nó làm thư mục cha (Tránh vòng lặp vô hạn)
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

  const treeData = buildTreeData(categories);
  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedId),
    [categories, selectedId]
  );

  // Khi chọn một node bên trái, nạp dữ liệu vào Form bên phải
  const handleSelectNode = (selectedKeys: React.Key[]) => {
    if (selectedKeys.length > 0) {
      const id = selectedKeys[0] as string;
      setSelectedId(id);
      const cat = categories.find((c) => c.id === id);
      if (cat) {
        editForm.setFieldsValue({
          name: cat.name,
          parentId: cat.parentId,
        });
      }
    } else {
      setSelectedId(null);
    }
  };

  // Mở modal tạo mới (truyền ID ngành cha nếu muốn tạo con)
  const handleOpenCreate = (parentId: string | null = null) => {
    createForm.resetFields();
    createForm.setFieldsValue({ parentId });
    setIsCreateModalOpen(true);
  };

  // Lưu tạo mới
  const handleCreateSave = async () => {
    try {
      const values = await createForm.validateFields();
      await axiosClient.post("/Categories", {
        name: values.name,
        parentId: values.parentId || null,
      });
      message.success("Thêm mới thành công!");
      setIsCreateModalOpen(false);
      fetchCategories();
    } catch (error: any) {
      message.error(error.response?.data || "Có lỗi xảy ra khi thêm mới");
    }
  };

  // Lưu chỉnh sửa (Bên phải)
  const handleEditSave = async () => {
    if (!selectedId) return;
    try {
      const values = await editForm.validateFields();
      await axiosClient.put(`/Categories/${selectedId}`, {
        name: values.name,
        parentId: values.parentId || null,
      });
      message.success("Cập nhật danh mục thành công!");
      fetchCategories();
    } catch (error: any) {
      message.error(error.response?.data || "Có lỗi xảy ra khi cập nhật");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axiosClient.delete(`/Categories/${id}`);
      message.success("Xóa thành công!");
      if (selectedId === id) setSelectedId(null);
      fetchCategories();
    } catch (error: any) {
      message.error(error.response?.data || "Không thể xóa!");
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const res = await axiosClient.put(`/Categories/${id}/toggle-status`);
      message.success(res.data.message || "Đổi trạng thái thành công!");
      fetchCategories();
    } catch (error: any) {
      message.error("Có lỗi xảy ra khi đổi trạng thái");
    }
  };

  const treeSelectDataForCreate = buildTreeSelectData(categories, null, false, null);
  const treeSelectDataForEdit = buildTreeSelectData(categories, null, false, selectedId);

  return (
    <PageContainer
      title="Danh mục Ngành nghề Tuyển dụng"
      subtitle="Quản lý toàn bộ Lĩnh vực và Chuyên ngành một cách trực quan."
    >
      <Row gutter={24}>
        {/* CỘT TRÁI: CÂY THƯ MỤC */}
        <Col xs={24} md={10} lg={9}>
          <Card
            title="Cấu trúc Ngành nghề"
            extra={
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => handleOpenCreate(null)}
              >
                Thêm Ngành chính
              </Button>
            }
            bodyStyle={{ padding: "16px", maxHeight: "calc(100vh - 250px)", overflowY: "auto" }}
          >
            {categories.length === 0 && !loading ? (
              <Empty description="Chưa có dữ liệu" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Tree
                showLine
                showIcon
                defaultExpandAll
                treeData={treeData}
                selectedKeys={selectedId ? [selectedId] : []}
                onSelect={handleSelectNode}
                style={{ fontSize: "15px" }}
              />
            )}
          </Card>
        </Col>

        {/* CỘT PHẢI: CHI TIẾT VÀ CHỈNH SỬA */}
        <Col xs={24} md={14} lg={15}>
          <Card
            title={selectedCategory ? `Chi tiết: ${selectedCategory.name}` : "Chi tiết Danh mục"}
          >
            {!selectedCategory ? (
              <div style={{ padding: "60px 0" }}>
                <Empty
                  description={
                    <Text type="secondary">
                      Vui lòng chọn một danh mục ở cột bên trái để xem và chỉnh sửa
                    </Text>
                  }
                />
              </div>
            ) : (
              <Form form={editForm} layout="vertical" onFinish={handleEditSave}>
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item
                      label="Tên danh mục / ngành nghề"
                      name="name"
                      rules={[{ required: true, message: "Vui lòng nhập tên" }]}
                    >
                      <Input placeholder="Nhập tên..." size="large" />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      label="Chuyển vào thư mục cha (Để trống nếu là cấp lớn nhất)"
                      name="parentId"
                      tooltip="Bạn có thể di chuyển ngành này sang một ngành khác bằng cách thay đổi thư mục cha."
                    >
                      <TreeSelect
                        showSearch
                        size="large"
                        style={{ width: "100%" }}
                        dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
                        placeholder="Không có (Cấp cao nhất)"
                        allowClear
                        treeDefaultExpandAll
                        treeData={treeSelectDataForEdit}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <div style={{ marginTop: 24, display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                    Lưu Thay Đổi
                  </Button>
                  <Button icon={<PlusOutlined />} onClick={() => handleOpenCreate(selectedId)}>
                    Thêm chuyên ngành con
                  </Button>

                  <div style={{ flex: 1 }}></div>

                  <Popconfirm
                    title={selectedCategory.isActive ? "Khóa mục này?" : "Mở khóa mục này?"}
                    onConfirm={() => handleToggleStatus(selectedId!)}
                  >
                    <Button
                      icon={selectedCategory.isActive ? <LockOutlined /> : <UnlockOutlined />}
                      danger={selectedCategory.isActive}
                      style={
                        !selectedCategory.isActive
                          ? { color: "#10B981", borderColor: "#BBF7D0", backgroundColor: "#F0FDF4" }
                          : { color: "#EF4444", borderColor: "#FECACA", backgroundColor: "#FEF2F2" }
                      }
                    >
                      {selectedCategory.isActive ? "Khóa danh mục" : "Mở khóa danh mục"}
                    </Button>
                  </Popconfirm>
                  <Popconfirm
                    title="Bạn có chắc chắn muốn xóa danh mục này?"
                    onConfirm={() => handleDelete(selectedId!)}
                  >
                    <Button danger icon={<DeleteOutlined />}>
                      Xóa
                    </Button>
                  </Popconfirm>
                </div>
              </Form>
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="Thêm Danh mục mới"
        open={isCreateModalOpen}
        onOk={handleCreateSave}
        onCancel={() => setIsCreateModalOpen(false)}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item
            label="Tên danh mục / ngành nghề"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập tên" }]}
          >
            <Input placeholder="Nhập tên..." />
          </Form.Item>

          <Form.Item label="Thuộc cấp (Để trống nếu là cấp lớn nhất)" name="parentId">
            <TreeSelect
              showSearch
              style={{ width: "100%" }}
              dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
              placeholder="Không có (Cấp cao nhất)"
              allowClear
              treeDefaultExpandAll
              treeData={treeSelectDataForCreate}
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
}

export default CategoryManagementPage;
