import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileSearchOutlined,
  DownloadOutlined,
  StarOutlined,
  RobotOutlined
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Descriptions,
  Progress,
  Row,
  Space,
  Tag,
  Timeline,
  Typography,
  Spin,
  message,
  List
} from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EmptyState from "../../components/common/EmptyState";
import PageContainer from "../../components/common/PageContainer";
import { recruitmentService } from "../../services/recruitmentService";

const { Paragraph, Text, Title } = Typography;

function CandidateDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const data = await recruitmentService.getHrApplications();
        const apps = Array.isArray(data) ? data : (data as any)?.$values || [];
        // Tìm đúng hồ sơ ứng tuyển theo ID trên đường dẫn
        const found = apps.find((app: any) => app.id === id);
        setCandidate(found || null);
      } catch (error) {
        message.error("Lỗi khi tải chi tiết hồ sơ");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const parseSkills = (jsonStr: string) => {
    if (!jsonStr) return [];
    try {
      const parsed = JSON.parse(jsonStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  // Mockup: AI Sinh câu hỏi phỏng vấn dựa trên kỹ năng
  const generateQuestions = () => {
    setGeneratingQuestions(true);
    setTimeout(() => {
      const strengths = parseSkills(candidate.matchedSkills);
      const gaps = parseSkills(candidate.missingSkills);
      
      setAiQuestions([
        `[Dựa trên Điểm mạnh: ${strengths[0] || 'Chuyên môn'}] Hãy mô tả một dự án phức tạp nhất mà bạn từng áp dụng kỹ năng này.`,
        `[Dựa trên Điểm yếu: ${gaps[0] || 'Kỹ năng mới'}] Chúng tôi thấy bạn chưa có nhiều kinh nghiệm về phần này, nếu được nhận, bạn dự định học hỏi nó như thế nào?`,
        `Xử lý tình huống: Nếu bạn và quản lý bất đồng quan điểm về một giải pháp kỹ thuật, bạn sẽ làm gì?`,
        `Động lực lớn nhất khiến bạn muốn ứng tuyển vào vị trí này là gì?`
      ]);
      setGeneratingQuestions(false);
    }, 2000);
  };

  if (loading) {
    return (
      <PageContainer title="Chi tiết ứng viên">
        <div style={{ textAlign: "center", padding: "100px 0" }}><Spin size="large" tip="Đang tải dữ liệu hồ sơ..." /></div>
      </PageContainer>
    );
  }

  if (!candidate) {
    return (
      <PageContainer title="Chi tiết ứng viên">
        <EmptyState description="Không tìm thấy hồ sơ ứng viên." />
      </PageContainer>
    );
  }

  const strengths = parseSkills(candidate.matchedSkills);
  const gaps = parseSkills(candidate.missingSkills);

  return (
    <PageContainer
      title={candidate.candidateName}
      subtitle={`Hồ sơ chi tiết cho vị trí ${candidate.jobTitle}`}
      extra={
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Quay lại
          </Button>
          <Button type="primary" icon={<DownloadOutlined />} href={candidate.cvUrl} target="_blank">Xem File CV</Button>
        </Space>
      }
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={15}>
          <Card title="Thông tin cơ bản">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Email">{candidate.email}</Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">{candidate.phone || "Chưa cập nhật"}</Descriptions.Item>
              <Descriptions.Item label="Vị trí ứng tuyển">{candidate.jobTitle}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={
                  candidate.classification === "Phù hợp" || candidate.classification === "Phù hợp cao" ? "green" :
                  candidate.classification === "Nên xem xét" ? "orange" : "red"
                }>
                  {candidate.classification || "Đã nhận CV"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Fit Score">
                <Text strong type={candidate.aiScore >= 75 ? "success" : candidate.aiScore >= 50 ? "warning" : "danger"}>
                  {candidate.aiScore} / 100
                </Text>
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 20 }}>
              <Text strong>Phân tích của AI</Text>
              <Paragraph style={{ marginTop: 8, marginBottom: 0, padding: 16, background: "#f8fafc", borderRadius: 8 }}>
                {candidate.aiReason}
              </Paragraph>
            </div>
          </Card>
        </Col>

        <Col xs={24} xl={9}>
          <Card title="Mức độ phù hợp" style={{ marginBottom: 16 }}>
            <Progress
              type="circle"
              percent={candidate.aiScore}
              strokeColor={candidate.aiScore >= 75 ? "#52c41a" : candidate.aiScore >= 50 ? "#faad14" : "#ff4d4f"}
              format={(percent) => `${percent}/100`}
            />
          </Card>

          <Card
            title={
              <Space>
                <CheckCircleOutlined style={{ color: "#16A34A" }} />
                <span>Điểm mạnh</span>
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            {strengths.length > 0 ? strengths.map((item: string) => (
              <Tag key={item} color="green" style={{ marginBottom: 8 }}>
                {item}
              </Tag>
            )) : (
              <Text type="secondary">AI không tìm thấy kỹ năng khớp</Text>
            )}
          </Card>

          <Card
            title={
              <Space>
                <CloseCircleOutlined style={{ color: "#DC2626" }} />
                <span>Khoảng thiếu</span>
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            {gaps.length > 0 ? gaps.map((item: string) => (
              <Tag key={item} color="red" style={{ marginBottom: 8 }}>
                {item}
              </Tag>
            )) : (
              <Text type="secondary">Ứng viên đáp ứng đủ kỹ năng yêu cầu</Text>
            )}
          </Card>

          <Card
            title={
              <Space>
                <RobotOutlined style={{ color: "#722ed1" }} />
                <span>AI Sinh Câu Hỏi Phỏng Vấn</span>
              </Space>
            }
            style={{ marginBottom: 16 }}
            extra={<Button size="small" type="primary" ghost onClick={generateQuestions} loading={generatingQuestions}>Tạo câu hỏi</Button>}
          >
            {aiQuestions.length > 0 ? (
              <List
                size="small"
                dataSource={aiQuestions}
                renderItem={(item, idx) => (
                  <List.Item><Text strong style={{ marginRight: 8 }}>{idx + 1}.</Text> {item}</List.Item>
                )}
              />
            ) : (
              <Text type="secondary">Bấm "Tạo câu hỏi" để AI phân tích CV và gợi ý các câu hỏi chuyên sâu cho ứng viên này.</Text>
            )}
          </Card>

          <Card
            title={
              <Space>
                <FileSearchOutlined style={{ color: "#2563EB" }} />
                <span>Luồng xử lý hồ sơ</span>
              </Space>
            }
          >
            <Timeline
              items={[
                { color: "blue", children: "CV đã được tải lên hệ thống" },
                { color: "blue", children: "Thông tin hồ sơ đã được trích xuất" },
                { color: "blue", children: "AI đã so khớp với JD" },
                { color: "green", children: "Ứng viên đã được chấm điểm và xếp hạng" },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
}

export default CandidateDetailPage;