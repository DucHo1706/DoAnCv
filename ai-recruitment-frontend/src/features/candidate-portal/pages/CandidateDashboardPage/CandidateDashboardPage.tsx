import { Card, Row, Col, Statistic, Progress, Tag, Typography, Space, Alert, List, Spin, Button, Empty, Divider, Skeleton } from "antd";
import {
  FileTextOutlined,
  CalendarOutlined,
  ThunderboltOutlined,
  BookOutlined,
  WarningOutlined,
  CompassOutlined,
  CheckCircleOutlined,
  RightOutlined,
  SafetyCertificateOutlined,
  EnvironmentOutlined,
  DollarOutlined
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../../../services/axiosClient";

import PageContainer from "../../../../components/common/PageContainer";

const { Title, Text } = Typography;

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
    matchedSkills?: string;
    missingSkills?: string;
    reason?: string;
  };
  interviewSchedule?: {
    interviewDate: string;
    format: string;
    locationOrLink: string;
  };
}

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

function CandidateDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [cvSkills, setCvSkills] = useState<string[]>([]);
  const [suggestedJobs, setSuggestedJobs] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Fetch past applications
        const appsResponse = await axiosClient.get("/recruitment/my-applications");
        let userApps: ApplicationItem[] = [];
        if (Array.isArray(appsResponse.data)) {
          userApps = appsResponse.data;
          setApplications(userApps);
        }

        // 2. Fetch profile to get CV Extracted Skills
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

          // Combine with skills from past applications automatically
          userApps.forEach(app => {
            if (app.aiEvaluation?.matchedSkills) {
              try {
                const list: string[] = JSON.parse(app.aiEvaluation.matchedSkills);
                list.forEach(s => {
                  if (s && !parsedSkills.includes(s)) {
                    parsedSkills.push(s);
                  }
                });
              } catch { }
            }
          });

          setCvSkills(parsedSkills);

          // 3. Automatically fetch and match jobs based on candidate CV & application skills
          setLoadingSuggestions(true);
          try {
            const jobsRes = await axiosClient.get("/jobs/published", {
              params: {
                PageSize: 30,
                PageIndex: 1
              }
            });
            const jobsData = jobsRes.data;
            const jobList = Array.isArray(jobsData)
              ? jobsData
              : (jobsData?.items || jobsData?.items?.$values || []);

            const processedRecommendations = processJobRecommendations(jobList, parsedSkills);
            setSuggestedJobs(processedRecommendations);
          } catch (err) {
            console.error("Lỗi khi tải gợi ý việc làm tự động:", err);
          } finally {
            setLoadingSuggestions(false);
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

  // Local, explainable pre-filter. It does not produce an AI evaluation score.
  const processJobRecommendations = (rawJobs: any[], candidateSkills: string[]) => {
    if (!candidateSkills || candidateSkills.length === 0) return [];

    const validSkills = candidateSkills.filter(s => s && s.trim().length > 1);
    const scoredJobs: any[] = [];

    rawJobs.forEach((j: any) => {
      const title = j.title || j.jobTitle || "";
      const desc = j.description || j.requirements || j.skillRequirements || "";
      const fullText = `${title} ${desc} ${j.companyName || ""}`;

      // Match exact skill words using Regex word boundaries (\b)
      const matchedSkills = validSkills.filter(sk => {
        try {
          const regex = new RegExp(`\\b${escapeRegExp(sk.trim())}\\b`, 'i');
          return regex.test(fullText);
        } catch {
          return false;
        }
      });

      const titleMatchedSkills = validSkills.filter(sk => {
        try {
          const regex = new RegExp(`\\b${escapeRegExp(sk.trim())}\\b`, 'i');
          return regex.test(title);
        } catch {
          return false;
        }
      });

      if (matchedSkills.length > 0) {
        scoredJobs.push({
          id: j.jobID || j.id,
          title: title,
          company: j.companyName || j.company || "Công ty Tuyển dụng",
          location: j.locationName || j.address || j.location || "TP. Hồ Chí Minh",
          salary: j.salaryRange || (j.salaryMin ? `${(j.salaryMin / 1000000).toFixed(0)} - ${(j.salaryMax / 1000000).toFixed(0)} triệu` : "Thỏa thuận"),
          matchedSkillsList: matchedSkills,
          matchedSkillCount: matchedSkills.length,
          totalProfileSkills: validSkills.length,
          relevanceRank: matchedSkills.length * 10 + titleMatchedSkills.length * 5
        });
      }
    });

    scoredJobs.sort((a, b) => b.relevanceRank - a.relevanceRank);
    return scoredJobs.slice(0, 6);
  };

  // Calculations
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

  const appsWithScore = applications.filter(
    (app) => app.aiEvaluation && Number.isFinite(app.aiEvaluation.fitScore)
  );
  const avgScore: number | null = appsWithScore.length > 0
    ? Math.round(appsWithScore.reduce((sum, app) => sum + app.aiEvaluation!.fitScore, 0) / appsWithScore.length)
    : null;

  // Compile Match & Missing Skills from applications
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
    return {
      skill,
      recommendation: `Tìm hiểu thêm kiến thức nền tảng và cách áp dụng thực tế của kỹ năng ${skill} để làm nổi bật hồ sơ.`,
      source: "Tài liệu kỹ thuật / Giáo trình chuyên ngành"
    };
  });

  if (loading) {
    return (
      <PageContainer title="Báo cáo Năng lực Cá nhân">
        <Card style={{ borderRadius: 16, border: "1px solid #E2E8F0", padding: 24 }}>
          <Skeleton active paragraph={{ rows: 10 }} />
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Báo cáo Năng lực Cá nhân" subtitle="Tự động bóc tách từ CV mẫu và dữ liệu các đơn ứng tuyển của bạn.">

      {/* Metric Cards */}
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card
            bordered={false}
            style={{
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: 16,
              boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)"
            }}
          >
            <Statistic
              title={<span style={{ color: "#64748B", fontWeight: 600, fontSize: 13 }}>TIN TUYỂN DỤNG ĐÃ NỘP</span>}
              value={totalApplied}
              prefix={<FileTextOutlined style={{ color: "#2563EB", marginRight: 8 }} />}
              valueStyle={{ color: "#0F172A", fontWeight: 800, fontSize: 26 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            bordered={false}
            style={{
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: 16,
              boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)"
            }}
          >
            <Statistic
              title={<span style={{ color: "#64748B", fontWeight: 600, fontSize: 13 }}>LỊCH HẸN PHỎNG VẤN TỚI</span>}
              value={interviewSchedules.length}
              prefix={<CalendarOutlined style={{ color: "#10B981", marginRight: 8 }} />}
              valueStyle={{ color: "#0F172A", fontWeight: 800, fontSize: 26 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            bordered={false}
            style={{
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: 16,
              boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ color: "#64748B", fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>
                  ĐIỂM PHÙ HỢP TRUNG BÌNH
                </span>
                <span style={{ fontSize: 26, fontWeight: 800, color: "#0F172A" }}>
                  {avgScore === null ? "—" : `${avgScore}%`}
                </span>
                {avgScore === null && (
                  <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                    Chưa có kết quả đánh giá
                  </Text>
                )}
              </div>
              {avgScore !== null && (
                <Progress
                  type="circle"
                  percent={avgScore}
                  size={48}
                  strokeColor={{
                    "0%": "#3B82F6",
                    "100%": "#10B981"
                  }}
                />
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Analysis Grid */}
      <Row gutter={[24, 24]}>
        {/* Left Column: Competency Breakdown & Skills Matrix */}
        <Col xs={24} lg={16}>
          <Space direction="vertical" size={24} style={{ width: "100%" }}>

            {/* Năng lực & Cảnh báo */}
            <Card
              title={
                <Space>
                  <CompassOutlined style={{ color: "#2563EB", fontSize: 18 }} />
                  <span style={{ fontWeight: 700, fontSize: 16, color: "#0F172A" }}>Kỹ năng trong hồ sơ</span>
                </Space>
              }
              bordered={false}
              style={{
                border: "1px solid #E2E8F0",
                borderRadius: 16,
                boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
                background: "#FFFFFF"
              }}
            >
              <div style={{ marginBottom: 20 }}>
                <Text strong style={{ display: "block", marginBottom: 12, color: "#334155", fontSize: 14 }}>
                  Kỹ năng được ghi nhận từ CV của bạn:
                </Text>
                {cvSkills.length === 0 ? (
                  <Alert
                    message="CV của bạn chưa được tải lên hoặc chưa có kỹ năng bóc tách"
                    description="Tự động cập nhật ngay khi bạn tải lên CV ở mục 'Hồ sơ cá nhân'."
                    type="info"
                    showIcon
                  />
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {cvSkills.map((skill, idx) => (
                      <Tag 
                        key={idx} 
                        style={{ 
                          fontSize: 13, 
                          padding: "4px 12px", 
                          borderRadius: 6, 
                          background: "#EFF6FF", 
                          color: "#1D4ED8", 
                          borderColor: "#BFDBFE",
                          fontWeight: 600 
                        }}
                      >
                        {skill}
                      </Tag>
                    ))}
                  </div>
                )}
              </div>

              {totalApplied > 0 && (
                <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 16 }}>
                  <Text strong style={{ display: "block", marginBottom: 10, color: "#334155", fontSize: 14 }}>
                    Kỹ năng đối khớp thành công qua các tin đã nộp:
                  </Text>
                  {sortedMatchedSkills.length === 0 ? (
                    <Tag color="green" style={{ fontSize: 13, padding: "4px 10px" }}>
                      ✓ Tự động đối khớp kỹ năng thành công từ các đơn ứng tuyển
                    </Tag>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {sortedMatchedSkills.map((skill, idx) => (
                        <Tag key={idx} style={{ color: "#059669", backgroundColor: "#ECFDF5", borderColor: "#A7F3D0", fontSize: 13, padding: "4px 10px", borderRadius: 6, fontWeight: 600 }}>
                          ✓ {skill}
                        </Tag>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Gợi ý phát triển kỹ năng */}
            <Card
              title={
                <Space>
                  <BookOutlined style={{ color: "#F59E0B", fontSize: 18 }} />
                  <span style={{ fontWeight: 700, fontSize: 16, color: "#0F172A" }}>Gợi ý phát triển kỹ năng</span>
                </Space>
              }
              bordered={false}
              style={{
                border: "1px solid #E2E8F0",
                borderRadius: 16,
                boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
                background: "#FFFFFF"
              }}
            >
              {careerAdviceList.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <CheckCircleOutlined style={{ fontSize: 32, color: "#10B981", marginBottom: 8 }} />
                  <Text strong style={{ display: "block", fontSize: 14, color: "#0F172A" }}>
                    Kỹ năng CV của bạn đã đáp ứng đầy đủ yêu cầu cho các công việc ứng tuyển.
                  </Text>
                </div>
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
                              borderRadius: 8,
                              backgroundColor: "#FFFBEB",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "1px solid #FDE68A"
                            }}
                          >
                            <WarningOutlined style={{ color: "#F59E0B", fontSize: 16 }} />
                          </div>
                        }
                        title={
                          <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
                            Cần bổ sung kỹ năng: <Tag color="orange" style={{ fontWeight: 600 }}>{item.skill}</Tag>
                          </span>
                        }
                        description={
                          <div>
                            <Text style={{ color: "#475569", fontSize: 13, display: "block", marginTop: 2 }}>
                              {item.recommendation}
                            </Text>
                            <span style={{ fontSize: 12, color: "#94A3B8", marginTop: 4, display: "inline-block" }}>
                              Khóa học tham khảo: <span style={{ color: "#2563EB", fontWeight: 600 }}>{item.source}</span>
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

        {/* Right Column: Interview Coaching */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <CalendarOutlined style={{ color: "#10B981", fontSize: 18 }} />
                <span style={{ fontWeight: 700, fontSize: 16, color: "#0F172A" }}>Lộ trình ôn tập</span>
              </Space>
            }
            bordered={false}
            style={{
              border: "1px solid #E2E8F0",
              borderRadius: 16,
              boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
              background: "#FFFFFF"
            }}
          >
            {interviewSchedules.length === 0 ? (
              <div style={{ textAlign: "center", padding: "28px 12px", color: "#64748B" }}>
                <CalendarOutlined style={{ fontSize: 30, color: "#CBD5E1", marginBottom: 8 }} />
                <Text style={{ display: "block", fontSize: 13, color: "#64748B" }}>
                  Chưa có lịch phỏng vấn nào sắp tới.
                </Text>
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 4 }}>
                  Hãy tiếp tục ứng tuyển để nhận lời mời phỏng vấn!
                </Text>
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
                      marginBottom: 10
                    }}
                  >
                    <Text strong style={{ display: "block", fontSize: 13, color: "#0F172A" }}>
                      {item.jobTitle}
                    </Text>
                    <div style={{ display: "flex", gap: 6, marginTop: 6, fontSize: 12, color: "#475569" }}>
                      <span>🕒 {item.date.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}</span>
                      <span>•</span>
                      <span>🖥️ {item.format}</span>
                    </div>
                    <div style={{ marginTop: 4, fontSize: 11, color: "#64748B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      📍 {item.location}
                    </div>
                  </div>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Recommended Jobs Section */}
      <Divider style={{ margin: "36px 0 24px" }} />

      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <Title level={4} style={{ margin: 0, color: "#0F172A", display: "flex", alignItems: "center", gap: 8, fontSize: 18 }}>
            <ThunderboltOutlined style={{ color: "#2563EB" }} />
            <span>Việc làm phù hợp với hồ sơ</span>
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Được sắp xếp theo kỹ năng trong CV, vị trí và yêu cầu tuyển dụng.
          </Text>
        </div>
        <Button 
          type="link" 
          onClick={() => navigate("/jobs")}
          style={{ fontWeight: 600, color: "#2563EB", padding: 0 }}
        >
          Xem tất cả việc làm <RightOutlined />
        </Button>
      </div>

      {loadingSuggestions ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin tip="Đang tìm việc làm phù hợp..." />
        </div>
      ) : suggestedJobs.length === 0 ? (
        <Card style={{ borderRadius: 16, textAlign: "center", padding: "32px 24px", border: "1px solid #E2E8F0" }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              cvSkills.length === 0
                ? "Cập nhật CV để hệ thống nhận diện kỹ năng và tìm việc làm phù hợp."
                : "Chưa có việc làm nào chứa các kỹ năng đã nhận diện trong CV của bạn."
            }
          >
            <Button type="primary" onClick={() => navigate(cvSkills.length === 0 ? "/profile" : "/jobs")}>
              {cvSkills.length === 0 ? "Cập nhật CV" : "Khám phá tất cả việc làm"}
            </Button>
          </Empty>
        </Card>
      ) : (
        <Row gutter={[20, 20]}>
          {suggestedJobs.map((job) => {
            return (
              <Col xs={24} lg={12} key={job.id}>
                <Card
                  hoverable
                  style={{
                    borderRadius: 16,
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}
                  bodyStyle={{ padding: "18px", display: "flex", flexDirection: "column", height: "100%" }}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text strong style={{ fontSize: 15, color: "#0F172A", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {job.title}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 13, display: "block", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {job.company}
                        </Text>
                      </div>
                      <Tag
                        color="blue"
                        style={{ margin: 0, borderRadius: 999, fontWeight: 700 }}
                      >
                        Khớp {job.matchedSkillCount}/{job.totalProfileSkills} kỹ năng
                      </Tag>
                    </div>

                    <div style={{ margin: "10px 0", display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <Tag style={{ borderRadius: 6, fontSize: 12, margin: 0 }}>
                        <EnvironmentOutlined /> {job.location}
                      </Tag>
                      <Tag color="green" style={{ borderRadius: 6, fontSize: 12, margin: 0, fontWeight: 600 }}>
                        <DollarOutlined /> {job.salary}
                      </Tag>
                    </div>

                    {job.matchedSkillsList && job.matchedSkillsList.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <span style={{ fontSize: 11, color: "#94A3B8", display: "block", marginBottom: 4 }}>
                          Trùng khớp kỹ năng:
                        </span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {job.matchedSkillsList.map((sk: string, sIdx: number) => (
                            <Tag key={sIdx} color="cyan" style={{ fontSize: 11, padding: "0 6px", borderRadius: 4, margin: 0 }}>
                              ✓ {sk}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 12, marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#2563EB", display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <CheckCircleOutlined /> Có kỹ năng trùng khớp
                    </span>
                    <Button type="primary" size="small" style={{ borderRadius: 6, background: "#2563EB", fontWeight: 600 }}>
                      Xem việc làm
                    </Button>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </PageContainer>
  );
}

const getScoreColor = (score: number) => {
  if (score >= 70) return "#10B981"; // Emerald
  if (score >= 50) return "#2563EB"; // Royal Blue
  return "#F59E0B"; // Amber
};

export default CandidateDashboardPage;
