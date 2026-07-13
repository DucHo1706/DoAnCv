import { useEffect, useState, useRef, useMemo } from "react";
import { Button, Col, Row, Typography, Space, Input, Tag, Spin, Select, Divider, Collapse } from "antd";
import {
  SearchOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  LineChartOutlined,
  SafetyOutlined,
  ArrowRightOutlined,
  LoadingOutlined,
  UnlockOutlined,
  ClusterOutlined,
  CodeOutlined,
  BarChartOutlined,
  BankOutlined,
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
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { jobService } from "../../services/jobService";
import axiosClient from "../../services/axiosClient";
import type { JobDto } from "../../services/jobService";

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

// Logo wall data
const LogoWall = () => (
  <div style={{ padding: "60px 20px", background: "#FFFFFF", borderBottom: "1px solid #E2E8F0" }}>
    <div style={{ maxWidth: "1280px", margin: "0 auto", textAlign: "center" }}>
      <Text type="secondary" style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.18em", fontWeight: 700, color: "#64748B", display: "block", marginBottom: "40px" }}>
        Được tin dùng bởi các doanh nghiệp công nghệ & tuyển dụng hàng đầu
      </Text>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flexWrap: "wrap", gap: "60px", opacity: 0.6 }}>
        {/* Google */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#0F172A"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#0F172A"/>
            <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.08H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.92l2.85-2.22-.03-.6z" fill="#0F172A"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.08l3.66 2.84c.87-2.6 3.3-4.54 6.16-4.54z" fill="#0F172A"/>
          </svg>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.03em", color: "#0F172A" }}>Google</span>
        </div>
        {/* Stripe */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.05em", color: "#0F172A", fontStyle: "italic" }}>stripe</span>
        </div>
        {/* Vercel */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="20" height="18" viewBox="0 0 116 100" fill="#0F172A">
            <path d="M57.5 0L115 100H0L57.5 0Z" />
          </svg>
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "0.15em", color: "#0F172A" }}>VERCEL</span>
        </div>
        {/* Slack */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em", color: "#0F172A" }}>slack</span>
        </div>
        {/* Airbnb */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "#0F172A" }}>airbnb</span>
        </div>
        {/* Figma */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="16" height="24" viewBox="0 0 16 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 12c-2.21 0-4-1.79-4-4s1.79-4 4-4h4v8H4z" fill="#0F172A"/>
            <path d="M12 4c2.21 0 4 1.79 4 4s-1.79 4-4 4H8V4h4z" fill="#0F172A"/>
            <path d="M12 12c2.21 0 4 1.79 4 4s-1.79 4-4 4h-4v-8h4z" fill="#0F172A"/>
            <path d="M4 20c-2.21 0-4-1.79-4-4s1.79-4 4-4h4v4c0 2.21-1.79 4-4 4z" fill="#0F172A"/>
            <circle cx="12" cy="20" r="4" fill="#0F172A"/>
          </svg>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#0F172A" }}>Figma</span>
        </div>
      </div>
    </div>
  </div>
);

const SIMULATOR_CANDIDATES = {
  tech: {
    name: "Phạm Minh Hoàng",
    role: "MACHINE LEARNING ENGINEER",
    score: 95,
    avatar: "MH",
    skills: ["Python", "PyTorch"],
    warnings: [
      "No Cloud Exp",
      "Short-term",
    ],
  },
  marketing: {
    name: "Lê Thu Thủy",
    role: "GROWTH MARKETING SPECIALIST",
    score: 88,
    avatar: "TT",
    skills: ["Google Ads", "SEO/SEM", "Content Strategy"],
    warnings: [
      "High salary expectations",
      "Frequent job hopping in 2 years",
    ],
  },
  corp: {
    name: "Nguyễn Văn Hùng",
    role: "HR BUSINESS PARTNER (HRBP)",
    score: 91,
    avatar: "VH",
    skills: ["Tuyển dụng", "SHRM Certified", "Luật lao động"],
    warnings: [
      "No large system experience",
      "Lacks deep IT skills",
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
  const [trendingJobs, setTrendingJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [searchLocation, setSearchLocation] = useState("all");

  const [stats, setStats] = useState<any>({
    activeJobs: 0,
    analyzedCvs: 0,
    totalCandidateUsers: 0,
  });

  // Simulator State
  const [activeCategory, setActiveCategory] = useState<string>("tech");
  const [simulatorLoading, setSimulatorLoading] = useState(false);
  const [simulatorCandidate, setSimulatorCandidate] = useState<any>(SIMULATOR_CANDIDATES.tech);
  const [simulatorItems, setSimulatorItems] = useState<any[]>([]);

  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes("công nghệ") || name.includes("tech") || name.includes("it") || name.includes("phần mềm") || name.includes("lập trình")) {
      return <CodeOutlined style={{ fontSize: 20 }} />;
    }
    if (name.includes("marketing") || name.includes("quảng cáo") || name.includes("seo") || name.includes("truyền thông")) {
      return <BarChartOutlined style={{ fontSize: 20 }} />;
    }
    if (name.includes("tài chính") || name.includes("kế toán") || name.includes("corp") || name.includes("doanh nghiệp") || name.includes("luật")) {
      return <BankOutlined style={{ fontSize: 20 }} />;
    }
    if (name.includes("kinh doanh") || name.includes("sales") || name.includes("bán hàng")) {
      return <DollarOutlined style={{ fontSize: 20 }} />;
    }
    if (name.includes("thiết kế") || name.includes("design") || name.includes("ux/ui")) {
      return <FormatPainterOutlined style={{ fontSize: 20 }} />;
    }
    if (name.includes("nhân sự") || name.includes("hr")) {
      return <TeamOutlined style={{ fontSize: 20 }} />;
    }
    return <AppstoreOutlined style={{ fontSize: 20 }} />;
  };

  // Rotating & Personalized Featured Jobs States
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>("all");
  const [isSmartRecommend, setIsSmartRecommend] = useState<boolean>(false);
  const [refreshSeed, setRefreshSeed] = useState<number>(0);

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
            title.includes("kỹ sư điện") ||
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
          const isTech = (
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
            title.includes("kỹ sư điện") ||
            title.includes("iot")
          );
          const isSalesMarketing = (
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
          const isHrFinance = (
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
          return !isTech && !isSalesMarketing && !isHrFinance;
        }
        return true;
      });
    }

    // 2. Apply smart recommendation personalization
    if (isSmartRecommend) {
      list = list.filter((job) => {
        const title = (job.position?.name || "").toLowerCase();
        return (
          title.includes("machine") ||
          title.includes("học máy") ||
          title.includes("ai") ||
          title.includes("python") ||
          title.includes("devops") ||
          title.includes("cloud") ||
          title.includes("design") ||
          title.includes("frontend") ||
          title.includes("react")
        );
      });
      list.sort((a, b) => {
        const nameA = (a.position?.name || "").toLowerCase();
        const nameB = (b.position?.name || "").toLowerCase();
        const scoreA = nameA.includes("ai") || nameA.includes("machine") ? 2 : 1;
        const scoreB = nameB.includes("ai") || nameB.includes("machine") ? 2 : 1;
        return scoreB - scoreA;
      });
    }

    // 3. Shuffle / rotate logic using refreshSeed
    if (list.length > 6) {
      const startIndex = (refreshSeed * 3) % list.length;
      const rotatedList = [...list.slice(startIndex), ...list.slice(0, startIndex)];
      return rotatedList.slice(0, 6);
    }

    return list.slice(0, 6);
  }, [allJobsCombined, selectedFilterCategory, isSmartRecommend, refreshSeed]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const [jobsData, trendingData, statsData, simulatorData] = await Promise.all([
          jobService.getJobs(),
          axiosClient.get("/Jobs/trending?limit=6").catch(() => ({ data: [] })),
          axiosClient.get("/Dashboard/admin-stats").catch(() => ({
            data: {
              quickMetrics: { totalUsers: 0, activeJobs: 0, analyzedCvs: 0, totalCandidateUsers: 0 },
            },
          })),
          axiosClient.get("/Dashboard/simulator-candidates").catch(() => ({ data: { isSuccess: false, data: [] } })),
        ]);

        const jobsArray = Array.isArray(jobsData) ? jobsData : (jobsData as any)?.$values || [];
        setRecentJobs(jobsArray.slice(0, 6));
        setTrendingJobs(trendingData.data?.$values || trendingData.data || []);

        if (statsData?.data?.quickMetrics) {
          setStats(statsData.data.quickMetrics);
        }

        const simList = simulatorData?.data?.data || [];
        if (simulatorData?.data?.isSuccess && Array.isArray(simList) && simList.length > 0) {
          const items = simList.map((item: any) => ({
            key: item.categoryKey,
            name: item.categoryName,
            candidate: item.candidate
          }));
          setSimulatorItems(items);
          setActiveCategory(items[0].key);
          setSimulatorCandidate(items[0].candidate);
        } else {
          const mockItems = [
            { key: "tech", name: "TECH", candidate: SIMULATOR_CANDIDATES.tech },
            { key: "marketing", name: "MARKETING", candidate: SIMULATOR_CANDIDATES.marketing },
            { key: "corp", name: "CORP", candidate: SIMULATOR_CANDIDATES.corp }
          ];
          setSimulatorItems(mockItems);
          setActiveCategory("tech");
          setSimulatorCandidate(SIMULATOR_CANDIDATES.tech);
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu trang chủ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  // getCategoryIcon helper is currently not in use.

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
      background: radial-gradient(circle at 80% 20%, rgba(37, 99, 235, 0.05) 0%, transparent 50%),
                  radial-gradient(circle at 20% 80%, rgba(16, 185, 129, 0.03) 0%, transparent 50%),
                  #F8FAFC;
    }

    .search-refined {
      background: #ffffff;
      box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      border: 1px solid #E2E8F0;
      border-radius: 12px;
    }
    .search-refined:focus-within {
      border-color: #2563EB;
      box-shadow: 0 12px 30px rgba(37, 99, 235, 0.08);
    }

    .premium-select .ant-select-selector {
      border-radius: 10px !important;
      border-color: #E2E8F0 !important;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.01) !important;
      transition: all 0.3s ease !important;
    }
    .premium-select:hover .ant-select-selector,
    .premium-select.ant-select-focused .ant-select-selector {
      border-color: #2563EB !important;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.06) !important;
    }

    .premium-card {
      background: rgba(255, 255, 255, 0.85);
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
  `;

  return (
    <div style={{ width: "100%", background: "#F8FAFC", minHeight: "100vh" }}>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />

      {/* 1. HERO SECTION */}
      <div className="hero-gradient-bg" style={{ padding: "100px 20px 80px", position: "relative", overflow: "hidden" }}>
        <div style={{ maxWidth: "1300px", margin: "0 auto" }}>
          <Row gutter={[48, 48]} align="middle">
            {/* Left Content */}
            <Col xs={24} lg={12}>
              <div style={{ textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                  <span style={{ width: 32, height: 1, background: "#2563EB" }}></span>
                  <span style={{ color: "#2563EB", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em" }}>
                    Hệ thống Tuyển dụng AI chuyên nghiệp
                  </span>
                </div>
                <Title
                  level={1}
                  style={{
                    fontSize: "52px",
                    fontWeight: 800,
                    lineHeight: 1.15,
                    marginBottom: 24,
                    color: "#0F172A",
                    letterSpacing: "-0.03em",
                  }}
                  className="plus-jakarta-sans"
                >
                  Nghệ thuật tuyển dụng <br />
                  <span style={{ color: "#2563EB" }}>Chính xác</span> từ AI.
                </Title>
                <Paragraph
                  style={{
                    fontSize: "16px",
                    color: "#64748B",
                    marginBottom: 40,
                    lineHeight: 1.75,
                    maxWidth: "520px",
                  }}
                >
                  Vượt trội hơn cả đối sánh thông thường. Hệ thống phân tích sâu hồ sơ năng lực của ứng viên để dự đoán mức độ thành công, mang lại tập hợp nhân sự xuất sắc nhất phù hợp với doanh nghiệp của bạn.
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
                    style={{ flex: 1, fontSize: "15px", minWidth: "140px" }}
                    suffixIcon={<EnvironmentOutlined style={{ fontSize: 15, color: "#64748B" }} />}
                    value={searchLocation}
                    onChange={(val) => setSearchLocation(val)}
                  >
                    <Option value="all">Làm việc từ xa</Option>
                    <Option value="hn">Hà Nội, VN</Option>
                    <Option value="hcm">Hồ Chí Minh, VN</Option>
                  </Select>
                  <Button
                    type="primary"
                    size="large"
                    className="action-btn"
                    style={{
                      height: "44px",
                      padding: "0 24px",
                      fontSize: "14px",
                      fontWeight: 700,
                      borderRadius: "8px",
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

                {/* Trending Tags */}
                <div style={{ marginTop: 36, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                    Xu hướng tìm kiếm:
                  </Text>
                  <Space wrap size={16}>
                    {["ML Engineer", "Product Design", "Cloud Architecture"].map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#0F172A",
                          cursor: "pointer",
                          borderBottom: "1px solid transparent",
                          transition: "color 0.2s, border-color 0.2s",
                        }}
                        className="action-btn"
                        onClick={() => navigate(`/jobs?keyword=${tag}`)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "#2563EB";
                          e.currentTarget.style.borderColor = "#2563EB";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "#0F172A";
                          e.currentTarget.style.borderColor = "transparent";
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </Space>
                </div>
              </div>
            </Col>

            {/* Right Simulator */}
            <Col xs={24} lg={12} style={{ display: "flex", justifyContent: "center" }}>
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.85)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(226, 232, 240, 0.8)",
                  borderRadius: "24px",
                  boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.04), 0 4px 20px rgba(37, 99, 235, 0.02)",
                  width: "100%",
                  maxWidth: "480px",
                  padding: "36px",
                  position: "relative",
                  transition: "all 0.4s ease",
                }}
              >
                {/* Simulator Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, paddingBottom: 18, borderBottom: "1px solid #E2E8F0" }}>
                  <Space size={10}>
                    <ClusterOutlined style={{ color: "#2563EB", fontSize: 20 }} />
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.05em" }} className="plus-jakarta-sans">
                      AI MATCH SIMULATOR
                    </span>
                  </Space>
                  <Tag
                    style={{
                      background: "#2563EB",
                      color: "#FFFFFF",
                      border: "none",
                      padding: "6px 16px",
                      borderRadius: "8px",
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  >
                    PRO
                  </Tag>
                </div>

                {/* dynamic job selector */}
                <div style={{ marginBottom: 28 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      SELECT ACTIVE REQUISITION
                    </span>
                  </div>
                  <div 
                    className="no-scrollbar"
                    style={{ 
                      display: "flex", 
                      gap: 12, 
                      overflowX: simulatorItems.length > 3 ? "auto" : "visible", 
                      paddingBottom: 8,
                      scrollbarWidth: "none",
                      msOverflowStyle: "none"
                    }}
                  >
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
                            flex: simulatorItems.length > 3 ? "0 0 115px" : 1,
                            border: isActive ? "2px solid #2563EB" : "1px solid #E2E8F0",
                            borderRadius: "12px",
                            padding: "16px 8px",
                            textAlign: "center",
                            cursor: "pointer",
                            background: "#FFFFFF",
                            transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                            boxShadow: isActive ? "0 8px 24px rgba(37, 99, 235, 0.08)" : "none",
                          }}
                        >
                          <div style={{ color: isActive ? "#2563EB" : "#64748B", marginBottom: 8 }}>
                            {getCategoryIcon(item.name)}
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", color: isActive ? "#2563EB" : "#0F172A", textTransform: "uppercase" }} className="plus-jakarta-sans">
                            {item.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Candidate Result Card */}
                {simulatorLoading ? (
                  <div style={{ height: "200px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "#F1F5F9", borderRadius: 16, border: "1px solid #E2E8F0" }}>
                    <Spin indicator={<LoadingOutlined style={{ fontSize: 28, color: "#2563EB" }} spin />} />
                    <Text style={{ marginTop: 16, fontSize: 13, color: "#64748B", fontWeight: 550 }} className="plus-jakarta-sans">
                      AI đang bóc tách hồ sơ & đối sánh...
                    </Text>
                  </div>
                ) : simulatorCandidate ? (
                  <div
                    style={{
                      background: "#F1F5F9",
                      border: "1px solid #E2E8F0",
                      padding: "28px",
                      borderRadius: "16px",
                      boxShadow: "inset 0 2px 4px rgba(15, 23, 42, 0.01)",
                    }}
                  >
                    {/* Candidate Profile Info */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 12 }}>
                      <div style={{ display: "flex", gap: 16, alignItems: "center", minWidth: 0, flex: 1 }}>
                        <div style={{
                          width: 56,
                          height: 56,
                          flexShrink: 0,
                          borderRadius: "50%",
                          background: "#FFFFFF",
                          border: "2px solid #E2E8F0",
                          color: "#2563EB",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          fontSize: 18,
                          boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)"
                        }}>
                          {simulatorCandidate.avatar}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <h4 style={{ fontSize: "21px", color: "#0F172A", margin: 0, fontWeight: 800, letterSpacing: "-0.02em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} className="plus-jakarta-sans">
                            {simulatorCandidate.name}
                          </h4>
                          <span style={{ fontSize: "11px", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, marginTop: 4, display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {simulatorCandidate.role}
                          </span>
                        </div>
                      </div>

                      {/* Matching Score Circle Badge */}
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 44, fontWeight: 900, color: simulatorCandidate.score >= 90 ? "#10B981" : "#2563EB", lineHeight: 1, letterSpacing: "-0.03em" }}>
                          {simulatorCandidate.score}
                          <small style={{ fontSize: 18, fontWeight: 800, marginLeft: 2 }}>%</small>
                        </div>
                        <span style={{ fontSize: 10, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 800, marginTop: 6, display: "block" }}>
                          ĐỘ PHÙ HỢP AI
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24, marginTop: 24 }}>
                      {/* Skills Section */}
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#475569", display: "block", borderBottom: "2px solid #E2E8F0", paddingBottom: 8, marginBottom: 12 }}>
                          NĂNG LỰC CỐT LÕI
                        </span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 10px" }}>
                          {simulatorCandidate.skills.map((skill: string) => (
                            <span
                              key={skill}
                              style={{
                                display: "inline-block",
                                background: "#FFFFFF",
                                border: "1px solid #E2E8F0",
                                color: "#1E293B",
                                padding: "6px 14px",
                                borderRadius: "20px",
                                fontSize: "12px",
                                fontWeight: 600,
                                boxShadow: "0 2px 4px rgba(15, 23, 42, 0.02)"
                              }}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Warnings Section */}
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#EF4444", display: "block", borderBottom: "2px solid #FEE2E2", paddingBottom: 8, marginBottom: 12 }}>
                          CẢNH BÁO
                        </span>
                        <ul style={{ fontSize: 12, color: "#DC2626", paddingLeft: 0, listStyle: "none", margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                          {simulatorCandidate.warnings.map((warn: string, i: number) => (
                            <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, lineHeight: "1.4" }}>
                              <span style={{ color: "#EF4444", fontWeight: 900 }}>•</span>
                              <span style={{ fontWeight: 600, color: "#7F1D1D" }}>{warn}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: "48px 24px", textAlign: "center", color: "#64748B", background: "#F8FAFC", borderRadius: 16, border: "1px solid #E2E8F0" }} className="plus-jakarta-sans">
                    Hãy chọn một công việc phía trên để chạy mô phỏng đối sánh AI.
                  </div>
                )}
              </div>
            </Col>
          </Row>
        </div>
      </div>

      {/* 2. STATS STRIP - REAL DATA ONLY */}
      <div style={{ background: "#FFFFFF", borderTop: "1px solid #E2E8F0", borderBottom: "1px solid #E2E8F0", padding: "48px 24px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <Row justify="space-between" align="middle" gutter={[32, 32]}>
            <Col xs={24} md={7} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "36px", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>
                {stats.activeJobs.toLocaleString("vi-VN")}
              </div>
              <div className="stat-label" style={{ marginTop: 12 }}>Công việc đang tuyển</div>
            </Col>
            <Col xs={0} md={1} style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ width: 1, height: 48, background: "#E2E8F0" }}></div>
            </Col>
            <Col xs={24} md={8} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "36px", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>
                {stats.analyzedCvs.toLocaleString("vi-VN")}
              </div>
              <div className="stat-label" style={{ marginTop: 12 }}>Hồ sơ đã phân tích AI</div>
            </Col>
            <Col xs={0} md={1} style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ width: 1, height: 48, background: "#E2E8F0" }}></div>
            </Col>
            <Col xs={24} md={7} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "36px", fontWeight: 800, color: "#2563EB", letterSpacing: "-0.02em" }}>
                {(stats.totalCandidateUsers || stats.totalUsers || 0).toLocaleString("vi-VN")}
              </div>
              <div className="stat-label" style={{ marginTop: 12 }}>Ứng viên tham gia</div>
            </Col>
          </Row>
        </div>
      </div>

      {/* 3. LOGO WALL */}
      <LogoWall />

      {/* 4. FEATURES BENTO */}
      <ScrollReveal>
        <div style={{ padding: "100px 20px", background: "#FFFFFF" }}>
          <div style={{ maxWidth: "1300px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <span style={{ color: "#2563EB", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", display: "block", marginBottom: 16 }}>
                Các Giải pháp Nhân sự
              </span>
              <Title level={2} style={{ fontSize: "36px", fontWeight: 800, color: "#0F172A", margin: 0 }} className="plus-jakarta-sans">
                Hệ điều hành Tuyển dụng thông minh
              </Title>
            </div>

            <Row gutter={[24, 24]}>
              {/* Main Feature - ATS Dashboard */}
              <Col xs={24} lg={16}>
                <div
                  className="pill-card"
                  style={{
                    height: "100%",
                    borderRadius: "16px",
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    padding: "48px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: "440px",
                  }}
                >
                  <div style={{ maxWidth: "540px" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: "#64748B", display: "block", marginBottom: 20 }}>
                      Hệ thống ATS thế mới
                    </span>
                    <Title level={3} style={{ fontSize: "28px", fontWeight: 800, color: "#0F172A", marginBottom: 20, lineHeight: 1.3 }} className="plus-jakarta-sans">
                      Trung tâm điều hành quản lý nhân tài
                    </Title>
                    <Paragraph style={{ fontSize: 15, color: "#64748B", lineHeight: 1.65, margin: 0 }}>
                      Hệ thống quản lý và vận hành quy trình tuyển dụng cao cấp. Phân tích hồ sơ thời gian thực, chấm điểm tương hợp tự động, và hỗ trợ phối hợp đánh giá nội bộ doanh nghiệp trên hạ tầng bảo mật chuẩn quốc tế.
                    </Paragraph>
                  </div>
                  <div style={{ display: "flex", gap: 48, marginTop: 32 }}>
                    <div>
                      <div style={{ fontSize: 32, fontWeight: 800, color: "#0F172A" }}>80%</div>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: "#64748B", marginTop: 8 }}>Sàng lọc nhanh hơn</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 32, fontWeight: 800, color: "#0F172A" }}>100%</div>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: "#64748B", marginTop: 8 }}>Tích hợp hệ thống</div>
                    </div>
                  </div>
                </div>
              </Col>

              {/* Side Feature 1 - Predictive Insights */}
              <Col xs={24} lg={8}>
                <div
                  className="pill-card"
                  style={{
                    height: "100%",
                    borderRadius: "16px",
                    border: "1px solid #E2E8F0",
                    padding: "48px 32px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: "440px",
                  }}
                >
                  <div>
                    <div style={{ width: 44, height: 44, borderRadius: "10px", background: "rgba(37, 99, 235, 0.08)", color: "#2563EB", display: "inline-flex", justifyContent: "center", alignItems: "center", fontSize: 20, marginBottom: 28 }}>
                      <LineChartOutlined />
                    </div>
                    <Title level={4} style={{ fontSize: "20px", fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>
                      Báo cáo phân tích dự báo
                    </Title>
                    <Paragraph style={{ fontSize: 14, color: "#64748B", lineHeight: 1.65, margin: 0 }}>
                      Khai phá dữ liệu lớn để dự đoán xu hướng tuyển dụng, đánh giá chỉ số chất lượng nguồn ứng viên và chất lượng tuyển dụng thông qua báo cáo trực quan sinh động.
                    </Paragraph>
                  </div>
                  <Button
                    type="default"
                    block
                    size="large"
                    className="action-btn"
                    style={{
                      height: "44px",
                      borderRadius: "8px",
                      fontWeight: 700,
                      fontSize: "13px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      borderColor: "#0F172A",
                      color: "#0F172A",
                      marginTop: 24,
                    }}
                    onClick={() => navigate("/login")}
                  >
                    Xem báo cáo mẫu
                  </Button>
                </div>
              </Col>

              {/* Side Feature 2 - Concierge Experience */}
              <Col xs={24} lg={8}>
                <div
                  className="pill-card"
                  style={{
                    height: "100%",
                    borderRadius: "16px",
                    border: "1px solid #E2E8F0",
                    padding: "48px 32px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: "400px",
                  }}
                >
                  <div>
                    <div style={{ width: 44, height: 44, borderRadius: "10px", background: "rgba(37, 99, 235, 0.08)", color: "#2563EB", display: "inline-flex", justifyContent: "center", alignItems: "center", fontSize: 20, marginBottom: 28 }}>
                      <UnlockOutlined />
                    </div>
                    <Title level={4} style={{ fontSize: "20px", fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>
                      Trải nghiệm ứng viên đặc quyền
                    </Title>
                    <Paragraph style={{ fontSize: 14, color: "#64748B", lineHeight: 1.65, margin: 0 }}>
                      Cổng tương tác cá nhân hóa đẳng cấp dành riêng cho ứng viên, giúp giữ chân nhân tài và nâng tầm uy tín của doanh nghiệp trong suốt hành trình ứng tuyển.
                    </Paragraph>
                  </div>
                </div>
              </Col>

              {/* Bottom Feature - Security */}
              <Col xs={24} lg={16}>
                <div
                  className="pill-card"
                  style={{
                    height: "100%",
                    borderRadius: "16px",
                    background: "#0F172A",
                    border: "none",
                    padding: "48px",
                    color: "#FFFFFF",
                    minHeight: "400px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Row gutter={[32, 32]} align="middle" style={{ width: "100%" }}>
                    <Col xs={24} md={14}>
                      <Title level={3} style={{ color: "#FFFFFF", fontSize: "28px", fontWeight: 800, marginBottom: 16 }} className="plus-jakarta-sans">
                        Tuân thủ & Bảo mật
                      </Title>
                      <Paragraph style={{ color: "#94A3B8", fontSize: "14px", lineHeight: 1.65, marginBottom: 28 }}>
                        Thiết kế chuyên biệt cho quy mô doanh nghiệp lớn. Bảo vệ an toàn dữ liệu cá nhân theo tiêu chuẩn quốc tế, mã hóa thông tin hai đầu và vận hành minh bạch.
                      </Paragraph>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                        {["Chuẩn mã hóa SSL", "Chuẩn bảo mật dữ liệu", "Bảo mật đa lớp"].map((std) => (
                          <span
                            key={std}
                            style={{
                              border: "1px solid rgba(148, 163, 184, 0.3)",
                              color: "#FFFFFF",
                              padding: "4px 12px",
                              borderRadius: "4px",
                              fontSize: "10px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.15em",
                            }}
                          >
                            {std}
                          </span>
                        ))}
                      </div>
                    </Col>
                    <Col xs={24} md={10} style={{ display: "flex", justifyContent: "center" }}>
                      <div style={{ border: "1px solid rgba(148, 163, 184, 0.3)", padding: "32px", borderRadius: "12px", textAlign: "center", width: "100%", maxWidth: "240px", background: "rgba(255, 255, 255, 0.02)" }}>
                        <SafetyOutlined style={{ fontSize: 44, color: "#FFFFFF", marginBottom: 16 }} />
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF" }}>Đã kiểm chứng an toàn</div>
                        <div style={{ fontSize: 10, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 8, fontWeight: 700 }}>
                          Kiểm toán: 24h trước
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

      {/* 4.5 TRENDING JOBS */}
      <ScrollReveal>
        <div style={{ padding: "80px 20px", background: "#FFFFFF", borderTop: "1px solid #E2E8F0" }}>
          <div style={{ maxWidth: "1300px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 48, paddingBottom: 20 }} className="editorial-border">
              <div>
                <Title level={2} style={{ fontSize: "32px", fontWeight: 800, color: "#0F172A", margin: 0 }} className="plus-jakarta-sans">
                  Xu hướng việc làm & Tin nổi bật
                </Title>
                <Paragraph style={{ fontSize: 15, color: "#64748B", marginTop: 8, margin: 0 }}>
                  Các vị trí tuyển dụng có lượt quan tâm và tương tác nhiều nhất hệ thống tuần qua.
                </Paragraph>
              </div>
            </div>

            {trendingJobs.length > 0 ? (
              <Row gutter={[24, 24]}>
                {trendingJobs.map((job: any) => (
                  <Col xs={24} md={8} key={job.id}>
                    <div
                      className="premium-card"
                      style={{
                        padding: "28px",
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                        background: "rgba(248, 250, 252, 0.6)",
                        border: "1px solid #E2E8F0",
                        borderRadius: "16px",
                        boxShadow: "0 4px 12px rgba(15, 23, 42, 0.01)",
                        transition: "all 0.3s ease",
                        cursor: "pointer",
                        minHeight: "180px"
                      }}
                      onClick={() => navigate(`/jobs/${job.id}`)}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <Tag color="blue" style={{ borderRadius: "8px", fontWeight: 700, fontSize: "11px", padding: "2px 8px" }}>
                          HOT • {job.viewCount || 0} lượt xem
                        </Tag>
                      </div>

                      <Title level={4} style={{ fontSize: "17px", fontWeight: 800, color: "#0F172A", marginBottom: 16, flex: 1 }} className="plus-jakarta-sans">
                        {job.title}
                      </Title>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          <EnvironmentOutlined /> {job.location}
                        </Text>
                        <Text strong style={{ color: "#2563EB", fontSize: 14 }}>
                          {job.salary}
                        </Text>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <Text type="secondary">Chưa có tin tuyển dụng nổi bật nào.</Text>
              </div>
            )}
          </div>
        </div>
      </ScrollReveal>

      {/* 5. FEATURED JOBS */}
      <ScrollReveal>
        <div style={{ padding: "100px 20px", background: "#F8FAFC", borderTop: "1px solid #E2E8F0" }}>
          <div style={{ maxWidth: "1300px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 48, paddingBottom: 20 }} className="editorial-border">
              <div>
                <Title level={2} style={{ fontSize: "32px", fontWeight: 800, color: "#0F172A", margin: 0 }} className="plus-jakarta-sans">
                  Vị trí tuyển dụng nổi bật
                </Title>
                <Paragraph style={{ fontSize: 15, color: "#64748B", marginTop: 8, margin: 0 }}>
                  Danh sách cơ hội việc làm tuyển chọn được phân tích và hỗ trợ bởi công nghệ AI.
                </Paragraph>
              </div>
              <Button
                type="link"
                className="action-btn"
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#0F172A",
                  padding: 0,
                  height: "auto",
                  borderBottom: "1px solid #0F172A",
                  borderRadius: 0,
                }}
                onClick={() => navigate("/jobs")}
                onMouseEnter={(e) => e.currentTarget.style.color = "#2563EB"}
                onMouseLeave={(e) => e.currentTarget.style.color = "#0F172A"}
              >
                Xem tất cả vị trí <ArrowRightOutlined style={{ fontSize: 12 }} />
              </Button>
            </div>

            {/* Filter Tabs & Personalization Bar */}
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 20, marginBottom: 40, background: "#FFFFFF", padding: "16px 24px", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
              {/* Category tabs */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
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
                      padding: "8px 18px",
                      borderRadius: "8px",
                      border: "none",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      background: selectedFilterCategory === tab.id ? "#2563EB" : "transparent",
                      color: selectedFilterCategory === tab.id ? "#FFFFFF" : "#64748B",
                      transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                      boxShadow: selectedFilterCategory === tab.id ? "0 4px 12px rgba(37, 99, 235, 0.15)" : "none"
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Personalization Controls */}
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {/* AI Recommendation Switch */}
                <div
                  onClick={() => setIsSmartRecommend(!isSmartRecommend)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 16px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    background: isSmartRecommend ? "#F0FDF4" : "#F8FAFC",
                    border: isSmartRecommend ? "1px solid #BBF7D0" : "1px solid #E2E8F0",
                    transition: "all 0.3s ease"
                  }}
                >
                  <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: isSmartRecommend ? "#10B981" : "#64748B" }}></span>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: isSmartRecommend ? "#10B981" : "#64748B" }}>
                    Gợi ý AI cho bạn
                  </span>
                </div>

                {/* Shuffle/Rotate Button */}
                <Button
                  onClick={() => setRefreshSeed(prev => prev + 1)}
                  type="default"
                  icon={<ReloadOutlined />}
                  style={{
                    height: "36px",
                    borderRadius: "8px",
                    fontWeight: 700,
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    borderColor: "#E2E8F0",
                    color: "#0F172A"
                  }}
                >
                  Xoay vòng tin
                </Button>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "80px 0" }}>
                <Spin indicator={<LoadingOutlined style={{ fontSize: 36, color: "#2563EB" }} spin />} />
              </div>
            ) : processedFeaturedJobs.length > 0 ? (
              <Row gutter={[32, 32]}>
                {processedFeaturedJobs.map((job) => (
                  <Col xs={24} md={8} key={job.id}>
                    <div
                      className="premium-card"
                      style={{
                        padding: "36px",
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                        background: "rgba(255, 255, 255, 0.85)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(226, 232, 240, 0.8)",
                        borderRadius: "16px",
                        boxShadow: "0 4px 20px rgba(15, 23, 42, 0.02)",
                        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                    >
                      {/* Top Header of Card with Icon and Badge */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <div style={{
                          width: 44,
                          height: 44,
                          borderRadius: "12px",
                          background: "rgba(37, 99, 235, 0.06)",
                          color: "#2563EB",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 20
                        }}>
                          {getJobCategoryIcon(job.position?.name || "")}
                        </div>
                        {isSmartRecommend && ((job.position?.name || "").toLowerCase().includes("machine") || (job.position?.name || "").toLowerCase().includes("ai")) ? (
                          <Tag
                            style={{
                              background: "#F0FDF4",
                              border: "1px solid #BBF7D0",
                              color: "#10B981",
                              margin: 0,
                              borderRadius: "20px",
                              fontWeight: 700,
                              fontSize: "10px"
                            }}
                          >
                            PHÙ HỢP 95%
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
                        style={{ fontSize: "18px", fontWeight: 800, color: "#0F172A", marginBottom: 24, lineHeight: 1.4, flex: 1 }}
                        className="plus-jakarta-sans"
                      >
                        {job.position?.name || "Vị trí tuyển dụng"}
                      </Title>

                      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#64748B" }}>
                          <EnvironmentOutlined style={{ fontSize: 16 }} />
                          <span style={{ fontSize: 14 }}>{job.branch?.name || "Hồ Chí Minh, Việt Nam"}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#0F172A", fontWeight: 700 }}>
                          <DollarOutlined style={{ fontSize: 16 }} />
                          <span style={{ fontSize: 14 }}>{job.salaryRange || "Thỏa thuận"}</span>
                        </div>
                      </div>

                      <Button
                        type="default"
                        block
                        size="large"
                        className="action-btn"
                        style={{
                          height: "44px",
                          borderRadius: "8px",
                          fontWeight: 700,
                          fontSize: "13px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          borderColor: "#0F172A",
                          color: "#0F172A",
                        }}
                        onClick={() => navigate(`/jobs/${job.id}`)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#0F172A";
                          e.currentTarget.style.color = "#FFFFFF";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "#0F172A";
                        }}
                      >
                        Ứng tuyển ngay
                      </Button>
                    </div>
                  </Col>
                ))}
              </Row>
            ) : (
              <div style={{ padding: "60px 20px", textAlign: "center", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, color: "#64748B" }}>
                Không tìm thấy vị trí tuyển dụng phù hợp với danh mục đã chọn.
              </div>
            )}
          </div>
        </div>
      </ScrollReveal>

      {/* 6. FAQ SECTION */}
      <ScrollReveal>
        <div style={{ padding: "100px 20px", background: "#FFFFFF", borderTop: "1px solid #E2E8F0" }}>
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <Title level={2} style={{ fontSize: "32px", fontWeight: 800, color: "#0F172A", textAlign: "center", marginBottom: 60 }} className="plus-jakarta-sans">
              Giải đáp thắc mắc tuyển dụng
            </Title>

            <Collapse className="faq-collapse" expandIconPosition="end">
              <Panel
                header="Hệ thống AI xác thực năng lực ứng viên như thế nào?"
                key="1"
                className="faq-panel"
              >
                Hệ thống sử dụng phân tích ngữ cảnh chéo (cross-contextual analysis) để đối chiếu thông tin ghi trong CV của ứng viên với hồ sơ năng lực thực tế và cơ sở dữ liệu lịch sử của chúng tôi, đảm bảo một quy trình sàng lọc chặt chẽ và khách quan nhất.
              </Panel>
              <Panel
                header="Chúng tôi có thể tích hợp AI với hệ thống nhân sự sẵn có như Oracle/SAP không?"
                key="2"
                className="faq-panel"
              >
                Có. Đối với phân khúc doanh nghiệp lớn, chúng tôi cung cấp các cổng kết nối API chuyên biệt tích hợp sâu vào toàn bộ hệ thống quản trị nhân sự ERP/HRMS lớn như SAP SuccessFactors, Oracle Cloud HCM hay Workday, giúp đồng bộ thông tin hồ sơ tức thì.
              </Panel>
              <Panel
                header="Thời gian tuyển dụng trung bình cải thiện như thế nào?"
                key="3"
                className="faq-panel"
              >
                Theo khảo sát thực tế, các doanh nghiệp áp dụng giải pháp của chúng tôi ghi nhận thời gian lọc hồ sơ vòng đầu giảm trung bình 65%, đồng thời tỷ lệ chuyển đổi từ hồ sơ sang phỏng vấn tăng 40% nhờ sự chính xác vượt trội của bộ lọc AI.
              </Panel>
            </Collapse>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}

export default HomePage;
