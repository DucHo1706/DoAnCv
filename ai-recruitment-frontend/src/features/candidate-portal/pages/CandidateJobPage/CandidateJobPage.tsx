import { useState, useEffect } from "react";
import {
  Input,
  Button,
  Row,
  Col,
  Card,
  Typography,
  Select,
  Space,
  Tag,
  Pagination,
  Divider,
  Radio,
  InputNumber,
  Spin,
  message,
  Alert,
  Skeleton,
  Grid,
} from "antd";
import {
  SearchOutlined,
  EnvironmentOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  StarOutlined,
  StarFilled,
  CheckCircleOutlined,
  DollarOutlined,
  DatabaseOutlined,
  CodeOutlined,
  DeploymentUnitOutlined,
  SafetyOutlined,
  NotificationOutlined,
  TeamOutlined,
  AppstoreOutlined,
  BuildOutlined,
  FilterOutlined,
  UpOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import axiosClient from "../../../../services/axiosClient";
import { appTheme } from "../../../../constants/theme";
import "./CandidateJobPage.css";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

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
  if (title.includes("nhân sự") || title.includes("hr") || title.includes("tuyển dụng") || title.includes("recruitment")) {
    return <TeamOutlined />;
  }
  if (title.includes("xây dựng") || title.includes("kỹ sư") || title.includes("bất động sản") || title.includes("logistics")) {
    return <BuildOutlined />;
  }
  return <AppstoreOutlined />;
};

