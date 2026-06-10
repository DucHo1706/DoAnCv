import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Card, Col, Input, Row, Space, Typography, message, Spin, Divider } from "antd";
import { ArrowLeftOutlined, SendOutlined, RobotOutlined } from "@ant-design/icons";
import PageContainer from "../../components/common/PageContainer";
import { recruitmentService } from "../../services/recruitmentService";

const { Title, Text, Paragraph } = Typography;

export default function EmailCandidatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        // Mockup lấy dữ liệu ứng viên hiện tại
        const data = await recruitmentService.getHrApplications();
        const apps = Array.isArray(data) ? data : (data as any)?.$values || [];
        const found = apps.find((app: any) => app.id === id);
        
        if (found) {
          setCandidate(found);
          setSubject(`[AI Recruitment] Kết quả ứng tuyển vị trí ${found.jobTitle}`);
        } else {
          message.error("Không tìm thấy ứng viên.");
          navigate(-1);
        }
      } catch {
        message.error("Lỗi khi tải thông tin ứng viên.");
      } finally {
        setLoading(false);
      }
    };
    fetchCandidate();
  }, [id, navigate]);

  const generateAiEmail = (type: 'invite' | 'reject') => {
    if (!candidate) return;
    if (type === 'invite') {
       setContent(`Chào ${candidate.candidateName},\n\nChúc mừng bạn đã vượt qua vòng sơ loại CV cho vị trí ${candidate.jobTitle} với đánh giá rất tích cực từ hệ thống.\n\nChúng tôi rất ấn tượng với kỹ năng của bạn và muốn mời bạn tham gia buổi phỏng vấn trực tuyến vào lúc [Điền thời gian].\n\nVui lòng phản hồi email này để xác nhận sự tham gia của bạn.\n\nTrân trọng,\nPhòng Nhân sự`);
    } else {
       setContent(`Chào ${candidate.candidateName},\n\nCảm ơn bạn đã quan tâm và ứng tuyển vào vị trí ${candidate.jobTitle}.\n\nSau khi xem xét kỹ lưỡng hồ sơ, chúng tôi rất tiếc phải thông báo rằng kinh nghiệm của bạn hiện tại chưa hoàn toàn phù hợp với định hướng của công ty cho vị trí này.\n\nChúng tôi sẽ lưu hồ sơ của bạn vào hệ thống và liên hệ lại khi có cơ hội phù hợp hơn trong tương lai.\n\nChúc bạn nhiều thành công trên con đường sự nghiệp.\n\nTrân trọng,\nPhòng Nhân sự`);
    }
  };

  const handleSendEmail = () => {
    if (!subject || !content) {
      message.error("Vui lòng nhập tiêu đề và nội dung.");
      return;
    }
    setIsSending(true);
    // Giả lập gửi email
    setTimeout(() => {
      message.success(`Đã gửi email thành công tới ${candidate?.email}`);
      setIsSending(false);
      navigate(-1);
    }, 1500);
  };

  if (loading) return <div style={{ textAlign: "center", padding: "100px 0" }}><Spin size="large" /></div>;

  return (
    <PageContainer
      title="Soạn Email gửi Ứng viên"
      subtitle="Sử dụng AI để phác thảo email hoặc tự viết nội dung cá nhân hóa."
      extra={<Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Quay lại</Button>}
    >
      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Card style={{ borderRadius: 12 }}>
            <Space style={{ marginBottom: 16, width: "100%", justifyContent: "space-between" }}>
              <div>
                <Text type="secondary">Người nhận: </Text>
                <Text strong>{candidate?.candidateName} ({candidate?.email})</Text>
              </div>
              <Space>
                <Button icon={<RobotOutlined />} onClick={() => generateAiEmail('invite')} style={{ borderColor: '#52c41a', color: '#52c41a' }}>AI Soạn Thư Mời</Button>
                <Button icon={<RobotOutlined />} onClick={() => generateAiEmail('reject')} style={{ borderColor: '#ff4d4f', color: '#ff4d4f' }}>AI Soạn Thư Từ Chối</Button>
              </Space>
            </Space>
            
            <Input size="large" placeholder="Tiêu đề Email" value={subject} onChange={e => setSubject(e.target.value)} style={{ marginBottom: 16 }} />
            
            <Input.TextArea rows={14} placeholder="Nội dung Email..." value={content} onChange={e => setContent(e.target.value)} style={{ fontSize: 15 }} />
            
            <Divider />
            <div style={{ textAlign: "right" }}>
              <Button size="large" style={{ marginRight: 12 }} onClick={() => navigate(-1)}>Hủy bỏ</Button>
              <Button size="large" type="primary" icon={<SendOutlined />} onClick={handleSendEmail} loading={isSending}>Gửi Email Này</Button>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Gợi ý từ AI Hệ thống" style={{ borderRadius: 12, background: "#f8fafc" }}>
            <Paragraph>
              Hệ thống đánh giá ứng viên này đạt <Text strong type="success">{candidate?.aiScore} điểm</Text>.
            </Paragraph>
            <Paragraph type="secondary">
              Khuyến nghị: {candidate?.aiScore >= 75 ? "Nên sắp xếp phỏng vấn ngay trong tuần này vì ứng viên có kỹ năng rất sát với yêu cầu." : "Có thể cân nhắc thêm hoặc chuyển sang Talent Pool nếu chưa thực sự cần thiết."}
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
}