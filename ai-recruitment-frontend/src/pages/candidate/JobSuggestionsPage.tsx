import { useEffect, useState } from "react";
import { Card, Row, Col, Progress, Tag, Space, Typography, Spin, Button, message, Alert, Divider } from "antd";
import { 
  ThunderboltOutlined, 
  EnvironmentOutlined, 
  DollarOutlined, 
  BookOutlined,
  CheckCircleOutlined,
  CompassOutlined,
  FilePdfOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import PageContainer from "../../components/common/PageContainer";
import axiosClient from "../../services/axiosClient";

const { Title, Text, Paragraph } = Typography;

function JobSuggestionsPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [suggestedJobs, setSuggestedJobs] = useState<any[]>([]);
  const navigate = useNavigate();

  const fetchProfileAndSuggestions = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch candidate profile to get default CV skills & major
      const profileRes = await axiosClient.get("/profile");
      const profileData = profileRes.data;
      setProfile(profileData);

      // Parse skills tag list
      let parsedSkills: string[] = [];
      try {
        const skillsVal = typeof profileData.skills === "string" 
          ? JSON.parse(profileData.skills) 
          : profileData.skills;
        parsedSkills = Array.isArray(skillsVal) 
          ? skillsVal 
          : (Array.isArray(skillsVal?.$values) ? skillsVal.$values : []);
      } catch (e) {
        parsedSkills = [];
      }

      // 2. Fetch semantic matches from /jobs/published endpoint
      const searchQuery = [profileData.major, ...parsedSkills]
        .filter(Boolean)
        .join(" ");

      if (searchQuery.trim().length > 0) {
        const jobsRes = await axiosClient.get("/jobs/published", {
          params: {
            Keyword: searchQuery,
            PageSize: 8,
            PageIndex: 1
          }
        });
        
        const jobsData = jobsRes.data;
        const jobList = Array.isArray(jobsData) 
          ? jobsData 
          : (jobsData?.items || jobsData?.items?.$values || []);
        
        setSuggestedJobs(jobList);
      } else {
        setSuggestedJobs([]);
      }
    } catch (err) {
      console.error("Lỗi khi tải gợi ý việc làm:", err);
      message.error("Lỗi khi tải gợi ý việc làm.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndSuggestions();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 75) return "#10B981"; // Emerald
    if (score >= 50) return "#F59E0B"; // Amber
    return "#EF4444"; // Crimson
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0" }}>
        <Spin size="large" tip="Đang chạy mô hình AI đối sánh năng lực..." />
      </div>
    );
  }

  // Parse skill list for display tags
  let candidateSkills: string[] = [];
  try {
    if (profile?.skills) {
      const skillsVal = typeof profile.skills === "string" ? JSON.parse(profile.skills) : profile.skills;
      candidateSkills = Array.isArray(skillsVal) 
        ? skillsVal 
        : (Array.isArray(skillsVal?.$values) ? skillsVal.$values : []);
    }
  } catch (e) {}

  return (
    <PageContainer 
      title="Gợi ý việc làm phù hợp" 
      subtitle="Được phân tích thông minh bởi AI dựa trên hồ sơ năng lực và kỹ năng từ CV mẫu của bạn"
    >
      {/* 1. Header Overview Card */}
      <Card
        style={{
          background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
          border: "1px solid #BFDBFE",
          borderRadius: 16,
          marginBottom: 24,
          boxShadow: "0 4px 14px rgba(37, 99, 235, 0.05)"
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Row gutter={[24, 16]} align="middle">
          <Col xs={24} md={18}>
            <Title level={4} style={{ margin: 0, color: "#1E3A8A" }}>
              ⚡ Trình Đối Sánh Năng Lực AI
            </Title>
            <Paragraph style={{ margin: "6px 0 16px", color: "#1E40AF", fontSize: 13.5 }}>
              AI phân tích độ khớp giữa học vấn **{profile?.major || "chưa cập nhật"}** cùng các kỹ năng trong CV với các tin tuyển dụng để tìm ra cơ hội phù hợp nhất cho bạn.
            </Paragraph>
            
            {candidateSkills.length > 0 ? (
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6, color: "#1E40AF", fontWeight: 600 }}>
                  KỸ NĂNG KHỚP NĂNG LỰC DÙNG ĐỂ ĐỐI SÁNH:
                </Text>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {candidateSkills.map((skill, idx) => (
                    <Tag key={idx} color="blue" style={{ margin: 0, fontWeight: 500, borderRadius: 4 }}>
                      {skill}
                    </Tag>
                  ))}
                </div>
              </div>
            ) : (
              <Tag color="warning">Chưa có dữ liệu kỹ năng trích xuất</Tag>
            )}
          </Col>
          <Col xs={24} md={6} style={{ textAlign: "right" }}>
            <Button
              type="primary"
              icon={<FilePdfOutlined />}
              onClick={() => navigate("/candidate/profile")}
              style={{ borderRadius: 8, height: 40, background: "#2563EB" }}
            >
              Cập nhật CV mẫu
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 2. Suggestions Grid */}
      {!profile?.defaultCvUrl ? (
        <Card style={{ borderRadius: 16, textAlign: "center", padding: "48px 24px" }}>
          <div style={{ fontSize: 44, color: "#94A3B8", marginBottom: 16 }}>
            <CompassOutlined />
          </div>
          <Title level={4} style={{ color: "#475569" }}>Chưa tải lên CV Mẫu</Title>
          <Paragraph style={{ color: "#64748B", maxWidth: 450, margin: "0 auto 20px" }}>
            Vui lòng tải lên CV mặc định tại mục hồ sơ cá nhân để kích hoạt công cụ đối sánh và tìm kiếm việc làm bằng AI thông minh.
          </Paragraph>
          <Button 
            type="primary" 
            onClick={() => navigate("/candidate/profile")}
            style={{ borderRadius: 8, background: "#2563EB" }}
          >
            Đến trang Quản lý CV
          </Button>
        </Card>
      ) : suggestedJobs.length === 0 ? (
        <Card style={{ borderRadius: 16, textAlign: "center", padding: "48px 24px" }}>
          <div style={{ fontSize: 44, color: "#94A3B8", marginBottom: 16 }}>
            <ThunderboltOutlined />
          </div>
          <Title level={4} style={{ color: "#475569" }}>Không tìm thấy gợi ý tương thích cao</Title>
          <Paragraph style={{ color: "#64748B", maxWidth: 450, margin: "0 auto" }}>
            Hệ thống không tìm thấy công việc nào có điểm tương đồng trên 40%. Hãy thử cập nhật thêm kỹ năng hoặc học vấn mới vào CV mẫu của bạn.
          </Paragraph>
        </Card>
      ) : (
        <Row gutter={[20, 20]}>
          {suggestedJobs.map((job) => {
            const matchScore = Math.round(job.aiScore);
            return (
              <Col xs={24} key={job.id}>
                <Card
                  hoverable
                  style={{
                    borderRadius: 16,
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
                  }}
                  bodyStyle={{ padding: 24 }}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <Row gutter={[24, 16]} align="middle">
                    {/* Left: Score ring */}
                    <Col xs={24} sm={4} md={3} style={{ textAlign: "center" }}>
                      <Progress
                        type="circle"
                        percent={matchScore}
                        size={75}
                        strokeColor={getScoreColor(matchScore)}
                        format={(p) => (
                          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                            <span style={{ fontSize: 15, fontWeight: "bold", color: "#0F172A", display: "block" }}>{p}%</span>
                            <span style={{ fontSize: 9, color: "#64748B" }}>độ khớp</span>
                          </div>
                        )}
                      />
                    </Col>
                    
                    {/* Middle: Job detail summary */}
                    <Col xs={24} sm={15} md={16}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <Title level={4} style={{ margin: 0, color: "#0F172A", fontSize: 18 }}>
                          {job.title}
                        </Title>
                        {matchScore >= 75 && (
                          <Tag color="success" style={{ fontWeight: 600, margin: 0 }}>
                            Perfect Match ✨
                          </Tag>
                        )}
                      </div>
                      <Text type="secondary" style={{ display: "block", margin: "4px 0 12px", fontSize: 14 }}>
                        {job.company}
                      </Text>
                      
                      <Space size="large" style={{ fontSize: 13, flexWrap: "wrap" }}>
                        <span style={{ color: "#64748B" }}>
                          <EnvironmentOutlined /> {job.location}
                        </span>
                        <span style={{ color: "#10B981", fontWeight: 600 }}>
                          <DollarOutlined /> Lương: {job.salary}
                        </span>
                        <span style={{ color: "#2563EB" }}>
                          <BookOutlined /> {job.type}
                        </span>
                      </Space>
                      
                      <Paragraph 
                        type="secondary" 
                        style={{ fontSize: 13, margin: "10px 0 0", color: "#64748B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      >
                        {job.description}
                      </Paragraph>
                    </Col>

                    {/* Right: Apply action */}
                    <Col xs={24} sm={5} md={5} style={{ textAlign: "right" }}>
                      <Button
                        type="primary"
                        ghost
                        style={{ borderRadius: 8, fontWeight: 600 }}
                      >
                        Xem chi tiết & Nộp CV
                      </Button>
                    </Col>
                  </Row>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </PageContainer>
  );
}

export default JobSuggestionsPage;
