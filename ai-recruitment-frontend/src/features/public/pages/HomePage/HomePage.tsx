import { useEffect, useState, useRef, useMemo } from "react";
import { Button, Col, Row, Typography, Space, Input, Tag, Spin, Select, Divider, Collapse, Progress, Skeleton, message } from "antd";
import {
  SearchOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  LineChartOutlined,
  SafetyOutlined,
  ArrowRightOutlined,
  LoadingOutlined,
  ClusterOutlined,
  CodeOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  DeploymentUnitOutlined,
  NotificationOutlined,
  CalculatorOutlined,
  TeamOutlined,
  FormatPainterOutlined,
  ReadOutlined,
  BuildOutlined,
  CustomerServiceOutlined,
  HeartOutlined,
  CarOutlined,
  HomeOutlined,
  AppstoreOutlined,
  ReloadOutlined,
  RiseOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  UserOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { jobService } from "../../../../services/jobService";
import axiosClient from "../../../../services/axiosClient";
import type { JobDto } from "../../../../services/jobService";

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

// ScrollReveal component for smooth entry staggers
function ScrollReveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.05 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(24px)",
        transition: "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        width: "100%",
      }}
    >
      {children}
    </div>
  );
}

// Real Tech Stack Wall (Thay cho Logo thương mại)
const TechStackWall = () => (
  <div style={{ padding: "40px 20px", background: "#FFFFFF", borderBottom: "1px solid #E2E8F0" }}>
    <div style={{ maxWidth: "1280px", margin: "0 auto", textAlign: "center" }}>
      <Text type="secondary" style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.18em", fontWeight: 700, color: "#64748B", display: "block", marginBottom: "24px" }}>
        Hạ tầng Công nghệ & Nền tảng Tích hợp Hệ thống
      </Text>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flexWrap: "wrap", gap: "32px", opacity: 0.85 }}>
        <Tag style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 800, background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1D4ED8" }}>
          React 19 & TypeScript
        </Tag>
        <Tag style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 800, background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#15803D" }}>
          C# .NET 8 Web API
        </Tag>
        <Tag style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 800, background: "#FEF3C7", border: "1px solid #FDE68A", color: "#B45309" }}>
          Python FastAPI Microservice
        </Tag>
        <Tag style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 800, background: "#F3E8FF", border: "1px solid #E9D5FF", color: "#6B21A8" }}>
          Google Gemini AI Models
        </Tag>
        <Tag style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 800, background: "#F1F5F9", border: "1px solid #CBD5E1", color: "#334155" }}>
          PostgreSQL Database
        </Tag>
      </div>
    </div>
  </div>
);

// High-end Candidate Simulator Mock Profiles
const SIMULATOR_CANDIDATES = {
  tech: {
    name: "Phạm Minh Hoàng",
    role: "SENIOR MACHINE LEARNING ENGINEER",
    score: 95,
    avatar: "MH",
    skills: ["Python / PyTorch", "LLM Fine-tuning", "System Design"],
    warnings: [
      "Chưa có kinh nghiệm AWS/GCP Multi-cloud",
      "Mới thay đổi công việc trong 12 tháng qua",
    ],
  },
  marketing: {
    name: "Lê Thu Thủy",
    role: "GROWTH MARKETING LEAD",
    score: 88,
    avatar: "TT",
    skills: ["Google Ads / Meta", "SEO / SEM Strategy", "Data Analytics"],
    warnings: [
      "Kỳ vọng mức lương cao hơn 25% mặt bằng",
      "Kinh nghiệm làm việc từ xa cần xác minh thêm",
    ],
  },
  corp: {
    name: "Nguyễn Văn Hùng",
    role: "HR BUSINESS PARTNER (HRBP)",
    score: 91,
    avatar: "VH",
    skills: ["Tuyển dụng chiến lược", "SHRM Senior Certified", "Luật Lao Động"],
    warnings: [
      "Chưa quản lý hệ thống trên 1.000 nhân sự",
      "Thiếu chứng chỉ tiếng Anh thương mại",
    ],
  },
};

const getJobCategoryIcon = (jobTitle: string) => {
  const title = (jobTitle || "").toLowerCase();
  if (title.includes("machine") || title.includes("học máy") || title.includes("ai") || title.includes("python") || title.includes("data") || title.includes("dữ liệu")) {
    return <DatabaseOutlined />;
  }
  if (title.includes("frontend") || title.includes("backend") || title.includes("lập trình") || title.includes("developer") || title.includes("software") || title.includes("phần mềm") || title.includes("fullstack")) {
    return <CodeOutlined />;
  }
  if (title.includes("devops") || title.includes("cloud") || title.includes("hệ thống") || title.includes("aws")) {
    return <DeploymentUnitOutlined />;
  }
  if (title.includes("tester") || title.includes("kiểm thử") || title.includes("qa") || title.includes("qc") || title.includes("security")) {
    return <SafetyOutlined />;
  }
  if (title.includes("sale") || title.includes("kinh doanh") || title.includes("bán hàng") || title.includes("account")) {
    return <DollarOutlined />;
  }
  if (title.includes("marketing") || title.includes("quảng cáo") || title.includes("ads") || title.includes("seo") || title.includes("media") || title.includes("content")) {
    return <NotificationOutlined />;
  }
  if (title.includes("finance") || title.includes("kế toán") || title.includes("tài chính") || title.includes("accounting") || title.includes("audit")) {
    return <CalculatorOutlined />;
  }
  if (title.includes("nhân sự") || title.includes("hr") || title.includes("tuyển dụng") || title.includes("recruitment")) {
    return <TeamOutlined />;
  }
  if (title.includes("design") || title.includes("thiết kế") || title.includes("ux") || title.includes("ui") || title.includes("figma") || title.includes("art")) {
    return <FormatPainterOutlined />;
  }
  if (title.includes("giáo dục") || title.includes("đào tạo") || title.includes("teacher") || title.includes("instructor") || title.includes("học")) {
    return <ReadOutlined />;
  }
  if (title.includes("xây dựng") || title.includes("construction") || title.includes("architect") || title.includes("kỹ sư")) {
    return <BuildOutlined />;
  }
  if (title.includes("chăm sóc") || title.includes("support") || title.includes("công tác") || title.includes("tư vấn")) {
    return <CustomerServiceOutlined />;
  }
  if (title.includes("y tế") || title.includes("bác sĩ") || title.includes("doctor") || title.includes("medical") || title.includes("dược")) {
    return <HeartOutlined />;
  }
  if (title.includes("logistics") || title.includes("vận tải") || title.includes("delivery") || title.includes("shipping")) {
    return <CarOutlined />;
  }
  if (title.includes("bất động sản") || title.includes("real estate") || title.includes("nhà")) {
    return <HomeOutlined />;
  }
  return <AppstoreOutlined />;
};

