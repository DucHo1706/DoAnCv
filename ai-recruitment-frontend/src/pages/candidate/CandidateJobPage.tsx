import { Alert, Button, Card, Col, message, Modal, Row, Tag, Typography, Upload, Spin, Input, Select, Space } from "antd";
import { useEffect, useState, useMemo } from "react";
import { jobService } from "../../services/jobService";
import type { JobDto } from "../../services/jobService";
import axiosClient from "../../services/axiosClient";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";

const { Title, Paragraph, Text } = Typography;

function CandidateJobPage() {
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobDto | null>(null);
  const [fileList, setFileList] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetailJob, setSelectedDetailJob] = useState<JobDto | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedSalary, setSelectedSalary] = useState<string | null>(null);

  const getClassificationColor = (classification?: string) => {
    if (!classification) {
      return "default";
    }

    if (classification.includes("Phù hợp cao")) {
      return "green";
    }

    if (classification === "Phù hợp") {
      return "blue";
    }

    if (classification.includes("Nên xem xét")) {
      return "gold";
    }

    if (classification.includes("Chưa phù hợp")) {
      return "orange";
    }

    if (classification.includes("Không phù hợp")) {
      return "red";
    }

    return "default";
  };

  const renderSkillList = (skills: string[]) => {
    if (skills.length === 0) {
      return <Paragraph style={{ marginTop: 8 }}>Không có</Paragraph>;
    }

    return (
      <ul style={{ marginTop: 8, paddingLeft: 22 }}>
        {skills.map((skill: string, index: number) => (
          <li key={index} style={{ marginBottom: 6 }}>
            {skill}
          </li>
        ))}
      </ul>
    );
  };

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
    // 1. Kiểm tra đăng nhập trước khi cho phép nộp CV
    const user = authService.getCurrentUser();

    if (!user) {
      message.warning("Vui lòng đăng nhập hoặc đăng ký để ứng tuyển!");
      navigate("/login");
      return;
    }

    // 2. Chặn HR/Admin nộp CV nhầm
    if (user.role && user.role !== "Candidate") {
      message.warning("Chỉ tài khoản Ứng viên mới có thể nộp CV!");
      return;
    }

    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const handleViewDetail = (job: JobDto) => {
    setSelectedDetailJob(job);
    setIsDetailModalOpen(true);
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning("Vui lòng chọn CV (file PDF, Word hoặc Ảnh) của bạn!");
      return;
    }

    // Lấy đúng file (Ant Design có lúc lưu ở originFileObj, có lúc lưu trực tiếp ở object)
    const fileToUpload = fileList[0].originFileObj || fileList[0];

    const formData = new FormData();
    formData.append("CvFile", fileToUpload); // Viết hoa chữ cái đầu cho khớp hoàn toàn với C#
    formData.append("JobId", selectedJob!.id);

    setUploading(true);

    try {
      const response = await axiosClient.post("/Recruitment/apply", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000, // Tăng thời gian chờ lên 60s để AI kịp bóc tách chữ từ ảnh (OCR)
      });

      if (response.data) {
        const result = response.data;

        const aiScore = result.aiScore ?? 0;
        const aiReason = result.aiReason || "Không có nhận xét";
        const matchedSkills = Array.isArray(result.matchedSkills) ? result.matchedSkills : [];
        const missingSkills = Array.isArray(result.missingSkills) ? result.missingSkills : [];
        const classification = result.classification || "";

        // 3. Xử lý logic gợi ý việc làm khác (Random 2 công việc khác với công việc vừa nộp)
        const otherJobs = jobs.filter((j) => j.id !== selectedJob!.id);
        const recommendedJobs = otherJobs.sort(() => 0.5 - Math.random()).slice(0, 2);

        message.success("Nộp CV thành công! AI đã chấm điểm hồ sơ của bạn.");

        Modal.success({
          title: "Kết quả phân tích AI",
          okText: "Đóng",
          content: (
            <div style={{ marginTop: 16 }}>
              <Alert
                type="success"
                showIcon
                message="Chúc mừng! Hồ sơ của bạn đã được gửi tới Nhà tuyển dụng thành công."
                description="Dưới đây là phân tích nhanh từ AI về mức độ phù hợp của bạn."
                style={{ marginBottom: 16 }}
              />

              <p>
                <b>Điểm phù hợp:</b>{" "}
                <Text type="success" strong>
                  {aiScore}/100
                </Text>
              </p>

              <p>
                <b>Phân loại:</b>{" "}
                <Tag color={getClassificationColor(classification)}>
                  {classification || "Chưa phân loại"}
                </Tag>
              </p>

              <div style={{ marginTop: 12 }}>
                <b>Kỹ năng khớp:</b>
                {renderSkillList(matchedSkills)}
              </div>

              <div style={{ marginTop: 12 }}>
                <b>Điểm cần cải thiện:</b>

                {missingSkills.length > 0 ? (
                  <ul style={{ marginTop: 8, paddingLeft: 22, color: "#cf1322" }}>
                    {missingSkills.map((skill: string, index: number) => (
                      <li key={index} style={{ marginBottom: 6 }}>
                        {skill}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Paragraph style={{ marginTop: 8 }}>
                    Chưa phát hiện điểm cần cải thiện rõ ràng.
                  </Paragraph>
                )}
              </div>

              <p style={{ marginTop: 12 }}>
                <b>Nhận xét của AI:</b> {aiReason}
              </p>

              {recommendedJobs.length > 0 && (
                <div style={{ marginTop: 24, borderTop: "1px solid #f0f0f0", paddingTop: 16 }}>
                  <Text strong style={{ color: "#1890ff" }}>
                    🌟 Có thể bạn sẽ quan tâm các vị trí khác:
                  </Text>

                  <ul style={{ paddingLeft: 20, marginTop: 8 }}>
                    {recommendedJobs.map((j) => (
                      <li key={j.id} style={{ marginBottom: 8 }}>
                        <Text strong>{j.position?.name || "Vị trí chưa cập nhật"}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {j.branch?.name || "Đang cập nhật"} • {j.salaryRange || "Thỏa thuận"}
                        </Text>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ),
          width: 600,
        });

        setIsModalOpen(false);
        setFileList([]);
      }
    } catch (error: any) {
      if (error?.response?.status === 401) {
        message.warning("Vui lòng đăng nhập với tài khoản Ứng viên để nộp CV!");
        navigate("/login");
        return;
      }

      // Bắt mọi loại lỗi để hiển thị rõ ràng trên màn hình
      const responseData = error?.response?.data;

      if (responseData?.errors) {
        const errorMessages = Object.values(responseData.errors).flat().join(" - ");
        message.error(errorMessages);
      } else if (responseData?.message || responseData?.error) {
        message.error(`${responseData.message || ""} ${responseData.error ? `(${responseData.error})` : ""}`);
      } else if (error.message) {
        message.error(`Lỗi đường truyền/AI: ${error.message}`);
      } else {
        message.error("Không thể nộp CV, vui lòng thử lại.");
      }
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
    accept: ".pdf,.doc,.docx,.png,.jpg,.jpeg",
  };

  // Tạo danh sách lọc tự động từ dữ liệu jobs
  const uniqueBranches = useMemo(
    () => Array.from(new Set(jobs.map((job) => job.branch?.name).filter(Boolean))),
    [jobs]
  );

  const uniqueSalaries = useMemo(
    () => Array.from(new Set(jobs.map((job) => job.salaryRange).filter(Boolean))),
    [jobs]
  );

  // Lọc dữ liệu công việc
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchSearch = (job.position?.name || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchBranch = selectedBranch ? job.branch?.name === selectedBranch : true;
      const matchSalary = selectedSalary ? job.salaryRange === selectedSalary : true;

      return matchSearch && matchBranch && matchSalary;
    });
  }, [jobs, searchTerm, selectedBranch, selectedSalary]);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <Title level={2}>Cơ Hội Việc Làm Mới Nhất</Title>
        <Paragraph style={{ fontSize: 16 }}>
          Khám phá các vị trí tuyển dụng đang mở và nộp CV để AI đánh giá ngay!
        </Paragraph>
      </div>

      <Card style={{ marginBottom: 24, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
        <Space wrap size="middle" style={{ display: "flex", justifyContent: "center" }}>
          <Input.Search
            placeholder="Tìm kiếm theo vị trí..."
            allowClear
            size="large"
            onSearch={setSearchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            style={{ width: 300 }}
          />

          <Select
            size="large"
            allowClear
            placeholder="Lọc theo chi nhánh"
            style={{ width: 200 }}
            onChange={setSelectedBranch}
            value={selectedBranch}
          >
            {uniqueBranches.map((branch) => (
              <Select.Option key={branch as string} value={branch as string}>
                {branch as string}
              </Select.Option>
            ))}
          </Select>

          <Select
            size="large"
            allowClear
            placeholder="Lọc theo mức lương"
            style={{ width: 200 }}
            onChange={setSelectedSalary}
            value={selectedSalary}
          >
            {uniqueSalaries.map((salary) => (
              <Select.Option key={salary as string} value={salary as string}>
                {salary as string}
              </Select.Option>
            ))}
          </Select>
        </Space>
      </Card>

      {loading ? (
        <div style={{ textAlign: "center", padding: 50 }}>
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[24, 24]}>
          {filteredJobs.map((job) => (
            <Col xs={24} md={12} lg={8} key={job.id}>
              <Card hoverable style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <Title level={4}>{job.position?.name || "Chưa cập nhật vị trí"}</Title>

                <div style={{ marginBottom: 16 }}>
                  <Tag color="blue">{job.branch?.name || "Chưa cập nhật chi nhánh"}</Tag>
                  <Tag color="green">{job.salaryRange || "Thỏa thuận"}</Tag>
                </div>

                <Paragraph type="secondary" ellipsis={{ rows: 3 }}>
                  {job.description}
                </Paragraph>

                <div style={{ marginTop: "auto", paddingTop: 16 }}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <Button style={{ flex: 1 }} onClick={() => handleViewDetail(job)}>
                      Xem chi tiết
                    </Button>

                    <Button type="primary" style={{ flex: 1 }} onClick={() => handleApplyClick(job)}>
                      Ứng tuyển
                    </Button>
                  </div>
                </div>
              </Card>
            </Col>
          ))}

          {filteredJobs.length === 0 && (
            <Col span={24}>
              <Card>
                <div style={{ textAlign: "center", color: "#888" }}>
                  Không tìm thấy công việc nào phù hợp với bộ lọc.
                </div>
              </Card>
            </Col>
          )}
        </Row>
      )}

      <Modal
        title={`Ứng tuyển: ${selectedJob?.position?.name}`}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setFileList([]);
        }}
        footer={[
          <Button key="back" onClick={() => setIsModalOpen(false)}>
            Hủy
          </Button>,
          <Button key="submit" type="primary" loading={uploading} onClick={handleUpload}>
            Nộp hồ sơ
          </Button>,
        ]}
      >
        <div style={{ padding: "20px 0" }}>
          <Text strong style={{ display: "block", marginBottom: 8 }}>
            Tải lên CV của bạn (PDF, Word, Ảnh):
          </Text>

          <Upload {...uploadProps}>
            <Button>Chọn file CV từ máy tính</Button>
          </Upload>
        </div>
      </Modal>

      {/* Modal Chi tiết công việc */}
      <Modal
        title={
          <Text strong style={{ fontSize: 20 }}>
            Chi tiết công việc
          </Text>
        }
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={[
          <Button key="back" onClick={() => setIsDetailModalOpen(false)}>
            Đóng
          </Button>,
          <Button
            key="apply"
            type="primary"
            onClick={() => {
              setIsDetailModalOpen(false);
              handleApplyClick(selectedDetailJob!);
            }}
          >
            Ứng tuyển ngay
          </Button>,
        ]}
        width={800}
      >
        {selectedDetailJob && (
          <div style={{ padding: "10px 0" }}>
            <Title level={3} style={{ color: "#1890ff", marginBottom: 16 }}>
              {selectedDetailJob.position?.name || "Chưa cập nhật vị trí"}
            </Title>

            <div style={{ marginBottom: 24 }}>
              <Tag color="blue" style={{ fontSize: 14, padding: "4px 8px", marginBottom: 8 }}>
                {selectedDetailJob.branch?.name || "Chưa cập nhật chi nhánh"}
              </Tag>

              <Tag color="green" style={{ fontSize: 14, padding: "4px 8px", marginBottom: 8 }}>
                {selectedDetailJob.salaryRange || "Thỏa thuận"}
              </Tag>

              <Tag color="purple" style={{ fontSize: 14, padding: "4px 8px", marginBottom: 8 }}>
                Hạn nộp:{" "}
                {selectedDetailJob.deadline
                  ? new Date(selectedDetailJob.deadline).toLocaleDateString("vi-VN")
                  : "Không giới hạn"}
              </Tag>
            </div>

            <Title level={5}>Mô tả công việc</Title>
            <div
              style={{
                background: "#f9f9f9",
                padding: 16,
                borderRadius: 8,
                marginBottom: 24,
                whiteSpace: "pre-line",
              }}
            >
              {selectedDetailJob.description || "Chưa có mô tả"}
            </div>

            <Title level={5}>Yêu cầu ứng viên</Title>
            <div
              style={{
                background: "#f9f9f9",
                padding: 16,
                borderRadius: 8,
                marginBottom: 24,
                whiteSpace: "pre-line",
              }}
            >
              {selectedDetailJob.requirements || "Chưa có yêu cầu"}
            </div>

            {selectedDetailJob.maxCandidates && (
              <Paragraph type="secondary">* Số lượng tuyển: {selectedDetailJob.maxCandidates} người</Paragraph>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default CandidateJobPage;