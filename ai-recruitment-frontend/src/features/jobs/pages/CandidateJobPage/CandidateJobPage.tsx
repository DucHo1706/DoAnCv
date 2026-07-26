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
} from "antd";
import {
  SearchOutlined,
  EnvironmentOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  StarOutlined,
  StarFilled,
  ThunderboltOutlined,
  CheckCircleOutlined,
  DollarOutlined
} from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import axiosClient from "../../../../services/axiosClient";
import { appTheme } from "../../../../constants/theme";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

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

export default function CandidateJobPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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
        setBranches(branchRes.data?.$values || branchRes.data || []);
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

  // Thuật toán tính toán AI Match score giữa CV ứng viên và Công việc
  const calculateJobMatch = (job: any) => {
    if (!candidateSkills || candidateSkills.length === 0) return { score: 0, matched: [] };
    const validSkills = candidateSkills.filter(s => s && s.trim().length > 1);
    if (validSkills.length === 0) return { score: 0, matched: [] };

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

    const isTechJob = ["developer", "engineer", "lập trình", "software", "react", "frontend", "backend", "fullstack", "devops", "cloud", "data", "python", "java", "c#", ".net", "design", "figma", "ui/ux", "it", "hệ thống", "tester", "qa", "web"].some(k => title.toLowerCase().includes(k));

    let score = 0;
    if (matched.length > 0) {
      score = Math.min(98, Math.round((matched.length / validSkills.length) * 50) + 48);
    } else if (isTechJob) {
      score = 55;
    }

    return { score, matched };
  };

  // Sắp xếp danh sách việc làm
  const processedJobs = [...jobs].sort((a, b) => {
    if (sortBy === "aiMatch") {
      const matchA = calculateJobMatch(a).score;
      const matchB = calculateJobMatch(b).score;
      return matchB - matchA;
    }
    return 0; // Giữ nguyên thứ tự từ API (Mới cập nhật)
  });

  return (
    <div style={{ background: appTheme.colors.background, minHeight: "100vh", paddingBottom: 60 }}>
      {/* 1. KHU VỰC TÌM KIẾM (SEARCH HERO SECTION) */}
      <div
        style={{
          background: "#F8FAFC",
          padding: "40px 20px 24px",
          borderBottom: "1px solid #E2E8F0",
        }}
      >
        <div style={{ maxWidth: "1300px", margin: "0 auto" }}>
          <Title level={2} style={{ color: "#0F172A", marginBottom: 8, fontWeight: 800, fontSize: 28, letterSpacing: "-0.02em" }}>
            Tìm kiếm cơ hội nghề nghiệp phù hợp
          </Title>
          <Text type="secondary" style={{ fontSize: 14, display: "block", marginBottom: 20 }}>
            Hệ thống tự động kết nối và cá nhân hóa gợi ý việc làm chuẩn xác dựa trên CV của bạn.
          </Text>

          <div
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
      <div style={{ maxWidth: "1300px", margin: "28px auto 0", padding: "0 20px" }}>
        <Row gutter={24}>
          {/* Cột trái: Bộ lọc Sidebar */}
          <Col xs={24} lg={6} xl={6}>
            <Card
              title={<span style={{ fontWeight: 700, fontSize: 16 }}>Lọc nâng cao</span>}
              style={{ ...glassCardStyle, position: "sticky", top: 100 }}
              bodyStyle={{
                padding: "16px 20px",
                maxHeight: "calc(100vh - 120px)",
                overflowY: "auto",
              }}
              extra={
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
                    {jobLevels.map((l) => (
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
              </Space>
            </Card>
          </Col>

          {/* Cột phải: Danh sách việc làm */}
          <Col xs={24} lg={18} xl={18}>
            {/* Thanh Tiêu đề & Sắp xếp cá nhân hóa */}
            <div
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

              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", flex: 1, justifyContent: "flex-end" }}>
                <Text type="secondary" style={{ fontSize: 14, whiteSpace: "nowrap" }}>Sắp xếp theo:</Text>
                <Select
                  value={sortBy}
                  onChange={setSortBy}
                  style={{ minWidth: 200, maxWidth: 260 }}
                  size="middle"
                >
                  {isLoggedIn && isCandidate && candidateSkills.length > 0 && (
                    <Option value="aiMatch">
                      <Space size={4}>
                        <ThunderboltOutlined style={{ color: "#2563EB" }} />
                        <span>Phù hợp nhất với CV (AI)</span>
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
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <Spin size="large" tip="Đang tải danh sách việc làm..." />
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

                  return (
                    <Card
                      key={job.id || job.jobID}
                      hoverable
                      onClick={() => navigate(`/jobs/${job.id || job.jobID}`)}
                      style={{
                        borderRadius: 16,
                        border: "1px solid #E2E8F0",
                        boxShadow: "0 2px 10px rgba(15, 23, 42, 0.03)",
                        transition: "all 0.2s ease",
                        background: "#FFFFFF"
                      }}
                      bodyStyle={{ padding: "20px 24px" }}
                    >
                      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                        {/* Container Logo Công ty bên trái */}
                        <div
                          style={{
                            width: 54,
                            height: 54,
                            borderRadius: 12,
                            background: "#EFF6FF",
                            border: "1px solid #DBEAFE",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0
                          }}
                        >
                          <img
                            src="https://cdn-icons-png.flaticon.com/512/3061/3061341.png"
                            alt="Logo"
                            style={{ width: 32, height: 32 }}
                          />
                        </div>

                        {/* Nội dung thông tin công việc */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 4 }}>
                            <div>
                              <Title level={4} style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0F172A", display: "inline-block", marginRight: 8 }}>
                                {job.title || job.position}
                              </Title>

                              {/* Badge Cá nhân hóa AI Match Score */}
                              {isLoggedIn && isCandidate && matchResult.score >= 50 && (
                                <Tag color="purple" style={{ borderRadius: 6, fontWeight: 700, padding: "2px 8px", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4 }}>
                                  <ThunderboltOutlined /> AI Match: {matchResult.score}%
                                </Tag>
                              )}
                            </div>

                            {/* Mức lương & Nút Ngôi sao ở góc phải trên */}
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <Text strong style={{ fontSize: 16, color: "#10B981", display: "block", marginBottom: 4 }}>
                                {job.salary || "Thỏa thuận"}
                              </Text>
                              <Button
                                type="text"
                                size="small"
                                icon={
                                  isSaved ? (
                                    <StarFilled style={{ fontSize: 20, color: "#F59E0B" }} />
                                  ) : (
                                    <StarOutlined style={{ fontSize: 20, color: "#94A3B8" }} />
                                  )
                                }
                                onClick={(e) => handleToggleSaveJob(job.id || job.jobID, e)}
                                style={{ padding: 0 }}
                              />
                            </div>
                          </div>

                          <Text style={{ fontSize: 14, color: "#64748B", display: "block", marginBottom: 10 }}>
                            {job.company || "Công Ty AI Recruitment"}
                          </Text>

                          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", fontSize: 13, color: "#64748B", marginBottom: 10 }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <EnvironmentOutlined style={{ color: "#94A3B8" }} /> {job.location || "TP. Hồ Chí Minh"}
                            </span>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <ClockCircleOutlined style={{ color: "#94A3B8" }} /> {job.updatedAt ? new Date(job.updatedAt).toLocaleDateString("vi-VN") : "Mới đăng"}
                            </span>
                            {job.type && (
                              <Tag color="blue" style={{ borderRadius: 6, margin: 0, fontWeight: 500 }}>
                                {job.type}
                              </Tag>
                            )}
                          </div>

                          {job.description && (
                            <Paragraph
                              ellipsis={{ rows: 2 }}
                              style={{ color: "#475569", fontSize: 13, margin: "6px 0 0", lineHeight: 1.6 }}
                            >
                              {job.description}
                            </Paragraph>
                          )}

                          {/* Kỹ năng trùng khớp cá nhân hóa */}
                          {matchResult.matched.length > 0 && (
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                              <span style={{ fontSize: 12, color: "#059669", fontWeight: 600 }}>
                                ✓ Trùng khớp kỹ năng CV của bạn:
                              </span>
                              {matchResult.matched.map((sk: string, sIdx: number) => (
                                <Tag key={sIdx} color="emerald" style={{ fontSize: 11, padding: "0 6px", borderRadius: 4, margin: 0, backgroundColor: "#ECFDF5", color: "#059669", borderColor: "#A7F3D0", fontWeight: 600 }}>
                                  {sk}
                                </Tag>
                              ))}
                            </div>
                          )}
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
                      pageSize={10}
                      total={totalCount}
                      onChange={(page) => setPageIndex(page)}
                      showSizeChanger={false}
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
