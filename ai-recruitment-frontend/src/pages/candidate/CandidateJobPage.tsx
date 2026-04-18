import { Button, Card, Col, message, Modal, Row, Tag, Typography, Upload, Spin } from "antd";
import { useEffect, useState } from "react";
import { jobService } from "../../services/jobService";
import type { JobDto } from "../../services/jobService";

const { Title, Paragraph, Text } = Typography;

function CandidateJobPage() {
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobDto | null>(null);
  const [fileList, setFileList] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchPublicJobs = async () => {
      try {
        const data: any = await jobService.getJobs();
        // Ở đây ta có thể lọc thêm điều kiện chỉ hiển thị Job đã duyệt (isApproved === true)
        // Bảo vệ UI: Đảm bảo data luôn là mảng để không sập màn hình trắng (White Screen)
        setJobs(Array.isArray(data) ? data : (data?.$values || []));
      } catch (error) {
        message.error("Lỗi khi tải danh sách công việc");
      } finally {
        setLoading(false);
      }
    };
    fetchPublicJobs();
  }, []);

  const handleApplyClick = (job: JobDto) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning("Vui lòng chọn CV (file PDF) của bạn!");
      return;
    }

    const formData = new FormData();
    formData.append("cvFile", fileList[0].originFileObj);
    formData.append("jobId", selectedJob!.id);

    setUploading(true);
    try {
      const response = await fetch("http://localhost:5000/api/Recruitment/apply", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        message.success("Nộp CV thành công! AI đã chấm điểm hồ sơ của bạn.");
        Modal.success({
          title: "Kết quả phân tích AI",
          content: (
            <div style={{ marginTop: 16 }}>
              <p><b>Điểm phù hợp:</b> <Text type="success" strong>{result.aiAnalysis.matching_result.score}/100</Text></p>
              <p><b>Kỹ năng khớp:</b> {result.aiAnalysis.matching_result.matched_skills.join(", ") || "Không có"}</p>
              <p><b>Kỹ năng thiếu:</b> <Text type="danger">{result.aiAnalysis.matching_result.missing_skills.join(", ") || "Không có"}</Text></p>
              <p><b>Nhận xét của AI:</b> {result.aiAnalysis.matching_result.explanation}</p>
            </div>
          ),
          width: 600,
        });
        setIsModalOpen(false);
        setFileList([]);
      } else {
        message.error("Có lỗi xảy ra khi nộp CV.");
      }
    } catch (error) {
      message.error("Không thể kết nối đến server.");
    } finally {
      setUploading(false);
    }
  };

  const uploadProps = {
    onRemove: () => setFileList([]),
    beforeUpload: (file: any) => {
      setFileList([file]);
      return false; // Ngăn upload tự động
    },
    fileList,
    accept: ".pdf,.doc,.docx",
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <Title level={2}>Cơ Hội Việc Làm Mới Nhất</Title>
        <Paragraph style={{ fontSize: 16 }}>Khám phá các vị trí tuyển dụng đang mở và nộp CV để AI đánh giá ngay!</Paragraph>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 50 }}><Spin size="large" /></div>
      ) : (
        <Row gutter={[24, 24]}>
          {jobs.map((job) => (
            <Col xs={24} md={12} lg={8} key={job.id}>
              <Card hoverable style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <Title level={4}>{job.position?.name || "Chưa cập nhật vị trí"}</Title>
                <div style={{ marginBottom: 16 }}>
                  <Tag color="blue">{job.branch?.name || "Chưa cập nhật chi nhánh"}</Tag>
                  <Tag color="green">{job.salaryRange || "Thỏa thuận"}</Tag>
                </div>
                <Paragraph type="secondary" ellipsis={{ rows: 3 }}>{job.description}</Paragraph>
                <div style={{ marginTop: "auto", paddingTop: 16 }}>
                  <Button type="primary" block onClick={() => handleApplyClick(job)}>Ứng tuyển ngay</Button>
                </div>
              </Card>
            </Col>
          ))}
          {jobs.length === 0 && (
            <Col span={24}><Card><div style={{ textAlign: "center", color: "#888" }}>Hiện chưa có vị trí nào đang mở.</div></Card></Col>
          )}
        </Row>
      )}

      <Modal
        title={`Ứng tuyển: ${selectedJob?.position?.name}`}
        open={isModalOpen}
        onCancel={() => { setIsModalOpen(false); setFileList([]); }}
        footer={[
          <Button key="back" onClick={() => setIsModalOpen(false)}>Hủy</Button>,
          <Button key="submit" type="primary" loading={uploading} onClick={handleUpload}>Nộp hồ sơ</Button>,
        ]}
      >
        <div style={{ padding: "20px 0" }}>
          <Text strong style={{ display: "block", marginBottom: 8 }}>Tải lên CV của bạn (PDF, Word):</Text>
          <Upload {...uploadProps}>
            <Button>Chọn file CV từ máy tính</Button>
          </Upload>
        </div>
      </Modal>
    </div>
  );
}

export default CandidateJobPage;