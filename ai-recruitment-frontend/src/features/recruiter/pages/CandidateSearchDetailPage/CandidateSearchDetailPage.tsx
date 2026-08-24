import { useEffect, useState } from "react";
import { Avatar, Button, Card, Col, DatePicker, Descriptions, Form, InputNumber, Modal, Row, Select, Skeleton, Space, Tag, Typography, message } from "antd";
import { ArrowLeftOutlined, FilePdfOutlined, MailOutlined, UserOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import PageContainer from "../../../../components/common/PageContainer";
import { talentPoolService, type CandidateDiscoveryResultDto, type CandidatePublicCvDto } from "../../services/talentPoolService";
import { createCvBuilderPdf } from "../../../candidate-portal/utils/createCvBuilderPdf";
import { getSourcingStageLabel } from "../../../../utils/statusLabels";
import { useRecruitmentMetadata } from "../../hooks/useRecruitmentMetadata";

const { Text, Title } = Typography;

export default function CandidateSearchDetailPage() {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<CandidateDiscoveryResultDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveForm] = Form.useForm();
  const { categories, positions, levels } = useRecruitmentMetadata();

  useEffect(() => {
    const load = async () => {
      if (!candidateId) return;
      try {
        setLoading(true);
        setCandidate(await talentPoolService.getDiscoverableCandidateDetail(candidateId));
      } catch (error: any) {
        message.error(error?.response?.data?.message || "Không thể tải hồ sơ ứng viên.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [candidateId]);

  const categoryOptions = categories.filter((item) => item.isActive !== false).map((item) => ({ value: item.name, label: item.name }));
  const positionOptions = positions.filter((item) => item.isActive !== false).map((item) => ({ value: item.name, label: item.name }));
  const levelOptions = levels
    .filter((item) => item.isActive !== false && Boolean(item.parentId))
    .map((item) => ({ value: item.name, label: item.name }));

  const openCvFile = (cv: CandidatePublicCvDto) => {
    if (!cv.fileUrl) return;
    const url = cv.fileUrl.startsWith("http")
      ? cv.fileUrl
      : `${window.location.origin}${cv.fileUrl.startsWith("/") ? "" : "/"}${cv.fileUrl}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openBuilderCv = async (cv: CandidatePublicCvDto) => {
    if (!cv.builderContentJson || !cv.builderSettingsJson) return;
    try {
      const file = await createCvBuilderPdf({
        id: cv.cvId,
        name: cv.displayName,
        content: JSON.parse(cv.builderContentJson),
        settings: JSON.parse(cv.builderSettingsJson),
        isDefault: false,
        createdAt: cv.createdAt,
        updatedAt: cv.createdAt,
      } as any);
      const url = URL.createObjectURL(file);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      message.error("Không thể dựng bản xem CV trực tuyến.");
    }
  };

  const saveCandidate = async (values: any) => {
    if (!candidateId) return;
    const domains = values.domains || [];
    const targetPositions = values.targetPositions || [];
    if (domains.length === 0 && targetPositions.length === 0) {
      message.warning("Vui lòng chọn ít nhất một lĩnh vực hoặc vị trí mục tiêu.");
      return;
    }
    try {
      setSaving(true);
      await talentPoolService.saveDiscoverableCandidate(candidateId, {
        domains,
        targetPositions,
        jobLevel: values.jobLevel,
        sourcingPriority: values.sourcingPriority || "Normal",
        sourcingStage: values.sourcingStage || "Saved",
        tags: values.tags || [],
        expectedSalary: values.expectedSalary,
        availableFrom: values.availableFrom?.toISOString(),
      });
      message.success("Đã lưu ứng viên vào Talent Pool; dữ liệu sẽ được đưa vào vòng mining kế tiếp.");
      setSaveOpen(false);
      setCandidate((current) => current ? { ...current, alreadyInTalentPool: true } : current);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Không thể lưu ứng viên vào Talent Pool.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer title="Hồ sơ ứng viên" subtitle="Thông tin được hiển thị theo quyền riêng tư mà ứng viên đã cấp.">
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/recruiter/candidate-search")} style={{ marginBottom: 16 }}>
        Quay lại danh sách
      </Button>
      {loading ? <Card><Skeleton active paragraph={{ rows: 8 }} /></Card> : !candidate ? (
        <Card>Không tìm thấy hồ sơ hoặc ứng viên đã tắt quyền hiển thị.</Card>
      ) : (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Card>
            <Space align="start" size="large" wrap>
              <Avatar size={84} icon={<UserOutlined />} style={{ backgroundColor: "#0EA5E9" }} />
              <div>
                <Title level={2} style={{ margin: 0 }}>{candidate.displayName}</Title>
                <Text type="secondary">{candidate.major || "Chưa cập nhật chuyên môn"}</Text>
                <div style={{ marginTop: 12 }}>
                  <Tag color={candidate.contactAllowed ? "green" : "default"} icon={<MailOutlined />}>
                    {candidate.contactAllowed ? "Được phép liên hệ" : "Chưa cấp quyền liên hệ"}
                  </Tag>
                  <Tag color={candidate.cvAllowed ? "blue" : "default"}>
                    {candidate.cvAllowed ? "Được phép xem CV" : "CV đang ẩn"}
                  </Tag>
                </div>
              </div>
            </Space>
            {!candidate.alreadyInTalentPool && (
              <Button type="primary" style={{ marginTop: 20 }} onClick={() => setSaveOpen(true)}>
                Lưu vào Talent Pool
              </Button>
            )}
          </Card>
          <Card title="Thông tin hồ sơ">
            <Descriptions column={{ xs: 1, sm: 2 }} bordered>
              <Descriptions.Item label="Địa điểm">{candidate.address || "Chưa cập nhật"}</Descriptions.Item>
              <Descriptions.Item label="Kinh nghiệm">{candidate.yearsOfExperience == null ? "Chưa rõ" : `${candidate.yearsOfExperience} năm`}</Descriptions.Item>
              <Descriptions.Item label="Điểm AI cao nhất từng có">{candidate.highestAiScore == null ? "Chưa có" : `${candidate.highestAiScore}/100`}</Descriptions.Item>
              <Descriptions.Item label="Talent Pool">{candidate.alreadyInTalentPool ? "Đã có" : "Chưa có"}</Descriptions.Item>
            </Descriptions>
          </Card>
          <Card title="Kỹ năng">
            <Space wrap>{(() => { try { return JSON.parse(candidate.skillsJson || "[]"); } catch { return []; } })().map((skill: string) => <Tag color="blue" key={skill}>{skill}</Tag>)}</Space>
          </Card>
          <Card title="Tài liệu được chia sẻ">
            {candidate.publicCvs?.length ? candidate.publicCvs.map((cv) => (
              <div key={cv.cvId} style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #F1F5F9" }}>
                <div style={{ minWidth: 0, flex: "1 1 240px" }}>
                  <Text strong>{cv.displayName}</Text>
                  <Text type="secondary" style={{ display: "block", fontSize: 12 }}>{cv.sourceLabel} · {new Date(cv.createdAt).toLocaleDateString("vi-VN")}{cv.isApplicationSnapshot ? " · Snapshot lần ứng tuyển" : ""}</Text>
                </div>
                {cv.fileUrl ? <Button icon={<FilePdfOutlined />} onClick={() => openCvFile(cv)}>Xem CV</Button> : cv.builderContentJson ? <Button icon={<FilePdfOutlined />} onClick={() => void openBuilderCv(cv)}>Xem CV</Button> : <Text type="secondary">CV đang ẩn</Text>}
              </div>
            )) : (
              <Text type="secondary">Ứng viên chưa có CV được lưu trong hệ thống.</Text>
            )}
          </Card>
          <Modal
            title="Lưu ứng viên vào Talent Pool"
            open={saveOpen}
            onCancel={() => setSaveOpen(false)}
            onOk={() => saveForm.submit()}
            confirmLoading={saving}
            okText="Lưu ứng viên"
            cancelText="Hủy"
          >
            <Form
              form={saveForm}
              layout="vertical"
              initialValues={{
                sourcingPriority: "Normal",
                sourcingStage: "Saved",
                domains: candidate.profileDomains || [],
                targetPositions: candidate.profilePositions || [],
              }}
              onFinish={saveCandidate}
            >
              <Form.Item label="Lĩnh vực" name="domains" rules={[{ required: false }]}>
                <Select mode="multiple" showSearch optionFilterProp="label" options={categoryOptions} placeholder="Chọn lĩnh vực trong danh mục hệ thống" />
              </Form.Item>
              <Form.Item label="Vị trí mục tiêu" name="targetPositions">
                <Select mode="multiple" showSearch optionFilterProp="label" options={positionOptions} placeholder="Chọn vị trí trong danh mục hệ thống" />
              </Form.Item>
              <Form.Item label="Cấp bậc" name="jobLevel">
                <Select allowClear options={levelOptions} placeholder="Chọn cấp bậc trong danh mục hệ thống" />
              </Form.Item>
              <Row gutter={[12, 0]}>
                <Col xs={24} sm={12}>
                  <Form.Item label="Ưu tiên" name="sourcingPriority">
                    <Select style={{ width: "100%" }} options={[{ value: "Low", label: "Thấp" }, { value: "Normal", label: "Bình thường" }, { value: "High", label: "Cao" }]} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Giai đoạn" name="sourcingStage">
                    <Select style={{ width: "100%" }} options={["Saved", "Reviewed", "ContactPlanned", "Contacted", "Interested"].map(value => ({ value, label: getSourcingStageLabel(value) }))} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="Tag" name="tags">
                <Select mode="tags" placeholder="Ví dụ: Ưu tiên liên hệ, Có thể nhận việc sớm" />
              </Form.Item>
              <Row gutter={[12, 0]}>
                <Col xs={24} sm={12}>
                  <Form.Item label="Lương kỳ vọng" name="expectedSalary"><InputNumber min={0} style={{ width: "100%" }} /></Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Có thể bắt đầu từ" name="availableFrom"><DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} /></Form.Item>
                </Col>
              </Row>
            </Form>
          </Modal>
        </Space>
      )}
    </PageContainer>
  );
}
