import { EyeOutlined, FilterOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Card, Descriptions, Drawer, Select, Space, Table, Tag, Typography } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "../../components/common/PageContainer";
import TableToolbar from "../../components/common/TableToolbar";
import { recruiterCandidates } from "../../mock/recruiter";
import type { RecruiterCandidate } from "../../mock/recruiter";

const { Paragraph, Text } = Typography;

function CandidateListPage() {
  const navigate = useNavigate();
  const [selectedCandidate, setSelectedCandidate] = useState<RecruiterCandidate | null>(null);

  const columns = [
    {
      title: "Ứng viên",
      key: "candidate",
      render: (_: unknown, record: RecruiterCandidate) => (
        <div>
          <Text strong>{record.name}</Text>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            {record.email}
          </Paragraph>
        </div>
      ),
    },
    {
      title: "Vị trí",
      dataIndex: "position",
      key: "position",
    },
    {
      title: "Kinh nghiệm",
      dataIndex: "experience",
      key: "experience",
      render: (value: number) => `${value} năm`,
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
    {
      title: "Thao tác",
      key: "actions",
      render: (_: unknown, record: RecruiterCandidate) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => setSelectedCandidate(record)}>
            Quick View
          </Button>
          <Button type="primary" onClick={() => navigate(`/recruiter/candidates/${record.id}`)}>
            Chi tiết
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title="Danh sách ứng viên"
      subtitle="Xem nhanh ứng viên, lọc theo trạng thái và mở hồ sơ chi tiết."
    >
      <Card>
        <TableToolbar
          searchPlaceholder="Tìm theo tên, email hoặc vị trí..."
          extra={
            <>
              <Select
                placeholder="Trạng thái"
                style={{ width: 150 }}
                suffixIcon={<FilterOutlined />}
                options={[
                  { label: "Tất cả", value: "all" },
                  { label: "New", value: "new" },
                  { label: "Reviewed", value: "reviewed" },
                  { label: "Interview", value: "interview" },
                  { label: "Shortlisted", value: "shortlisted" },
                ]}
              />
              <Select
                placeholder="Vị trí"
                style={{ width: 180 }}
                options={[
                  { label: "Frontend Developer", value: "frontend" },
                  { label: "Backend Developer", value: "backend" },
                  { label: "Business Analyst", value: "ba" },
                ]}
              />
            </>
          }
        />

        <Table
          rowKey="id"
          columns={columns}
          dataSource={recruiterCandidates}
          pagination={{ pageSize: 6 }}
        />
      </Card>

      <Drawer
        title="Quick View ứng viên"
        placement="right"
        width={440}
        open={!!selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
      >
        {selectedCandidate ? (
          <>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Họ tên">{selectedCandidate.name}</Descriptions.Item>
              <Descriptions.Item label="Email">{selectedCandidate.email}</Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">{selectedCandidate.phone}</Descriptions.Item>
              <Descriptions.Item label="Vị trí">{selectedCandidate.position}</Descriptions.Item>
              <Descriptions.Item label="Kinh nghiệm">
                {selectedCandidate.experience} năm
              </Descriptions.Item>
              <Descriptions.Item label="Fit Score">
                {selectedCandidate.fitScore}/100
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 16 }}>
              <Text strong>Kỹ năng</Text>
              <div style={{ marginTop: 8 }}>
                {selectedCandidate.skills.map((skill) => (
                  <Tag key={skill} color="blue" style={{ marginBottom: 8 }}>
                    {skill}
                  </Tag>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <Text strong>AI Summary</Text>
              <Paragraph style={{ marginTop: 8 }}>{selectedCandidate.aiSummary}</Paragraph>
            </div>

            <Button
              type="primary"
              icon={<UserOutlined />}
              block
              onClick={() => navigate(`/recruiter/candidates/${selectedCandidate.id}`)}
            >
              Mở trang chi tiết
            </Button>
          </>
        ) : null}
      </Drawer>
    </PageContainer>
  );
}

export default CandidateListPage;
