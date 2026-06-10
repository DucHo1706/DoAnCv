import React, { useState } from "react";
import { Button, Card, Input, Space, Table, Tag, Typography, Avatar } from "antd";
import { SearchOutlined, UserOutlined, SendOutlined, MailOutlined, TrophyOutlined } from "@ant-design/icons";
import PageContainer from "../../components/common/PageContainer";
import { useNavigate } from "react-router-dom";

const { Title, Text, Paragraph } = Typography;

// Dữ liệu giả lập cho kho Talent Pool
const mockTalentPool = [
  { id: "1", name: "Nguyễn Văn A", email: "nguyenvana@gmail.com", skills: ["ReactJS", "NodeJS", "TypeScript"], lastApplied: "Frontend Developer", maxAiScore: 92, status: "Sẵn sàng tìm việc" },
  { id: "2", name: "Trần Thị B", email: "tranthib@gmail.com", skills: ["Figma", "UI/UX", "Photoshop"], lastApplied: "UI/UX Designer", maxAiScore: 88, status: "Đang làm việc" },
  { id: "3", name: "Lê Hoàng C", email: "lehoangc@gmail.com", skills: ["Java", "Spring Boot", "MySQL", "AWS"], lastApplied: "Backend Developer", maxAiScore: 95, status: "Sẵn sàng tìm việc" },
  { id: "4", name: "Phạm D", email: "phamd@gmail.com", skills: ["Marketing", "SEO", "Content"], lastApplied: "Content Creator", maxAiScore: 78, status: "Sẵn sàng tìm việc" },
];

export default function TalentPoolPage() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");

  const columns = [
    {
      title: "Ứng viên",
      key: "candidate",
      render: (_: any, record: any) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />
          <div>
            <Text strong>{record.name}</Text>
            <div style={{ fontSize: 12, color: "#8c8c8c" }}>{record.email}</div>
          </div>
        </Space>
      )
    },
    {
      title: "Kỹ năng nổi bật",
      key: "skills",
      render: (_: any, record: any) => (
        <Space wrap>
          {record.skills.map((skill: string) => <Tag color="blue" key={skill}>{skill}</Tag>)}
        </Space>
      )
    },
    {
      title: "Lịch sử cao nhất",
      key: "history",
      render: (_: any, record: any) => (
        <div>
          <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>Từng nộp: {record.lastApplied}</Text>
          <Tag color="green" icon={<TrophyOutlined />}>AI Điểm cao nhất: {record.maxAiScore}</Tag>
        </div>
      )
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => <Tag color={status === "Sẵn sàng tìm việc" ? "success" : "default"}>{status}</Tag>
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" type="primary" ghost icon={<SendOutlined />} onClick={() => navigate(`/recruiter/talent-pool/invite/${record.id}`)}>Mời ứng tuyển</Button>
          <Button size="small" icon={<MailOutlined />} onClick={() => navigate(`/recruiter/candidates/${record.id}/email`)}>Email</Button>
        </Space>
      )
    }
  ];

  return (
    <PageContainer title="Ngân hàng Ứng viên (Talent Pool)" subtitle="Quản lý và tìm kiếm lại những ứng viên tiềm năng cũ cho các chiến dịch mới.">
      <Card style={{ borderRadius: 12 }}>
        <div style={{ marginBottom: 24, display: "flex", gap: 16 }}>
          <Input size="large" placeholder="Tìm kiếm theo kỹ năng (VD: React, Java...)" prefix={<SearchOutlined />} style={{ width: 400 }} value={searchText} onChange={e => setSearchText(e.target.value)} />
          <Button size="large" type="primary">Tìm kiếm AI</Button>
        </div>

        <Table columns={columns} dataSource={mockTalentPool} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>
    </PageContainer>
  );
}