import {
  CheckCircleOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Button, Card, Col, List, Progress, Row, Table, Tag, Typography } from "antd";
import PageContainer from "../../components/common/PageContainer";
import StatCard from "../../components/common/StatCard";
import { recruiterCandidates, recruiterJobs } from "../../mock/recruiter";

const { Paragraph, Text } = Typography;

function RecruiterDashboardPage() {
  const activeJobs = recruiterJobs.filter((job) => job.status === "Open").length;
  const totalCandidates = recruiterCandidates.length;
  const shortlisted = recruiterCandidates.filter(
    (candidate) => candidate.status === "Shortlisted",
  ).length;
  const averageScore = Math.round(
    recruiterCandidates.reduce((sum, candidate) => sum + candidate.fitScore, 0) /
      recruiterCandidates.length,
  );

  const recentCandidates = recruiterCandidates.slice(0, 4).map((item) => ({
    key: item.id,
    name: item.name,
    position: item.position,
    fitScore: item.fitScore,
    status: item.status,
  }));

  const candidateColumns = [
    {
      title: "Ứng viên",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Vị trí",
      dataIndex: "position",
      key: "position",
    },
    {
      title: "Fit Score",
      dataIndex: "fitScore",
      key: "fitScore",
      render: (value: number) => <Text strong>{value}/100</Text>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (value: string) => <Tag color="blue">{value}</Tag>,
    },
  ];

  return (
    <PageContainer
      title="Recruiter Dashboard"
      subtitle="Tổng quan nhanh về các vị trí đang tuyển, hồ sơ mới và kết quả chấm điểm AI."
      extra={<Button type="primary">Tạo tin tuyển dụng</Button>}
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Tin tuyển dụng đang mở"
            value={activeJobs}
            subtitle="Các vị trí đang nhận hồ sơ"
            icon={<FileTextOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Tổng ứng viên"
            value={totalCandidates}
            subtitle="Toàn bộ hồ sơ đang quản lý"
            icon={<TeamOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Shortlisted"
            value={shortlisted}
            subtitle="Ứng viên phù hợp cao"
            icon={<CheckCircleOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Điểm phù hợp trung bình"
            value={`${averageScore}/100`}
            subtitle="AI matching score"
            icon={<FileSearchOutlined />}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={15}>
          <Card title="Ứng viên mới / nổi bật">
            <Table
              columns={candidateColumns}
              dataSource={recentCandidates}
              pagination={false}
            />
          </Card>
        </Col>

        <Col xs={24} xl={9}>
          <Card title="Tiến độ tuyển dụng" style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Frontend Developer</Text>
              <Progress percent={76} strokeColor="#2563EB" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Backend Developer</Text>
              <Progress percent={61} strokeColor="#2563EB" />
            </div>
            <div>
              <Text strong>Business Analyst</Text>
              <Progress percent={38} strokeColor="#2563EB" />
            </div>
          </Card>

          <Card title="Tin tuyển dụng gần đây">
            <List
              dataSource={recruiterJobs.slice(0, 4)}
              renderItem={(job) => (
                <List.Item>
                  <List.Item.Meta
                    title={job.title}
                    description={
                      <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                        {job.department} • {job.location} • {job.applications} hồ sơ
                      </Paragraph>
                    }
                  />
                  <Tag color={job.status === "Open" ? "green" : job.status === "Draft" ? "gold" : "default"}>
                    {job.status}
                  </Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
}

export default RecruiterDashboardPage;