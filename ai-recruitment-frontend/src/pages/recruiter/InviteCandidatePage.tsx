import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, Typography, Select, message, Spin, Divider, Row, Col } from "antd";
import { RobotOutlined, FireOutlined, ArrowLeftOutlined, SendOutlined } from "@ant-design/icons";
import PageContainer from "../../components/common/PageContainer";
import { jobService } from "../../services/jobService";

const { Text, Paragraph } = Typography;

// Dữ liệu giả lập cho kho Talent Pool
const mockTalentPool = [
  {
    id: "1",
    name: "Nguyễn Văn A",
    email: "nguyenvana@gmail.com",
    skills: ["ReactJS", "NodeJS", "TypeScript"],
    lastApplied: "Frontend Developer",
    maxAiScore: 92,
    status: "Sẵn sàng tìm việc",
  },
  {
    id: "2",
    name: "Trần Thị B",
    email: "tranthib@gmail.com",
    skills: ["Figma", "UI/UX", "Photoshop"],
    lastApplied: "UI/UX Designer",
    maxAiScore: 88,
    status: "Đang làm việc",
  },
  {
    id: "3",
    name: "Lê Hoàng C",
    email: "lehoangc@gmail.com",
    skills: ["Java", "Spring Boot", "MySQL", "AWS"],
    lastApplied: "Backend Developer",
    maxAiScore: 95,
    status: "Sẵn sàng tìm việc",
  },
  {
    id: "4",
    name: "Phạm D",
    email: "phamd@gmail.com",
    skills: ["Marketing", "SEO", "Content"],
    lastApplied: "Content Creator",
    maxAiScore: 78,
    status: "Sẵn sàng tìm việc",
  },
];

export default function InviteCandidatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const data = await jobService.getMyJobs();
        setJobs(Array.isArray(data) ? data : (data as any)?.$values || []);

        const found = mockTalentPool.find((c) => c.id === id);
        setCandidate(found || null);
      } catch (error) {
        message.error("Lỗi khi tải dữ liệu.");
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [id]);

  // Logic AI giả lập: Gợi ý công việc phù hợp
  const suggestedJobs = useMemo(() => {
    if (!candidate || !jobs.length) return [];

    return [...jobs]
      .map((job) => {
        const positionName = (job.position?.name || "").toLowerCase();
        const skills = candidate.skills || [];
        let baseScore = 60 + Math.floor(Math.random() * 20); // 60 - 80

        if (skills.some((s: string) => positionName.includes(s.toLowerCase()))) {
          baseScore += 15; // Cộng thêm điểm
        }

        return { ...job, matchScore: Math.min(99, baseScore) };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 2); // Chọn top 2
  }, [candidate, jobs]);

  const sendInvite = () => {
    if (!selectedJobId) {
      message.error("Vui lòng chọn một công việc để gửi lời mời!");
      return;
    }
    const job = jobs.find((j) => j.id === selectedJobId);
    message.success(
      `Đã gửi lời mời ứng tuyển vị trí [${job?.position?.name || "này"}] tới ${candidate?.name}!`
    );
    navigate("/recruiter/talent-pool");
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "100px 0" }}>
        <Spin size="large" />
      </div>
    );
  if (!candidate)
    return (
      <PageContainer title="Không tìm thấy ứng viên">
        <Button onClick={() => navigate(-1)}>Quay lại</Button>
      </PageContainer>
    );

  return (
    <PageContainer
      title={`Mời ứng tuyển: ${candidate.name}`}
      subtitle="Sử dụng AI để phân tích và đề xuất công việc phù hợp nhất để gửi lời mời ứng tuyển."
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          Quay lại Talent Pool
        </Button>
      }
    >
      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Card style={{ borderRadius: 12 }}>
            <Paragraph style={{ marginBottom: 16 }}>
              Ứng viên này sở hữu các kỹ năng: <Text strong>{candidate.skills.join(", ")}</Text>.
            </Paragraph>

            {/* Khối AI Gợi ý Việc làm */}
            <div
              style={{
                padding: 16,
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 8,
                marginBottom: 24,
              }}
            >
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <RobotOutlined style={{ color: "#16a34a", fontSize: 20 }} />
                <Text strong style={{ color: "#16a34a", fontSize: 16 }}>
                  Phân tích & Đề xuất
                </Text>
              </div>
              <Text>
                Hệ thống tự động quét <b>{jobs.length}</b> chiến dịch đang mở và tìm thấy 2 vị trí
                phù hợp nhất:
              </Text>
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                {suggestedJobs.map((job) => (
                  <div
                    key={job.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "#fff",
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "1px solid #d9f9e6",
                    }}
                  >
                    <div>
                      <Text strong>
                        {job.position?.name || "Vị trí IT"} ({job.branch?.name})
                      </Text>
                      <div style={{ fontSize: 13, color: "#8c8c8c", marginTop: 4 }}>
                        <FireOutlined style={{ color: "#faad14" }} /> Độ phù hợp:{" "}
                        <Text strong type="success">
                          {job.matchScore}%
                        </Text>
                      </div>
                    </div>
                    <Button
                      size="small"
                      type={selectedJobId === job.id ? "primary" : "default"}
                      onClick={() => setSelectedJobId(job.id)}
                    >
                      {selectedJobId === job.id ? "Đang chọn" : "Chọn job này"}
                    </Button>
                  </div>
                ))}
                {suggestedJobs.length === 0 && (
                  <Text type="secondary">Chưa có công việc nào đang mở.</Text>
                )}
              </div>
            </div>

            <Divider />

            <Text strong>Hoặc bạn tự tìm công việc khác theo nhóm ngành:</Text>
            <Select
              style={{ width: "100%", marginTop: 8, marginBottom: 24 }}
              placeholder="-- Nhập tên vị trí để tìm nhanh --"
              value={selectedJobId}
              onChange={setSelectedJobId}
              showSearch
              filterOption={(input, option) =>
                ((option?.label as string) ?? "").toLowerCase().includes(input.toLowerCase())
              }
              options={Object.entries(
                jobs.reduce((acc: any, j: any) => {
                  const catName = j.category?.name || "Lĩnh vực khác";
                  if (!acc[catName]) acc[catName] = [];
                  acc[catName].push({
                    label: `${j.position?.name || "Vị trí"} (${j.branch?.name || "Chi nhánh"})`,
                    value: j.id,
                  });
                  return acc;
                }, {})
              ).map(([catName, jobsGroup]: [string, any]) => ({
                label: catName,
                options: jobsGroup,
              }))}
            />

            <div style={{ textAlign: "right" }}>
              <Button size="large" style={{ marginRight: 12 }} onClick={() => navigate(-1)}>
                Hủy bỏ
              </Button>
              <Button size="large" type="primary" icon={<SendOutlined />} onClick={sendInvite}>
                Gửi Lời Mời Ngay
              </Button>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Thông tin tóm tắt" style={{ borderRadius: 12 }}>
            <Paragraph>
              <Text type="secondary">Email:</Text> <br />
              <Text strong>{candidate.email}</Text>
            </Paragraph>
            <Paragraph>
              <Text type="secondary">Công việc nộp gần nhất:</Text> <br />
              <Text strong>{candidate.lastApplied}</Text>
            </Paragraph>
            <Paragraph>
              <Text type="secondary">Trạng thái:</Text> <br />
              <Text strong type="success">
                {candidate.status}
              </Text>
            </Paragraph>
            <Paragraph>
              <Text type="secondary">Điểm hệ thống cao nhất từng đạt:</Text> <br />
              <Text strong style={{ color: "#faad14" }}>
                {candidate.maxAiScore} / 100
              </Text>
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
}