const glassCardStyle = {
  background: "rgba(255, 255, 255, 0.85)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(226, 232, 240, 0.8)",
  boxShadow: "0 8px 32px 0 rgba(148, 163, 184, 0.08)",
  borderRadius: "16px",
};

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const getPublicJobCode = (value: unknown) => {
  const raw = String(value || "");
  const guid = raw.match(/[0-9a-f]{8}(?:-?[0-9a-f]{4}){3}-?[0-9a-f]{12}/i)?.[0];
  if (guid) return guid.replaceAll("-", "").slice(0, 8).toUpperCase();

  let hash = 2166136261;
  for (let index = 0; index < raw.length; index += 1) {
    hash ^= raw.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0").toUpperCase();
};

const canonicalizeLocation = (name: string) => {
  const normalized = (name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  if (["hcm", "tphcm", "hochiminh", "thanhphohochiminh"].includes(normalized)) {
    return { key: "ho-chi-minh", name: "Hồ Chí Minh" };
  }
  if (["hn", "hanoi", "thanhphohanoi"].includes(normalized)) {
    return { key: "ha-noi", name: "Hà Nội" };
  }
  if (["dn", "danang", "thanhphodanang"].includes(normalized)) {
    return { key: "da-nang", name: "Đà Nẵng" };
  }

  return { key: normalized || name, name };
};

const mergeLocationAliases = (items: any[]) => {
  const uniqueLocations = new Map<string, { id: string; name: string }>();
  items.forEach((branch) => {
    const canonical = canonicalizeLocation(branch?.name || "");
    if (canonical.name && !uniqueLocations.has(canonical.key)) {
      uniqueLocations.set(canonical.key, { id: canonical.key, name: canonical.name });
    }
  });
  return Array.from(uniqueLocations.values());
};

export default function CandidateJobPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const screens = Grid.useBreakpoint();
  const isDesktop = Boolean(screens.lg);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Khởi tạo giá trị mặc định từ URL
  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "all");
  const [jobs, setJobs] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isFallback, setIsFallback] = useState(false);

  const isLoggedIn = !!localStorage.getItem("token");
  const isCandidate = JSON.parse(localStorage.getItem("user") || "{}").role === "Candidate";
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [candidateSkills, setCandidateSkills] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>(isLoggedIn && isCandidate ? "aiMatch" : "newest");

  // State cho Bộ lọc nâng cao
  const [categoryId, setCategoryId] = useState("all");
  const [jobLevelId, setJobLevelId] = useState("all");
  const [salaryMin, setSalaryMin] = useState<number | null>(null);
  const [salaryMax, setSalaryMax] = useState<number | null>(null);
  const [salaryRange, setSalaryRange] = useState("all");
  const [categories, setCategories] = useState<any[]>([]);
  const [jobLevels, setJobLevels] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);

  const handleSalaryRangeChange = (val: string) => {
    setSalaryRange(val);
    if (val === "all") {
      setSalaryMin(null);
      setSalaryMax(null);
    } else if (val === "under10") {
      setSalaryMin(0);
      setSalaryMax(10);
    } else if (val === "10to15") {
      setSalaryMin(10);
      setSalaryMax(15);
    } else if (val === "15to20") {
      setSalaryMin(15);
      setSalaryMax(20);
    } else if (val === "20to25") {
      setSalaryMin(20);
      setSalaryMax(25);
    } else if (val === "25to30") {
      setSalaryMin(25);
      setSalaryMax(30);
    } else if (val === "30to50") {
      setSalaryMin(30);
      setSalaryMax(50);
    } else if (val === "over50") {
      setSalaryMin(50);
      setSalaryMax(null);
    }
  };

  // Fetch Dynamic Metadata (Categories, Job Levels, Branches) lúc khởi tạo
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const catRes = await axiosClient.get("/Metadata/categories");
        const levelRes = await axiosClient.get("/Metadata/job-levels");
        const branchRes = await axiosClient.get("/Metadata/branches");
        setCategories(catRes.data?.$values || catRes.data || []);
        setJobLevels(levelRes.data?.$values || levelRes.data || []);
        const branchItems = branchRes.data?.$values || branchRes.data || [];
        setBranches(mergeLocationAliases(branchItems));
      } catch (error) {
        console.error("Lỗi lấy metadata:", error);
      }
    };
    fetchMetadata();
  }, []);

  // Cá nhân hóa: Tải hồ sơ CV của Ứng viên để tính điểm AI Match
  useEffect(() => {
    const fetchCandidateContext = async () => {
      try {
        if (isLoggedIn && isCandidate) {
          const savedRes = await axiosClient.get("/jobs/saved");
          if (Array.isArray(savedRes.data)) {
            setSavedJobIds(new Set(savedRes.data.map((j: any) => j.id)));
          }

          const profileRes = await axiosClient.get("/profile");
          if (profileRes.data?.skills) {
            try {
              const parsed = typeof profileRes.data.skills === "string"
                ? JSON.parse(profileRes.data.skills)
                : profileRes.data.skills;
              const skillList = Array.isArray(parsed) ? parsed : (parsed?.$values || []);
              setCandidateSkills(skillList);
            } catch {}
          }
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu cá nhân hóa ứng viên:", error);
      }
    };
    fetchCandidateContext();
  }, [isLoggedIn, isCandidate]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/Jobs/published", {
        params: {
          Keyword: keyword,
          Location: location === "all" ? "" : location,
          CategoryId: categoryId === "all" ? "" : categoryId,
          JobLevelId: jobLevelId === "all" ? "" : jobLevelId,
          SalaryMin: salaryMin,
          SalaryMax: salaryMax,
          PageIndex: pageIndex,
          PageSize: 12,
        },
      });
      const items = res.data.items?.$values || res.data.items || [];
      setJobs(items);
      setTotalCount(res.data.totalCount || 0);
      setIsFallback(res.data.isFallback || false);
    } catch (error) {
      console.error("Lỗi lấy danh sách việc làm:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [pageIndex]);

  // Tự động tìm kiếm khi người dùng chọn lọc
  useEffect(() => {
    handleSearch();
  }, [categoryId, jobLevelId, location, salaryMin, salaryMax]);

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams);
    if (keyword) params.set("keyword", keyword);
    else params.delete("keyword");
    if (location && location !== "all") params.set("location", location);
    else params.delete("location");
    navigate(`/jobs?${params.toString()}`, { replace: true });

    if (pageIndex === 1) fetchJobs();
    else setPageIndex(1);
  };

  const handleClearFilter = () => {
    setKeyword("");
    setLocation("all");
    setCategoryId("all");
    setJobLevelId("all");
    setSalaryMin(null);
    setSalaryMax(null);
    setSalaryRange("all");
    setPageIndex(1);
    navigate("/jobs", { replace: true });
    setTimeout(() => fetchJobs(), 50);
  };

  const handleToggleSaveJob = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      message.warning("Vui lòng đăng nhập để lưu việc làm!");
      navigate("/login");
      return;
    }
    try {
      if (savedJobIds.has(jobId)) {
        await axiosClient.delete(`/jobs/${jobId}/unsave`);
        const next = new Set(savedJobIds);
        next.delete(jobId);
        setSavedJobIds(next);
        message.success("Đã bỏ lưu việc làm!");
      } else {
        await axiosClient.post(`/jobs/${jobId}/save`);
        const next = new Set(savedJobIds);
        next.add(jobId);
        setSavedJobIds(next);
        message.success("Đã lưu việc làm vào danh sách yêu thích!");
      }
    } catch (err) {
      message.error("Thao tác thất bại, vui lòng thử lại!");
    }
  };

  // Đối chiếu từ khóa minh bạch; đây không phải điểm đánh giá AI.
  const calculateJobMatch = (job: any) => {
    if (!candidateSkills || candidateSkills.length === 0) return { matched: [], total: 0 };
    const validSkills = candidateSkills.filter(s => s && s.trim().length > 1);
    if (validSkills.length === 0) return { matched: [], total: 0 };

    const title = job.title || job.position || "";
    const desc = job.description || job.requirements || "";
    const fullText = `${title} ${desc}`;

    const matched = validSkills.filter(sk => {
      try {
        const regex = new RegExp(`\\b${escapeRegExp(sk.trim())}\\b`, 'i');
        return regex.test(fullText);
      } catch {
        return false;
      }
    });

    return { matched, total: validSkills.length };
  };

  // Sắp xếp danh sách việc làm
  const processedJobs = [...jobs].sort((a, b) => {
    if (sortBy === "aiMatch") {
      const matchA = calculateJobMatch(a).matched.length;
      const matchB = calculateJobMatch(b).matched.length;
      return matchB - matchA;
    }
    return 0; // Giữ nguyên thứ tự từ API (Mới cập nhật)
  });

  return (
    <div className="candidate-jobs-page" style={{ background: appTheme.colors.background, minHeight: "100vh", paddingBottom: 60 }}>
      {/* 1. KHU VỰC TÌM KIẾM (SEARCH HERO SECTION) */}
      <div
        className="candidate-jobs-hero"
        style={{
          background: "#F8FAFC",
          padding: "40px 20px 24px",
          borderBottom: "1px solid #E2E8F0",
        }}
      >
        <div className="candidate-jobs-container" style={{ maxWidth: "1300px", margin: "0 auto" }}>
          <Title className="candidate-jobs-title" level={1} style={{ color: "#0F172A", marginBottom: 18, fontWeight: 800, fontSize: 30, letterSpacing: "-0.02em" }}>
            Tìm kiếm cơ hội nghề nghiệp
          </Title>

          <div
            className="candidate-jobs-search"
            style={{
              background: "white",
              padding: "10px 14px",
              borderRadius: 16,
              display: "flex",
              gap: 10,
              boxShadow: "0 8px 30px rgba(15, 23, 42, 0.04)",
              border: "1px solid #E2E8F0",
              alignItems: "center",
              flexWrap: "wrap"
            }}
          >
            <Input
              className="candidate-jobs-keyword"
              size="large"
              placeholder="Nhập tên công việc, vị trí, kỹ năng (ví dụ: React, C#, Bắc Ninh)..."
              prefix={<SearchOutlined style={{ color: "#64748B", fontSize: 20 }} />}
              bordered={false}
              style={{ flex: "2 1 240px", fontSize: 15, minWidth: 0 }}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
            />
            <Select
              className="candidate-jobs-location"
              size="large"
              showSearch
              placeholder="Tất cả địa điểm"
              bordered={false}
              style={{ flex: "1 1 180px", fontSize: 15, borderLeft: "1px solid #F1F5F9", minWidth: 0 }}
              suffixIcon={<EnvironmentOutlined style={{ color: "#64748B" }} />}
              value={location}
              onChange={(val) => setLocation(val)}
              filterOption={(input, option) =>
                (option?.children as unknown as string)
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              <Option value="all">Tất cả địa điểm</Option>
              {branches.map((b) => (
                <Option key={b.id} value={b.name}>
                  {b.name}
                </Option>
              ))}
            </Select>
            <Button
              className="candidate-jobs-search-button"
              type="primary"
              size="large"
              onClick={handleSearch}
              style={{
                borderRadius: 12,
                padding: "0 28px",
                fontSize: 15,
                height: 48,
                background: "#2563EB",
                fontWeight: 600,
                flexShrink: 0
              }}
            >
              Tìm kiếm
            </Button>
          </div>
        </div>
      </div>

      {/* 2. KHU VỰC NỘI DUNG CHÍNH */}
      <div className="candidate-jobs-content candidate-jobs-container" style={{ maxWidth: "1300px", margin: "28px auto 0", padding: "0 20px" }}>
        <Row className="candidate-jobs-layout" gutter={[24, 20]}>
          {/* Cột trái: Bộ lọc Sidebar */}
          <Col className="candidate-jobs-filter-column" xs={24} lg={6} xl={6}>
            <Card
              className="candidate-jobs-filter-card"
              title={
                <span style={{ fontWeight: 700, fontSize: 16 }}>
                  <FilterOutlined style={{ marginRight: 8 }} />
                  Lọc nâng cao
                </span>
              }
              style={{ ...glassCardStyle, position: isDesktop ? "sticky" : "static", top: 100 }}
              bodyStyle={{
                padding: "16px 20px",
                maxHeight: isDesktop ? "calc(100vh - 120px)" : "none",
                overflowY: isDesktop ? "auto" : "visible",
                display: isDesktop || mobileFiltersOpen ? "block" : "none",
              }}
              extra={
                isDesktop ? (
                  <Space size={8} align="center">
                    <Button
                      type="link"
                      size="small"
                      danger
                      style={{ padding: 0 }}
                      onClick={handleClearFilter}
                    >
                      Xóa lọc
                    </Button>
                    <Divider type="vertical" style={{ margin: 0 }} />
                    <Button type="link" size="small" style={{ padding: 0 }} onClick={handleSearch}>
                      Áp dụng
                    </Button>
                  </Space>
                ) : (
                  <Button
                    type="text"
                    size="small"
                    icon={mobileFiltersOpen ? <UpOutlined /> : <DownOutlined />}
                    onClick={() => setMobileFiltersOpen((current) => !current)}
                    aria-expanded={mobileFiltersOpen}
                  >
                    {mobileFiltersOpen ? "Thu gọn" : "Mở bộ lọc"}
                  </Button>
                )
              }
            >
              <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                {/* 1. Lọc theo Địa điểm (Động từ DB) */}
                <div>
                  <Text strong style={{ display: "block", marginBottom: 10, fontSize: 15 }}>
                    Địa điểm làm việc
                  </Text>
                  <Select
                    size="large"
                    value={location}
                    onChange={setLocation}
                    style={{ width: "100%" }}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.children as unknown as string)
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  >
                    <Option value="all">Tất cả địa điểm</Option>
                    {branches.map((b) => (
                      <Option key={b.id} value={b.name}>
                        {b.name}
                      </Option>
                    ))}
                  </Select>
                </div>

                <Divider style={{ margin: 0 }} />

                {/* 2. Lọc theo Lĩnh vực công việc */}
                <div>
                  <Text strong style={{ display: "block", marginBottom: 10, fontSize: 15 }}>
                    Lĩnh vực công việc
                  </Text>
                  <Select
                    size="large"
                    value={categoryId}
                    onChange={setCategoryId}
                    style={{ width: "100%" }}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.children as unknown as string)
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  >
                    <Option value="all">Tất cả lĩnh vực</Option>
                    {categories.map((c) => (
                      <Option key={c.id} value={c.id}>
                        {c.name}
                      </Option>
                    ))}
                  </Select>
                </div>

                <Divider style={{ margin: 0 }} />

                {/* 3. Lọc theo Cấp bậc */}
                <div>
                  <Text strong style={{ display: "block", marginBottom: 10, fontSize: 15 }}>
                    Cấp bậc tuyển dụng
                  </Text>
                  <Select
                    size="large"
                    value={jobLevelId}
                    onChange={setJobLevelId}
                    style={{ width: "100%" }}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.children as unknown as string)
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  >
                    <Option value="all">Tất cả cấp bậc</Option>
                    {jobLevels.filter((l) => l.parentId).map((l) => (
                      <Option key={l.id} value={l.id}>
                        {l.name}
                      </Option>
                    ))}
                  </Select>
                </div>

                <Divider style={{ margin: 0 }} />

                {/* 4. Lọc theo Mức lương */}
                <div>
                  <Text strong style={{ display: "block", marginBottom: 10, fontSize: 15 }}>
                    Khoảng lương tuyển dụng
                  </Text>
                  <Radio.Group
                    value={salaryRange}
                    onChange={(e) => handleSalaryRangeChange(e.target.value)}
                    style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}
                  >
                    <Radio value="all" style={{ fontSize: 14 }}>Tất cả mức lương</Radio>
                    <Radio value="under10" style={{ fontSize: 14 }}>Dưới 10 triệu</Radio>
                    <Radio value="10to15" style={{ fontSize: 14 }}>10 - 15 triệu</Radio>
                    <Radio value="15to20" style={{ fontSize: 14 }}>15 - 20 triệu</Radio>
                    <Radio value="20to25" style={{ fontSize: 14 }}>20 - 25 triệu</Radio>
                    <Radio value="25to30" style={{ fontSize: 14 }}>25 - 30 triệu</Radio>
                    <Radio value="30to50" style={{ fontSize: 14 }}>30 - 50 triệu</Radio>
                    <Radio value="over50" style={{ fontSize: 14 }}>Trên 50 triệu</Radio>
                  </Radio.Group>

                  <Text type="secondary" style={{ display: "block", marginBottom: 6, fontSize: 13 }}>
                    Nhập khoảng lương tự chọn (triệu):
                  </Text>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <InputNumber
                      size="large"
                      placeholder="Từ"
                      style={{ width: "100%" }}
                      value={salaryMin}
                      onChange={(val) => {
                        setSalaryMin(val);
                        setSalaryRange("custom");
                      }}
                      onPressEnter={handleSearch}
                    />
                    <span>-</span>
                    <InputNumber
                      size="large"
                      placeholder="Đến"
                      style={{ width: "100%" }}
                      value={salaryMax}
                      onChange={(val) => {
                        setSalaryMax(val);
                        setSalaryRange("custom");
                      }}
                      onPressEnter={handleSearch}
                    />
                  </div>
                </div>

                {!isDesktop && (
                  <div className="candidate-jobs-mobile-filter-actions">
                    <Button onClick={handleClearFilter}>Xóa lọc</Button>
                    <Button
                      type="primary"
                      onClick={() => {
                        handleSearch();
                        setMobileFiltersOpen(false);
                      }}
                    >
                      Xem kết quả
                    </Button>
                  </div>
                )}
              </Space>
            </Card>
          </Col>

          {/* Cột phải: Danh sách việc làm */}
          <Col className="candidate-jobs-results-column" xs={24} lg={18} xl={18}>
            {/* Thanh Tiêu đề & Sắp xếp cá nhân hóa */}
            <div
              className="candidate-jobs-results-header"
              style={{
                background: "#FFFFFF",
                padding: "16px 20px",
                borderRadius: 16,
                marginBottom: 20,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: "1px solid #E2E8F0",
                boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
                flexWrap: "wrap",
                gap: 12
              }}
            >
              <Title level={4} style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0F172A", whiteSpace: "nowrap" }}>
                Tìm thấy <span style={{ color: "#2563EB" }}>{totalCount}</span> việc làm phù hợp
              </Title>

              <div className="candidate-jobs-sort" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", flex: 1, justifyContent: "flex-end" }}>
                <Text type="secondary" style={{ fontSize: 14, whiteSpace: "nowrap" }}>Sắp xếp theo:</Text>
                <Select
                  className="candidate-jobs-sort-select"
                  value={sortBy}
                  onChange={setSortBy}
                  style={{ minWidth: 200, maxWidth: 260 }}
                  size="middle"
                >
                  {isLoggedIn && isCandidate && candidateSkills.length > 0 && (
                    <Option value="aiMatch">
                      <Space size={4}>
                        <CheckCircleOutlined style={{ color: "#2563EB" }} />
                        <span>Nhiều kỹ năng trùng khớp</span>
                      </Space>
                    </Option>
                  )}
                  <Option value="newest">
                    <Space size={4}>
                      <ClockCircleOutlined />
                      <span>Mới cập nhật</span>
                    </Space>
                  </Option>
                </Select>
              </div>
            </div>

            {/* Thông báo Fallback khi không tìm thấy công việc */}
            {isFallback && (
              <Alert
                message="Không tìm thấy việc làm khớp chính xác 100% với từ khóa bộ lọc"
                description="Dưới đây là các cơ hội việc làm nổi bật và thu hút nhiều ứng viên nhất đang tuyển dụng gấp."
                type="info"
                showIcon
                style={{ marginBottom: 20, borderRadius: 12 }}
              />
            )}

            {/* Danh sách Công việc */}
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[1, 2, 3, 4].map((idx) => (
                  <Card key={idx} style={{ borderRadius: 16, border: "1px solid #E2E8F0" }}>
                    <Skeleton active paragraph={{ rows: 4 }} />
                  </Card>
                ))}
              </div>
            ) : processedJobs.length === 0 ? (
              <Card style={{ borderRadius: 16, textAlign: "center", padding: "40px 20px", border: "1px solid #E2E8F0" }}>
                <Text type="secondary" style={{ fontSize: 15 }}>
                  Không tìm thấy việc làm nào phù hợp. Hãy thử thay đổi từ khóa hoặc bấm "Xóa lọc".
                </Text>
              </Card>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {processedJobs.map((job) => {
                  const isSaved = savedJobIds.has(job.id || job.jobID);
                  const matchResult = calculateJobMatch(job);
                  const jobTitle = job.title || job.position || (typeof job.position === "object" ? job.position?.name : "") || "Vị trí tuyển dụng";
                  const companyName = job.company || job.recruiter?.name || "Công Ty AI Recruitment";
                  const salaryText = job.salary || job.salaryRange || "Thỏa thuận";
                  const locationText = job.location || job.branch?.name || "TP. Hồ Chí Minh";
                  const categoryName = typeof job.category === "string" ? job.category : job.category?.name;
                  const jobLevelName = typeof job.jobLevel === "string" ? job.jobLevel : job.jobLevel?.name;

                  return (
                    <Card
                      key={job.id || job.jobID}
                      className="premium-card candidate-job-card"
                      style={{
                        borderRadius: 16,
                        border: "1px solid #E2E8F0",
                        boxShadow: "0 2px 12px rgba(15, 23, 42, 0.03)",
                        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                        background: "#FFFFFF",
                        marginBottom: 16,
                      }}
                      bodyStyle={{ padding: "24px 28px" }}
                    >
                      <div className="candidate-job-card-layout" style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                        {/* Container Logo Icon Công nghệ/Ngành nghề bên trái */}
                        <div
                          className="candidate-job-card-icon"
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: 16,
                            background: "rgba(37, 99, 235, 0.08)",
                            color: "#2563EB",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 24,
                            flexShrink: 0,
                          }}
                        >
                          {getJobCategoryIcon(jobTitle)}
                        </div>

                        {/* Nội dung thông tin chi tiết việc làm */}
                        <div className="candidate-job-card-content" style={{ flex: 1, minWidth: 0 }}>
                          {/* Hàng 1: Tiêu đề + AI Match Tag + Mức lương & Lưu */}
                          <div className="candidate-job-card-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                            <div className="candidate-job-card-title-block" style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                                <Title
                                  level={4}
                                  onClick={() => navigate(`/jobs/${job.id || job.jobID}`)}
                                  style={{
                                    margin: 0,
                                    fontSize: 19,
                                    fontWeight: 800,
                                    color: "#0F172A",
                                    cursor: "pointer",
                                    lineHeight: 1.35,
                                  }}
                                >
                                  {jobTitle}
                                </Title>

                                {isLoggedIn && isCandidate && matchResult.matched.length > 0 && (
                                  <Tag
                                    color="blue"
                                    style={{
                                      borderRadius: 20,
                                      fontWeight: 700,
                                      padding: "3px 10px",
                                      fontSize: 11,
                                      margin: 0,
                                    }}
                                  >
                                    <CheckCircleOutlined /> Khớp {matchResult.matched.length}/{matchResult.total} kỹ năng
                                  </Tag>
                                )}
                              </div>

                              {/* Công ty & Các Tag Ngành nghề / Cấp bậc */}
                              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                <Text strong style={{ fontSize: 14, color: "#475569" }}>
                                  {companyName}
                                </Text>
                                {categoryName && (
                                  <Tag style={{ background: "#F1F5F9", border: "1px solid #CBD5E1", color: "#475569", borderRadius: 8, margin: 0, fontSize: 11, fontWeight: 600 }}>
                                    {categoryName}
                                  </Tag>
                                )}
                                {jobLevelName && (
                                  <Tag style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1D4ED8", borderRadius: 8, margin: 0, fontSize: 11, fontWeight: 600 }}>
                                    {jobLevelName}
                                  </Tag>
                                )}
                              </div>
                            </div>

                            {/* Góc phải: Mức Lương & Nút Lưu */}
                            <div className="candidate-job-card-salary-row" style={{ textAlign: "right", flexShrink: 0, display: "flex", alignItems: "center", gap: 12 }}>
                              <div className="candidate-job-card-salary" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", padding: "6px 14px", borderRadius: 12 }}>
                                <Text strong style={{ fontSize: 17, color: "#10B981", fontWeight: 800, display: "block" }}>
                                  {salaryText}
                                </Text>
                              </div>
                              <Button
                                type="text"
                                size="large"
                                icon={
                                  isSaved ? (
                                    <StarFilled style={{ fontSize: 22, color: "#F59E0B" }} />
                                  ) : (
                                    <StarOutlined style={{ fontSize: 22, color: "#94A3B8" }} />
                                  )
                                }
                                onClick={(e) => handleToggleSaveJob(job.id || job.jobID, e)}
                                style={{ padding: 0 }}
                              />
                            </div>
                          </div>

                          {/* Hàng 2: Địa điểm, Ngày đăng, Hạn nộp */}
                          <div className="candidate-job-card-meta" style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", fontSize: 13, color: "#64748B", margin: "12px 0 14px" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                              <EnvironmentOutlined style={{ color: "#2563EB" }} />
                              <strong style={{ color: "#334155" }}>{locationText}</strong>
                            </span>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                              <ClockCircleOutlined style={{ color: "#94A3B8" }} />
                              Đăng ngày: {job.updatedAt || job.createdAt ? new Date(job.updatedAt || job.createdAt).toLocaleDateString("vi-VN") : "Mới cập nhật"}
                            </span>
                            {job.deadline && (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#DC2626", fontWeight: 600 }}>
                                Hạn nộp: {new Date(job.deadline).toLocaleDateString("vi-VN")}
                              </span>
                            )}
                          </div>

                          {/* Hàng 3: Trích đoạn Yêu cầu & Mô tả công việc */}
                          {(job.requirements || job.description) && (
                            <div style={{ background: "#F8FAFC", padding: "12px 16px", borderRadius: 12, border: "1px solid #F1F5F9", marginBottom: 14 }}>
                              <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 4, color: "#64748B" }}>
                                Mô tả & Yêu cầu công việc:
                              </Text>
                              <Paragraph ellipsis={{ rows: 2 }} style={{ color: "#334155", fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                                {job.requirements || job.description}
                              </Paragraph>
                            </div>
                          )}

                          {/* Hàng 4: Kỹ năng trùng khớp CV */}
                          {matchResult.matched.length > 0 && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                              <span style={{ fontSize: 12, color: "#059669", fontWeight: 700 }}>
                                ✓ Trùng khớp CV của bạn:
                              </span>
                              {matchResult.matched.map((sk: string, sIdx: number) => (
                                <Tag key={sIdx} color="emerald" style={{ fontSize: 11, padding: "2px 8px", borderRadius: 8, margin: 0, backgroundColor: "#ECFDF5", color: "#059669", borderColor: "#A7F3D0", fontWeight: 700 }}>
                                  {sk}
                                </Tag>
                              ))}
                            </div>
                          )}

                          {/* Hàng 5: Nút Thao tác Ứng tuyển & Xem chi tiết */}
                          <div className="candidate-job-card-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid #F1F5F9" }}>
                            <Space className="candidate-job-card-actions" size={12}>
                              <Button
                                type="primary"
                                onClick={() => navigate(`/jobs/${job.id || job.jobID}`)}
                                style={{ borderRadius: 8, background: "#2563EB", fontWeight: 700, fontSize: 13, height: 36, padding: "0 22px" }}
                              >
                                Ứng tuyển ngay
                              </Button>
                              <Button
                                onClick={() => navigate(`/jobs/${job.id || job.jobID}`)}
                                style={{ borderRadius: 8, fontWeight: 600, fontSize: 13, height: 36, borderColor: "#CBD5E1", color: "#334155" }}
                              >
                                Xem chi tiết
                              </Button>
                            </Space>

                            <Text className="candidate-job-card-code" type="secondary" style={{ fontSize: 12 }}>
                              Mã tin: #{getPublicJobCode(job.id || job.jobID)}
                            </Text>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}

                {/* Phân trang */}
                {totalCount > 10 && (
                  <div style={{ textAlign: "center", marginTop: 24 }}>
                    <Pagination
                      current={pageIndex}
                      pageSize={12}
                      total={totalCount}
                      onChange={(page) => setPageIndex(page)}
                      showSizeChanger={false}
                      responsive
                    />
                  </div>
                )}
              </div>
            )}
          </Col>
        </Row>
      </div>
    </div>
  );
}
