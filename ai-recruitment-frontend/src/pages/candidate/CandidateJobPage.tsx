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
  Checkbox,
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
  LoadingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  RobotOutlined,
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
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [isFallback, setIsFallback] = useState(false);

  // State cho Bộ lọc nâng cao
  const [categoryId, setCategoryId] = useState("all");
  const [jobLevelId, setJobLevelId] = useState("all");
  const [salaryMin, setSalaryMin] = useState<number | null>(null);
  const [salaryMax, setSalaryMax] = useState<number | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [jobLevels, setJobLevels] = useState<any[]>([]);

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

  const normalizeArrayData = (data: any) => {
    if (Array.isArray(data)) {
      return data;
    }

    return data?.$values || [];
  };

  const getJobId = (job: any) => {
    return job?.id || job?.jobId || job?.jobID || "";
  };

  const getApplicationJobId = (application: any) => {
    return application?.jobId || application?.jobID || "";
  };

  const findApplicationByJobId = (jobId: string) => {
    return myApplications.find((application) => {
      return getApplicationJobId(application) === jobId;
    });
  };

  const isApplicationAiReady = (application: any) => {
    if (!application) {
      return false;
    }

    if (application.aiStatus === "Completed") {
      return true;
    }

    if (application.hasAiEvaluation === true && application.classification !== "AI_ERROR") {
      return true;
    }

    return false;
  };

  const isApplicationAiProcessing = (application: any) => {
    if (!application) {
      return false;
    }

    if (application.aiStatus === "Processing") {
      return true;
    }

    if (application.hasAiEvaluation === false) {
      return true;
    }

    return false;
  };

  const isApplicationAiFailed = (application: any) => {
    if (!application) {
      return false;
    }

    if (application.aiStatus === "Failed") {
      return true;
    }

    if (application.classification === "AI_ERROR") {
      return true;
    }

    return false;
  };

  const getAiScoreText = (application: any) => {
    if (!application) {
      return "Chưa chấm";
    }

    if (isApplicationAiProcessing(application) === true) {
      return "Đang phân tích";
    }

    if (isApplicationAiFailed(application) === true) {
      return "AI lỗi";
    }

    if (isApplicationAiReady(application) === true) {
      return `${Math.round(Number(application.aiScore || 0))}/100`;
    }

    return "Chưa chấm";
  };

  const getAiTagColor = (application: any) => {
    if (!application) {
      return "default";
    }

    if (isApplicationAiProcessing(application) === true) {
      return "processing";
    }

    if (isApplicationAiFailed(application) === true) {
      return "red";
    }

    const score = Number(application.aiScore || 0);

    if (score >= 80) {
      return "green";
    }

    if (score >= 50) {
      return "orange";
    }

    return "red";
  };

  const renderAiMatchTag = (job: any) => {
    const jobId = getJobId(job);
    const application = findApplicationByJobId(jobId);

    let icon = <RobotOutlined />;

    if (isApplicationAiProcessing(application) === true) {
      icon = <LoadingOutlined />;
    } else if (isApplicationAiFailed(application) === true) {
      icon = <ExclamationCircleOutlined />;
    } else if (isApplicationAiReady(application) === true) {
      icon = <CheckCircleOutlined />;
    }

    return (
      <Tag
        icon={icon}
        color={getAiTagColor(application)}
        style={{
          marginTop: 12,
          fontSize: 16,
          padding: "6px 12px",
          borderRadius: 6,
        }}
      >
        AI Match: {getAiScoreText(application)}
      </Tag>
    );
  };

  const fetchMyApplications = async () => {
    try {
      const response = await axiosClient.get("/Recruitment/my-applications");
      const applications = normalizeArrayData(response.data);

      setMyApplications(applications);

      return applications;
    } catch (error: any) {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        setMyApplications([]);
        return [];
      }

      console.error("Lỗi lấy lịch sử ứng tuyển:", error);
      setMyApplications([]);
      return [];
    }
  };

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
    fetchMyApplications();
  }, [pageIndex]);

  // Tự động gọi Tìm kiếm khi người dùng đổi Category hoặc Level
  useEffect(() => {
    handleSearch();
  }, [categoryId, jobLevelId]);

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
                {/* Nghỉ thứ 7 */}
                <div>
                  <Text strong style={{ display: "block", marginBottom: 12, fontSize: 16 }}>
                    Nghỉ thứ 7
                  </Text>
                  <Radio.Group
                    defaultValue="all"
                    style={{ display: "flex", flexDirection: "column", gap: 12 }}
                  >
                    <Radio value="all" style={{ fontSize: 15 }}>
                      Không lọc
                    </Radio>
                    <Radio value="work" style={{ fontSize: 15 }}>
                      Làm thứ 7
                    </Radio>
                    <Radio value="off" style={{ fontSize: 15 }}>
                      Nghỉ thứ 7
                    </Radio>
                    <Radio value="na" style={{ fontSize: 15 }}>
                      Tin đăng không đề cập
                    </Radio>
                  </Radio.Group>
                </div>

                <Divider style={{ margin: 0 }} />

                {/* Theo danh mục nghề */}
                <div>
                  <Text strong style={{ display: "block", marginBottom: 12, fontSize: 16 }}>
                    Theo danh mục nghề
                  </Text>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <Checkbox style={{ fontSize: 15 }}>Kế toán</Checkbox>{" "}
                    <Text type="secondary" style={{ fontSize: 14 }}>
                      (4495)
                    </Text>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <Checkbox style={{ fontSize: 15 }}>Marketing</Checkbox>{" "}
                    <Text type="secondary" style={{ fontSize: 14 }}>
                      (4113)
                    </Text>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <Checkbox style={{ fontSize: 15 }}>Quản lý dự án xây dựng</Checkbox>{" "}
                    <Text type="secondary" style={{ fontSize: 14 }}>
                      (1875)
                    </Text>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <Checkbox style={{ fontSize: 15 }}>Nhân sự</Checkbox>{" "}
                    <Text type="secondary" style={{ fontSize: 14 }}>
                      (1517)
                    </Text>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Checkbox style={{ fontSize: 15 }}>Thiết kế và Kiến trúc</Checkbox>{" "}
                    <Text type="secondary" style={{ fontSize: 14 }}>
                      (1501)
                    </Text>
                  </div>
                </div>

                <Divider style={{ margin: 0 }} />

                {/* Kinh nghiệm */}
                <div>
                  <Text strong style={{ display: "block", marginBottom: 12, fontSize: 16 }}>
                    Kinh nghiệm
                  </Text>
                  <Select
                    size="large"
                    placeholder="Chọn kinh nghiệm"
                    style={{ width: "100%" }}
                    mode="multiple"
                    maxTagCount="responsive"
                    defaultValue={["all"]}
                  >
                    <Option value="all">Tất cả</Option>
                    <Option value="none">Không yêu cầu</Option>
                    <Option value="under_1">Dưới 1 năm</Option>
                    <Option value="1">1 năm</Option>
                    <Option value="2">2 năm</Option>
                    <Option value="3">3 năm</Option>
                    <Option value="4">4 năm</Option>
                    <Option value="5">5 năm</Option>
                    <Option value="over_5">Trên 5 năm</Option>
                  </Select>
                </div>

                <Divider style={{ margin: 0 }} />

                {/* Lĩnh vực công ty */}
                <div>
                  <Text strong style={{ display: "block", marginBottom: 12, fontSize: 16 }}>
                    Lĩnh vực công ty
                  </Text>
                  <Select size="large" defaultValue="all" style={{ width: "100%" }} showSearch>
                    <Option value="all">Tất cả lĩnh vực</Option>
                    <Option value="it">IT - Phần mềm</Option>
                    <Option value="finance">Tài chính - Ngân hàng</Option>
                    <Option value="education">Giáo dục / Đào tạo</Option>
                  </Select>
                </div>

                <Divider style={{ margin: 0 }} />

                {/* Lĩnh vực công việc */}
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

                {/* Loại công ty */}
                <div>
                  <Text strong style={{ display: "block", marginBottom: 12, fontSize: 16 }}>
                    Loại công ty
                  </Text>
                  <Radio.Group
                    defaultValue="all"
                    style={{ display: "flex", flexDirection: "column", gap: 12 }}
                  >
                    <Radio value="all" style={{ fontSize: 15 }}>
                      Tất cả
                    </Radio>
                    <Radio value="pro" style={{ fontSize: 15 }}>
                      Pro Company
                    </Radio>
                  </Radio.Group>
                </div>

                <Divider style={{ margin: 0 }} />

                {/* Mức lương */}
                <div>
                  <Text strong style={{ display: "block", marginBottom: 12, fontSize: 16 }}>
                    Mức lương
                  </Text>
                  <Space
                    direction="vertical"
                    size="middle"
                    style={{ width: "100%", marginBottom: 16 }}
                  >
                    <Checkbox defaultChecked style={{ fontSize: 15 }}>
                      Tất cả
                    </Checkbox>
                    <Checkbox style={{ fontSize: 15 }}>Dưới 10 triệu</Checkbox>
                    <Checkbox style={{ fontSize: 15 }}>10 - 15 triệu</Checkbox>
                    <Checkbox style={{ fontSize: 15 }}>15 - 20 triệu</Checkbox>
                    <Checkbox style={{ fontSize: 15 }}>20 - 25 triệu</Checkbox>
                    <Checkbox style={{ fontSize: 15 }}>25 - 30 triệu</Checkbox>
                    <Checkbox style={{ fontSize: 15 }}>30 - 50 triệu</Checkbox>
                    <Checkbox style={{ fontSize: 15 }}>Trên 50 triệu</Checkbox>
                    <Checkbox style={{ fontSize: 15 }}>Thoả thuận</Checkbox>
                  </Space>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <InputNumber
                      size="large"
                      placeholder="Từ"
                      style={{ width: "100%" }}
                      value={salaryMin}
                      onChange={setSalaryMin}
                      onPressEnter={handleSearch}
                    />
                    <span>-</span>
                    <InputNumber
                      size="large"
                      placeholder="Đến"
                      style={{ width: "100%" }}
                      value={salaryMax}
                      onChange={setSalaryMax}
                      onPressEnter={handleSearch}
                    />
                    <span>triệu</span>
                  </div>
                </div>

                <Divider style={{ margin: 0 }} />

                {/* Cấp bậc */}
                <div>
                  <Text strong style={{ display: "block", marginBottom: 12, fontSize: 16 }}>
                    Cấp bậc
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

                {/* Loại hình làm việc */}
                <div>
                  <Text strong style={{ display: "block", marginBottom: 12, fontSize: 16 }}>
                    Loại hình làm việc
                  </Text>
                  <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                    <Checkbox defaultChecked style={{ fontSize: 15 }}>
                      Tất cả
                    </Checkbox>
                    <Checkbox style={{ fontSize: 15 }}>Toàn thời gian</Checkbox>
                    <Checkbox style={{ fontSize: 15 }}>Bán thời gian</Checkbox>
                    <Checkbox style={{ fontSize: 15 }}>Thực tập</Checkbox>
                    <Checkbox style={{ fontSize: 15 }}>Khác</Checkbox>
                  </Space>
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
                  <Select defaultValue="ai" style={{ width: 220 }} size="large">
                    <Option value="ai">
                      <RobotOutlined style={{ color: appTheme.colors.primary }} /> Gợi ý từ AI Toppy
                    </Option>
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
                          {renderAiMatchTag(job)}
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