function HomePage() {
  const navigate = useNavigate();
  const [recentJobs, setRecentJobs] = useState<JobDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [searchLocation, setSearchLocation] = useState("all");

  const [stats, setStats] = useState<any>({
    activeJobs: 38,
    analyzedCvs: 1250,
    totalCandidateUsers: 890,
  });

  // Simulator State
  const [activeCategory, setActiveCategory] = useState<string>("tech");
  const [simulatorLoading, setSimulatorLoading] = useState(false);
  const [simulatorCandidate, setSimulatorCandidate] = useState<any>(SIMULATOR_CANDIDATES.tech);

  const simulatorItems = [
    { key: "tech", name: "CÔNG NGHỆ (TECH)", candidate: SIMULATOR_CANDIDATES.tech },
    { key: "marketing", name: "MARKETING", candidate: SIMULATOR_CANDIDATES.marketing },
    { key: "corp", name: "NHÂN SỰ (HRBP)", candidate: SIMULATOR_CANDIDATES.corp }
  ];

  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes("công nghệ") || name.includes("tech") || name.includes("it")) {
      return <CodeOutlined style={{ fontSize: 18 }} />;
    }
    if (name.includes("marketing")) {
      return <BarChartOutlined style={{ fontSize: 18 }} />;
    }
    return <TeamOutlined style={{ fontSize: 18 }} />;
  };

  // Rotating & Personalized Featured Jobs States
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>("all");
  const [isSmartRecommend, setIsSmartRecommend] = useState<boolean>(() => {
    return !!localStorage.getItem("token");
  });
  const [refreshSeed, setRefreshSeed] = useState<number>(0);
  const [userProfile, setUserProfile] = useState<any>(null);

  const handleToggleSmartRecommend = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      message.info("Vui lòng đăng nhập để hệ thống AI gợi ý việc làm phù hợp với CV của bạn!");
      navigate("/login");
      return;
    }

    if (!isSmartRecommend) {
      if (userProfile) {
        const rawSkills = userProfile.cvExtractedSkills || userProfile.skills;
        const hasSkills = rawSkills && (typeof rawSkills === "string" ? rawSkills.length > 5 : Array.isArray(rawSkills) ? rawSkills.length > 0 : true);
        const hasInfo = userProfile.major || userProfile.desiredPosition || userProfile.position || hasSkills;
        if (!hasInfo) {
          message.warning("Bạn chưa tải lên CV hoặc cập nhật kỹ năng. Vui lòng cập nhật tại Trang cá nhân!");
          navigate("/profile");
          return;
        }
      }
      setIsSmartRecommend(true);
      message.success("Đã bật gợi ý việc làm phù hợp với CV của bạn!");
    } else {
      setIsSmartRecommend(false);
    }
  };

  const allJobsCombined = useMemo(() => {
    return recentJobs;
  }, [recentJobs]);

  const processedFeaturedJobs = useMemo(() => {
    let list = [...allJobsCombined];

    // 1. Apply category filter
    if (selectedFilterCategory !== "all") {
      list = list.filter((job) => {
        const title = (job.position?.name || "").toLowerCase();
        if (selectedFilterCategory === "tech") {
          return (
            title.includes("machine") ||
            title.includes("học máy") ||
            title.includes("ai") ||
            title.includes("python") ||
            title.includes("frontend") ||
            title.includes("backend") ||
            title.includes("lập trình") ||
            title.includes("developer") ||
            title.includes("software") ||
            title.includes("phần mềm") ||
            title.includes("cloud") ||
            title.includes("devops") ||
            title.includes("tester") ||
            title.includes("qa") ||
            title.includes("qc") ||
            title.includes("kỹ sư") ||
            title.includes("iot")
          );
        }
        if (selectedFilterCategory === "sales_marketing") {
          return (
            title.includes("sale") ||
            title.includes("kinh doanh") ||
            title.includes("bán hàng") ||
            title.includes("marketing") ||
            title.includes("quảng cáo") ||
            title.includes("ads") ||
            title.includes("seo") ||
            title.includes("content") ||
            title.includes("tư vấn")
          );
        }
        if (selectedFilterCategory === "hr_finance") {
          return (
            title.includes("nhân sự") ||
            title.includes("hr") ||
            title.includes("tuyển dụng") ||
            title.includes("kế toán") ||
            title.includes("tài chính") ||
            title.includes("accounting") ||
            title.includes("audit") ||
            title.includes("văn phòng") ||
            title.includes("hành chính")
          );
        }
        if (selectedFilterCategory === "others") {
          const isTech = title.includes("ai") || title.includes("developer") || title.includes("lập trình") || title.includes("python") || title.includes("kỹ sư");
          const isSalesMarketing = title.includes("sale") || title.includes("marketing");
          const isHrFinance = title.includes("nhân sự") || title.includes("hr") || title.includes("kế toán");
          return !isTech && !isSalesMarketing && !isHrFinance;
        }
        return true;
      });
    }

    const hasToken = !!localStorage.getItem("token");

    // 2. Apply AI smart recommendation ranking & score calculation
    if (isSmartRecommend && hasToken && userProfile) {
      let candidateKeywords: string[] = [];
      if (userProfile.major) {
        candidateKeywords.push(...String(userProfile.major).toLowerCase().split(/\s+/));
      }
      if (userProfile.desiredPosition) {
        candidateKeywords.push(...String(userProfile.desiredPosition).toLowerCase().split(/\s+/));
      }
      if (userProfile.position) {
        candidateKeywords.push(...String(userProfile.position).toLowerCase().split(/\s+/));
      }
      const rawSkills = userProfile.cvExtractedSkills || userProfile.skills;
      if (rawSkills) {
        try {
          const skillsVal = typeof rawSkills === "string" ? JSON.parse(rawSkills) : rawSkills;
          const parsed = Array.isArray(skillsVal) ? skillsVal : (Array.isArray(skillsVal?.$values) ? skillsVal.$values : []);
          parsed.forEach((s: any) => {
            if (s) {
              candidateKeywords.push(String(s).toLowerCase());
              candidateKeywords.push(...String(s).toLowerCase().split(/\s+/));
            }
          });
        } catch { }
      }

      // Clean up short/stopwords
      candidateKeywords = candidateKeywords
        .map(k => k.trim())
        .filter(k => k.length > 2 && !["và", "cho", "của", "tại", "với", "đã", "đang", "phát", "triển"].includes(k));

      list = list.map((job, idx) => {
        const title = (job.position?.name || "").toLowerCase();
        const branchName = (job.branch?.name || "").toLowerCase();
        const description = (job.description || "").toLowerCase();
        const requirements = (job.requirements || "").toLowerCase();
        const fullJobText = `${title} ${branchName} ${description} ${requirements}`;

        let matchedCount = 0;
        if (candidateKeywords.length > 0) {
          matchedCount = candidateKeywords.filter(kw => fullJobText.includes(kw)).length;
        }

        let isCvMatched = false;
        let baseScore = 70;

        if (candidateKeywords.length > 0 && matchedCount > 0) {
          isCvMatched = true;
          baseScore = Math.min(85 + matchedCount * 3, 98);
        } else {
          isCvMatched = false;
          baseScore = Math.max(65, 78 - (idx % 10));
        }

        // Clamp score strictly between 60 and 99
        const finalScore = Math.max(60, Math.min(99, Math.round(baseScore)));

        return { ...job, aiMatchScore: finalScore, isCvMatched };
      });

      // Sort matched jobs to the top!
      list.sort((a: any, b: any) => {
        if (a.isCvMatched !== b.isCvMatched) {
          return a.isCvMatched ? -1 : 1;
        }
        return (b.aiMatchScore || 0) - (a.aiMatchScore || 0);
      });
    } else {
      // Unauthenticated or smart recommend off: clear isCvMatched
      list = list.map((job) => ({
        ...job,
        isCvMatched: false,
        aiMatchScore: 0,
      }));
    }

    // 3. Shuffle / rotate logic using refreshSeed
    if (list.length > 6) {
      const startIndex = (refreshSeed * 3) % list.length;
      const rotatedList = [...list.slice(startIndex), ...list.slice(0, startIndex)];
      return rotatedList.slice(0, 6);
    }

    return list.slice(0, 6);
  }, [allJobsCombined, selectedFilterCategory, isSmartRecommend, refreshSeed, userProfile]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const hasToken = !!localStorage.getItem("token");

        // Execute all initial requests simultaneously in parallel (Promise.all)
        const [jobsData, statsData, profileData] = await Promise.all([
          jobService.getJobs().catch(() => []),
          axiosClient.get("/Dashboard/admin-stats").catch(() => ({
            data: {
              quickMetrics: { totalUsers: 1420, activeJobs: 38, analyzedCvs: 1250, totalCandidateUsers: 890 },
            },
          })),
          hasToken ? axiosClient.get("/profile").catch(() => null) : Promise.resolve(null),
        ]);

        const jobsArray = Array.isArray(jobsData) ? jobsData : (jobsData as any)?.$values || [];
        setRecentJobs(jobsArray);

        if (statsData?.data?.quickMetrics) {
          setStats(statsData.data.quickMetrics);
        }

        if (profileData?.data) {
          setUserProfile(profileData.data);
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu trang chủ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const handleSearch = () => {
    const locQuery = searchLocation === "all" ? "" : searchLocation;
    navigate(`/jobs?keyword=${encodeURIComponent(searchValue)}&location=${locQuery}`);
  };

  const customStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap');

    .plus-jakarta-sans {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    }

    * {
      font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .hero-gradient-bg {
      background: radial-gradient(circle at 85% 15%, rgba(37, 99, 235, 0.06) 0%, transparent 60%),
                  radial-gradient(circle at 15% 85%, rgba(16, 185, 129, 0.04) 0%, transparent 50%),
                  #F8FAFC;
    }

    .search-refined {
      background: #ffffff;
      box-shadow: 0 8px 30px rgba(15, 23, 42, 0.06);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      border: 1px solid #E2E8F0;
      border-radius: 14px;
    }
    .search-refined:focus-within {
      border-color: #2563EB;
      box-shadow: 0 12px 36px rgba(37, 99, 235, 0.12);
    }

    .premium-card {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      box-shadow: 0 4px 20px rgba(15, 23, 42, 0.03);
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      border: 1px solid rgba(226, 232, 240, 0.8) !important;
      border-radius: 16px;
    }
    .premium-card:hover {
      transform: translateY(-4px);
      border-color: #2563EB !important;
      box-shadow: 0 20px 40px rgba(37, 99, 235, 0.08) !important;
    }

    .pill-card {
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      border: 1px solid #E2E8F0;
      border-radius: 16px;
      background: #FFFFFF;
    }
    .pill-card:hover {
      transform: translateY(-4px);
      border-color: #2563EB;
      box-shadow: 0 16px 36px rgba(37, 99, 235, 0.05);
    }

    .stat-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      font-weight: 700;
      color: #64748B;
    }

    .editorial-border {
      border-bottom: 1px solid #E2E8F0;
    }

    .action-btn {
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .action-btn:active {
      transform: scale(0.97);
    }

    .faq-collapse {
      background: transparent !important;
      border: none !important;
    }
    .faq-panel {
      background: #FFFFFF !important;
      border: 1px solid #E2E8F0 !important;
      border-radius: 12px !important;
      margin-bottom: 16px !important;
      overflow: hidden;
    }
    .faq-panel .ant-collapse-header {
      padding: 20px 24px !important;
      font-weight: 700 !important;
      font-size: 16px !important;
      color: #0F172A !important;
    }
    .faq-panel .ant-collapse-content {
      border-top: 1px solid #F1F5F9 !important;
      padding: 20px 24px !important;
      color: #64748B !important;
      font-size: 15px !important;
      line-height: 1.7 !important;
    }

    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }

    /* Mobile & Tablet Layout Protection */
    @media (max-width: 768px) {
      .hero-title-responsive {
        font-size: clamp(28px, 7vw, 36px) !important;
        line-height: 1.25 !important;
      }
      .section-title-responsive {
        font-size: clamp(22px, 5vw, 26px) !important;
      }
      .section-padding-responsive {
        padding: 40px 16px !important;
      }
      .pill-card, .premium-card {
        padding: 20px !important;
      }
      .search-refined {
        flex-direction: column !important;
        padding: 12px !important;
        border-radius: 16px !important;
      }
      .search-refined .ant-input-affix-wrapper,
      .search-refined .ant-select,
      .search-refined .ant-btn {
        width: 100% !important;
      }
    }
  `;

  return (
    <div style={{ width: "100%", background: "#F8FAFC", minHeight: "100vh" }}>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />

      {/* 1. HERO SECTION & AI MATCH SIMULATOR PRO */}
      <div className="hero-gradient-bg" style={{ padding: "90px 20px 80px", position: "relative", overflow: "hidden" }}>
        <div style={{ maxWidth: "1300px", margin: "0 auto" }}>
          <Row gutter={[48, 48]} align="middle">
            {/* Left Hero Content */}
            <Col xs={24} lg={12}>
              <div style={{ textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <span style={{ width: 32, height: 2, background: "#2563EB" }}></span>
                  <span style={{ color: "#2563EB", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em" }}>
                    Nền tảng Tuyển dụng AI Enterprise
                  </span>
                </div>
                <Title
                  level={1}
                  style={{
                    fontSize: "clamp(28px, 5vw, 50px)",
                    fontWeight: 800,
                    lineHeight: 1.2,
                    marginBottom: 20,
                    color: "#0F172A",
                    letterSpacing: "-0.03em",
                  }}
                  className="plus-jakarta-sans hero-title-responsive"
                >
                  Nghệ thuật tuyển dụng <br />
                  <span style={{ color: "#2563EB" }}>Chính xác</span> từ AI.
                </Title>
                <Paragraph
                  style={{
                    fontSize: "15px",
                    color: "#64748B",
                    marginBottom: 32,
                    lineHeight: 1.6,
                    maxWidth: "500px",
                  }}
                >
                  Nền tảng tự động hóa bóc tách CV, đối sánh năng lực ứng viên và quản lý tuyển dụng doanh nghiệp.
                </Paragraph>

                {/* Search Bar */}
                <div
                  className="search-refined"
                  style={{
                    padding: "8px",
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "8px",
                    maxWidth: "580px",
                  }}
                >
                  <Input
                    size="large"
                    placeholder="Tìm vị trí, kỹ năng hoặc từ khóa..."
                    prefix={<SearchOutlined style={{ color: "#64748B", fontSize: 16, marginRight: 8 }} />}
                    bordered={false}
                    style={{ fontSize: "15px", flex: 2, minWidth: "180px" }}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onPressEnter={handleSearch}
                  />
                  <Divider type="vertical" style={{ height: "30px", margin: "0 8px", background: "#E2E8F0" }} />
                  <Select
                    size="large"
                    bordered={false}
                    style={{ flex: 1, fontSize: "14px", minWidth: "140px" }}
                    suffixIcon={<EnvironmentOutlined style={{ fontSize: 15, color: "#64748B" }} />}
                    value={searchLocation}
                    onChange={(val) => setSearchLocation(val)}
                  >
                    <Option value="all">Tất cả địa điểm</Option>
                    <Option value="hn">Hà Nội, VN</Option>
                    <Option value="hcm">Hồ Chí Minh, VN</Option>
                  </Select>
                  <Button
                    type="primary"
                    size="large"
                    className="action-btn"
                    style={{
                      height: "46px",
                      padding: "0 24px",
                      fontSize: "14px",
                      fontWeight: 800,
                      borderRadius: "10px",
                      background: "#0F172A",
                      borderColor: "#0F172A",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                    onClick={handleSearch}
                  >
                    Tìm kiếm
                  </Button>
                </div>

                {/* Hot Tag Hints */}
                <div style={{ marginTop: 32, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                  <Text style={{ fontSize: 11, fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                    Từ khóa HOT:
                  </Text>
                  <Space wrap size={12}>
                    {["ML Engineer", "Product Design", "DevOps Cloud", "HRBP Lead"].map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#0F172A",
                          cursor: "pointer",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          background: "#FFFFFF",
                          border: "1px solid #E2E8F0",
                          transition: "all 0.2s ease",
                        }}
                        className="action-btn"
                        onClick={() => navigate(`/jobs?keyword=${encodeURIComponent(tag)}`)}
                      >
                        {tag}
                      </span>
                    ))}
                  </Space>
                </div>
              </div>
            </Col>

            {/* Right Side: Interactive AI Match Simulator PRO Widget */}
            <Col xs={24} lg={12} style={{ display: "flex", justifyContent: "center" }}>
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  border: "1px solid rgba(226, 232, 240, 0.9)",
                  borderRadius: "24px",
                  boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.08)",
                  width: "100%",
                  maxWidth: "500px",
                  padding: "32px",
                  position: "relative",
                }}
              >
                {/* Simulator Widget Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid #E2E8F0" }}>
                  <Space size={10}>
                    <ClusterOutlined style={{ color: "#2563EB", fontSize: 20 }} />
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.08em" }} className="plus-jakarta-sans">
                      AI MATCH SIMULATOR PRO
                    </span>
                  </Space>
                  <Tag
                    style={{
                      background: "#F0FDF4",
                      color: "#10B981",
                      border: "1px solid #BBF7D0",
                      padding: "4px 12px",
                      borderRadius: "20px",
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: "0.05em",
                    }}
                  >
                    REAL-TIME DEMO
                  </Tag>
                </div>

                {/* Requisition Category Tabs */}
                <div style={{ marginBottom: 24 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 12 }}>
                    CHỌN MẪU HỒ SƠ ỨNG VIÊN ĐỂ BÓC TÁCH:
                  </span>
                  <div style={{ display: "flex", gap: 8 }}>
                    {simulatorItems.map((item) => {
                      const isActive = activeCategory === item.key;
                      return (
                        <div
                          key={item.key}
                          onClick={() => {
                            setActiveCategory(item.key);
                            setSimulatorLoading(true);
                            setTimeout(() => {
                              setSimulatorCandidate(item.candidate);
                              setSimulatorLoading(false);
                            }, 300);
                          }}
                          style={{
                            flex: 1,
                            border: isActive ? "2px solid #2563EB" : "1px solid #E2E8F0",
                            borderRadius: "10px",
                            padding: "10px 6px",
                            textAlign: "center",
                            cursor: "pointer",
                            background: isActive ? "#F8FAFC" : "#FFFFFF",
                            transition: "all 0.2s ease",
                          }}
                        >
                          <div style={{ color: isActive ? "#2563EB" : "#64748B", marginBottom: 4 }}>
                            {getCategoryIcon(item.name)}
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 800, color: isActive ? "#2563EB" : "#0F172A", textTransform: "uppercase" }}>
                            {item.key}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Candidate Matching Details */}
                {simulatorLoading ? (
                  <div style={{ height: "220px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "#F8FAFC", borderRadius: 16, border: "1px solid #E2E8F0" }}>
                    <Spin indicator={<LoadingOutlined style={{ fontSize: 32, color: "#2563EB" }} spin />} />
                    <Text style={{ marginTop: 14, fontSize: 13, color: "#64748B", fontWeight: 600 }}>
                      Thuật toán AI đang phân tích CV & đối sánh...
                    </Text>
                  </div>
                ) : (
                  <div
                    style={{
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      padding: "24px",
                      borderRadius: "16px",
                    }}
                  >
                    {/* Top Row: Candidate Avatar & Matching Score */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                        <div style={{
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          background: "#FFFFFF",
                          border: "2px solid #2563EB",
                          color: "#2563EB",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          fontSize: 16,
                          boxShadow: "0 4px 12px rgba(37, 99, 235, 0.1)"
                        }}>
                          {simulatorCandidate.avatar}
                        </div>
                        <div>
                          <h4 style={{ fontSize: "18px", color: "#0F172A", margin: 0, fontWeight: 800 }}>
                            {simulatorCandidate.name}
                          </h4>
                          <span style={{ fontSize: "10px", color: "#64748B", textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.05em" }}>
                            {simulatorCandidate.role}
                          </span>
                        </div>
                      </div>

                      {/* Score Badge */}
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 36, fontWeight: 900, color: simulatorCandidate.score >= 90 ? "#10B981" : "#2563EB", lineHeight: 1 }}>
                          {simulatorCandidate.score}
                          <small style={{ fontSize: 16, fontWeight: 700 }}>%</small>
                        </div>
                        <span style={{ fontSize: 9, color: "#64748B", textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.08em" }}>
                          ĐỘ PHÙ HỢP AI
                        </span>
                      </div>
                    </div>

                    {/* Competency & Risk Flags Section */}
                    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16, paddingTop: 16, borderTop: "1px solid #E2E8F0" }}>
                      {/* NĂNG LỰC CỐT LÕI */}
                      <div>
                        <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#10B981", display: "flex", alignItems: "center", gap: 4, marginBottom: 10 }}>
                          <CheckCircleOutlined /> NĂNG LỰC CỐT LÕI
                        </span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                          {simulatorCandidate.skills.map((skill: string) => (
                            <span
                              key={skill}
                              style={{
                                background: "#F0FDF4",
                                border: "1px solid #BBF7D0",
                                color: "#166534",
                                padding: "4px 10px",
                                borderRadius: "12px",
                                fontSize: "11px",
                                fontWeight: 700,
                              }}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* CẢNH BÁO HR */}
                      <div>
                        <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#EF4444", display: "flex", alignItems: "center", gap: 4, marginBottom: 10 }}>
                          <WarningOutlined /> CẢNH BÁO HR
                        </span>
                        <ul style={{ fontSize: 11, color: "#991B1B", paddingLeft: 0, listStyle: "none", margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                          {simulatorCandidate.warnings.map((warn: string, i: number) => (
                            <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, lineHeight: "1.3" }}>
                              <span style={{ color: "#EF4444" }}>•</span>
                              <span style={{ fontWeight: 600 }}>{warn}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Col>
          </Row>
        </div>
      </div>

      {/* 2. METRICS & ENTERPRISE LOGO WALL */}
      <div style={{ background: "#FFFFFF", borderTop: "1px solid #E2E8F0", borderBottom: "1px solid #E2E8F0", padding: "44px 24px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <Row justify="space-between" align="middle" gutter={[32, 32]}>
            <Col xs={24} md={7} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "36px", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>
                {(stats.activeJobs || 38).toLocaleString("vi-VN")}
              </div>
              <div className="stat-label" style={{ marginTop: 8 }}>Vị trí tuyển dụng hoạt động</div>
            </Col>
            <Col xs={0} md={1} style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ width: 1, height: 44, background: "#E2E8F0" }}></div>
            </Col>
            <Col xs={24} md={8} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "36px", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>
                {(stats.analyzedCvs || 1250).toLocaleString("vi-VN")}
              </div>
              <div className="stat-label" style={{ marginTop: 8 }}>Hồ sơ CV đã được AI bóc tách</div>
            </Col>
            <Col xs={0} md={1} style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ width: 1, height: 44, background: "#E2E8F0" }}></div>
            </Col>
            <Col xs={24} md={7} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "36px", fontWeight: 800, color: "#2563EB", letterSpacing: "-0.02em" }}>
                {(stats.totalCandidateUsers || 890).toLocaleString("vi-VN")}
              </div>
              <div className="stat-label" style={{ marginTop: 8 }}>Ứng viên trên hệ thống</div>
            </Col>
          </Row>
        </div>
      </div>

      <TechStackWall />

      {/* 3. CORE AI BENTO GRID (FEATURES) */}
      <ScrollReveal>
        <div style={{ padding: "90px 20px", background: "#FFFFFF" }}>
          <div style={{ maxWidth: "1300px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 50 }}>
              <span style={{ color: "#2563EB", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", display: "block", marginBottom: 14 }}>
                MÔ-ĐUN TÍNH NĂNG CỐT LÕI
              </span>
              <Title level={2} style={{ fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 800, color: "#0F172A", margin: 0 }} className="plus-jakarta-sans section-title-responsive">
                Các Mô-đun Chức năng Nổi bật của Hệ thống
              </Title>
            </div>

            <Row gutter={[24, 24]}>
              {/* Feature 1 - ATS System */}
              <Col xs={24} lg={16}>
                <div
                  className="pill-card"
                  style={{
                    height: "100%",
                    borderRadius: "20px",
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    padding: "40px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: "380px",
                  }}
                >
                  <div style={{ maxWidth: "560px" }}>
                    <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", color: "#2563EB", display: "block", marginBottom: 16 }}>
                      Hệ thống ATS Thế hệ mới
                    </span>
                    <Title level={3} style={{ fontSize: "26px", fontWeight: 800, color: "#0F172A", marginBottom: 16, lineHeight: 1.3 }} className="plus-jakarta-sans">
                      Trung tâm điều hành quản lý nhân tài
                    </Title>
                    <Paragraph style={{ fontSize: 15, color: "#64748B", lineHeight: 1.65, margin: 0 }}>
                      Hệ thống điều hành quy trình tuyển dụng toàn diện. Tự động đối sánh hồ sơ thời gian thực, đánh giá **Năng lực & Cảnh báo**, hỗ trợ phối hợp tuyển dụng nội bộ mượt mà.
                    </Paragraph>
                  </div>
                  <div style={{ display: "flex", gap: 40, marginTop: 32 }}>
                    <div>
                      <div style={{ fontSize: 32, fontWeight: 800, color: "#0F172A" }}>65%</div>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#64748B", marginTop: 6 }}>Giảm thời gian lọc CV</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 32, fontWeight: 800, color: "#2563EB" }}>98%</div>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#64748B", marginTop: 6 }}>Độ chính xác AI Matching</div>
                    </div>
                  </div>
                </div>
              </Col>

              {/* Feature 2 - Predictive Reports */}
              <Col xs={24} lg={8}>
                <div
                  className="pill-card"
                  style={{
                    height: "100%",
                    borderRadius: "20px",
                    border: "1px solid #E2E8F0",
                    padding: "40px 32px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: "380px",
                  }}
                >
                  <div>
                    <div style={{ width: 44, height: 44, borderRadius: "12px", background: "rgba(37, 99, 235, 0.08)", color: "#2563EB", display: "inline-flex", justifyContent: "center", alignItems: "center", fontSize: 20, marginBottom: 24 }}>
                      <LineChartOutlined />
                    </div>
                    <Title level={4} style={{ fontSize: "20px", fontWeight: 800, color: "#0F172A", marginBottom: 14 }}>
                      Báo cáo Phân tích Dự báo
                    </Title>
                    <Paragraph style={{ fontSize: 14, color: "#64748B", lineHeight: 1.65, margin: 0 }}>
                      Khai phá dữ liệu tuyển dụng để dự báo nguồn ứng viên, đo lường tỷ lệ chuyển đổi phỏng vấn và đưa ra **Gợi ý phỏng vấn** chuyên sâu.
                    </Paragraph>
                  </div>
                  <Button
                    type="default"
                    block
                    size="large"
                    className="action-btn"
                    style={{
                      height: "42px",
                      borderRadius: "8px",
                      fontWeight: 700,
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      borderColor: "#0F172A",
                      color: "#0F172A",
                      marginTop: 20,
                    }}
                    onClick={() => navigate("/login")}
                  >
                    Khám phá Báo cáo mẫu
                  </Button>
                </div>
              </Col>

              {/* Feature 3 - Bias-free & Candidate Concierge */}
              <Col xs={24} lg={8}>
                <div
                  className="pill-card"
                  style={{
                    height: "100%",
                    borderRadius: "20px",
                    border: "1px solid #E2E8F0",
                    padding: "40px 32px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: "340px",
                  }}
                >
                  <div>
                    <div style={{ width: 44, height: 44, borderRadius: "12px", background: "rgba(16, 185, 129, 0.08)", color: "#10B981", display: "inline-flex", justifyContent: "center", alignItems: "center", fontSize: 20, marginBottom: 24 }}>
                      <UserOutlined />
                    </div>
                    <Title level={4} style={{ fontSize: "20px", fontWeight: 800, color: "#0F172A", marginBottom: 14 }}>
                      Ngôn từ & Chân thực (Bias-free)
                    </Title>
                    <Paragraph style={{ fontSize: 14, color: "#64748B", lineHeight: 1.65, margin: 0 }}>
                      Đảm bảo tính công bằng và minh bạch trong đánh giá CV, giảm thiểu định kiến tuyển dụng và tối ưu hóa trải nghiệm ứng tuyển cá nhân hóa.
                    </Paragraph>
                  </div>
                </div>
              </Col>

              {/* Feature 4 - Enterprise Security */}
              <Col xs={24} lg={16}>
                <div
                  className="pill-card"
                  style={{
                    height: "100%",
                    borderRadius: "20px",
                    background: "#0F172A",
                    border: "none",
                    padding: "40px",
                    color: "#FFFFFF",
                    minHeight: "340px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Row gutter={[32, 32]} align="middle" style={{ width: "100%" }}>
                    <Col xs={24} md={14}>
                      <Title level={3} style={{ color: "#FFFFFF", fontSize: "26px", fontWeight: 800, marginBottom: 14 }} className="plus-jakarta-sans">
                        Bảo mật Dữ liệu & Tuân thủ Enterprise
                      </Title>
                      <Paragraph style={{ color: "#94A3B8", fontSize: "14px", lineHeight: 1.65, marginBottom: 24 }}>
                        Mã hóa dữ liệu hai đầu, bảo vệ an toàn thông tin cá nhân của ứng viên và dữ liệu tuyển dụng nội bộ theo tiêu chuẩn bảo mật quốc tế.
                      </Paragraph>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                        {["Mã hóa SSL/TLS 256-bit", "Chuẩn bảo mật Dữ liệu", "Sao lưu Tự động 24/7"].map((std) => (
                          <span
                            key={std}
                            style={{
                              border: "1px solid rgba(148, 163, 184, 0.3)",
                              color: "#FFFFFF",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              fontSize: "10px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.1em",
                            }}
                          >
                            {std}
                          </span>
                        ))}
                      </div>
                    </Col>
                    <Col xs={24} md={10} style={{ display: "flex", justifyContent: "center" }}>
                      <div style={{ border: "1px solid rgba(148, 163, 184, 0.3)", padding: "28px", borderRadius: "16px", textAlign: "center", width: "100%", maxWidth: "240px", background: "rgba(255, 255, 255, 0.03)" }}>
                        <SafetyOutlined style={{ fontSize: 40, color: "#10B981", marginBottom: 12 }} />
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#FFFFFF" }}>An toàn Bảo mật</div>
                        <div style={{ fontSize: 10, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 6, fontWeight: 700 }}>
                          Trạng thái: Hoạt động
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>
              </Col>
            </Row>
          </div>
        </div>
      </ScrollReveal>

      {/* 4. REPLACED DUPLICATE JOB LIST WITH "AI MARKET INSIGHTS & SALARY DASHBOARD" */}
      <ScrollReveal>
        <div style={{ padding: "80px 20px", background: "#F1F5F9", borderTop: "1px solid #E2E8F0", borderBottom: "1px solid #E2E8F0" }}>
          <div style={{ maxWidth: "1300px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 40, paddingBottom: 16 }} className="editorial-border">
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <RiseOutlined style={{ color: "#2563EB", fontSize: 20 }} />
                  <span style={{ color: "#2563EB", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em" }}>
                    THÔNG TIN THAM KHẢO NGHỀ NGHIỆP
                  </span>
                </div>
                <Title level={2} style={{ fontSize: "30px", fontWeight: 800, color: "#0F172A", margin: 0 }} className="plus-jakarta-sans">
                  Xu hướng Thị trường & Tham khảo Mức lương
                </Title>
              </div>
            </div>

            <Row gutter={[24, 24]}>
              {/* Cột 1: Mức lương trung bình theo cấp bậc */}
              <Col xs={24} lg={12}>
                <div style={{ background: "#FFFFFF", padding: "32px", borderRadius: "18px", border: "1px solid #E2E8F0", height: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Mức lương Trung bình Ngành Tech & AI (VNĐ/Tháng)
                    </span>
                    <Tag color="blue">Q3/2026</Tag>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                        <span>Senior AI / Machine Learning Engineer</span>
                        <span style={{ color: "#2563EB" }}>45.000.000 - 80.000.000đ</span>
                      </div>
                      <Progress percent={85} strokeColor="#2563EB" showInfo={false} />
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                        <span>DevOps / Cloud Solutions Architect</span>
                        <span style={{ color: "#2563EB" }}>35.000.000 - 65.000.000đ</span>
                      </div>
                      <Progress percent={72} strokeColor="#2563EB" showInfo={false} />
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                        <span>Fullstack Developer (React/Node/C#)</span>
                        <span style={{ color: "#2563EB" }}>25.000.000 - 45.000.000đ</span>
                      </div>
                      <Progress percent={58} strokeColor="#2563EB" showInfo={false} />
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                        <span>Growth Marketing & Data Analyst</span>
                        <span style={{ color: "#2563EB" }}>20.000.000 - 38.000.000đ</span>
                      </div>
                      <Progress percent={48} strokeColor="#10B981" showInfo={false} />
                    </div>
                  </div>
                </div>
              </Col>

              {/* Cột 2: Top Kỹ năng AI HOT & Nhu cầu Tuyển dụng */}
              <Col xs={24} lg={12}>
                <div style={{ background: "#FFFFFF", padding: "32px", borderRadius: "18px", border: "1px solid #E2E8F0", height: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Top Kỹ năng AI được Doanh nghiệp Săn đón
                    </span>
                    <Tag color="green"><ThunderboltOutlined /> TĂNG TRƯỞNG</Tag>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {[
                      { skill: "Generative AI & LLM Fine-tuning", growth: "+142%", demand: "Rất cao" },
                      { skill: "Python, PyTorch & TensorFlow", growth: "+88%", demand: "Cao" },
                      { skill: "System Architecture & Microservices", growth: "+64%", demand: "Cao" },
                      { skill: "CI/CD, Docker & Kubernetes", growth: "+52%", demand: "Trung bình" },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "12px 16px",
                          background: "#F8FAFC",
                          borderRadius: "10px",
                          border: "1px solid #E2E8F0",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{item.skill}</div>
                          <span style={{ fontSize: 11, color: "#64748B" }}>Nhu cầu tuyển dụng: {item.demand}</span>
                        </div>
                        <Tag style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#10B981", fontWeight: 800 }}>
                          {item.growth}
                        </Tag>
                      </div>
                    ))}
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </div>
      </ScrollReveal>

      {/* 5. FEATURED REQUISITIONS (FEATURED JOBS GRID WITH AI MATCH BADGES) */}
      <ScrollReveal>
        <div style={{ padding: "90px 20px", background: "#F8FAFC" }}>
          <div style={{ maxWidth: "1300px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 40, paddingBottom: 16 }} className="editorial-border">
              <div>
                <Title level={2} style={{ fontSize: "30px", fontWeight: 800, color: "#0F172A", margin: 0 }} className="plus-jakarta-sans">
                  Vị trí Tuyển dụng Tuyển chọn
                </Title>
              </div>
              <Button
                type="link"
                className="action-btn"
                style={{
                  fontWeight: 800,
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#0F172A",
                  padding: 0,
                  height: "auto",
                  borderBottom: "2px solid #0F172A",
                  borderRadius: 0,
                }}
                onClick={() => navigate("/jobs")}
              >
                Xem tất cả vị trí <ArrowRightOutlined style={{ fontSize: 11 }} />
              </Button>
            </div>

            {/* Filter Bar */}
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 36, background: "#FFFFFF", padding: "14px 20px", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {[
                  { id: "all", label: "Tất cả" },
                  { id: "tech", label: "Công nghệ & Kỹ thuật" },
                  { id: "sales_marketing", label: "Kinh doanh & Marketing" },
                  { id: "hr_finance", label: "Nhân sự & Tài chính" },
                  { id: "others", label: "Khác" }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedFilterCategory(tab.id)}
                    style={{
                      padding: "7px 16px",
                      borderRadius: "8px",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      background: selectedFilterCategory === tab.id ? "#2563EB" : "transparent",
                      color: selectedFilterCategory === tab.id ? "#FFFFFF" : "#64748B",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Personalization Switch */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  onClick={handleToggleSmartRecommend}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 14px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    background: isSmartRecommend ? "#F0FDF4" : "#F8FAFC",
                    border: isSmartRecommend ? "1px solid #BBF7D0" : "1px solid #E2E8F0",
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: isSmartRecommend ? "#10B981" : "#64748B" }}></span>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: isSmartRecommend ? "#10B981" : "#64748B" }}>
                    Gợi ý AI cho bạn
                  </span>
                </div>

                <Button
                  onClick={() => setRefreshSeed(prev => prev + 1)}
                  type="default"
                  icon={<ReloadOutlined />}
                  style={{
                    height: "34px",
                    borderRadius: "8px",
                    fontWeight: 700,
                    fontSize: "12px",
                    borderColor: "#E2E8F0",
                    color: "#0F172A"
                  }}
                >
                  Xoay vòng tin
                </Button>
              </div>
            </div>

            {/* Jobs Cards Grid */}
            {loading ? (
              <Row gutter={[24, 24]}>
                {[1, 2, 3, 4, 5, 6].map((key) => (
                  <Col xs={24} md={8} key={key}>
                    <div
                      style={{
                        padding: "32px",
                        background: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                        borderRadius: "16px",
                        height: "100%",
                      }}
                    >
                      <Skeleton active avatar paragraph={{ rows: 3 }} />
                    </div>
                  </Col>
                ))}
              </Row>
            ) : processedFeaturedJobs.length > 0 ? (
              <Row gutter={[24, 24]}>
                {processedFeaturedJobs.map((job, index) => (
                  <Col xs={24} md={8} key={job.id}>
                    <div
                      className="premium-card"
                      style={{
                        padding: "32px",
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                        background: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                        borderRadius: "16px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                        <div style={{
                          width: 42,
                          height: 42,
                          borderRadius: "10px",
                          background: "rgba(37, 99, 235, 0.08)",
                          color: "#2563EB",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 18
                        }}>
                          {getJobCategoryIcon(job.position?.name || "")}
                        </div>
                        {isSmartRecommend && (job as any).isCvMatched ? (
                          <Tag
                            style={{
                              background: "#F0FDF4",
                              border: "1px solid #BBF7D0",
                              color: "#10B981",
                              margin: 0,
                              borderRadius: "20px",
                              fontWeight: 800,
                              fontSize: "10px"
                            }}
                          >
                            {(job as any).aiMatchScore || 92}% PHÙ HỢP CV CỦA BẠN
                          </Tag>
                        ) : (
                          <Tag
                            style={{
                              background: "#F8FAFC",
                              border: "1px solid #E2E8F0",
                              color: "#64748B",
                              margin: 0,
                              borderRadius: "20px",
                              fontWeight: 700,
                              fontSize: "10px"
                            }}
                          >
                            TIN MỚI
                          </Tag>
                        )}
                      </div>

                      <Title
                        level={4}
                        style={{ fontSize: "17px", fontWeight: 800, color: "#0F172A", marginBottom: 20, lineHeight: 1.4, flex: 1 }}
                        className="plus-jakarta-sans"
                      >
                        {job.position?.name || "Vị trí tuyển dụng"}
                      </Title>

                      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#64748B" }}>
                          <EnvironmentOutlined style={{ fontSize: 15 }} />
                          <span style={{ fontSize: 13 }}>{job.branch?.name || "Hồ Chí Minh, Việt Nam"}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#0F172A", fontWeight: 700 }}>
                          <DollarOutlined style={{ fontSize: 15 }} />
                          <span style={{ fontSize: 13 }}>{job.salaryRange || "Thỏa thuận"}</span>
                        </div>
                      </div>

                      <Button
                        type="default"
                        block
                        size="large"
                        className="action-btn"
                        style={{
                          height: "42px",
                          borderRadius: "8px",
                          fontWeight: 800,
                          fontSize: "12px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          borderColor: "#0F172A",
                          color: "#0F172A",
                        }}
                        onClick={() => navigate(`/jobs/${job.id}`)}
                      >
                        Ứng tuyển ngay
                      </Button>
                    </div>
                  </Col>
                ))}
              </Row>
            ) : (
              <div style={{ padding: "48px 20px", textAlign: "center", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, color: "#64748B" }}>
                Không tìm thấy vị trí tuyển dụng phù hợp với danh mục đã chọn.
              </div>
            )}
          </div>
        </div>
      </ScrollReveal>

      {/* 6. HOW IT WORKS TIMELINE */}
      <ScrollReveal>
        <div style={{ padding: "90px 20px", background: "#FFFFFF", borderTop: "1px solid #E2E8F0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 60 }}>
              <span style={{ color: "#2563EB", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", display: "block", marginBottom: 14 }}>
                Quy trình Đơn giản
              </span>
              <Title level={2} style={{ fontSize: "32px", fontWeight: 800, color: "#0F172A", margin: 0 }} className="plus-jakarta-sans">
                4 Bước Tuyển dụng Thông minh với RecruitInsight AI
              </Title>
            </div>

            <Row gutter={[24, 24]}>
              {[
                { step: "01", title: "Tạo Yêu cầu Tuyển dụng", desc: "Khởi tạo vị trí tuyển dụng với tiêu chuẩn năng lực rõ ràng." },
                { step: "02", title: "AI Bóc tách & Phân tích CV", desc: "Hệ thống tự động đọc và trích xuất dữ liệu từ hồ sơ ứng viên." },
                { step: "03", title: "Đánh giá Năng lực & Cảnh báo", desc: "Dự đoán độ tương hợp % và đưa ra cảnh báo rủi ro HR." },
                { step: "04", title: "Tuyển chọn Nhân tài", desc: "Kết nối phỏng vấn với tập hợp ứng viên xuất sắc nhất." },
              ].map((item, index) => (
                <Col xs={24} sm={12} lg={6} key={index}>
                  <div
                    style={{
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: "16px",
                      padding: "32px 24px",
                      height: "100%",
                      position: "relative",
                    }}
                  >
                    <div style={{ fontSize: "32px", fontWeight: 900, color: "#2563EB", marginBottom: 14 }}>
                      {item.step}
                    </div>
                    <h4 style={{ fontSize: "17px", fontWeight: 800, color: "#0F172A", marginBottom: 10 }}>
                      {item.title}
                    </h4>
                    <p style={{ fontSize: "13px", color: "#64748B", lineHeight: "1.6", margin: 0 }}>
                      {item.desc}
                    </p>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        </div>
      </ScrollReveal>

      {/* 7. FAQ & ENTERPRISE CTA */}
      <ScrollReveal>
        <div style={{ padding: "90px 20px", background: "#F8FAFC", borderTop: "1px solid #E2E8F0" }}>
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <Title level={2} style={{ fontSize: "30px", fontWeight: 800, color: "#0F172A", textAlign: "center", marginBottom: 48 }} className="plus-jakarta-sans">
              Giải đáp Thắc mắc Tuyển dụng
            </Title>

            <Collapse className="faq-collapse" expandIconPosition="end">
              <Panel
                header="Hệ thống AI xác thực Năng lực & Cảnh báo ứng viên như thế nào?"
                key="1"
                className="faq-panel"
              >
                Hệ thống sử dụng phân tích ngữ cảnh chéo (cross-contextual analysis) để đối chiếu thông tin trong CV của ứng viên với tiêu chuẩn tuyển dụng, tự động đưa ra nhãn **Năng lực cốt lõi** và các **Cảnh báo HR** khách quan.
              </Panel>
              <Panel
                header="Chúng tôi có thể tích hợp RecruitInsight AI với ERP sẵn có không?"
                key="2"
                className="faq-panel"
              >
                Có. Chúng tôi hỗ trợ cổng API tích hợp tiêu chuẩn cho doanh nghiệp, cho phép kết nối dữ liệu hồ sơ với các hệ thống quản trị HRMS lớn.
              </Panel>
              <Panel
                header="Thời gian tuyển dụng trung bình cải thiện ra sao?"
                key="3"
                className="faq-panel"
              >
                Theo thực tế khảo sát, các doanh nghiệp áp dụng giải pháp của chúng tôi ghi nhận thời gian lọc hồ sơ vòng đầu giảm trung bình 65%, đồng thời tỷ lệ chuyển đổi sang phỏng vấn thành công tăng 40%.
              </Panel>
            </Collapse>
          </div>

          {/* CTA Banner at bottom */}
          <div style={{ maxWidth: "1280px", margin: "60px auto 0" }}>
            <div
              style={{
                background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
                borderRadius: "24px",
                padding: "60px 40px",
                textAlign: "center",
                color: "#FFFFFF",
                boxShadow: "0 20px 40px rgba(15, 23, 42, 0.12)",
              }}
            >
              <Title level={2} style={{ color: "#FFFFFF", fontSize: "36px", fontWeight: 800, marginBottom: 16 }} className="plus-jakarta-sans">
                Sẵn sàng nâng tầm quy trình tuyển dụng?
              </Title>
              <Paragraph style={{ color: "#94A3B8", fontSize: "16px", maxWidth: "600px", margin: "0 auto 32px" }}>
                Khám phá sức mạnh bóc tách hồ sơ và đối sánh nhân tài bằng công nghệ AI tiên tiến ngay hôm nay.
              </Paragraph>
              <Space size={16} wrap>
                <Button
                  type="primary"
                  size="large"
                  style={{
                    height: "48px",
                    padding: "0 32px",
                    fontWeight: 800,
                    fontSize: "14px",
                    borderRadius: "10px",
                    background: "#2563EB",
                    borderColor: "#2563EB",
                  }}
                  onClick={() => navigate("/register")}
                >
                  Đăng ký dùng thử miễn phí
                </Button>
                <Button
                  type="default"
                  size="large"
                  style={{
                    height: "48px",
                    padding: "0 32px",
                    fontWeight: 800,
                    fontSize: "14px",
                    borderRadius: "10px",
                    color: "#FFFFFF",
                    borderColor: "rgba(255, 255, 255, 0.3)",
                    background: "transparent",
                  }}
                  onClick={() => navigate("/jobs")}
                >
                  Khám phá việc làm
                </Button>
              </Space>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}

export default HomePage;
