import { EditOutlined, PlusOutlined, LockOutlined, UnlockOutlined } from "@ant-design/icons";
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
  TreeSelect,
  Typography,
} from "antd";
import { useEffect, useState, useMemo } from "react";
import PageContainer from "../../../../components/common/PageContainer";
import TableToolbar from "../../../../components/common/TableToolbar";
import axiosClient from "../../../../services/axiosClient";

const { Text } = Typography;

function JobPositionManagementPage() {
  const [positions, setPositions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [posRes, catRes] = await Promise.all([
        axiosClient.get("/JobPositions"),
        axiosClient.get("/Categories"),
      ]);
      setPositions(Array.isArray(posRes.data) ? posRes.data : posRes.data?.$values || []);
      setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data?.$values || []);
    } catch (error) {
      message.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const buildTreeSelectData = (items: any[], parentId: string | null = null): any[] => {
    return items
      .filter((item) => item.parentId === parentId)
      .map((item) => {
        const children = buildTreeSelectData(items, item.id);
        return {
          value: item.id,
          title: item.name,
          children: children.length > 0 ? children : undefined,
        };
      });
  };

  const treeData = useMemo(() => buildTreeSelectData(categories), [categories]);

  // Nhóm các vị trí công việc theo lĩnh vực (Category)
  const groupedPositions = useMemo(() => {
    const groups: any[] = [];
    positions.forEach((pos) => {
      const groupId = "group_" + (pos.categoryId || "unassigned");
      let group = groups.find((g) => g.id === groupId);
      if (!group) {
        group = {
          id: groupId,
          name: pos.categoryName || "Chưa phân loại",
          isCategoryGroup: true,
          children: [],
        };
        groups.push(group);
      }
      group.children.push({ ...pos, key: pos.id });
    });
    groups.sort((a, b) => a.name.localeCompare(b.name));
    groups.forEach((g) => g.children.sort((a: any, b: any) => a.name.localeCompare(b.name)));
    return groups;
  }, [positions]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: any) => {
    setEditingItem(record);
    form.setFieldsValue({
      name: record.name,
      categoryId: record.categoryId,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingItem) {
        await axiosClient.put(`/JobPositions/${editingItem.id}`, values);
        message.success("Cập nhật thành công!");
      } else {
        await axiosClient.post("/JobPositions", values);
        message.success("Thêm mới thành công!");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data || "Có lỗi xảy ra");
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const res = await axiosClient.put(`/JobPositions/${id}/toggle-status`);
      message.success(res.data?.message || "Thao tác thành công");
      fetchData();
    } catch (error) {
      message.error("Có lỗi xảy ra");
    }
  };

  const columns = [
    {
      title: "Lĩnh vực / Tên vị trí",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: any) => {
        if (record.isCategoryGroup) {
          return (
            <Text strong style={{ fontSize: 15, color: "#2563EB" }}>
              📂 {text}
            </Text>
          );
        }
        return <Text style={{ paddingLeft: 16 }}>{text}</Text>;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean, record: any) => {
        if (record.isCategoryGroup) return null;
        return (
          <Tag color={isActive ? "success" : "error"}>{isActive ? "Hoạt động" : "Đã khóa"}</Tag>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_: any, record: any) => {
        if (record.isCategoryGroup) return null;
        return (
          <Space>
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleOpenEdit(record)}
              style={{ color: "#2563EB" }}
            >
              Sửa
            </Button>
            <Popconfirm
              title={record.isActive ? "Khóa vị trí này?" : "Mở khóa vị trí này?"}
              onConfirm={() => handleToggleStatus(record.id)}
            >
              <Button
                type="text"
                icon={record.isActive ? <LockOutlined /> : <UnlockOutlined />}
                danger={record.isActive}
                style={!record.isActive ? { color: "#10B981" } : {}}
              >
                {record.isActive ? "Khóa" : "Mở"}
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <PageContainer
      title="Quản lý vị trí công việc"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
          Thêm Vị trí
        </Button>
      }
    >
      <Card>
        <TableToolbar searchPlaceholder="Tìm kiếm vị trí..." />
        <Table scroll={{ x: "max-content" }}
          columns={columns}
          dataSource={groupedPositions}
          rowKey="id"
          loading={loading}
          defaultExpandAllRows
          pagination={false}
        />
      </Card>
      <Modal
        title={editingItem ? "Cập nhật Vị trí" : "Thêm Vị trí mới"}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Tên vị trí"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập tên" }]}
          >
            <Input placeholder="Ví dụ: Frontend Developer" />
          </Form.Item>
          <Form.Item
            label="Thuộc Lĩnh vực/Chuyên ngành"
            name="categoryId"
            rules={[{ required: true, message: "Vui lòng chọn lĩnh vực" }]}
          >
            <TreeSelect
              showSearch
              treeData={treeData}
              placeholder="Chọn lĩnh vực..."
              treeDefaultExpandAll
              allowClear
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
}

export default JobPositionManagementPage;
