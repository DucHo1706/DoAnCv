import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import type { TableProps } from "antd";
import {
  CheckOutlined,
  DeleteOutlined,
  LinkOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  StopOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import PageContainer from "../../../../components/common/PageContainer";
import { appTheme } from "../../../../constants/theme";
import {
  skillTaxonomyService,
  type SkillObservation,
  type SkillObservationStatus,
  type TaxonomySkill,
} from "../../services/skillTaxonomyService";

const { Text, Title } = Typography;
type Columns<T> = NonNullable<TableProps<T>["columns"]>;
type ReviewAction = "map" | "approve" | "reject";

const STATUS_OPTIONS: Array<{ value: SkillObservationStatus; label: string }> = [
  { value: "CandidateForReview", label: "Chờ xem xét" },
  { value: "Quarantine", label: "Đang cách ly" },
  { value: "Mapped", label: "Đã ánh xạ" },
  { value: "Approved", label: "Đã duyệt" },
  { value: "Rejected", label: "Đã từ chối" },
];

const STATUS_META: Record<SkillObservationStatus, { label: string; color: string }> = {
  CandidateForReview: { label: "Chờ xem xét", color: "gold" },
  Quarantine: { label: "Đang cách ly", color: "default" },
  Mapped: { label: "Đã ánh xạ", color: "blue" },
  Approved: { label: "Đã duyệt", color: "green" },
  Rejected: { label: "Đã từ chối", color: "red" },
};

function getApiErrorMessage(error: unknown, fallback: string) {
  const data = (error as {
    response?: {
      data?: string | { message?: string; errors?: Record<string, unknown> };
    };
  })?.response?.data;
  if (typeof data === "string" && data.trim()) return data.trim();
  if (data && typeof data === "object" && typeof data.message === "string" && data.message.trim()) {
    return data.message.trim();
  }
  if (data && typeof data === "object" && data.errors && typeof data.errors === "object") {
    const validationMessages = Object.values(data.errors)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0);
    if (validationMessages.length > 0) return validationMessages.join(" ");
  }
  return fallback;
}

function formatDate(value?: string) {
  if (!value) return "Chưa ghi nhận";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa ghi nhận";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatConfidence(value: number) {
  const normalized = value <= 1 ? value * 100 : value;
  return `${Math.max(0, Math.min(100, normalized)).toFixed(0)}%`;
}

