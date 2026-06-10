import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Row, Col, Card, Typography, Button, Space, Divider, Spin, message, Breadcrumb, Tag, Modal, Upload } from "antd";
import { 
  EnvironmentOutlined, DollarOutlined, ClockCircleOutlined, 
  TeamOutlined, SendOutlined, HeartOutlined, HomeOutlined,
  BankOutlined, StarOutlined, RobotOutlined, UploadOutlined
} from "@ant-design/icons";
import axiosClient from "../../services/axiosClient";

const { Title, Text, Paragraph } = Typography;

export default function CandidateJobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyFile, setApplyFile] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchJobDetail = async () => {
      try {
        const res = await axiosClient.get(`/Jobs/published/${id}`);
        setJob(res.data);
      } catch (error) {
        message.error("Không thể tải chi tiết công việc hoặc tin đã hết hạn.");
        navigate("/jobs");
      } finally {
        setLoading(false);
      }
    };
    fetchJobDetail();
  }, [id, navigate]);

  const handleApplyWithAI = () => {
    // Tuyệt chiêu: Kích hoạt event để Chatbot tự động mở lên và gán job này vào
    window.dispatchEvent(new CustomEvent("open-chatbot", {
      detail: { jobId: job.id, jobTitle: job.title }
    }));
    message.success("Vui lòng đính kèm CV vào Chatbot để AI phân tích nhé!");
  };

  const showApplyModal = () => {
    setIsApplyModalOpen(true);
  };

  const handleCancelApplyModal = () => {
    setIsApplyModalOpen(false);
    setApplyFile(null);
  };

  const handleDirectApply = async () => {
    if (!applyFile) {
      message.error("Vui lòng chọn file CV của bạn!");
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      const prompt = `Tôi muốn ứng tuyển vào vị trí ${job.title} với CV đính kèm.`;
      formData.append("Prompt", prompt);
      formData.append("JobId", job.id);
      formData.append("File", applyFile);
      
      await axiosClient.post("/Chatbot/chat", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      message.success("Nộp hồ sơ thành công! AI đang xử lý, bạn có thể xem kết quả ở trang Lịch sử ứng tuyển.");
      setIsApplyModalOpen(false);
      setApplyFile(null);

    } catch (error) {
      message.error("Đã có lỗi xảy ra khi nộp hồ sơ. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadProps = { onRemove: () => { setApplyFile(null); }, beforeUpload: (file: any) => { setApplyFile(file); return false; }, fileList: applyFile ? [applyFile] : [], maxCount: 1 };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "100px 0" }}><Spin size="large" tip="Đang tải chi tiết công việc..." /></div>;
  }

  if (!job) return null;

  return (
    <div style={{ background: "#f4f5f5", minHeight: "100vh", paddingBottom: 60, paddingTop: 24 }}>
      <div style={{ maxWidth: "94%", margin: "0 auto" }}>
        
        {/* Breadcrumb */}
        <Breadcrumb style={{ marginBottom: 16 }}>
          <Breadcrumb.Item href="/" onClick={(e) => { e.preventDefault(); navigate("/"); }}><HomeOutlined /> Trang chủ</Breadcrumb.Item>
          <Breadcrumb.Item href="/jobs" onClick={(e) => { e.preventDefault(); navigate("/jobs"); }}>Việc làm IT</Breadcrumb.Item>
          <Breadcrumb.Item>{job.title}</Breadcrumb.Item>
        </Breadcrumb>

        {/* 1. KHU VỰC HERO CARD (TOP) */}
        <Card bodyStyle={{ padding: 32 }} style={{ borderRadius: 16, marginBottom: 24, boxShadow: "0 2px 10px rgba(0,0,0,0.03)", border: "none" }}>
          <Row gutter={32} align="middle">
            <Col flex="140px">
              <img src={job.logo} alt="Company Logo" style={{ width: 140, height: 140, objectFit: "contain", borderRadius: 12, border: "1px solid #f0f0f0", padding: 8 }} />
            </Col>
            <Col flex="auto">
              <Title level={2} style={{ margin: 0, fontSize: 28, color: "#1f2937", marginBottom: 8 }}>{job.title}</Title>
              <Text style={{ fontSize: 18, color: "#595959", display: "block", marginBottom: 20 }}>{job.company}</Text>
              
              <Space size="large" split={<Divider type="vertical" />}>
                <Space align="center">
                  <div style={{ background: "#e6f4ff", padding: 10, borderRadius: "50%", color: "#1677ff", display: "flex" }}><DollarOutlined style={{ fontSize: 20 }} /></div>
                  <div>
                    <Text type="secondary" style={{ display: "block", fontSize: 13 }}>Mức lương</Text>
                    <Text strong style={{ fontSize: 16, color: "#00b14f" }}>{job.salary}</Text>
                  </div>
                </Space>
                <Space align="center">
                  <div style={{ background: "#e6f4ff", padding: 10, borderRadius: "50%", color: "#1677ff", display: "flex" }}><EnvironmentOutlined style={{ fontSize: 20 }} /></div>
                  <div>
                    <Text type="secondary" style={{ display: "block", fontSize: 13 }}>Địa điểm</Text>
                    <Text strong style={{ fontSize: 16 }}>{job.location}</Text>
                  </div>
                </Space>
                <Space align="center">
                  <div style={{ background: "#e6f4ff", padding: 10, borderRadius: "50%", color: "#1677ff", display: "flex" }}><ClockCircleOutlined style={{ fontSize: 20 }} /></div>
                  <div>
                    <Text type="secondary" style={{ display: "block", fontSize: 13 }}>Hạn nộp hồ sơ</Text>
                    <Text strong style={{ fontSize: 16 }}>{job.deadline ? new Date(job.deadline).toLocaleDateString('vi-VN') : "Không giới hạn"}</Text>
                  </div>
                </Space>
              </Space>
            </Col>
            <Col>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Button type="primary" size="large" icon={<SendOutlined />} onClick={showApplyModal} style={{ width: 240, height: 50, fontSize: 18, borderRadius: 8 }}>
                  Ứng tuyển ngay
                </Button>
                <Button size="large" icon={<RobotOutlined />} onClick={handleApplyWithAI} style={{ width: 240, height: 50, fontSize: 16, borderRadius: 8 }}>
                  Chat với AI & Ứng tuyển
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* 2. KHU VỰC CHI TIẾT */}
        <Row gutter={24}>
          {/* Cột trái: Chi tiết CV */}
          <Col xs={24} lg={16} xl={17}>
            <Card title={<Title level={4} style={{ margin: 0 }}>Chi tiết tin tuyển dụng</Title>} style={{ borderRadius: 16, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }} bodyStyle={{ padding: 24 }}>
              
              <Title level={5} style={{ fontSize: 18, marginTop: 0, marginBottom: 12 }}>Mô tả công việc</Title>
              <Paragraph style={{ fontSize: 16, whiteSpace: "pre-line", lineHeight: 1.8, color: "#374151" }}>
                {job.description || "Đang cập nhật nội dung..."}
              </Paragraph>

              <Title level={5} style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>Yêu cầu ứng viên</Title>
              <Paragraph style={{ fontSize: 16, whiteSpace: "pre-line", lineHeight: 1.8, color: "#374151" }}>
                {job.requirements || "Đang cập nhật nội dung..."}
              </Paragraph>

              <Title level={5} style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>Quyền lợi</Title>
              <Paragraph style={{ fontSize: 16, whiteSpace: "pre-line", lineHeight: 1.8, color: "#374151" }}>
                - Môi trường làm việc trẻ trung, năng động, chuyên nghiệp. {"\n"}
                - Được review lương 2 lần/năm. {"\n"}
                - Lương tháng 13 + thưởng KPI, thưởng dự án theo năng lực. {"\n"}
                - Trợ cấp ăn trưa, đi lại, team building hàng quý.
              </Paragraph>

              <Divider style={{ margin: "40px 0 24px" }} />
              
              <Title level={5} style={{ fontSize: 18, marginBottom: 16 }}>Cách thức ứng tuyển</Title>
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: 24, borderRadius: 12 }}>
                <Text style={{ fontSize: 16, display: "block", marginBottom: 16 }}>
                  Ứng viên nộp hồ sơ trực tuyến bằng cách bấm <strong>Ứng tuyển ngay</strong>. Trợ lý AI sẽ tiếp nhận, phân tích CV và trả về kết quả độ phù hợp (Match Score) ngay lập tức.
                </Text>
                <Button type="primary" size="large" onClick={showApplyModal} style={{ borderRadius: 8, height: 46 }}>Nộp Hồ Sơ Ứng Tuyển</Button>
              </div>
            </Card>
          </Col>

          {/* Cột phải: Thông tin chung & Công ty */}
          <Col xs={24} lg={8} xl={7}>
            
            {/* Bảng Thông tin chung */}
            <Card title={<Title level={5} style={{ margin: 0 }}>Thông tin chung</Title>} style={{ borderRadius: 16, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
              <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ background: "#f5f5f5", padding: 10, borderRadius: "50%", color: "#595959", display: "flex" }}><StarOutlined style={{ fontSize: 20 }} /></div>
                  <div>
                    <Text type="secondary" style={{ display: "block", fontSize: 14 }}>Cấp bậc</Text>
                    <Text strong style={{ fontSize: 15 }}>Nhân viên</Text>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ background: "#f5f5f5", padding: 10, borderRadius: "50%", color: "#595959", display: "flex" }}><TeamOutlined style={{ fontSize: 20 }} /></div>
                  <div>
                    <Text type="secondary" style={{ display: "block", fontSize: 14 }}>Số lượng tuyển</Text>
                    <Text strong style={{ fontSize: 15 }}>{job.maxCandidates ? `${job.maxCandidates} người` : "Không giới hạn"}</Text>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ background: "#f5f5f5", padding: 10, borderRadius: "50%", color: "#595959", display: "flex" }}><ClockCircleOutlined style={{ fontSize: 20 }} /></div>
                  <div>
                    <Text type="secondary" style={{ display: "block", fontSize: 14 }}>Hình thức làm việc</Text>
                    <Text strong style={{ fontSize: 15 }}>{job.type}</Text>
                  </div>
                </div>
              </Space>
            </Card>

            {/* Bảng Thông tin công ty */}
            <Card title={<Title level={5} style={{ margin: 0 }}>Thông tin công ty</Title>} style={{ borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                <img src={job.logo} alt="logo" style={{ width: 64, height: 64, objectFit: "contain", border: "1px solid #f0f0f0", borderRadius: 8, padding: 4 }} />
                <Text strong style={{ fontSize: 16 }}>{job.company}</Text>
              </div>
              <Text type="secondary" style={{ display: "block", marginBottom: 8 }}><BankOutlined /> Quy mô: 100 - 499 nhân viên</Text>
              <Text type="secondary" style={{ display: "block" }}><EnvironmentOutlined /> Địa chỉ: {job.location}</Text>
            </Card>

          </Col>
        </Row>

        <Modal
          title={`Ứng tuyển vị trí: ${job.title}`}
          open={isApplyModalOpen}
          onOk={handleDirectApply}
          onCancel={handleCancelApplyModal}
          confirmLoading={isSubmitting}
          okText="Nộp hồ sơ"
          cancelText="Hủy"
        >
          <Paragraph type="secondary">Vui lòng tải lên CV của bạn (định dạng PDF, DOC, DOCX). AI sẽ tự động phân tích và gửi đến nhà tuyển dụng.</Paragraph>
          <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>Chọn file CV của bạn</Button>
          </Upload>
        </Modal>

      </div>
    </div>
  );
}