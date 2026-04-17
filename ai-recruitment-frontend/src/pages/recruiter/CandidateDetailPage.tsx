import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileSearchOutlined,
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
} from "antd";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EmptyState from "../../components/common/EmptyState";
import PageContainer from "../../components/common/PageContainer";
import { recruiterCandidates } from "../../mock/recruiter";

const { Paragraph, Text, Title } = Typography;

function CandidateDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const candidate = useMemo(
    () => recruiterCandidates.find((item) => item.id === id),
    [id],
  );

  if (!candidate) {
    return (
      <PageContainer title="Chi tiết ứng viên">
        <EmptyState description="Không tìm thấy hồ sơ ứng viên." />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={candidate.name}
      subtitle={`Hồ sơ chi tiết cho vị trí ${candidate.position}`}
      extra={
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/recruiter/candidates")}>
            Quay lại
          </Button>
          <Button type="primary">Mời phỏng vấn</Button>
        </Space>
      }
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={15}>
          <Card title="Thông tin hồ sơ">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Email">{candidate.email}</Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">{candidate.phone}</Descriptions.Item>
              <Descriptions.Item label="Vị trí">{candidate.position}</Descriptions.Item>
              <Descriptions.Item label="Kinh nghiệm">
                {candidate.experience} năm
              </Descriptions.Item>
              <Descriptions.Item label="Địa điểm">{candidate.location}</Descriptions.Item>
              <Descriptions.Item label="Ngày ứng tuyển">
                {candidate.appliedDate}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color="blue">{candidate.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Fit Score">
                <Text strong>{candidate.fitScore}/100</Text>
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 20 }}>
              <Text strong>Kỹ năng</Text>
              <div style={{ marginTop: 10 }}>
                {candidate.skills.map((skill) => (
                  <Tag key={skill} color="blue" style={{ marginBottom: 8 }}>
                    {skill}
                  </Tag>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <Text strong>Phân tích của AI</Text>
              <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
                {candidate.aiSummary}
              </Paragraph>
            </div>
          </Card>
        </Col>

        <Col xs={24} xl={9}>
          <Card title="Mức độ phù hợp" style={{ marginBottom: 16 }}>
            <Progress
              type="circle"
              percent={candidate.fitScore}
              strokeColor="#2563EB"
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
            {candidate.strengths.map((item) => (
              <Paragraph key={item} style={{ marginBottom: 10 }}>
                • {item}
              </Paragraph>
            ))}
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
            {candidate.gaps.map((item) => (
              <Paragraph key={item} style={{ marginBottom: 10 }}>
                • {item}
              </Paragraph>
            ))}
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