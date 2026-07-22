import { Card, Row, Col, Statistic, Progress, Tag, Typography, Space, Alert, List, Spin, Button, Empty, Divider } from "antd";
import {
  FileTextOutlined,
  CalendarOutlined,
  ThunderboltOutlined,
  BookOutlined,
  WarningOutlined,
  ArrowRightOutlined,
  CompassOutlined,
  CheckCircleOutlined
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../services/axiosClient";

const { Title, Paragraph, Text } = Typography;

interface ApplicationItem {
  applicationId: string;
  status: string;
  appliedAt: string;
  job: {
    id: string;
    title: string;
    salaryRange: string;
  };
  aiEvaluation?: {
    fitScore: number;
    matchedSkills?: string; // JSON string array
    missingSkills?: string; // JSON string array
    reason?: string;
  };
  interviewSchedule?: {
    interviewDate: string;
    format: string;
    locationOrLink: string;
  };
}

function CandidateDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [cvSkills, setCvSkills] = useState<string[]>([]);
  const [suggestedJobs, setSuggestedJobs] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  // 1. Fetch applications and profile
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch applications
        const appsResponse = await axiosClient.get("/recruitment/my-applications");
        if (Array.isArray(appsResponse.data)) {
          setApplications(appsResponse.data);
        }

        // Fetch profile to get CV Extracted Skills
        const profileResponse = await axiosClient.get("/profile");
        const profileData = profileResponse.data;
        if (profileData) {
          setProfile(profileData);
          let parsedSkills: string[] = [];
          try {
            const skillsVal = typeof profileData.skills === "string"
              ? JSON.parse(profileData.skills)
              : profileData.skills;
            parsedSkills = Array.isArray(skillsVal)
              ? skillsVal
              : (Array.isArray(skillsVal?.$values) ? skillsVal.$values : []);
          } catch {
            parsedSkills = [];
          }
          setCvSkills(parsedSkills);

          const searchQuery = [profileData.major, ...parsedSkills]
            .filter(Boolean)
            .join(" ");

          if (searchQuery.trim().length > 0) {
            setLoadingSuggestions(true);
            try {
              const jobsRes = await axiosClient.get("/jobs/published", {
                params: {
                  Keyword: searchQuery,
                  PageSize: 4, // Show top 4 recommended jobs on dashboard
                  PageIndex: 1
                }
              });
              const jobsData = jobsRes.data;
              const jobList = Array.isArray(jobsData)
                ? jobsData
                : (jobsData?.items || jobsData?.items?.$values || []);
              setSuggestedJobs(jobList);
            } catch (err) {
              console.error("Lỗi khi tải gợi ý việc làm trên dashboard:", err);
            } finally {
              setLoadingSuggestions(false);
            }
          } else {
            setSuggestedJobs([]);
          }
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. Calculations
  const totalApplied = applications.length;

  const interviewSchedules = applications
    .filter((app) => app.interviewSchedule)
    .map((app) => ({
      jobTitle: app.job?.title || "Vị trí tuyển dụng",
      date: new Date(app.interviewSchedule!.interviewDate),
      format: app.interviewSchedule!.format,
      location: app.interviewSchedule!.locationOrLink
    }))
    .filter((sch) => sch.date >= new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const appsWithScore = applications.filter((app) => app.aiEvaluation && app.aiEvaluation.fitScore > 0);
  const avgScore = appsWithScore.length > 0
    ? Math.round(appsWithScore.reduce((sum, app) => sum + app.aiEvaluation!.fitScore, 0) / appsWithScore.length)
    : 0;

  // 3. Compile Match & Missing Skills from applications
  const missingSkillsMap: { [key: string]: number } = {};
  const matchedSkillsMap: { [key: string]: number } = {};

  applications.forEach((app) => {
    if (app.aiEvaluation) {
      if (app.aiEvaluation.missingSkills) {
        try {
          const list: string[] = JSON.parse(app.aiEvaluation.missingSkills);
          list.forEach((skill) => {
            missingSkillsMap[skill] = (missingSkillsMap[skill] || 0) + 1;
          });
        } catch { }
      }
      if (app.aiEvaluation.matchedSkills) {
        try {
          const list: string[] = JSON.parse(app.aiEvaluation.matchedSkills);
          list.forEach((skill) => {
            matchedSkillsMap[skill] = (matchedSkillsMap[skill] || 0) + 1;
          });
        } catch { }
      }
    }
  });

  const sortedMissingSkills = Object.entries(missingSkillsMap)
    .sort((a, b) => b[1] - a[1])
    .map(([skill]) => skill)
    .slice(0, 8);

  const sortedMatchedSkills = Object.entries(matchedSkillsMap)
    .sort((a, b) => b[1] - a[1])
    .map(([skill]) => skill)
    .slice(0, 8);

  // Recommendations based on missing market skills
  const careerAdviceList = sortedMissingSkills.map((skill) => {
    if (["react", "javascript", "typescript", "frontend"].some(s => skill.toLowerCase().includes(s))) {
      return {
        skill,
        recommendation: `Học thêm các dự án thực tế với React, NextJS để đáp ứng các vị trí Frontend chất lượng cao.`,
        source: "Udemy / Coursera React Course"
      };
    }
    if (["c#", "dotnet", "net core", "backend", "sql"].some(s => skill.toLowerCase().includes(s))) {
      return {
        skill,
        recommendation: `Bổ sung kỹ năng thiết kế Database, RESTful API bằng ASP.NET Core để phù hợp yêu cầu backend doanh nghiệp.`,
        source: "Microsoft Learn / Pluralsight"
      };
    }
    if (["python", "machine learning", "ai", "data"].some(s => skill.toLowerCase().includes(s))) {
      return {
        skill,
        recommendation: `Nâng cao năng lực xử lý dữ liệu với Pandas, PyTorch để làm quen với các bài toán AI thực tế.`,
        source: "Kaggle / DeepLearning.AI"
      };
    }
    return {
      skill,
      recommendation: `Tìm hiểu thêm kiến thức nền tảng và cách áp dụng thực tế của kỹ năng ${skill} để làm nổi bật hồ sơ.`,
      source: "Tài liệu kỹ thuật / Giáo trình chuyên ngành"
    };
  });

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <Spin size="large" tip="Đang phân tích dữ liệu năng lực..." />
      </div>
    );
  }

  return (
    <div style={{ padding: "12px 0" }}>
      {/* Hero section */}
      <div style={{ marginBottom: 28 }}>
        <Title level={3} style={{ margin: 0, color: "#0F172A" }}>Báo cáo năng lực cá nhân</Title>
      </div>

      {/* KPI Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: 28 }}>
        <Col xs={24} sm={8}>
          <Card
            bordered={false}
            style={{
              background: "rgba(255, 255, 255, 0.85)",
              backdropFilter: "blur(20px)",
              border: "1px solid #E2E8F0",
              borderRadius: 12,
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
            }}
          >
            <Statistic
              title={<span style={{ color: "#64748B", fontWeight: 500 }}>Tin tuyển dụng đã nộp</span>}
              value={totalApplied}
              prefix={<FileTextOutlined style={{ color: "#2563EB", marginRight: 8 }} />}
              valueStyle={{ color: "#0F172A", fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            bordered={false}
            style={{
              background: "rgba(255, 255, 255, 0.85)",
              backdropFilter: "blur(20px)",
              border: "1px solid #E2E8F0",
              borderRadius: 12,
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
            }}
          >
            <Statistic
              title={<span style={{ color: "#64748B", fontWeight: 500 }}>Lịch hẹn phỏng vấn tới</span>}
              value={interviewSchedules.length}
              prefix={<CalendarOutlined style={{ color: "#10B981", marginRight: 8 }} />}
              valueStyle={{ color: "#0F172A", fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            bordered={false}
            style={{
              background: "rgba(255, 255, 255, 0.85)",
              backdropFilter: "blur(20px)",
              border: "1px solid #E2E8F0",
              borderRadius: 12,
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ color: "#64748B", fontSize: 14, fontWeight: 500, display: "block", marginBottom: 4 }}>
                  Tương hợp AI trung bình
                </span>
                <span style={{ fontSize: 24, fontWeight: 700, color: "#0F172A" }}>
                  {avgScore}%
                </span>
              </div>
              <Progress
                type="circle"
                percent={avgScore}
                size={48}
                strokeColor={{
                  "0%": "#3B82F6",
                  "100%": "#10B981"
                }}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Analysis Section */}
      <Row gutter={[24, 24]}>
        {/* Left Column: Skill Matrix */}
        <Col xs={24} lg={16}>
          <Space direction="vertical" size={24} style={{ width: "100%" }}>

            {/* Năng lực & Cảnh báo */}
            <Card
              title={
                <Space>
                  <CompassOutlined style={{ color: "#2563EB" }} />
                  <span>Năng lực & Cảnh báo</span>
                </Space>
              }
              bordered={false}
              style={{
                border: "1px solid #E2E8F0",
                borderRadius: 16,
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
              }}
            >
              <div style={{ marginBottom: 20 }}>
                <Text strong style={{ display: "block", marginBottom: 8, color: "#475569" }}>
                  Kỹ năng được ghi nhận trong CV của bạn:
                </Text>
                {cvSkills.length === 0 ? (
                  <Alert
                    message="CV của bạn chưa được tải lên hoặc chưa được quét kỹ năng"
                    description="Vui lòng tải lên CV mặc định tại mục 'Hồ sơ cá nhân' (Quản lý CV mẫu) để kích hoạt công cụ phân tích và gợi ý việc làm từ AI."
                    type="warning"
                    showIcon
                    action={
                      <Button size="small" type="primary" onClick={() => navigate("/profile")}>
                        Quản lý CV ngay
                      </Button>
                    }
                  />
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {cvSkills.map((skill, idx) => (
                      <Tag key={idx} color="blue" style={{ fontSize: 13, padding: "4px 10px", borderRadius: 4 }}>
                        {skill}
                      </Tag>
                    ))}
                  </div>
                )}
              </div>

              {totalApplied > 0 && (
                <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 16 }}>
                  <Text strong style={{ display: "block", marginBottom: 12, color: "#475569" }}>
                    Kỹ năng đối khớp thành công qua các tin đã nộp:
                  </Text>
                  {sortedMatchedSkills.length === 0 ? (
                    <Text type="secondary" style={{ fontSize: 13 }}>Đang phân tích đối khớp...</Text>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {sortedMatchedSkills.map((skill, idx) => (
                        <Tag key={idx} color="emerald" style={{ color: "#10B981", backgroundColor: "#F0FDF4", borderColor: "#BBF7D0", fontSize: 13, padding: "4px 10px", borderRadius: 4 }}>
                          ✓ {skill}
                        </Tag>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Gợi ý học thêm */}
            <Card
              title={
                <Space>
                  <BookOutlined style={{ color: "#F59E0B" }} />
                  <span>Gợi ý học thêm</span>
                </Space>
              }
              bordered={false}
              style={{
                border: "1px solid #E2E8F0",
                borderRadius: 16,
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
              }}
            >
              {sortedMissingSkills.length === 0 ? (
                <Empty description="Tuyệt vời! CV của bạn đã phủ đầy đủ kỹ năng mà các công việc đã ứng tuyển yêu cầu." />
              ) : (
                <List
                  itemLayout="horizontal"
                  dataSource={careerAdviceList}
                  renderItem={(item) => (
                    <List.Item style={{ padding: "12px 0", borderBottom: "1px solid #F1F5F9" }}>
                      <List.Item.Meta
                        avatar={
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              backgroundColor: "#FFFBEB",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "1px solid #FDE68A"
                            }}
                          >
                            <WarningOutlined style={{ color: "#F59E0B" }} />
                          </div>
                        }
                        title={
                          <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
                            Cần bổ sung kỹ năng: <Tag color="orange">{item.skill}</Tag>
                          </span>
                        }
                        description={
                          <div>
                            <Text style={{ color: "#475569", fontSize: 13, display: "block", marginTop: 4 }}>
                              {item.recommendation}
                            </Text>
                            <span style={{ fontSize: 11, color: "#94A3B8", marginTop: 4, display: "inline-block" }}>
                              Khóa học tham khảo: <span style={{ color: "#2563EB", fontWeight: 500 }}>{item.source}</span>
                            </span>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>

          </Space>
        </Col>

        {/* Right Column: AI Coaching & Interviews */}
        <Col xs={24} lg={8}>
          <Space direction="vertical" size={24} style={{ width: "100%" }}>

            {/* Lịch phỏng vấn sắp tới */}
            <Card
              title={
                <Space>
                  <CalendarOutlined style={{ color: "#10B981" }} />
                  <span>Gợi ý phỏng vấn</span>
                </Space>
              }
              bordered={false}
              style={{
                border: "1px solid #E2E8F0",
                borderRadius: 16,
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
              }}
            >
              {interviewSchedules.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px 0", color: "#94A3B8" }}>
                  Chưa có lịch phỏng vấn nào sắp tới. Hãy tiếp tục ứng tuyển các công việc phù hợp!
                </div>
              ) : (
                <List
                  dataSource={interviewSchedules}
                  renderItem={(item) => (
                    <div
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        background: "#F8FAFC",
                        border: "1px solid #E2E8F0",
                        marginBottom: 12
                      }}
                    >
                      <Text strong style={{ display: "block", fontSize: 13, color: "#0F172A" }}>
                        {item.jobTitle}
                      </Text>
                      <div style={{ display: "flex", gap: 8, marginTop: 6, fontSize: 12, color: "#64748B" }}>
                        <span>🕒 {item.date.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}</span>
                        <span>•</span>
                        <span>🖥️ {item.format}</span>
                      </div>
                      <div style={{ marginTop: 4, fontSize: 11, color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        📍 {item.location}
                      </div>
                    </div>
                  )}
                />
              )}
            </Card>
          </Space>
        </Col>
      </Row>

      {/* AI Recommended Jobs Section */}
      <Divider style={{ margin: "36px 0 24px" }} />

      <div style={{ marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0, color: "#0F172A", display: "flex", alignItems: "center", gap: 8 }}>
          <ThunderboltOutlined style={{ color: "#2563EB" }} />
          <span>Gợi ý việc làm phù hợp (Phân tích bởi AI)</span>
        </Title>
      </div>

      {loadingSuggestions ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin tip="Đang chạy mô hình AI đối sánh năng lực..." />
        </div>
      ) : !profile?.defaultCvUrl ? (
        <Card style={{ borderRadius: 12, textAlign: "center", padding: "30px 24px" }}>
          <Text type="secondary" style={{ fontSize: 14, display: "block", marginBottom: 12 }}>
            Bạn chưa tải lên CV mẫu nào trong Hồ sơ cá nhân.
          </Text>
          <Button type="primary" onClick={() => navigate("/profile")} style={{ borderRadius: 6, background: "#2563EB" }}>
            Tải lên CV ngay
          </Button>
        </Card>
      ) : suggestedJobs.length === 0 ? (
        <Card style={{ borderRadius: 12, textAlign: "center", padding: "30px 24px" }}>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Không tìm thấy gợi ý tương thích cao (trên 40% điểm tương đồng). Hãy thử cập nhật thêm kỹ năng hoặc học vấn mới vào CV mẫu của bạn.
          </Text>
        </Card>
      ) : (
        <Row gutter={[20, 20]}>
          {suggestedJobs.map((job) => {
            const matchScore = Math.round(job.aiScore);
            return (
              <Col xs={24} sm={12} key={job.id}>
                <Card
                  hoverable
                  style={{
                    borderRadius: 12,
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                  }}
                  bodyStyle={{ padding: 20 }}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text strong style={{ fontSize: 15, color: "#0F172A", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {job.title}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 13, display: "block", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {job.company}
                      </Text>
                      <div style={{ display: "flex", gap: 12, marginTop: 12, fontSize: 12, flexWrap: "wrap" }}>
                        <span style={{ color: "#64748B" }}>📍 {job.location}</span>
                        <span style={{ color: "#10B981", fontWeight: 600 }}>💵 {job.salary}</span>
                      </div>
                    </div>
                    <Progress
                      type="circle"
                      percent={matchScore}
                      size={48}
                      strokeColor={getScoreColor(matchScore)}
                      format={(p) => <span style={{ fontSize: 11, fontWeight: "bold", color: "#0F172A" }}>{p}%</span>}
                    />
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
}

const getScoreColor = (score: number) => {
  if (score >= 75) return "#10B981"; // Emerald
  if (score >= 50) return "#F59E0B"; // Amber
  return "#EF4444"; // Crimson
};

export default CandidateDashboardPage;
