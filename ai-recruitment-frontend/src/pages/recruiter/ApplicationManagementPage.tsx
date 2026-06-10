import { EyeOutlined, DownloadOutlined, FilePdfOutlined, RobotOutlined, UserOutlined, MailOutlined, AppstoreOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { Button, Card, Col, message, Drawer, Row, Space, Table, Tag, Typography, Select, Progress, Alert, Radio, Avatar } from "antd";
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "../../components/common/PageContainer";
import StatCard from "../../components/common/StatCard";
import { recruitmentService } from "../../services/recruitmentService";
import type { ApplicationDto } from "../../services/recruitmentService";
import { jobService } from "../../services/jobService";
import type { JobDto } from "../../services/jobService";
import TableToolbar from "../../components/common/TableToolbar";

const { Paragraph, Text, Title } = Typography;

function ApplicationManagementPage() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<ApplicationDto[]>([]);
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<ApplicationDto | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  
  // Mockup Kanban Stages
  const kanbanStages = ["Mới nộp", "Đang xem xét", "Phỏng vấn", "Nhận việc (Offer)", "Đã từ chối"];
  // State lưu trữ dữ liệu Kanban để xử lý kéo thả
  const [kanbanData, setKanbanData] = useState<Record<string, ApplicationDto[]>>({});

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

  // Mỗi khi dữ liệu lọc thay đổi, reset lại bảng Kanban
  useEffect(() => {
    setKanbanData({
      "Mới nộp": filteredApplications,
      "Đang xem xét": [],
      "Phỏng vấn": [],
      "Nhận việc (Offer)": [],
      "Đã từ chối": []
    });
  }, [filteredApplications]);

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
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} title="Xem nhanh báo cáo AI">
            Xem nhanh AI
          </Button>
          <Button icon={<MailOutlined />} onClick={() => navigate(`/recruiter/candidates/${record.id}/email`)} title="Gửi Email cho ứng viên">
            Email
          </Button>
          <Button type="primary" icon={<UserOutlined />} onClick={() => navigate(`/recruiter/candidates/${record.id}`)}>
            Hồ sơ chi tiết
          </Button>
        </Space>
      ),
    },
  ];

  // --- CÁC HÀM XỬ LÝ KÉO THẢ (DRAG & DROP) ---
  const handleDragStart = (e: React.DragEvent, appId: string, sourceStage: string) => {
    e.dataTransfer.setData("appId", appId);
    e.dataTransfer.setData("sourceStage", sourceStage);
  };

  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData("appId");
    const sourceStage = e.dataTransfer.getData("sourceStage");
    
    if (sourceStage === targetStage || !appId) return; // Không làm gì nếu thả lại cột cũ

    setKanbanData(prev => {
      const app = prev[sourceStage].find(a => a.id === appId);
      if (!app) return prev;
      return {
        ...prev,
        [sourceStage]: prev[sourceStage].filter(a => a.id !== appId),
        [targetStage]: [...prev[targetStage], app]
      };
    });
    message.success(`Đã chuyển ứng viên sang trạng thái: ${targetStage}`);
  };

  // Render Kanban Board
  const renderKanbanBoard = () => {
    return (
      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}>
        {kanbanStages.map((stage, idx) => (
          <div key={stage} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, stage)} style={{ minWidth: 300, background: '#f5f7fa', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', minHeight: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text strong style={{ fontSize: 16 }}>{stage}</Text>
              <Tag color="blue">{kanbanData[stage]?.length || 0}</Tag>
            </div>
            
            <Space direction="vertical" style={{ width: '100%' }}>
              {kanbanData[stage]?.map(app => (
                <Card key={app.id} size="small" draggable onDragStart={(e) => handleDragStart(e, app.id, stage)} style={{ borderRadius: 8, cursor: 'grab', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                    <Avatar icon={<UserOutlined />} />
                    <div>
                      <Text strong style={{ display: 'block' }}>{app.candidateName}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>{app.jobTitle}</Text>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Tag color={app.aiScore >= 80 ? "green" : app.aiScore >= 60 ? "gold" : "red"}>
                      AI: {app.aiScore}đ
                    </Tag>
                    <Space size="small">
                      <Button size="small" type="text" icon={<EyeOutlined />} onClick={() => handleViewDetail(app)} />
                      <Button size="small" type="text" icon={<MailOutlined />} onClick={() => navigate(`/recruiter/candidates/${app.id}/email`)} />
                    </Space>
                  </div>
                </Card>
              ))}
              {(!kanbanData[stage] || kanbanData[stage].length === 0) && (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#bfbfbf', border: '1px dashed #d9d9d9', borderRadius: 8 }}>
                  Kéo thả ứng viên vào đây
                </div>
              )}
            </Space>
          </div>
        ))}
      </div>
    );
  };

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
            <Space>
              <Select
                placeholder="Lọc theo tin tuyển dụng..."
                style={{ width: 300 }}
                allowClear
                value={selectedJobId}
                onChange={setSelectedJobId}
                showSearch
                filterOption={(input, option) => ((option?.label as string) ?? "").toLowerCase().includes(input.toLowerCase())}
                options={Object.entries(
                  jobs.reduce((acc: any, j: any) => {
                    const catName = j.category?.name || "Lĩnh vực khác";
                    if (!acc[catName]) acc[catName] = [];
                    acc[catName].push({ label: `${j.position?.name || 'Vị trí'} (${j.branch?.name || 'Chi nhánh'})`, value: j.id });
                    return acc;
                  }, {})
                ).map(([catName, jobsGroup]: [string, any]) => ({
                  label: catName,
                  options: jobsGroup
                }))}
              />
              <Radio.Group value={viewMode} onChange={(e) => setViewMode(e.target.value)} optionType="button" buttonStyle="solid">
                <Radio.Button value="table"><UnorderedListOutlined /> Bảng</Radio.Button>
                <Radio.Button value="kanban"><AppstoreOutlined /> Kanban</Radio.Button>
              </Radio.Group>
            </Space>
          }
        />
        {viewMode === 'table' ? (
          <Table columns={columns} dataSource={filteredApplications} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
        ) : (
          renderKanbanBoard()
        )}
      </Card>

      {/* Drawer hiển thị chi tiết chấm điểm của AI */}
      <Drawer
        title={<span><RobotOutlined style={{ color: '#1677ff', marginRight: 8 }}/> Báo cáo Phân tích từ AI</span>}
        placement="right"
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        extra={
          <Button type="primary" icon={<DownloadOutlined />} href={selectedApp?.cvUrl} target="_blank">
            Tải CV này
          </Button>
        }
        width={760}
      >
        {selectedApp && (
          <div>
            <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 24, marginTop: 16 }}>
              <Col span={6} style={{ textAlign: "center" }}>
                <Progress
                  type="dashboard"
                  percent={selectedApp.aiScore}
                  strokeColor={
                    selectedApp.aiScore >= 80 ? "#52c41a" :
                    selectedApp.aiScore >= 60 ? "#faad14" : "#ff4d4f"
                  }
                  format={(percent) => `${percent} Điểm`}
                />
              </Col>
              <Col span={18}>
                <Title level={4} style={{ margin: 0 }}>
                  {selectedApp.candidateName}
                </Title>
                <Text type="secondary" style={{ display: "block" }}>
                  {selectedApp.email}
                </Text>
                <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
                  Vị trí ứng tuyển: <Text strong>{selectedApp.jobTitle}</Text>
                </Text>
                <div>
                  Phân loại:{" "}
                  <Tag color={
                    selectedApp.classification === "Phù hợp" || selectedApp.classification === "Phù hợp cao" ? "green" :
                    selectedApp.classification === "Nên xem xét" ? "orange" : "red"
                  }>
                    {selectedApp.classification || "Chưa phân loại"}
                  </Tag>
                </div>
              </Col>
            </Row>

            <Alert
              message="Trí tuệ nhân tạo (AI) nhận xét tổng quan:"
              description={selectedApp.aiReason}
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={12}>
                <Text strong>✅ Kỹ năng đáp ứng được (CV có):</Text>
                <div style={{ marginTop: 8 }}>
                  {parseSkills(selectedApp.matchedSkills).length > 0 ? (
                    parseSkills(selectedApp.matchedSkills).map((skill: string) => (
                      <Tag color="green" key={skill} style={{ marginBottom: 4 }}>{skill}</Tag>
                    ))
                  ) : (
                    <Text type="secondary">Không có</Text>
                  )}
                </div>
              </Col>
              <Col span={12}>
                <Text strong>❌ Kỹ năng còn thiếu (JD yêu cầu):</Text>
                <div style={{ marginTop: 8 }}>
                  {parseSkills(selectedApp.missingSkills).length > 0 ? (
                    parseSkills(selectedApp.missingSkills).map((skill: string) => (
                      <Tag color="red" key={skill} style={{ marginBottom: 4 }}>{skill}</Tag>
                    ))
                  ) : (
                    <Text type="secondary">Không thiếu kỹ năng nào</Text>
                  )}
                </div>
              </Col>
            </Row>
            
            <Title level={5}>Điểm chi tiết theo từng tiêu chí</Title>
            <Table
              dataSource={(selectedApp as any).criteriaResults || []}
              rowKey={(record: any) => record.criterionName || record.criterion_name}
              pagination={false}
              size="small"
              bordered
              columns={[
                {
                  title: 'Tiêu chí đánh giá',
                  key: 'criterionName',
                  width: '30%',
                  render: (_: any, record: any) => record.criterionName || record.criterion_name || "Chưa có tên"
                },
                {
                  title: 'Trọng số',
                  key: 'weight',
                  width: '10%',
                  render: (_: any, record: any) => `${record.weight || 0}%`
                },
                {
                  title: 'Điểm',
                  key: 'score',
                  width: '15%',
                  render: (_: any, record: any) => (
                    <strong>{record.score || 0} / {record.maxScore || record.max_score || 0}</strong>
                  )
                },
                {
                  title: 'AI Giải thích',
                  dataIndex: 'comment',
                  key: 'comment',
                  width: '45%'
                }
              ]}
              locale={{ emptyText: "Không có dữ liệu tiêu chí đánh giá" }}
            />
          </div>
        )}
      </Drawer>
    </PageContainer>
  );
}

export default ApplicationManagementPage;