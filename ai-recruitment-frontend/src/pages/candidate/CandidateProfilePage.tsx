import { useEffect, useState } from "react";
import { Avatar, Button, Card, Col, List, Progress, Row, Space, Spin, Tabs, Tag, Typography, message } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined, UserOutlined } from "@ant-design/icons";
import PageContainer from "../../components/common/PageContainer";
import EmptyState from "../../components/common/EmptyState";
import axiosClient from "../../services/axiosClient";
import { authService } from "../../services/authService";

const { Title, Text, Paragraph } = Typography;

function CandidateProfilePage() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const user = authService.getCurrentUser();

  useEffect(() => {
    fetchMyApplications();
  }, []);

  const fetchMyApplications = async () => {
    try {
      setLoading(true);
      // Gọi API lấy danh sách việc làm ứng viên đã nộp kèm kết quả AI chấm
      const res = await axiosClient.get("/Recruitment/my-applications");
      const data = res.data;
      setApplications(Array.isArray(data) ? data : (data?.$values || []));
    } catch (error) {
      message.error("Lỗi khi tải lịch sử ứng tuyển.");
    } finally {
      setLoading(false);
    }
  };

  // Hàm chọn màu sắc cho Tag Xếp loại
  const getClassificationColor = (classification?: string) => {
    if (!classification) return "default";
    if (classification.includes("Phù hợp cao") || classification === "Phù hợp") return "green";
    if (classification.includes("Nên xem xét")) return "gold";
    return "red";
  };

  // Render danh sách công việc đã ứng tuyển
  const renderHistory = () => {
    if (loading) return <div style={{ textAlign: "center", padding: 40 }}><Spin size="large" /></div>;
    if (applications.length === 0) return <EmptyState description="Bạn chưa ứng tuyển công việc nào." />;

    return (
      <List
        grid={{ gutter: 16, xs: 1, sm: 1, md: 1, lg: 2, xl: 2, xxl: 2 }}
        dataSource={applications}
        renderItem={(app) => (
          <List.Item>
            <Card 
              title={<Text strong style={{ color: "#1677ff" }}>{app.jobTitle}</Text>} 
              extra={<Tag color={getClassificationColor(app.classification)}>{app.classification}</Tag>}
              style={{ height: "100%", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
            >
              <Row gutter={[16, 16]} align="middle">
                <Col span={8} style={{ textAlign: "center" }}>
                  <Progress 
                    type="circle" 
                    percent={app.aiScore} 
                    size={80}
                    strokeColor={app.aiScore >= 75 ? "#52c41a" : app.aiScore >= 50 ? "#faad14" : "#ff4d4f"}
                    format={(percent) => <span style={{ fontSize: 16, fontWeight: "bold" }}>{percent}</span>}
                  />
                  <div style={{ marginTop: 8 }}><Text type="secondary">Điểm AI</Text></div>
                </Col>
                <Col span={16}>
                  <Text strong>Nhận xét từ AI:</Text>
                  <Paragraph ellipsis={{ rows: 3, expandable: true, symbol: 'Đọc thêm' }} style={{ marginTop: 4, fontSize: 13, background: "#f9f9f9", padding: 8, borderRadius: 6, border: "1px solid #f0f0f0" }}>
                    {app.aiReason}
                  </Paragraph>
                </Col>
              </Row>
              
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px dashed #f0f0f0" }}>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <div>
                    <Text type="success" strong><CheckCircleOutlined /> Điểm mạnh (Khớp JD):</Text>
                    <div style={{ marginTop: 6 }}>
                      {app.matchedSkills?.length > 0 
                        ? app.matchedSkills.map((s: string) => <Tag key={s} color="green" style={{ marginBottom: 4 }}>{s}</Tag>)
                        : <Text type="secondary" style={{ fontSize: 13 }}>Không có</Text>}
                    </div>
                  </div>
                  <div>
                    <Text type="danger" strong><CloseCircleOutlined /> Điểm yếu (Thiếu sót):</Text>
                    <div style={{ marginTop: 6 }}>
                      {app.missingSkills?.length > 0 
                        ? app.missingSkills.map((s: string) => <Tag key={s} color="red" style={{ marginBottom: 4 }}>{s}</Tag>)
                        : <Text type="secondary" style={{ fontSize: 13 }}>Đã đáp ứng đủ yêu cầu</Text>}
                    </div>
                  </div>
                </Space>
              </div>
            </Card>
          </List.Item>
        )}
      />
    );
  };

  return (
    <PageContainer title="Hồ sơ của tôi" subtitle="Quản lý thông tin cá nhân và lịch sử ứng tuyển">
      <Row gutter={[24, 24]}>
        {/* Cột trái: Thông tin cá nhân */}
        <Col xs={24} md={8} lg={6}>
          <Card style={{ textAlign: "center", borderRadius: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
            <Avatar size={100} icon={<UserOutlined />} style={{ backgroundColor: "#1677ff", marginBottom: 16 }} />
            <Title level={4} style={{ margin: 0 }}>{user?.fullName || "Ứng viên"}</Title>
            <Text type="secondary">{user?.email || "Chưa cập nhật email"}</Text>
            
            <div style={{ marginTop: 24, textAlign: "left", background: "#f8fafc", padding: 16, borderRadius: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <Text type="secondary">Loại tài khoản</Text>
                <Tag color="blue" style={{ margin: 0 }}>Candidate</Tag>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text type="secondary">Đã ứng tuyển</Text>
                <Text strong>{applications.length} công việc</Text>
              </div>
            </div>
            
            <Button type="primary" block style={{ marginTop: 24, borderRadius: 8 }}>Cập nhật thông tin</Button>
          </Card>
        </Col>

        {/* Cột phải: Tabs quản lý */}
        <Col xs={24} md={16} lg={18}>
          <Card style={{ borderRadius: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
            <Tabs defaultActiveKey="1" size="large">
              <Tabs.TabPane tab={<span><CheckCircleOutlined />Lịch sử ứng tuyển</span>} key="1">
                {renderHistory()}
              </Tabs.TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
}

export default CandidateProfilePage;