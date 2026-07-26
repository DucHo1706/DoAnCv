import { useState, useEffect, useMemo } from "react";
import {
  Card,
  Tabs,
  Table,
  Tag,
  Space,
  Button,
  Modal,
  Form,
  Input,
  message,
  Typography,
  Popconfirm,
  TreeSelect,
  Row,
  Col,
  Select,
  Badge,
  Tooltip,
} from "antd";
import {
  EnvironmentOutlined,
  AppstoreOutlined,
  OrderedListOutlined,
  SolutionOutlined,
  PlusOutlined,
  EditOutlined,
  LockOutlined,
  UnlockOutlined,
  SearchOutlined,
  ApartmentOutlined,
  DownloadOutlined,
  FilterOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  FolderOutlined,
  FileTextOutlined,
  ReloadOutlined,
  SortAscendingOutlined,
} from "@ant-design/icons";
import { useSearchParams } from "react-router-dom";
import PageContainer from "../../../../components/common/PageContainer";
import axiosClient from "../../../../services/axiosClient";
import { branchService } from "../../../../services/jobService";
import { appTheme } from "../../../../constants/theme";
import { exportToCsv } from "../../../../utils/exportUtils";

const { Text } = Typography;

export default function OrganizationManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabKey = searchParams.get("tab") || "branches";

  const handleTabChange = (key: string) => {
    setSearchParams({ tab: key });
  };

  return (
    <PageContainer
      title="Quản lý Cơ cấu Tổ chức"
      subtitle="Quản lý tập trung các danh mục nền tảng: Chi nhánh làm việc, Lĩnh vực Ngành nghề, Cấp bậc và Vị trí công việc"
    >
      <Card
        style={{
          borderRadius: appTheme.radius.lg,
          border: `1px solid ${appTheme.colors.border}`,
          boxShadow: appTheme.shadow.card,
        }}
        bodyStyle={{ padding: "16px 24px 24px" }}
      >
        <Tabs
          activeKey={activeTabKey}
          onChange={handleTabChange}
          type="line"
          size="large"
          items={[
            {
              key: "branches",
              label: (
                <Space size={8}>
                  <EnvironmentOutlined style={{ color: appTheme.colors.primary }} />
                  <span>Chi nhánh</span>
                </Space>
              ),
              children: <BranchTab />,
            },
            {
              key: "categories",
              label: (
                <Space size={8}>
                  <AppstoreOutlined style={{ color: appTheme.colors.accent }} />
                  <span>Lĩnh vực ngành nghề</span>
                </Space>
              ),
              children: <CategoryTab />,
            },
            {
              key: "job-levels",
              label: (
                <Space size={8}>
                  <OrderedListOutlined style={{ color: appTheme.colors.info }} />
                  <span>Cấp bậc công việc</span>
                </Space>
              ),
              children: <JobLevelTab />,
            },
            {
              key: "job-positions",
              label: (
                <Space size={8}>
                  <SolutionOutlined style={{ color: appTheme.colors.success }} />
                  <span>Vị trí công việc</span>
                </Space>
              ),
              children: <JobPositionTab />,
            },
          ]}
        />
      </Card>
    </PageContainer>
  );
}

/* ============================================================
   TAB 1: CHI NHÁNH (Branches Table List with Multi-filters & Sort)
   ============================================================ */
