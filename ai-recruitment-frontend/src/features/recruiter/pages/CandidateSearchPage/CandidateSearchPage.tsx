import { useEffect, useState } from "react";
import { Avatar, Button, Card, Col, Form, Input, InputNumber, Modal, Row, Select, Space, Table, Tag, Typography, message } from "antd";
import { EyeOutlined, PlusOutlined, SearchOutlined, UserOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import PageContainer from "../../../../components/common/PageContainer";
import { talentPoolService, type CandidateDiscoveryResultDto } from "../../services/talentPoolService";
import { useRecruitmentMetadata } from "../../hooks/useRecruitmentMetadata";

const { Text } = Typography;

export default function CandidateSearchPage({ embedded = false }: { embedded?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CandidateDiscoveryResultDto[]>([]);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [skill, setSkill] = useState("");
  const [minYears, setMinYears] = useState<number | null>(null);
  const [minScore, setMinScore] = useState<number | null>(null);
  const [saveCandidate, setSaveCandidate] = useState<CandidateDiscoveryResultDto | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveForm] = Form.useForm();
  const navigate = useNavigate();
  const { categories, positions } = useRecruitmentMetadata();

  const search = async () => {
    try {
      setLoading(true);
      const data = await talentPoolService.searchDiscoverableCandidates({
        keyword: keyword.trim() || undefined,
        skill: skill.trim() || undefined,
        minYearsOfExperience: minYears ?? undefined,
        minAiScore: minScore ?? undefined,
        page: 1,
        pageSize: 50,
      });
      setResults(data.items || []);
      setTotal(data.total || 0);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Không thể tìm ứng viên lúc này.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void search();
  }, []);

  const parseSkills = (value: string) => {
    try {
      const parsed = JSON.parse(value || "[]");
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  };

  const submitQuickSave = async (values: { domains?: string[]; targetPositions?: string[] }) => {
    if (!saveCandidate) return;
    const domains = values.domains || [];
    const targetPositions = values.targetPositions || [];
    if (domains.length === 0 && targetPositions.length === 0) {
      message.warning("Vui lòng nhập ít nhất một lĩnh vực hoặc vị trí mục tiêu.");
      return;
    }
    try {
      setSaveLoading(true);
      await talentPoolService.saveDiscoverableCandidate(saveCandidate.candidateId, {
        domains,
        targetPositions,
        sourcingPriority: "Normal",
        sourcingStage: "Saved",
        tags: [],
      });
      message.success("Đã lưu ứng viên vào Talent Pool.");
      setResults((current) => current.map((item) => item.candidateId === saveCandidate.candidateId
        ? { ...item, alreadyInTalentPool: true }
        : item));
      setSaveCandidate(null);
      saveForm.resetFields();
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Không thể lưu ứng viên vào Talent Pool.");
    } finally {
      setSaveLoading(false);
    }
  };

  const columns = [
    {
      title: "Ứng viên",
      dataIndex: "displayName",
      key: "displayName",
      render: (value: string, record: CandidateDiscoveryResultDto) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: "#0EA5E9" }} />
          <div>
            <Text strong>{value}</Text>
            <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
              {record.contactAllowed ? "Đã cho phép liên hệ" : "Thông tin liên hệ đang ẩn"}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Chuyên môn",
      key: "profile",
      render: (_: unknown, record: CandidateDiscoveryResultDto) => (
        <div>
          <Text>{record.major || "Chưa cập nhật"}</Text>
          <Text type="secondary" style={{ display: "block", fontSize: 12 }}>{record.address || "Chưa cập nhật địa điểm"}</Text>
        </div>
      ),
    },
    {
      title: "Kinh nghiệm",
      dataIndex: "yearsOfExperience",
      key: "yearsOfExperience",
      render: (value?: number) => value == null ? "Chưa rõ" : `${value} năm`,
    },
    {
      title: "Kỹ năng",
      dataIndex: "skillsJson",
      key: "skillsJson",
      render: (value: string) => <Space wrap>{parseSkills(value).slice(0, 5).map((item: string) => <Tag color="blue" key={item}>{item}</Tag>)}</Space>,
    },
    {
      title: "Điểm AI cao nhất từng có",
      dataIndex: "highestAiScore",
      key: "highestAiScore",
      render: (value?: number) => value == null ? "Chưa có điểm" : <Tag color="green">{value}/100</Tag>,
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_: unknown, record: CandidateDiscoveryResultDto) => record.alreadyInTalentPool
        ? <Tag>Đã có trong Talent Pool</Tag>
        : <Tag color="processing">Có thể xem xét</Tag>,
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_: unknown, record: CandidateDiscoveryResultDto) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/recruiter/candidate-search/${record.candidateId}`)}>
            Xem hồ sơ
          </Button>
          {!record.alreadyInTalentPool && (
            <Button size="small" type="primary" ghost icon={<PlusOutlined />} onClick={() => setSaveCandidate(record)}>
              Lưu Talent Pool
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const content = (
    <>
      <Card style={{ borderRadius: 16, marginBottom: 20 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} md={7}><Input placeholder="Tên, chuyên môn, địa điểm" value={keyword} onChange={(e) => setKeyword(e.target.value)} onPressEnter={search} allowClear /></Col>
          <Col xs={24} md={5}><Input placeholder="Kỹ năng (VD: .NET)" value={skill} onChange={(e) => setSkill(e.target.value)} onPressEnter={search} allowClear /></Col>
          <Col xs={12} md={4}><InputNumber min={0} max={80} style={{ width: "100%" }} placeholder="Kinh nghiệm từ" value={minYears} onChange={setMinYears} /></Col>
          <Col xs={12} md={4}><InputNumber min={0} max={100} style={{ width: "100%" }} placeholder="Điểm AI cao nhất từ" value={minScore} onChange={setMinScore} /></Col>
          <Col xs={24} md={4}><Button type="primary" block icon={<SearchOutlined />} onClick={search} loading={loading}>Tìm kiếm</Button></Col>
        </Row>
      </Card>
      <Card style={{ borderRadius: 16 }}>
        <Table scroll={{ x: "max-content" }}
          rowKey="candidateId"
          columns={columns}
          dataSource={results}
          loading={loading}
          pagination={false}
          locale={{ emptyText: "Chưa có hồ sơ phù hợp." }}
        />
        <Text type="secondary" style={{ display: "block", marginTop: 12 }}>Tìm thấy {total} hồ sơ</Text>
      </Card>
      <Modal
        title="Lưu ứng viên vào Talent Pool"
        open={saveCandidate !== null}
        onCancel={() => { setSaveCandidate(null); saveForm.resetFields(); }}
        onOk={() => saveForm.submit()}
        confirmLoading={saveLoading}
        okText="Lưu ứng viên"
        cancelText="Hủy"
      >
        <Form form={saveForm} layout="vertical" onFinish={submitQuickSave}>
          <Form.Item label="Lĩnh vực" name="domains">
            <Select
              mode="multiple"
              showSearch
              optionFilterProp="label"
              placeholder="Chọn lĩnh vực"
              options={categories.filter((item) => item.isActive !== false).map((item) => ({ value: item.name, label: item.name }))}
            />
          </Form.Item>
          <Form.Item label="Vị trí mục tiêu" name="targetPositions">
            <Select
              mode="multiple"
              showSearch
              optionFilterProp="label"
              placeholder="Chọn vị trí"
              options={positions.filter((item) => item.isActive !== false).map((item) => ({ value: item.name, label: item.name }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );

  if (embedded) return content;
  return (
    <PageContainer title="Tìm ứng viên" subtitle="Tìm các hồ sơ đã được ứng viên cho phép nhà tuyển dụng tiếp cận.">
      {content}
    </PageContainer>
  );
}
