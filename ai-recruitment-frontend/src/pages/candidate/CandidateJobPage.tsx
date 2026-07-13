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
} from "antd";
import {
  SearchOutlined,
  EnvironmentOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import axiosClient from "../../services/axiosClient";
import { appTheme } from "../../constants/theme";

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

export default function CandidateJobPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Khởi tạo giá trị mặc định từ URL (Nếu có truyền từ trang chủ sang)
  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "all");
  const [jobs, setJobs] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isFallback, setIsFallback] = useState(false);

  // State cho Bộ lọc nâng cao
  const [categoryId, setCategoryId] = useState("all");
  const [jobLevelId, setJobLevelId] = useState("all");
  const [salaryMin, setSalaryMin] = useState<number | null>(null);
  const [salaryMax, setSalaryMax] = useState<number | null>(null);
  const [salaryRange, setSalaryRange] = useState("all");
  const [categories, setCategories] = useState<any[]>([]);
  const [jobLevels, setJobLevels] = useState<any[]>([]);

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

  // Fetch Metadata lúc mới mở trang
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const catRes = await axiosClient.get("/Metadata/categories");
        const levelRes = await axiosClient.get("/Metadata/job-levels");
        setCategories(catRes.data?.$values || catRes.data || []);
        setJobLevels(levelRes.data?.$values || levelRes.data || []);
      } catch (error) {
        console.error("Lỗi lấy metadata:", error);
      }
    };
    fetchMetadata();
  }, []);





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
          PageSize: 10,
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

  // Tự động gọi Tìm kiếm khi người dùng đổi các bộ lọc chính
  useEffect(() => {
    handleSearch();
  }, [categoryId, jobLevelId, location, salaryMin, salaryMax]);

  const handleSearch = () => {
    // Cập nhật lại thanh URL để người dùng có thể copy link chia sẻ
    const params = new URLSearchParams(searchParams);
    if (keyword) params.set("keyword", keyword);
    else params.delete("keyword");
    if (location && location !== "all") params.set("location", location);
    else params.delete("location");
    navigate(`/jobs?${params.toString()}`, { replace: true });

    if (pageIndex === 1) fetchJobs();
    else setPageIndex(1); // Set state = 1 sẽ tự động trigger useEffect
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
    setTimeout(() => fetchJobs(), 50); // Fetch lại ngay sau khi reset
  };

  return (
    <div style={{ background: appTheme.colors.background, minHeight: "100vh", paddingBottom: 60 }}>
      {/* 1. KHU VỰC TÌM KIẾM (SEARCH HERO SECTION) */}
      <div
        style={{
          background: "#F8FAFC",
          padding: "48px 20px 24px",
          borderBottom: "1px solid #E2E8F0",
        }}
      >
        <div style={{ maxWidth: "1300px", margin: "0 auto" }}>
          <Title level={2} style={{ color: "#0F172A", marginBottom: 20, fontFamily: appTheme.font.family, fontWeight: 800, fontSize: 28, letterSpacing: "-0.02em" }}>
            Tìm kiếm cơ hội nghề nghiệp tiếp theo
          </Title>

          <div
            style={{
              background: "white",
              padding: "10px 14px",
              borderRadius: 16,
              display: "flex",
              gap: 8,
              boxShadow: "0 8px 30px rgba(15, 23, 42, 0.04)",
              border: "1px solid #E2E8F0",
            }}
          >
            <Input
              size="large"
              placeholder="Nhập tên vị trí, kỹ năng, công ty..."
              prefix={<SearchOutlined style={{ color: "#64748B", fontSize: 20 }} />}
              bordered={false}
              style={{ flex: 2, fontSize: 16, fontFamily: appTheme.font.family }}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
            />
            <Divider type="vertical" style={{ height: "30px", margin: "auto 0" }} />
            <Select
              size="large"
              showSearch
              placeholder="Tất cả địa điểm"
              bordered={false}
              style={{ flex: 1, fontSize: 15, fontFamily: appTheme.font.family }}
              suffixIcon={<EnvironmentOutlined style={{ color: "#64748B" }} />}
              value={location}
              onChange={(val) => setLocation(val)}
            >
              <Option value="all">Tất cả địa điểm</Option>
              <Option value="hn">Hà Nội</Option>
              <Option value="hcm">Hồ Chí Minh</Option>
              <Option value="dn">Đà Nẵng</Option>
            </Select>
            <Button
              type="primary"
              size="large"
              onClick={handleSearch}
              style={{
                borderRadius: 12,
                padding: "0 40px",
                fontSize: 16,
                height: 48,
                background: appTheme.colors.primary,
                borderColor: appTheme.colors.primary,
                fontWeight: 600,
                fontFamily: appTheme.font.family,
              }}
            >
              Tìm kiếm
            </Button>
          </div>
        </div>
      </div>

      {/* 2. KHU VỰC NỘI DUNG CHÍNH */}
      <div style={{ maxWidth: "1300px", margin: "32px auto 0", padding: "0 20px" }}>
        <Row gutter={24}>
          {/* Cột trái: Bộ lọc (Sidebar Filters) - REFACTOR: Chuyển dọc thay vì ngang như TopCV */}
          <Col xs={24} lg={6} xl={5}>
            <Card
              title="Lọc nâng cao"
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
                {/* 1. Lọc theo Địa điểm */}
                <div>
                  <Text strong style={{ display: "block", marginBottom: 12, fontSize: 16 }}>
                    Địa điểm làm việc
                  </Text>
                  <Radio.Group
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    style={{ display: "flex", flexDirection: "column", gap: 12 }}
                  >
                    <Radio value="all" style={{ fontSize: 15 }}>Tất cả địa điểm</Radio>
                    <Radio value="hn" style={{ fontSize: 15 }}>Hà Nội</Radio>
                    <Radio value="hcm" style={{ fontSize: 15 }}>Hồ Chí Minh</Radio>
                    <Radio value="dn" style={{ fontSize: 15 }}>Đà Nẵng</Radio>
                  </Radio.Group>
                </div>

                <Divider style={{ margin: 0 }} />

                {/* 2. Lọc theo Lĩnh vực công việc */}
                <div>
                  <Text strong style={{ display: "block", marginBottom: 12, fontSize: 16 }}>
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
                  <Text strong style={{ display: "block", marginBottom: 12, fontSize: 16 }}>
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
                  <Text strong style={{ display: "block", marginBottom: 12, fontSize: 16 }}>
                    Khoảng lương tuyển dụng
                  </Text>
                  <Radio.Group
                    value={salaryRange}
                    onChange={(e) => handleSalaryRangeChange(e.target.value)}
                    style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}
                  >
                    <Radio value="all" style={{ fontSize: 15 }}>Tất cả mức lương</Radio>
                    <Radio value="under10" style={{ fontSize: 15 }}>Dưới 10 triệu</Radio>
                    <Radio value="10to15" style={{ fontSize: 15 }}>10 - 15 triệu</Radio>
                    <Radio value="15to20" style={{ fontSize: 15 }}>15 - 20 triệu</Radio>
                    <Radio value="20to25" style={{ fontSize: 15 }}>20 - 25 triệu</Radio>
                    <Radio value="25to30" style={{ fontSize: 15 }}>25 - 30 triệu</Radio>
                    <Radio value="30to50" style={{ fontSize: 15 }}>30 - 50 triệu</Radio>
                    <Radio value="over50" style={{ fontSize: 15 }}>Trên 50 triệu</Radio>
                  </Radio.Group>

                  <Text type="secondary" style={{ display: "block", marginBottom: 8, fontSize: 14 }}>
                    Nhập khoảng lương tự chọn (triệu):
                  </Text>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
          <Col xs={24} lg={18} xl={19}>
            <div
              style={{
                background: appTheme.colors.surface,
                padding: "16px 24px",
                borderRadius: 16,
                marginBottom: 24,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: appTheme.shadow.card,
                border: `1px solid ${appTheme.colors.border}`,
              }}
            >
              <Title level={4} style={{ margin: 0, fontSize: 18, fontFamily: appTheme.font.family, fontWeight: 600 }}>
                Tìm thấy <span style={{ color: appTheme.colors.primary }}>{totalCount}</span> việc làm phù hợp
              </Title>

              <Space size="large" wrap>
                <Space>
                  <Text type="secondary" style={{ fontSize: 14, fontFamily: appTheme.font.family }}>
                    Tìm kiếm theo:
                  </Text>
                  <Select defaultValue="all" style={{ width: 160 }} size="large">
                    <Option value="all">Tất cả</Option>
                    <Option value="jobName">Tên việc làm</Option>
                    <Option value="companyName">Tên công ty</Option>
                  </Select>
                </Space>
                <Space>
                  <Text type="secondary" style={{ fontSize: 14, fontFamily: appTheme.font.family }}>
                    Sắp xếp theo:
                  </Text>
                  <Select defaultValue="new" style={{ width: 180 }} size="large">
                    <Option value="new">Mới cập nhật</Option>
                    <Option value="salary">Lương cao đến thấp</Option>
                  </Select>
                </Space>
              </Space>
            </div>

            {isFallback && (
              <div
                style={{
                  background: "#FEF3C7",
                  border: "1px solid #F59E0B",
                  borderRadius: "12px",
                  padding: "16px 24px",
                  marginBottom: "24px",
                  color: "#D97706",
                  fontWeight: 600,
                  fontSize: "15px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12
                }}
              >
                <ExclamationCircleOutlined style={{ fontSize: 20 }} />
                <span>
                  Chúng tôi không tìm thấy kết quả phù hợp cho từ khóa của bạn. Dưới đây là danh sách việc làm nổi bật đang tuyển dụng gấp:
                </span>
              </div>
            )}

            {/* Map danh sách công việc */}
            <Spin spinning={loading} tip="Đang tải danh sách việc làm...">
              <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                {jobs.map((job) => (
                <Card
                  key={job.id}
                  hoverable
                  style={{
                    borderRadius: 16,
                    overflow: "hidden",
                    border: `1px solid ${appTheme.colors.border}`,
                    boxShadow: appTheme.shadow.card,
                    marginBottom: 16,
                  }}
                  bodyStyle={{ padding: 24 }}
                >
                  <Row gutter={24} wrap={false} align="middle">
                    <Col flex="100px">
                      <img
                        src={job.logo}
                        alt="company"
                        style={{
                          width: 100,
                          height: 100,
                          objectFit: "contain",
                          borderRadius: 12,
                          border: `1px solid ${appTheme.colors.border}`,
                          padding: 8,
                          background: "#fff",
                        }}
                      />
                    </Col>
                    <Col flex="auto" style={{ minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 16,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Title
                            level={3}
                            style={{
                              margin: 0,
                              color: appTheme.colors.textPrimary,
                              cursor: "pointer",
                              fontSize: 18,
                              lineHeight: 1.4,
                              fontFamily: appTheme.font.family,
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                            onClick={() => navigate(`/jobs/${job.id}`)}
                          >
                            {job.title}
                          </Title>
                          <Text
                            style={{
                              color: appTheme.colors.textSecondary,
                              fontSize: 14,
                              marginTop: 6,
                              display: "block",
                              fontFamily: appTheme.font.family,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {job.company}
                          </Text>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <Text strong style={{ color: appTheme.colors.success, fontSize: 16, display: "block", fontFamily: appTheme.font.family }}>
                            {job.salary}
                          </Text>
                        </div>
                      </div>

                      <Space size="large" style={{ marginTop: 16, color: appTheme.colors.textSecondary, fontSize: 13, fontFamily: appTheme.font.family }}>
                        <span>
                          <EnvironmentOutlined style={{ marginRight: 6 }} />
                          {job.location}
                        </span>
                        <span>
                          <ClockCircleOutlined style={{ marginRight: 6 }} />
                          {job.updatedAt}
                        </span>
                        <Tag
                          color="blue"
                          style={{ fontSize: 15, padding: "4px 10px", borderRadius: 6 }}
                        >
                          {job.type}
                        </Tag>
                      </Space>

                      {/* Phân cách và hiển thị Mô tả + Kỹ năng để tăng chiều cao */}
                      <div
                        style={{ marginTop: 20, paddingTop: 16, borderTop: `1px dashed ${appTheme.colors.border}` }}
                      >
                        <Paragraph
                          ellipsis={{ rows: 2, expandable: false }}
                          style={{
                            fontSize: 14,
                            color: appTheme.colors.textSecondary,
                            display: "block",
                            marginBottom: 12,
                            lineHeight: 1.6,
                            fontFamily: appTheme.font.family,
                          }}
                        >
                          {job.description || "Chưa có mô tả chi tiết."}
                        </Paragraph>
                        <Space wrap size={[0, 8]}>
                          {job.skills?.map((skill: string) => (
                            <Tag
                              key={skill}
                              style={{
                                fontSize: 12,
                                padding: "3px 10px",
                                background: "#F1F5F9",
                                border: "none",
                                color: "#475569",
                                borderRadius: 6,
                                fontFamily: appTheme.font.family,
                              }}
                            >
                              {skill}
                            </Tag>
                          ))}
                        </Space>
                      </div>
                    </Col>
                  </Row>
                </Card>
                ))}
              </Space>
            </Spin>

            {/* Phân trang */}
            <div style={{ textAlign: "center", marginTop: 40 }}>
              <Pagination
                current={pageIndex}
                total={totalCount}
                pageSize={10}
                showSizeChanger={false}
                onChange={(page) => setPageIndex(page)}
              />
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
}