function BranchTab() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name-asc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await branchService.getBranches();
      const data = Array.isArray(res) ? res : (res as any)?.$values || [];
      setBranches(data);
    } catch (err) {
      message.error("Không tải được danh sách Chi nhánh");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const isFiltered = searchText.trim() !== "" || statusFilter !== "all" || sortBy !== "name-asc";

  const handleResetFilters = () => {
    setSearchText("");
    setStatusFilter("all");
    setSortBy("name-asc");
  };

  const filteredBranches = useMemo(() => {
    return branches
      .filter((b) => {
        const q = searchText.trim().toLowerCase();
        const matchesSearch = !q || b.name.toLowerCase().includes(q);
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && b.isActive) ||
          (statusFilter === "inactive" && !b.isActive);
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "name-asc") return a.name.localeCompare(b.name);
        if (sortBy === "name-desc") return b.name.localeCompare(a.name);
        if (sortBy === "status") return Number(b.isActive) - Number(a.isActive);
        return 0;
      });
  }, [branches, searchText, statusFilter, sortBy]);

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
      setSaving(true);

      if (editingItem) {
        await branchService.updateBranch(editingItem.id, { name: values.name });
        message.success("Cập nhật Chi nhánh thành công!");
      } else {
        await branchService.createBranch({ name: values.name });
        message.success("Thêm mới Chi nhánh thành công!");
      }
      setIsModalOpen(false);
      fetchBranches();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || "Thao tác thất bại!";
      message.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await branchService.toggleBranchStatus(id);
      message.success("Cập nhật trạng thái Chi nhánh thành công");
      fetchBranches();
    } catch (err) {
      message.error("Lỗi khi thay đổi trạng thái!");
    }
  };

  const handleExportCsv = () => {
    const headers = ["ID Chi Nhánh", "Tên Chi Nhánh", "Trạng Thái"];
    const rows = filteredBranches.map((b) => [
      b.id,
      b.name,
      b.isActive ? "Hoạt động" : "Đã khóa",
    ]);
    exportToCsv("Danh_Sach_Chi_Nhanh", headers, rows);
    message.success("Đã xuất danh sách Chi nhánh ra file Excel (CSV)!");
  };

  const columns = [
    {
      title: "Tên Chi nhánh Làm việc",
      dataIndex: "name",
      key: "name",
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
      render: (text: string, record: any) => (
        <Space>
          <EnvironmentOutlined style={{ color: appTheme.colors.primary }} />
          <Text strong style={{ color: record.isActive ? appTheme.colors.textPrimary : "#94A3B8" }}>
            {text}
          </Text>
        </Space>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 150,
      filters: [
        { text: "Hoạt động", value: true },
        { text: "Đã khóa", value: false },
      ],
      onFilter: (value: any, record: any) => record.isActive === value,
      render: (isActive: boolean) =>
        isActive ? (
          <Tag color="success" style={{ borderRadius: 6, fontWeight: 700, padding: "2px 10px" }}>
            Hoạt động
          </Tag>
        ) : (
          <Tag color="error" style={{ borderRadius: 6, fontWeight: 600, padding: "2px 10px" }}>
            Đã khóa
          </Tag>
        ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 200,
      render: (_: any, record: any) => (
        <Space size={8}>
          <Button icon={<EditOutlined />} onClick={() => handleOpenEdit(record)} size="small">
            Sửa
          </Button>
          <Popconfirm
            title={record.isActive ? "Khóa chi nhánh này?" : "Mở khóa chi nhánh này?"}
            onConfirm={() => handleToggleStatus(record.id)}
            okText="Đồng ý"
            cancelText="Hủy"
          >
            <Button icon={record.isActive ? <LockOutlined /> : <UnlockOutlined />} danger={record.isActive} size="small">
              {record.isActive ? "Khóa" : "Mở"}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ paddingTop: 12 }}>
      {/* Detailed Multi-filter Bar */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }} align="middle" justify="space-between">
        <Col xs={24} xl={18}>
          <Row gutter={[10, 10]} align="middle">
            <Col xs={24} sm={9} md={7}>
              <Input
                placeholder="Tìm kiếm chi nhánh..."
                prefix={<SearchOutlined style={{ color: "#94A3B8" }} />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                style={{ borderRadius: 8 }}
              />
            </Col>

            <Col xs={24} sm={7} md={5}>
              <Select
                style={{ width: "100%" }}
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                options={[
                  { value: "all", label: "Tất cả trạng thái" },
                  {
                    value: "active",
                    label: (
                      <Space size={6}>
                        <CheckCircleFilled style={{ color: "#10B981" }} />
                        <span>Đang hoạt động</span>
                      </Space>
                    ),
                  },
                  {
                    value: "inactive",
                    label: (
                      <Space size={6}>
                        <CloseCircleFilled style={{ color: "#EF4444" }} />
                        <span>Đã khóa</span>
                      </Space>
                    ),
                  },
                ]}
              />
            </Col>

            <Col xs={24} sm={8} md={6}>
              <Select
                style={{ width: "100%" }}
                value={sortBy}
                onChange={(val) => setSortBy(val)}
                suffixIcon={<SortAscendingOutlined />}
                options={[
                  { value: "name-asc", label: "Sắp xếp: Tên (A → Z)" },
                  { value: "name-desc", label: "Sắp xếp: Tên (Z → A)" },
                  { value: "status", label: "Sắp xếp: Hoạt động trước" },
                ]}
              />
            </Col>

            {isFiltered && (
              <Col xs={24} sm={6} md={3}>
                <Button icon={<ReloadOutlined />} onClick={handleResetFilters} danger type="dashed">
                  Xóa lọc
                </Button>
              </Col>
            )}

            <Col xs={24} sm={18} md={3}>
              <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                Hiển thị <Text strong>{filteredBranches.length}</Text> / {branches.length} chi nhánh
              </Text>
            </Col>
          </Row>
        </Col>

        <Col xs={24} xl={6} style={{ textAlign: "right" }}>
          <Space size={8}>
            <Button icon={<DownloadOutlined />} onClick={handleExportCsv}>
              Xuất Excel
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenCreate}
              style={{ background: appTheme.colors.primary, borderRadius: 8 }}
            >
              Thêm Chi nhánh
            </Button>
          </Space>
        </Col>
      </Row>

      <Table
        dataSource={filteredBranches.map((b) => ({ ...b, key: b.id }))}
        columns={columns}
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        bordered
        style={{ background: "#FFFFFF", borderRadius: 12 }}
      />

      <Modal
        title={editingItem ? "Chỉnh sửa Chi nhánh làm việc" : "Thêm mới Chi nhánh làm việc"}
        open={isModalOpen}
        onOk={handleSave}
        confirmLoading={saving}
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Tên Chi nhánh làm việc"
            rules={[{ required: true, message: "Vui lòng nhập tên chi nhánh!" }]}
          >
            <Input placeholder="Ví dụ: Chi nhánh Hà Nội, Chi nhánh TP.HCM, Chi nhánh Đà Nẵng..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

/* ============================================================
   TAB 2: LĨNH VỰC NGÀNH NGHỀ (Categories Table List with Multi-filters & Sort)
   ============================================================ */
function CategoryTab() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name-asc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/Categories");
      const data = Array.isArray(res.data) ? res.data : res.data?.$values || [];
      setCategories(data);
    } catch (err) {
      message.error("Không tải được danh sách Lĩnh vực ngành nghề");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const isFiltered = searchText.trim() !== "" || statusFilter !== "all" || levelFilter !== "all" || sortBy !== "name-asc";

  const handleResetFilters = () => {
    setSearchText("");
    setStatusFilter("all");
    setLevelFilter("all");
    setSortBy("name-asc");
  };

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

  const treeSelectData = useMemo(() => buildTreeSelectData(categories), [categories]);

  const filteredCategories = useMemo(() => {
    return categories
      .filter((c) => {
        const q = searchText.trim().toLowerCase();
        const matchesSearch =
          !q ||
          c.name.toLowerCase().includes(q) ||
          (categoryMap.get(c.parentId) || "").toLowerCase().includes(q);

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && c.isActive) ||
          (statusFilter === "inactive" && !c.isActive);

        const matchesLevel =
          levelFilter === "all" ||
          (levelFilter === "root" && !c.parentId) ||
          (levelFilter === "child" && !!c.parentId);

        return matchesSearch && matchesStatus && matchesLevel;
      })
      .sort((a, b) => {
        if (sortBy === "name-asc") return a.name.localeCompare(b.name);
        if (sortBy === "name-desc") return b.name.localeCompare(a.name);
        if (sortBy === "status") return Number(b.isActive) - Number(a.isActive);
        return 0;
      });
  }, [categories, searchText, statusFilter, levelFilter, sortBy, categoryMap]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: any) => {
    setEditingItem(record);
    form.setFieldsValue({
      name: record.name,
      parentId: record.parentId || undefined,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      if (editingItem) {
        await axiosClient.put(`/Categories/${editingItem.id}`, {
          name: values.name,
          parentId: values.parentId || null,
        });
        message.success("Cập nhật Lĩnh vực thành công!");
      } else {
        await axiosClient.post("/Categories", {
          name: values.name,
          parentId: values.parentId || null,
        });
        message.success("Thêm mới Lĩnh vực ngành nghề thành công!");
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || "Thao tác thất bại!";
      message.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await axiosClient.put(`/Categories/${id}/toggle-status`);
      message.success("Cập nhật trạng thái Lĩnh vực thành công");
      fetchCategories();
    } catch (err) {
      message.error("Lỗi khi thay đổi trạng thái!");
    }
  };

  const handleExportCsv = () => {
    const headers = ["ID Lĩnh Vực", "Tên Lĩnh Vực", "Danh Mục Cha", "Trạng Thái"];
    const rows = filteredCategories.map((c) => [
      c.id,
      c.name,
      c.parentId ? categoryMap.get(c.parentId) || c.parentId : "Danh mục gốc",
      c.isActive ? "Hoạt động" : "Đã khóa",
    ]);
    exportToCsv("Danh_Sach_Linh_Vuc_Nganh_Nghe", headers, rows);
    message.success("Đã xuất danh sách Lĩnh vực ra file Excel (CSV)!");
  };

  const columns = [
    {
      title: "Tên Lĩnh vực Ngành nghề",
      dataIndex: "name",
      key: "name",
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
      render: (text: string, record: any) => (
        <Space>
          <ApartmentOutlined style={{ color: appTheme.colors.primary }} />
          <Text strong style={{ color: record.isActive ? appTheme.colors.textPrimary : "#94A3B8" }}>
            {text}
          </Text>
        </Space>
      ),
    },
    {
      title: "Danh mục Cha",
      dataIndex: "parentId",
      key: "parentId",
      render: (parentId: string | null) => {
        if (!parentId) return <Tag color="blue">Danh mục gốc</Tag>;
        const parentName = categoryMap.get(parentId);
        return parentName ? <Tag color="default">{parentName}</Tag> : <Text type="secondary">—</Text>;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 150,
      filters: [
        { text: "Hoạt động", value: true },
        { text: "Đã khóa", value: false },
      ],
      onFilter: (value: any, record: any) => record.isActive === value,
      render: (isActive: boolean) =>
        isActive ? (
          <Tag color="success" style={{ borderRadius: 6, fontWeight: 700, padding: "2px 10px" }}>
            Hoạt động
          </Tag>
        ) : (
          <Tag color="error" style={{ borderRadius: 6, fontWeight: 600, padding: "2px 10px" }}>
            Đã khóa
          </Tag>
        ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 200,
      render: (_: any, record: any) => (
        <Space size={8}>
          <Button icon={<EditOutlined />} onClick={() => handleOpenEdit(record)} size="small">
            Sửa
          </Button>
          <Popconfirm
            title={record.isActive ? "Bạn có chắc muốn khóa lĩnh vực này?" : "Mở khóa lĩnh vực này?"}
            onConfirm={() => handleToggleStatus(record.id)}
            okText="Đồng ý"
            cancelText="Hủy"
          >
            <Button icon={record.isActive ? <LockOutlined /> : <UnlockOutlined />} danger={record.isActive} size="small">
              {record.isActive ? "Khóa" : "Mở"}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ paddingTop: 12 }}>
      {/* Multi-filter Bar */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }} align="middle" justify="space-between">
        <Col xs={24} xl={18}>
          <Row gutter={[10, 10]} align="middle">
            <Col xs={24} sm={8} md={6}>
              <Input
                placeholder="Tìm tên lĩnh vực..."
                prefix={<SearchOutlined style={{ color: "#94A3B8" }} />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                style={{ borderRadius: 8 }}
              />
            </Col>

            <Col xs={24} sm={7} md={5}>
              <Select
                style={{ width: "100%" }}
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                options={[
                  { value: "all", label: "Tất cả trạng thái" },
                  {
                    value: "active",
                    label: (
                      <Space size={6}>
                        <CheckCircleFilled style={{ color: "#10B981" }} />
                        <span>Hoạt động</span>
                      </Space>
                    ),
                  },
                  {
                    value: "inactive",
                    label: (
                      <Space size={6}>
                        <CloseCircleFilled style={{ color: "#EF4444" }} />
                        <span>Đã khóa</span>
                      </Space>
                    ),
                  },
                ]}
              />
            </Col>

            <Col xs={24} sm={7} md={5}>
              <Select
                style={{ width: "100%" }}
                value={levelFilter}
                onChange={(val) => setLevelFilter(val)}
                options={[
                  { value: "all", label: "Tất cả cấp độ" },
                  {
                    value: "root",
                    label: (
                      <Space size={6}>
                        <FolderOutlined style={{ color: appTheme.colors.primary }} />
                        <span>Danh mục gốc</span>
                      </Space>
                    ),
                  },
                  {
                    value: "child",
                    label: (
                      <Space size={6}>
                        <FileTextOutlined style={{ color: appTheme.colors.textSecondary }} />
                        <span>Danh mục con</span>
                      </Space>
                    ),
                  },
                ]}
              />
            </Col>

            <Col xs={24} sm={8} md={5}>
              <Select
                style={{ width: "100%" }}
                value={sortBy}
                onChange={(val) => setSortBy(val)}
                suffixIcon={<SortAscendingOutlined />}
                options={[
                  { value: "name-asc", label: "Tên (A → Z)" },
                  { value: "name-desc", label: "Tên (Z → A)" },
                  { value: "status", label: "Hoạt động trước" },
                ]}
              />
            </Col>

            {isFiltered && (
              <Col xs={24} sm={6} md={3}>
                <Button icon={<ReloadOutlined />} onClick={handleResetFilters} danger type="dashed">
                  Xóa lọc
                </Button>
              </Col>
            )}

            <Col xs={24} sm={18} md={3}>
              <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                Hiển thị <Text strong>{filteredCategories.length}</Text> / {categories.length} lĩnh vực
              </Text>
            </Col>
          </Row>
        </Col>

        <Col xs={24} xl={6} style={{ textAlign: "right" }}>
          <Space size={8}>
            <Button icon={<DownloadOutlined />} onClick={handleExportCsv}>
              Xuất Excel
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenCreate}
              style={{ background: appTheme.colors.accent, borderRadius: 8 }}
            >
              Thêm Lĩnh vực mới
            </Button>
          </Space>
        </Col>
      </Row>

      <Table
        dataSource={filteredCategories.map((c) => ({ ...c, key: c.id }))}
        columns={columns}
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        bordered
        style={{ background: "#FFFFFF", borderRadius: 12 }}
      />

      <Modal
        title={editingItem ? "Chỉnh sửa Lĩnh vực Ngành nghề" : "Thêm mới Lĩnh vực Ngành nghề"}
        open={isModalOpen}
        onOk={handleSave}
        confirmLoading={saving}
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Tên Lĩnh vực Ngành nghề"
            rules={[{ required: true, message: "Vui lòng nhập tên lĩnh vực!" }]}
          >
            <Input placeholder="Ví dụ: Công nghệ thông tin, Marketing, Tài chính..." />
          </Form.Item>

          <Form.Item name="parentId" label="Danh mục Cha (Để trống nếu là Danh mục gốc)">
            <TreeSelect
              showSearch
              style={{ width: "100%" }}
              dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
              placeholder="Chọn danh mục cha (Không bắt buộc)"
              allowClear
              treeDefaultExpandAll
              treeData={treeSelectData}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

/* ============================================================
   TAB 3: CẤP BẬC CÔNG VIỆC (Job Levels Table List with Multi-filters & Sort)
   ============================================================ */
function JobLevelTab() {
  const [levels, setLevels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name-asc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const fetchLevels = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/JobLevels");
      const data = Array.isArray(res.data) ? res.data : res.data?.$values || [];
      setLevels(data);
    } catch (err) {
      message.error("Không tải được danh sách Cấp bậc công việc");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLevels();
  }, []);

  const levelMap = useMemo(() => {
    const map = new Map<string, string>();
    levels.forEach((l) => map.set(l.id, l.name));
    return map;
  }, [levels]);

  const isFiltered = searchText.trim() !== "" || statusFilter !== "all" || sortBy !== "name-asc";

  const handleResetFilters = () => {
    setSearchText("");
    setStatusFilter("all");
    setSortBy("name-asc");
  };

  const filteredLevels = useMemo(() => {
    return levels
      .filter((l) => {
        const q = searchText.trim().toLowerCase();
        const matchesSearch = !q || l.name.toLowerCase().includes(q);
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && l.isActive) ||
          (statusFilter === "inactive" && !l.isActive);
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "name-asc") return a.name.localeCompare(b.name);
        if (sortBy === "name-desc") return b.name.localeCompare(a.name);
        if (sortBy === "status") return Number(b.isActive) - Number(a.isActive);
        return 0;
      });
  }, [levels, searchText, statusFilter, sortBy]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: any) => {
    setEditingItem(record);
    form.setFieldsValue({
      name: record.name,
      parentId: record.parentId || undefined,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      if (editingItem) {
        await axiosClient.put(`/JobLevels/${editingItem.id}`, {
          name: values.name,
          parentId: values.parentId || null,
        });
        message.success("Cập nhật Cấp bậc thành công!");
      } else {
        await axiosClient.post("/JobLevels", {
          name: values.name,
          parentId: values.parentId || null,
        });
        message.success("Thêm mới Cấp bậc thành công!");
      }
      setIsModalOpen(false);
      fetchLevels();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || "Thao tác thất bại!";
      message.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await axiosClient.put(`/JobLevels/${id}/toggle-status`);
      message.success("Cập nhật trạng thái Cấp bậc thành công");
      fetchLevels();
    } catch (err) {
      message.error("Lỗi khi thay đổi trạng thái!");
    }
  };

  const handleExportCsv = () => {
    const headers = ["ID Cấp Bậc", "Tên Cấp Bậc", "Nhóm Cha", "Trạng Thái"];
    const rows = filteredLevels.map((l) => [
      l.id,
      l.name,
      l.parentId ? levelMap.get(l.parentId) || l.parentId : "Cấp bậc chuẩn",
      l.isActive ? "Hoạt động" : "Đã khóa",
    ]);
    exportToCsv("Danh_Sach_Cap_Bac_Cong_Viec", headers, rows);
    message.success("Đã xuất danh sách Cấp bậc công việc ra file Excel (CSV)!");
  };

  const columns = [
    {
      title: "Tên Cấp bậc Công việc",
      dataIndex: "name",
      key: "name",
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
      render: (text: string, record: any) => (
        <Space>
          <OrderedListOutlined style={{ color: appTheme.colors.info }} />
          <Text strong style={{ color: record.isActive ? appTheme.colors.textPrimary : "#94A3B8" }}>
            {text}
          </Text>
        </Space>
      ),
    },
    {
      title: "Nhóm Cấp bậc Cha",
      dataIndex: "parentId",
      key: "parentId",
      render: (parentId: string | null) => {
        if (!parentId) return <Tag color="blue">Cấp bậc chuẩn</Tag>;
        const parentName = levelMap.get(parentId);
        return parentName ? <Tag color="default">{parentName}</Tag> : <Text type="secondary">—</Text>;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 150,
      filters: [
        { text: "Hoạt động", value: true },
        { text: "Đã khóa", value: false },
      ],
      onFilter: (value: any, record: any) => record.isActive === value,
      render: (isActive: boolean) =>
        isActive ? (
          <Tag color="success" style={{ borderRadius: 6, fontWeight: 700, padding: "2px 10px" }}>
            Hoạt động
          </Tag>
        ) : (
          <Tag color="error" style={{ borderRadius: 6, fontWeight: 600, padding: "2px 10px" }}>
            Đã khóa
          </Tag>
        ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 200,
      render: (_: any, record: any) => (
        <Space size={8}>
          <Button icon={<EditOutlined />} onClick={() => handleOpenEdit(record)} size="small">
            Sửa
          </Button>
          <Popconfirm
            title={record.isActive ? "Bạn có chắc muốn khóa cấp bậc này?" : "Mở khóa cấp bậc này?"}
            onConfirm={() => handleToggleStatus(record.id)}
            okText="Đồng ý"
            cancelText="Hủy"
          >
            <Button icon={record.isActive ? <LockOutlined /> : <UnlockOutlined />} danger={record.isActive} size="small">
              {record.isActive ? "Khóa" : "Mở"}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ paddingTop: 12 }}>
      {/* Multi-filter Bar */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }} align="middle" justify="space-between">
        <Col xs={24} xl={18}>
          <Row gutter={[10, 10]} align="middle">
            <Col xs={24} sm={9} md={7}>
              <Input
                placeholder="Tìm kiếm tên cấp bậc..."
                prefix={<SearchOutlined style={{ color: "#94A3B8" }} />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                style={{ borderRadius: 8 }}
              />
            </Col>

            <Col xs={24} sm={7} md={5}>
              <Select
                style={{ width: "100%" }}
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                options={[
                  { value: "all", label: "Tất cả trạng thái" },
                  {
                    value: "active",
                    label: (
                      <Space size={6}>
                        <CheckCircleFilled style={{ color: "#10B981" }} />
                        <span>Hoạt động</span>
                      </Space>
                    ),
                  },
                  {
                    value: "inactive",
                    label: (
                      <Space size={6}>
                        <CloseCircleFilled style={{ color: "#EF4444" }} />
                        <span>Đã khóa</span>
                      </Space>
                    ),
                  },
                ]}
              />
            </Col>

            <Col xs={24} sm={8} md={6}>
              <Select
                style={{ width: "100%" }}
                value={sortBy}
                onChange={(val) => setSortBy(val)}
                suffixIcon={<SortAscendingOutlined />}
                options={[
                  { value: "name-asc", label: "Sắp xếp: Tên (A → Z)" },
                  { value: "name-desc", label: "Sắp xếp: Tên (Z → A)" },
                  { value: "status", label: "Sắp xếp: Hoạt động trước" },
                ]}
              />
            </Col>

            {isFiltered && (
              <Col xs={24} sm={6} md={3}>
                <Button icon={<ReloadOutlined />} onClick={handleResetFilters} danger type="dashed">
                  Xóa lọc
                </Button>
              </Col>
            )}

            <Col xs={24} sm={18} md={3}>
              <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                Hiển thị <Text strong>{filteredLevels.length}</Text> / {levels.length} cấp bậc
              </Text>
            </Col>
          </Row>
        </Col>

        <Col xs={24} xl={6} style={{ textAlign: "right" }}>
          <Space size={8}>
            <Button icon={<DownloadOutlined />} onClick={handleExportCsv}>
              Xuất Excel
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenCreate}
              style={{ background: appTheme.colors.info, borderRadius: 8 }}
            >
              Thêm Cấp bậc mới
            </Button>
          </Space>
        </Col>
      </Row>

      <Table
        dataSource={filteredLevels.map((l) => ({ ...l, key: l.id }))}
        columns={columns}
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        bordered
        style={{ background: "#FFFFFF", borderRadius: 12 }}
      />

      <Modal
        title={editingItem ? "Chỉnh sửa Cấp bậc Công việc" : "Thêm mới Cấp bậc Công việc"}
        open={isModalOpen}
        onOk={handleSave}
        confirmLoading={saving}
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Tên Cấp bậc Công việc"
            rules={[{ required: true, message: "Vui lòng nhập tên cấp bậc!" }]}
          >
            <Input placeholder="Ví dụ: Intern, Junior, Middle, Senior, Lead/Manager..." />
          </Form.Item>

          <Form.Item name="parentId" label="Nhóm Cấp bậc Cha (Không bắt buộc)">
            <Select
              allowClear
              placeholder="Chọn nhóm cấp bậc cha"
              options={levels
                .filter((l) => !editingItem || l.id !== editingItem.id)
                .map((l) => ({ value: l.id, label: l.name }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

/* ============================================================
   TAB 4: VỊ TRÍ CÔNG VIỆC (Job Positions Table List with Multi-filters & Sort)
   ============================================================ */
function JobPositionTab() {
  const [positions, setPositions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name-asc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
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
      message.error("Lỗi tải dữ liệu Vị trí công việc");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isFiltered = searchText.trim() !== "" || selectedCategoryId !== "all" || statusFilter !== "all" || sortBy !== "name-asc";

  const handleResetFilters = () => {
    setSearchText("");
    setSelectedCategoryId("all");
    setStatusFilter("all");
    setSortBy("name-asc");
  };

  const filteredPositions = useMemo(() => {
    return positions
      .filter((pos) => {
        const q = searchText.trim().toLowerCase();
        const matchesSearch =
          !q ||
          pos.name.toLowerCase().includes(q) ||
          (pos.categoryName || "").toLowerCase().includes(q);

        const matchesCat =
          selectedCategoryId === "all" || pos.categoryId === selectedCategoryId;

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && pos.isActive) ||
          (statusFilter === "inactive" && !pos.isActive);

        return matchesSearch && matchesCat && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "name-asc") return a.name.localeCompare(b.name);
        if (sortBy === "name-desc") return b.name.localeCompare(a.name);
        if (sortBy === "category") return (a.categoryName || "").localeCompare(b.categoryName || "");
        if (sortBy === "status") return Number(b.isActive) - Number(a.isActive);
        return 0;
      });
  }, [positions, searchText, selectedCategoryId, statusFilter, sortBy]);

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
      setSaving(true);

      if (editingItem) {
        await axiosClient.put(`/JobPositions/${editingItem.id}`, values);
        message.success("Cập nhật Vị trí công việc thành công!");
      } else {
        await axiosClient.post("/JobPositions", values);
        message.success("Thêm mới Vị trí công việc thành công!");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || "Thao tác thất bại!";
      message.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await axiosClient.put(`/JobPositions/${id}/toggle-status`);
      message.success("Cập nhật trạng thái Vị trí thành công");
      fetchData();
    } catch (err) {
      message.error("Lỗi khi thay đổi trạng thái!");
    }
  };

  const handleExportCsv = () => {
    const headers = ["ID Vị Trí", "Tên Vị Trí Công Việc", "Lĩnh Vực Ngành Nghề", "Trạng Thái"];
    const rows = filteredPositions.map((p) => [
      p.id,
      p.name,
      p.categoryName || "Chưa phân loại",
      p.isActive ? "Hoạt động" : "Đã khóa",
    ]);
    exportToCsv("Danh_Sach_Vi_Tri_Cong_Viec", headers, rows);
    message.success("Đã xuất danh sách Vị trí công việc ra file Excel (CSV)!");
  };

  const columns = [
    {
      title: "Tên Vị trí Công việc",
      dataIndex: "name",
      key: "name",
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
      render: (text: string, record: any) => (
        <Space>
          <SolutionOutlined style={{ color: appTheme.colors.success }} />
          <Text strong style={{ color: record.isActive ? appTheme.colors.textPrimary : "#94A3B8" }}>
            {text}
          </Text>
        </Space>
      ),
    },
    {
      title: "Lĩnh vực / Ngành nghề",
      dataIndex: "categoryName",
      key: "categoryName",
      sorter: (a: any, b: any) => (a.categoryName || "").localeCompare(b.categoryName || ""),
      render: (categoryName: string) =>
        categoryName ? <Tag color="blue">{categoryName}</Tag> : <Tag color="default">Chưa phân loại</Tag>,
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 150,
      filters: [
        { text: "Hoạt động", value: true },
        { text: "Đã khóa", value: false },
      ],
      onFilter: (value: any, record: any) => record.isActive === value,
      render: (isActive: boolean) =>
        isActive ? (
          <Tag color="success" style={{ borderRadius: 6, fontWeight: 700, padding: "2px 10px" }}>
            Hoạt động
          </Tag>
        ) : (
          <Tag color="error" style={{ borderRadius: 6, fontWeight: 600, padding: "2px 10px" }}>
            Đã khóa
          </Tag>
        ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 200,
      render: (_: any, record: any) => (
        <Space size={8}>
          <Button icon={<EditOutlined />} onClick={() => handleOpenEdit(record)} size="small">
            Sửa
          </Button>
          <Popconfirm
            title={record.isActive ? "Bạn có chắc muốn khóa vị trí này?" : "Mở khóa vị trí này?"}
            onConfirm={() => handleToggleStatus(record.id)}
            okText="Đồng ý"
            cancelText="Hủy"
          >
            <Button icon={record.isActive ? <LockOutlined /> : <UnlockOutlined />} danger={record.isActive} size="small">
              {record.isActive ? "Khóa" : "Mở"}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ paddingTop: 12 }}>
      {/* Detailed Multi-filter Bar */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }} align="middle" justify="space-between">
        <Col xs={24} xl={18}>
          <Row gutter={[10, 10]} align="middle">
            <Col xs={24} sm={8} md={6}>
              <Input
                placeholder="Tìm tên vị trí, lĩnh vực..."
                prefix={<SearchOutlined style={{ color: "#94A3B8" }} />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                style={{ borderRadius: 8 }}
              />
            </Col>

            <Col xs={24} sm={6} md={5}>
              <Select
                style={{ width: "100%" }}
                placeholder="Lọc theo Lĩnh vực"
                value={selectedCategoryId}
                onChange={(val) => setSelectedCategoryId(val)}
                options={[
                  { value: "all", label: "Tất cả lĩnh vực" },
                  ...categories.map((c) => ({ value: c.id, label: c.name })),
                ]}
              />
            </Col>

            <Col xs={24} sm={5} md={4}>
              <Select
                style={{ width: "100%" }}
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                options={[
                  { value: "all", label: "Tất cả trạng thái" },
                  {
                    value: "active",
                    label: (
                      <Space size={6}>
                        <CheckCircleFilled style={{ color: "#10B981" }} />
                        <span>Hoạt động</span>
                      </Space>
                    ),
                  },
                  {
                    value: "inactive",
                    label: (
                      <Space size={6}>
                        <CloseCircleFilled style={{ color: "#EF4444" }} />
                        <span>Đã khóa</span>
                      </Space>
                    ),
                  },
                ]}
              />
            </Col>

            <Col xs={24} sm={5} md={4}>
              <Select
                style={{ width: "100%" }}
                value={sortBy}
                onChange={(val) => setSortBy(val)}
                suffixIcon={<SortAscendingOutlined />}
                options={[
                  { value: "name-asc", label: "Tên (A → Z)" },
                  { value: "name-desc", label: "Tên (Z → A)" },
                  { value: "category", label: "Theo Lĩnh vực" },
                  { value: "status", label: "Hoạt động trước" },
                ]}
              />
            </Col>

            {isFiltered && (
              <Col xs={24} sm={6} md={3}>
                <Button icon={<ReloadOutlined />} onClick={handleResetFilters} danger type="dashed">
                  Xóa lọc
                </Button>
              </Col>
            )}

            <Col xs={24} sm={18} md={2}>
              <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                Hiển thị <Text strong>{filteredPositions.length}</Text> / {positions.length} vị trí
              </Text>
            </Col>
          </Row>
        </Col>

        <Col xs={24} xl={6} style={{ textAlign: "right" }}>
          <Space size={8}>
            <Button icon={<DownloadOutlined />} onClick={handleExportCsv}>
              Xuất Excel
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenCreate}
              style={{ background: appTheme.colors.success, borderRadius: 8 }}
            >
              Thêm Vị trí mới
            </Button>
          </Space>
        </Col>
      </Row>

      <Table
        dataSource={filteredPositions.map((p) => ({ ...p, key: p.id }))}
        columns={columns}
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        bordered
        style={{ background: "#FFFFFF", borderRadius: 12 }}
      />

      <Modal
        title={editingItem ? "Chỉnh sửa Vị trí Công việc" : "Thêm mới Vị trí Công việc"}
        open={isModalOpen}
        onOk={handleSave}
        confirmLoading={saving}
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Tên Vị trí Công việc"
            rules={[{ required: true, message: "Vui lòng nhập tên vị trí!" }]}
          >
            <Input placeholder="Ví dụ: Lập trình viên ReactJS, Chuyên viên Marketing..." />
          </Form.Item>

          <Form.Item
            name="categoryId"
            label="Lĩnh vực Ngành nghề Trực thuộc"
            rules={[{ required: true, message: "Vui lòng chọn lĩnh vực!" }]}
          >
            <Select
              showSearch
              placeholder="Chọn lĩnh vực trực thuộc"
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
