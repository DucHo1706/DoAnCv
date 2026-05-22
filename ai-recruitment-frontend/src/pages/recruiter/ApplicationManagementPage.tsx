import { EyeOutlined, DownloadOutlined, FilePdfOutlined, RobotOutlined } from "@ant-design/icons";
import { Button, Card, Col, message, Modal, Row, Space, Table, Tag, Typography, Descriptions, Divider, Select } from "antd";
import { useEffect, useState, useMemo } from "react";
import PageContainer from "../../components/common/PageContainer";
import StatCard from "../../components/common/StatCard";
import { recruitmentService } from "../../services/recruitmentService";
import type { ApplicationDto } from "../../services/recruitmentService";
import { jobService } from "../../services/jobService";
import type { JobDto } from "../../services/jobService";
import TableToolbar from "../../components/common/TableToolbar";

const { Paragraph, Text, Title } = Typography;

function ApplicationManagementPage() {
  const [applications, setApplications] = useState<ApplicationDto[]>([]);
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<ApplicationDto | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appData, jobData] = await Promise.all([
        recruitmentService.getHrApplications(),
        jobService.getMyJobs()
      ]);
      setApplications(Array.isArray(appData) ? appData : (appData as any)?.$values || []);
      setJobs(Array.isArray(jobData) ? jobData : (jobData as any)?.$values || []);
    } catch (error) {
      message.error("Lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleViewDetail = (record: ApplicationDto) => {
    setSelectedApp(record);
    setIsModalOpen(true);
  };

  // Hàm parse chuỗi JSON kỹ năng thành mảng
  const parseSkills = (jsonStr: string) => {
    if (!jsonStr) return [];
    try {
      const parsed = JSON.parse(jsonStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const filteredApplications = useMemo(() => {
    if (!selectedJobId) return applications;
    return applications.filter(app => app.jobId === selectedJobId);
  }, [applications, selectedJobId]);

  const columns = [
    {
      title: "Ứng viên",
      dataIndex: "candidateName",
      key: "candidateName",
      render: (text: string, record: ApplicationDto) => (
        <div>
          <Text strong>{text}</Text>
          <div style={{ fontSize: "12px", color: "#8c8c8c" }}>{record.email}</div>
        </div>
      ),
    },
    {
      title: "Vị trí ứng tuyển",
      dataIndex: "jobTitle",
      key: "jobTitle",
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Điểm AI Đánh giá",
      dataIndex: "aiScore",
      key: "aiScore",
      sorter: (a: ApplicationDto, b: ApplicationDto) => a.aiScore - b.aiScore,
      render: (score: number) => {
        let color = "success";
        if (score < 50) color = "error";
        else if (score < 75) color = "warning";
        
        return (
          <Tag color={color} style={{ fontSize: "14px", padding: "4px 8px" }}>
            <RobotOutlined style={{ marginRight: 4 }} />
            {score}/100
          </Tag>
        );
      },
    },
    {
      title: "CV File",
      key: "cv",
      render: (_: any, record: ApplicationDto) => (
        <Button 
          type="link" 
          icon={<FilePdfOutlined />} 
          href={record.cvUrl} 
          target="_blank"
        >
          Xem CV
        </Button>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: any, record: ApplicationDto) => (
        <Button type="primary" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
          Chi tiết AI
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      title="Quản lý Hồ sơ Ứng tuyển"
      subtitle="Xem danh sách ứng viên, lọc theo chiến dịch và phân tích kết quả từ AI."
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <StatCard title="Tổng số CV đã nhận" value={filteredApplications.length} subtitle={selectedJobId ? "Chiến dịch đã chọn" : "Tất cả các chiến dịch"} />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard 
            title="Hồ sơ tiềm năng (>75đ)" 
            value={filteredApplications.filter(a => a.aiScore >= 75).length} 
            subtitle="AI đánh giá phù hợp cao" 
          />
        </Col>
      </Row>

      <Card>
        <TableToolbar
          searchPlaceholder="Tìm ứng viên (chờ update)..."
          extra={
            <Select
              placeholder="Lọc theo tin tuyển dụng..."
              style={{ width: 300 }}
              allowClear
              value={selectedJobId}
              onChange={setSelectedJobId}
              options={jobs.map(j => ({
                label: `${j.position?.name || 'Vị trí'} (${j.branch?.name || 'Chi nhánh'})`,
                value: j.id
              }))}
            />
          }
        />
        <Table 
          columns={columns} 
          dataSource={filteredApplications} 
          rowKey="id" 
          loading={loading} 
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Modal hiển thị chi tiết chấm điểm của AI */}
      <Modal
        title={<span><RobotOutlined style={{ color: '#1677ff', marginRight: 8 }}/> Báo cáo Phân tích từ AI</span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalOpen(false)}>Đóng</Button>,
          <Button key="download" type="primary" icon={<DownloadOutlined />} href={selectedApp?.cvUrl} target="_blank">
            Tải CV này
          </Button>
        ]}
        width={700}
      >
        {selectedApp && (
          <div style={{ marginTop: 16 }}>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Ứng viên"><Text strong>{selectedApp.candidateName}</Text> ({selectedApp.email})</Descriptions.Item>
              <Descriptions.Item label="Vị trí ứng tuyển">{selectedApp.jobTitle}</Descriptions.Item>
              <Descriptions.Item label="Điểm độ phù hợp">
                <Text type={selectedApp.aiScore >= 75 ? "success" : selectedApp.aiScore >= 50 ? "warning" : "danger"} strong style={{ fontSize: 18 }}>
                  {selectedApp.aiScore} / 100
                </Text>
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">Nhận xét chi tiết từ AI</Divider>
            
            <Paragraph><b>✅ Kỹ năng đáp ứng:</b> <span style={{ color: '#52c41a' }}>{parseSkills(selectedApp.matchedSkills).join(', ') || 'Không có'}</span></Paragraph>
            <Paragraph><b>❌ Kỹ năng còn thiếu:</b> <span style={{ color: '#f5222d' }}>{parseSkills(selectedApp.missingSkills).join(', ') || 'Không có'}</span></Paragraph>
            
            <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, marginTop: 16 }}>
              <Text italic>"{selectedApp.aiReason}"</Text>
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}

export default ApplicationManagementPage;