export default function SkillTaxonomyPage() {
  const [skills, setSkills] = useState<TaxonomySkill[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [skillsError, setSkillsError] = useState("");
  const [skillSearch, setSkillSearch] = useState("");

  const [observations, setObservations] = useState<SkillObservation[]>([]);
  const [observationStatus, setObservationStatus] = useState<SkillObservationStatus>("CandidateForReview");
  const [observationsLoading, setObservationsLoading] = useState(false);
  const [observationsError, setObservationsError] = useState("");
  const [observationPage, setObservationPage] = useState(1);
  const [observationPageSize, setObservationPageSize] = useState(20);
  const [observationTotal, setObservationTotal] = useState(0);

  const [aliasSkill, setAliasSkill] = useState<TaxonomySkill | null>(null);
  const [aliasSaving, setAliasSaving] = useState(false);
  const [deletingAliasId, setDeletingAliasId] = useState<number | null>(null);
  const [aliasForm] = Form.useForm<{ alias: string }>();

  const [reviewTarget, setReviewTarget] = useState<SkillObservation | null>(null);
  const [reviewAction, setReviewAction] = useState<ReviewAction | null>(null);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewForm] = Form.useForm<{ skillId?: number; canonicalName?: string; reason?: string }>();

  const loadSkills = useCallback(async () => {
    setSkillsLoading(true);
    setSkillsError("");
    try {
      setSkills(await skillTaxonomyService.getSkills());
    } catch (error) {
      setSkillsError(getApiErrorMessage(error, "Không tải được danh mục kỹ năng."));
    } finally {
      setSkillsLoading(false);
    }
  }, []);

  const loadObservations = useCallback(async () => {
    setObservationsLoading(true);
    setObservationsError("");
    try {
      const result = await skillTaxonomyService.getObservations(
        observationStatus,
        observationPage,
        observationPageSize
      );
      setObservations(result.items);
      setObservationTotal(result.totalCandidates);
    } catch (error) {
      setObservations([]);
      setObservationTotal(0);
      setObservationsError(getApiErrorMessage(error, "Không tải được hàng chờ kỹ năng."));
    } finally {
      setObservationsLoading(false);
    }
  }, [observationPage, observationPageSize, observationStatus]);

  useEffect(() => {
    void loadSkills();
  }, [loadSkills]);

  useEffect(() => {
    void loadObservations();
  }, [loadObservations]);

  const filteredSkills = useMemo(() => {
    const query = skillSearch.trim().toLocaleLowerCase("vi-VN");
    if (!query) return skills;
    return skills.filter(
      (skill) =>
        skill.name.toLocaleLowerCase("vi-VN").includes(query) ||
        skill.aliases.some((alias) => alias.alias.toLocaleLowerCase("vi-VN").includes(query))
    );
  }, [skillSearch, skills]);

  const aliasCount = useMemo(
    () => skills.reduce((total, skill) => total + skill.aliases.length, 0),
    [skills]
  );

  const openAliasModal = (skill: TaxonomySkill) => {
    setAliasSkill(skill);
    aliasForm.resetFields();
  };

  const saveAlias = async () => {
    if (!aliasSkill) return;
    const values = await aliasForm.validateFields();
    setAliasSaving(true);
    try {
      await skillTaxonomyService.addAlias(aliasSkill.id, values.alias.trim());
      message.success("Đã thêm bí danh kỹ năng.");
      setAliasSkill(null);
      await loadSkills();
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không thể thêm bí danh kỹ năng."));
    } finally {
      setAliasSaving(false);
    }
  };

  const deleteAlias = async (skillId: number, aliasId: number) => {
    setDeletingAliasId(aliasId);
    try {
      await skillTaxonomyService.deleteAlias(skillId, aliasId);
      message.success("Đã xóa bí danh kỹ năng.");
      await loadSkills();
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không thể xóa bí danh kỹ năng."));
    } finally {
      setDeletingAliasId(null);
    }
  };

  const openReviewModal = (action: ReviewAction, observation: SkillObservation) => {
    setReviewAction(action);
    setReviewTarget(observation);
    reviewForm.resetFields();
    if (action === "approve") {
      reviewForm.setFieldValue("canonicalName", observation.displayText);
    }
  };

  const closeReviewModal = () => {
    setReviewAction(null);
    setReviewTarget(null);
    reviewForm.resetFields();
  };

  const saveReview = async () => {
    if (!reviewTarget || !reviewAction) return;
    const values = await reviewForm.validateFields();
    setReviewSaving(true);
    try {
      let result: { message: string };
      if (reviewAction === "map") {
        result = await skillTaxonomyService.mapObservation(reviewTarget.sampleObservationId, values.skillId!);
      } else if (reviewAction === "approve") {
        result = await skillTaxonomyService.approveNewObservation(
          reviewTarget.sampleObservationId,
          values.canonicalName!.trim()
        );
      } else {
        result = await skillTaxonomyService.rejectObservation(
          reviewTarget.sampleObservationId,
          values.reason!.trim()
        );
      }
      message.success(result.message || "Đã xử lý kỹ năng.");
      closeReviewModal();
      await Promise.all([loadSkills(), loadObservations()]);
    } catch (error) {
      message.error(getApiErrorMessage(error, "Không thể xử lý kỹ năng."));
    } finally {
      setReviewSaving(false);
    }
  };

  const skillColumns: Columns<TaxonomySkill> = [
    {
      title: "Kỹ năng chuẩn",
      dataIndex: "name",
      key: "name",
      width: 260,
      sorter: (a, b) => a.name.localeCompare(b.name, "vi"),
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: "Bí danh được quy về kỹ năng này",
      key: "aliases",
      render: (_, skill) =>
        skill.aliases.length > 0 ? (
          <Space size={[6, 6]} wrap>
            {skill.aliases.map((alias) => (
              <Tag
                key={alias.id}
                style={{ margin: 0 }}
              >
                <Space size={4}>
                  {alias.alias}
                  <Popconfirm
                    title="Xóa bí danh này?"
                    description="Các lần trích xuất sau sẽ không còn tự quy đổi theo bí danh này."
                    okText="Xóa"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true, loading: deletingAliasId === alias.id }}
                    onConfirm={() => deleteAlias(skill.id, alias.id)}
                  >
                    <DeleteOutlined style={{ color: appTheme.colors.textSecondary, cursor: "pointer" }} />
                  </Popconfirm>
                </Space>
              </Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary">Chưa có bí danh</Text>
        ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 140,
      fixed: "right",
      render: (_, skill) => (
        <Button size="small" icon={<PlusOutlined />} onClick={() => openAliasModal(skill)}>
          Thêm bí danh
        </Button>
      ),
    },
  ];

  const observationColumns: Columns<SkillObservation> = [
    {
      title: "Thuật ngữ phát hiện",
      key: "candidate",
      width: 220,
      render: (_, item) => (
        <Space direction="vertical" size={2}>
          <Text strong>{item.displayText}</Text>
          <Text type="secondary" style={{ fontSize: 12 }} copyable>
            {item.normalizedCandidate}
          </Text>
        </Space>
      ),
    },
    {
      title: "Nguồn độc lập",
      key: "sources",
      width: 150,
      render: (_, item) => (
        <Space direction="vertical" size={2}>
          <Text strong>{item.independentSources} nguồn</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {item.cvSources} CV · {item.jobSources} tin tuyển dụng
          </Text>
        </Space>
      ),
    },
    {
      title: "Độ tin cậy trích xuất",
      dataIndex: "averageConfidence",
      key: "confidence",
      width: 160,
      render: (value: number) => <Tag color={value >= 0.8 ? "green" : value >= 0.6 ? "blue" : "gold"}>{formatConfidence(value)}</Tag>,
    },
    {
      title: "Bằng chứng mẫu",
      dataIndex: "sampleEvidence",
      key: "evidence",
      width: 320,
      ellipsis: true,
      render: (value?: string | null) =>
        value?.trim() ? <Text title={value}>{value}</Text> : <Text type="secondary">Không có đoạn trích mẫu</Text>,
    },
    {
      title: "Ghi nhận gần nhất",
      dataIndex: "lastObservedAtUtc",
      key: "lastObservedAtUtc",
      width: 170,
      render: formatDate,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status: SkillObservationStatus) => {
        const meta = STATUS_META[status] || { label: status, color: "default" };
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "Xử lý",
      key: "actions",
      width: 390,
      fixed: "right",
      render: (_, item) =>
        item.status === "CandidateForReview" || item.status === "Quarantine" ? (
          <Space size={6} wrap>
            <Button size="small" icon={<LinkOutlined />} onClick={() => openReviewModal("map", item)}>
              Gộp vào kỹ năng có sẵn
            </Button>
            <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => openReviewModal("approve", item)}>
              Duyệt kỹ năng mới
            </Button>
            <Button size="small" danger icon={<StopOutlined />} onClick={() => openReviewModal("reject", item)}>
              Từ chối
            </Button>
          </Space>
        ) : (
          <Text type="secondary">Đã xử lý</Text>
        ),
    },
  ];

  const refreshAll = () => {
    void Promise.all([loadSkills(), loadObservations()]);
  };

  const tabs = [
    {
      key: "taxonomy",
      label: (
        <Space size={8}>
          <TagsOutlined />
          Kỹ năng chuẩn
          <Tag style={{ margin: 0 }}>{skills.length}</Tag>
        </Space>
      ),
      children: (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Tìm tên kỹ năng hoặc bí danh"
              value={skillSearch}
              onChange={(event) => setSkillSearch(event.target.value)}
              style={{ width: "min(420px, 100%)" }}
            />
            <Text type="secondary">
              {skills.length} kỹ năng chuẩn · {aliasCount} bí danh
            </Text>
          </div>
          {skillsError ? (
            <Alert
              type="error"
              showIcon
              message="Không tải được danh mục kỹ năng"
              description={skillsError}
              action={<Button onClick={() => void loadSkills()}>Thử lại</Button>}
            />
          ) : null}
          <Table<TaxonomySkill>
            rowKey="id"
            columns={skillColumns}
            dataSource={filteredSkills}
            loading={skillsLoading}
            scroll={{ x: 820 }}
            pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `${total} kỹ năng` }}
            locale={{ emptyText: <Empty description="Không tìm thấy kỹ năng phù hợp" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
          />
        </Space>
      ),
    },
    {
      key: "observations",
      label: (
        <Space size={8}>
          Hàng chờ xem xét
          {observationStatus === "CandidateForReview" && observationTotal > 0 ? (
            <Tag color="gold" style={{ margin: 0 }}>
              {observationTotal}
            </Tag>
          ) : null}
        </Space>
      ),
      children: (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Alert
            type="info"
            showIcon
            message="Các thuật ngữ này chưa được dùng để chấm điểm"
            description="Admin chỉ duyệt tên chuẩn hoặc gộp bí danh. Apriori và Two-Phase vẫn tự cập nhật theo lịch nền khi có dữ liệu mới."
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <Space wrap>
              <Text strong>Trạng thái</Text>
              <Select
                value={observationStatus}
                options={STATUS_OPTIONS}
                onChange={(value) => {
                  setObservationStatus(value);
                  setObservationPage(1);
                }}
                style={{ minWidth: 190 }}
              />
            </Space>
            <Text type="secondary">{observationTotal} thuật ngữ</Text>
          </div>
          {observationsError ? (
            <Alert
              type="error"
              showIcon
              message="Không tải được hàng chờ kỹ năng"
              description={observationsError}
              action={<Button onClick={() => void loadObservations()}>Thử lại</Button>}
            />
          ) : null}
          <Table<SkillObservation>
            rowKey={(item) => `${item.normalizedCandidate}-${item.sampleObservationId}`}
            columns={observationColumns}
            dataSource={observations}
            loading={observationsLoading}
            scroll={{ x: 1540 }}
            pagination={{
              current: observationPage,
              pageSize: observationPageSize,
              total: observationTotal,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50, 100],
              showTotal: (total) => `${total} thuật ngữ`,
              onChange: (page, pageSize) => {
                setObservationPage(pageSize !== observationPageSize ? 1 : page);
                setObservationPageSize(pageSize);
              },
            }}
            locale={{ emptyText: <Empty description="Không có thuật ngữ ở trạng thái này" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
          />
        </Space>
      ),
    },
  ];

  const reviewModalTitle =
    reviewAction === "map"
      ? "Gộp vào kỹ năng có sẵn"
      : reviewAction === "approve"
        ? "Duyệt thành kỹ năng mới"
        : "Từ chối thuật ngữ";

  return (
    <PageContainer
      title="Quản lý kỹ năng"
      subtitle="Chuẩn hóa tên kỹ năng và xử lý các thuật ngữ mới được phát hiện từ CV, tin tuyển dụng."
      extra={
        <Button icon={<ReloadOutlined />} loading={skillsLoading || observationsLoading} onClick={refreshAll}>
          Làm mới
        </Button>
      }
    >
      <Card
        style={{
          borderRadius: appTheme.radius.lg,
          border: `1px solid ${appTheme.colors.border}`,
          boxShadow: appTheme.shadow.card,
        }}
        styles={{ body: { padding: "16px 24px 24px" } }}
      >
        <Tabs items={tabs} size="large" />
      </Card>

      <Modal
        open={Boolean(aliasSkill)}
        title={`Thêm bí danh cho ${aliasSkill?.name || "kỹ năng"}`}
        okText="Thêm bí danh"
        cancelText="Hủy"
        confirmLoading={aliasSaving}
        onOk={() => void saveAlias()}
        onCancel={() => setAliasSkill(null)}
        destroyOnHidden
      >
        <Form form={aliasForm} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item
            label="Bí danh"
            name="alias"
            rules={[
              { required: true, whitespace: true, message: "Vui lòng nhập bí danh kỹ năng." },
              { max: 100, message: "Bí danh không được vượt quá 100 ký tự." },
            ]}
          >
            <Input placeholder="Ví dụ: dotnet, asp net core" maxLength={100} showCount />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={Boolean(reviewTarget && reviewAction)}
        title={reviewModalTitle}
        okText={reviewAction === "reject" ? "Từ chối" : "Xác nhận"}
        okButtonProps={{ danger: reviewAction === "reject" }}
        cancelText="Hủy"
        confirmLoading={reviewSaving}
        onOk={() => void saveReview()}
        onCancel={closeReviewModal}
        destroyOnHidden
      >
        <Space direction="vertical" size={16} style={{ width: "100%", marginTop: 12 }}>
          <div
            style={{
              padding: 12,
              borderRadius: appTheme.radius.sm,
              border: `1px solid ${appTheme.colors.border}`,
              background: appTheme.colors.background,
            }}
          >
            <Text type="secondary">Thuật ngữ phát hiện</Text>
            <Title level={5} style={{ margin: "4px 0 0" }}>
              {reviewTarget?.displayText}
            </Title>
          </div>
          <Form form={reviewForm} layout="vertical" style={{ width: "100%" }}>
            {reviewAction === "map" ? (
              <Form.Item
                label="Kỹ năng chuẩn nhận bí danh"
                name="skillId"
                rules={[{ required: true, message: "Vui lòng chọn kỹ năng chuẩn." }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Tìm và chọn kỹ năng"
                  options={skills.map((skill) => ({ value: skill.id, label: skill.name }))}
                />
              </Form.Item>
            ) : null}
            {reviewAction === "approve" ? (
              <Form.Item
                label="Tên kỹ năng chuẩn"
                name="canonicalName"
                rules={[
                  { required: true, whitespace: true, message: "Vui lòng nhập tên kỹ năng chuẩn." },
                  { max: 100, message: "Tên kỹ năng không được vượt quá 100 ký tự." },
                ]}
              >
                <Input maxLength={100} showCount />
              </Form.Item>
            ) : null}
            {reviewAction === "reject" ? (
              <Form.Item
                label="Lý do từ chối"
                name="reason"
                rules={[
                  { required: true, whitespace: true, message: "Vui lòng nêu lý do từ chối." },
                  { max: 500, message: "Lý do không được vượt quá 500 ký tự." },
                ]}
              >
                <Input.TextArea rows={4} maxLength={500} showCount placeholder="Ví dụ: Thuật ngữ quá chung, không phải kỹ năng tuyển dụng." />
              </Form.Item>
            ) : null}
          </Form>
        </Space>
      </Modal>
    </PageContainer>
  );
}
