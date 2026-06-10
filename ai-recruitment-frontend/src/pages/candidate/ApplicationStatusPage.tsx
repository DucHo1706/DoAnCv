import { EyeOutlined, RobotOutlined } from "@ant-design/icons";
import { Card, Typography, Table, Tag, message, Button, Drawer, Row, Col, Progress, Alert } from "antd";
import { useEffect, useState } from "react";
import { recruitmentService } from "../../services/recruitmentService";
import PageContainer from "../../components/common/PageContainer";

const { Text } = Typography;

function ApplicationStatusPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);

  useEffect(() => {
    const fetchMyApps = async () => {
      try {
        setLoading(true);

        const data: any = await recruitmentService.getMyApplications();

        if (Array.isArray(data)) {
          setApplications(data);
        } else {
          setApplications(data?.$values || []);
        }
      } catch (error) {
        message.error("Không tải được lịch sử ứng tuyển.");
      } finally {
        setLoading(false);
      }
    };

    fetchMyApps();
  }, []);

  const handleViewDetail = (record: any) => {
    setSelectedApp(record);
    setIsDetailModalOpen(true);
  };

  const columns = [
    {
      title: "Vị trí ứng tuyển",
      dataIndex: "jobTitle",
      key: "jobTitle",
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "Điểm AI Đánh giá",
      dataIndex: "aiScore",
      key: "aiScore",
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
      title: "Nhận xét của AI",
      dataIndex: "aiReason",
      key: "aiReason",
      render: (text: string) => (
        <Text
          type="secondary"
          ellipsis={{ tooltip: text }}
          style={{ maxWidth: 350 }}
        >
          {text || "Chưa có nhận xét"}
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      render: () => <Tag color="blue">Đã gửi tới HR</Tag>,
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: any, record: any) => (
        <Button type="primary" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
          Báo cáo AI
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      title="Lịch sử Ứng tuyển"
      subtitle="Theo dõi các công việc bạn đã nộp CV và xem lại đánh giá chi tiết từ AI."
    >
      <Card>
        <Table
          columns={columns}
          dataSource={applications}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: "Bạn chưa nộp CV vào vị trí nào." }}
        />
      </Card>

      <Drawer
        title={<span><RobotOutlined style={{ color: '#1677ff', marginRight: 8 }}/> Báo cáo Phân tích từ AI</span>}
        placement="right"
        open={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
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
                <Typography.Title level={4} style={{ margin: 0, marginBottom: 8 }}>
                  Vị trí: {selectedApp.jobTitle}
                </Typography.Title>
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

            <Alert message="Trí tuệ nhân tạo (AI) nhận xét:" description={selectedApp.aiReason} type="info" showIcon style={{ marginBottom: 24 }} />

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={12}>
                <Text strong>✅ Kỹ năng đáp ứng được (CV có):</Text>
                <div style={{ marginTop: 8 }}>
                  {selectedApp.matchedSkills?.length > 0 ? (
                    selectedApp.matchedSkills.map((skill: string) => (
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
                  {selectedApp.missingSkills?.length > 0 ? (
                    selectedApp.missingSkills.map((skill: string) => (
                      <Tag color="red" key={skill} style={{ marginBottom: 4 }}>{skill}</Tag>
                    ))
                  ) : (
                    <Text type="secondary">Không thiếu kỹ năng nào</Text>
                  )}
                </div>
              </Col>
            </Row>
            
            <Typography.Title level={5}>Điểm chi tiết theo từng tiêu chí</Typography.Title>
            <Table
              dataSource={selectedApp.criteriaResults || []}
              rowKey={(record: any) => record.criterionName || record.criterion_name}
              pagination={false}
              size="small"
              bordered
              columns={[
                { title: 'Tiêu chí đánh giá', key: 'criterionName', width: '30%', render: (_: any, record: any) => record.criterionName || record.criterion_name || "Chưa có tên" },
                { title: 'Trọng số', key: 'weight', width: '10%', render: (_: any, record: any) => `${record.weight || 0}%` },
                { title: 'Điểm', key: 'score', width: '15%', render: (_: any, record: any) => (<strong>{record.score || 0} / {record.maxScore || record.max_score || 0}</strong>) },
                { title: 'AI Giải thích', dataIndex: 'comment', key: 'comment', width: '45%' }
              ]}
              locale={{ emptyText: "Không có dữ liệu tiêu chí đánh giá" }}
            />
          </div>
        )}
      </Drawer>
    </PageContainer>
  );
}

export default ApplicationStatusPage;