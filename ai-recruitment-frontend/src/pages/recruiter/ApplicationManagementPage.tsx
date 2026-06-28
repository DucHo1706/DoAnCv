import { EyeOutlined, FilePdfOutlined, RobotOutlined, UserOutlined, MailOutlined, AppstoreOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { Button, Card, Col, message, Drawer, Row, Space, Table, Tag, Typography, Select, Progress, Alert, Radio, Avatar, Modal, Input } from "antd";
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
  
  const applicationStatusStages = [
    { status: "Applied", label: "Mới nộp" },
    { status: "Reviewing", label: "Đang xem xét" },
    { status: "Interview", label: "Phỏng vấn" },
    { status: "Offer", label: "Nhận việc (Offer)" },
    { status: "Rejected", label: "Đã từ chối" },
  ];

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetApplication, setRejectTargetApplication] = useState<ApplicationDto | null>(null);
  const [rejectReasonType, setRejectReasonType] = useState<string | undefined>(undefined);
  const [rejectNote, setRejectNote] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const rejectReasonOptions = [
    { value: "Thiếu kinh nghiệm", label: "Thiếu kinh nghiệm" },
    { value: "Không phù hợp văn hóa", label: "Không phù hợp văn hóa" },
    { value: "Kỹ năng chưa phù hợp JD", label: "Kỹ năng chưa phù hợp JD" },
    { value: "Mức lương kỳ vọng chưa phù hợp", label: "Mức lương kỳ vọng chưa phù hợp" },
    { value: "Ứng viên không phản hồi", label: "Ứng viên không phản hồi" },
    { value: "Khác", label: "Khác" },
  ];

  const openRejectModal = (application: ApplicationDto) => {
    setRejectTargetApplication(application);
    setRejectReasonType(undefined);
    setRejectNote("");
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectTargetApplication) {
      message.error("Không tìm thấy hồ sơ cần từ chối.");
      return;
    }

    if (!rejectReasonType) {
      message.warning("Vui lòng chọn lý do từ chối.");
      return;
    }

    try {
      setRejectSubmitting(true);

      await recruitmentService.rejectApplication(rejectTargetApplication.id, {
        reasonType: rejectReasonType,
        note: rejectNote,
      });

      setApplications((previousApplications) =>
        previousApplications.map((application) => {
          if (application.id === rejectTargetApplication.id) {
            return {
              ...application,
              status: "Rejected",
            };
          }

          return application;
        })
      );

      message.success("Đã từ chối hồ sơ và đưa ứng viên vào Talent Pool.");

      setRejectModalOpen(false);
      setRejectTargetApplication(null);
      setRejectReasonType(undefined);
      setRejectNote("");
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "Không thể từ chối hồ sơ.";

      message.error(errorMessage);
    } finally {
      setRejectSubmitting(false);
    }
  };

  const getStageLabelByStatus = (status?: string) => {
    const foundStage = applicationStatusStages.find(
      (stage) => stage.status === status
    );

    if (foundStage) {
      return foundStage.label;
    }

    return "Mới nộp";
  };

  const getStatusByStageLabel = (label: string) => {
    const foundStage = applicationStatusStages.find(
      (stage) => stage.label === label
    );

    if (foundStage) {
      return foundStage.status;
    }

    return "Applied";
  };
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
    const groupedData: Record<string, ApplicationDto[]> = {};

    applicationStatusStages.forEach((stage) => {
      groupedData[stage.label] = [];
    });

    filteredApplications.forEach((application) => {
      const stageLabel = getStageLabelByStatus(application.status);

      if (!groupedData[stageLabel]) {
        groupedData[stageLabel] = [];
      }

      groupedData[stageLabel].push(application);
    });

    setKanbanData(groupedData);
  }, [filteredApplications]);

  const columns = [
    {
      title: "Ứng viên",
      dataIndex: "candidateName",
      key: "candidateName",
      width: 220,
      render: (text: string, record: ApplicationDto) => (
        <div style={{ maxWidth: 200 }}>
          <Text strong ellipsis style={{ display: "block" }}>
            {text}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
            {record.email}
          </Text>
        </div>
      ),
    },
    {
      title: "Vị trí ứng tuyển",
      dataIndex: "jobTitle",
      key: "jobTitle",
      width: 320,
      render: (text: string) => (
        <Tag
          color="blue"
          style={{
            maxWidth: 290,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </Tag>
      ),
    },
    {
      title: "Điểm AI Đánh giá",
      dataIndex: "aiScore",
      key: "aiScore",
      width: 180,
      sorter: (a: ApplicationDto, b: ApplicationDto) => a.aiScore - b.aiScore,
      render: (score: number) => {
        let color = "success";

        if (score < 50) {
          color = "error";
        } else if (score < 75) {
          color = "warning";
        }

        return (
          <Tag color={color} style={{ fontSize: "14px", padding: "4px 8px" }}>
            <RobotOutlined style={{ marginRight: 4 }} />
            {score}/100
          </Tag>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 220,
      render: (status: string, record: ApplicationDto) => {
        const currentStatus = status || "Applied";

        return (
          <Select
            value={currentStatus}
            style={{ width: 170 }}
            onChange={async (newStatus) => {
              if (newStatus === "Rejected") {
                openRejectModal(record);
                return;
              }

              try {
                await recruitmentService.updateApplicationStatus(record.id, newStatus);

                setApplications((previousApplications) =>
                  previousApplications.map((application) => {
                    if (application.id === record.id) {
                      return {
                        ...application,
                        status: newStatus,
                      };
                    }

                    return application;
                  })
                );

                message.success("Cập nhật trạng thái thành công.");
              } catch (error: any) {
                const errorMessage =
                  error?.response?.data?.message || "Không thể cập nhật trạng thái.";

                message.error(errorMessage);
              }
            }}
            options={[
              { value: "Applied", label: "Mới nộp" },
              { value: "Reviewing", label: "Đang xem xét" },
              { value: "Interview", label: "Phỏng vấn" },
              { value: "Offer", label: "Nhận việc (Offer)" },
              { value: "Rejected", label: "Đã từ chối" },
            ]}
          />
        );
      },
    },
    {
      title: "Thao tác",
      key: "action",
      width: 390,
      align: "center" as const,
      render: (_: any, record: ApplicationDto) => (
        <Space size="small" wrap={false}>
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            Xem nhanh AI
          </Button>

          <Button
            icon={<MailOutlined />}
            onClick={() => navigate(`/recruiter/candidates/${record.id}/email`)}
          >
            Email
          </Button>

          <Button
            type="primary"
            icon={<UserOutlined />}
            onClick={() => navigate(`/recruiter/candidates/${record.id}`)}
          >
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

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();

    const appId = e.dataTransfer.getData("appId");
    const sourceStage = e.dataTransfer.getData("sourceStage");

    if (sourceStage === targetStage || !appId) {
      return;
    }

    const targetStatus = getStatusByStageLabel(targetStage);

    if (targetStatus === "Rejected") {
      const targetApplication = applications.find((application) => application.id === appId);

      if (!targetApplication) {
        message.error("Không tìm thấy hồ sơ cần từ chối.");
        return;
      }

      openRejectModal(targetApplication);
      return;
    }

    try {
      await recruitmentService.updateApplicationStatus(appId, targetStatus);

      setApplications((previousApplications) =>
        previousApplications.map((application) => {
          if (application.id === appId) {
            return {
              ...application,
              status: targetStatus,
            };
          }

          return application;
        })
      );

      message.success(`Đã chuyển ứng viên sang trạng thái: ${targetStage}`);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "Không thể cập nhật trạng thái hồ sơ.";

      message.error(errorMessage);
    }
  };

  // Render Kanban Board
  const renderKanbanBoard = () => {
    return (
      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}>
        {applicationStatusStages.map((stageItem) => {
          const stage = stageItem.label;

          return (
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
          );
        })}
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

      <Card style={{ overflow: "hidden" }}>
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
          <Table columns={columns} dataSource={filteredApplications} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} scroll={{ x: 1050 }} tableLayout="fixed"/>
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
          <Button type="primary" icon={<FilePdfOutlined />} href={selectedApp?.cvUrl} target="_blank">
            Xem CV
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
      <Modal
        title="Xác nhận từ chối & Ghi chú"
        open={rejectModalOpen}
        onOk={handleConfirmReject}
        onCancel={() => {
          setRejectModalOpen(false);
          setRejectTargetApplication(null);
          setRejectReasonType(undefined);
          setRejectNote("");
        }}
        okText="Xác nhận từ chối"
        cancelText="Hủy"
        confirmLoading={rejectSubmitting}
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <div>
            <Text strong>Ứng viên</Text>
            <div style={{ marginTop: 4 }}>
              {rejectTargetApplication?.candidateName || "Chưa chọn ứng viên"}
            </div>
          </div>

          <div>
            <Text strong>Vị trí ứng tuyển</Text>
            <div style={{ marginTop: 4 }}>
              {rejectTargetApplication?.jobTitle || "Chưa cập nhật"}
            </div>
          </div>

          <div>
            <Text strong>
              Lý do từ chối <span style={{ color: "red" }}>*</span>
            </Text>

            <Select
              placeholder="Chọn lý do từ chối"
              value={rejectReasonType}
              onChange={setRejectReasonType}
              options={rejectReasonOptions}
              style={{ width: "100%", marginTop: 8 }}
            />
          </div>

          <div>
            <Text strong>Ghi chú thêm</Text>

            <Input.TextArea
              placeholder="Nhập ghi chú để lưu vào Talent Pool..."
              value={rejectNote}
              onChange={(event) => setRejectNote(event.target.value)}
              rows={4}
              style={{ marginTop: 8 }}
            />
          </div>

          <Alert
            type="info"
            showIcon
            message="Sau khi xác nhận, hồ sơ sẽ được chuyển sang trạng thái Đã từ chối và ứng viên sẽ được lưu vào Ngân hàng Ứng viên."
          />
        </Space>
      </Modal>
    </PageContainer>
  );
}

export default ApplicationManagementPage;