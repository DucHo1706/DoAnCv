import { useEffect, useState } from "react";
import { Button, Col, Row, Typography, Card, Space, Input, Tag, Spin, Select, Divider } from "antd";
import {
  SearchOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  RobotOutlined,
  FireOutlined,
  StarOutlined,
  CodeOutlined,
  LineChartOutlined,
  NotificationOutlined,
  CalculatorOutlined,
  TeamOutlined,
  FormatPainterOutlined,
  ReadOutlined,
  BuildOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { jobService } from "../../services/jobService";
import axiosClient from "../../services/axiosClient";
import type { JobDto } from "../../services/jobService";

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

function HomePage() {
  const navigate = useNavigate();
  const [recentJobs, setRecentJobs] = useState<JobDto[]>([]);
  const [trendingCategories, setTrendingCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [searchLocation, setSearchLocation] = useState("all");

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const [jobsData, trendingData] = await Promise.all([
          jobService.getJobs(),
          axiosClient.get("/Jobs/trending-categories"),
        ]);

        const jobsArray = Array.isArray(jobsData) ? jobsData : (jobsData as any)?.$values || [];
        setRecentJobs(jobsArray.slice(0, 6));

        const trendingArray = Array.isArray(trendingData.data)
          ? trendingData.data
          : trendingData.data?.$values || [];

        // Fallback: Nếu hệ thống chưa có công việc nào được duyệt, hiển thị dữ liệu mẫu cho đẹp UI
        if (trendingArray.length === 0) {
          setTrendingCategories([
            { id: "it", name: "IT - Phần mềm", count: 0 },
            { id: "sales", name: "Kinh doanh / Bán hàng", count: 0 },
            { id: "marketing", name: "Marketing / Truyền thông", count: 0 },
            { id: "accounting", name: "Kế toán / Kiểm toán", count: 0 },
            { id: "hr", name: "Nhân sự", count: 0 },
            { id: "education", name: "Giáo dục / Đào tạo", count: 0 },
          ]);
        } else {
          setTrendingCategories(trendingArray);
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu trang chủ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  // Hàm gán Icon tự động dựa trên tên ngành nghề (Bảo tồn giao diện chuẩn)
  const getCategoryIcon = (name: string) => {
    if (!name) return <StarOutlined />;
    const lowerName = name.toLowerCase();
    if (
      lowerName.includes("it") ||
      lowerName.includes("công nghệ") ||
      lowerName.includes("phần mềm")
    )
      return <CodeOutlined />;
    if (
      lowerName.includes("kinh doanh") ||
      lowerName.includes("bán hàng") ||
      lowerName.includes("sale")
    )
      return <LineChartOutlined />;
    if (lowerName.includes("marketing") || lowerName.includes("truyền thông"))
      return <NotificationOutlined />;
    if (
      lowerName.includes("kế toán") ||
      lowerName.includes("kiểm toán") ||
      lowerName.includes("tài chính")
    )
      return <CalculatorOutlined />;
    if (lowerName.includes("nhân sự") || lowerName.includes("hr")) return <TeamOutlined />;
    if (
      lowerName.includes("thiết kế") ||
      lowerName.includes("mỹ thuật") ||
      lowerName.includes("design")
    )
      return <FormatPainterOutlined />;
    if (lowerName.includes("giáo dục") || lowerName.includes("đào tạo")) return <ReadOutlined />;
    if (lowerName.includes("xây dựng") || lowerName.includes("kiến trúc")) return <BuildOutlined />;
    return <StarOutlined />;
  };

  const handleSearch = () => {
    // Chuyển hướng sang trang việc làm kèm theo tham số lọc
    navigate(`/jobs?keyword=${encodeURIComponent(searchValue)}&location=${searchLocation}`);
  };

  return (
    <div style={{ width: "100%" }}>
      {/* 1. HEADER & BANNER SECTION (TOPCV STYLE) */}
      <div style={{ background: "#f4f5f5", padding: "40px 20px 0" }}>
        <div style={{ maxWidth: "94%", margin: "0 auto" }}>
          <Row justify="center" align="middle" style={{ padding: "20px 0 60px" }}>
            <Col xs={24} md={20} lg={16} style={{ textAlign: "center" }}>
              <Title
                level={1}
                style={{
                  fontSize: "36px",
                  fontWeight: 800,
                  marginBottom: "16px",
                  color: "#1677ff",
                }}
              >
                Công nghệ AI dự đoán, cá nhân hoá việc làm
              </Title>
              <Paragraph
                style={{
                  fontSize: "16px",
                  color: "#595959",
                  marginBottom: "32px",
                  maxWidth: "800px",
                  margin: "0 auto 32px",
                }}
              >
                Khám phá hàng ngàn cơ hội nghề nghiệp. Nâng tầm hồ sơ với hệ thống trí tuệ nhân tạo
                phân tích và gợi ý việc làm chính xác.
              </Paragraph>

              {/* Search Bar */}
              <div
                style={{
                  background: "white",
                  padding: "8px 8px 8px 24px",
                  borderRadius: "40px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                  display: "flex",
                  alignItems: "center",
                  textAlign: "left",
                }}
              >
                <Input
                  size="large"
                  placeholder="Vị trí tuyển dụng, kỹ năng, công ty..."
                  prefix={
                    <SearchOutlined
                      style={{ color: "#bfbfbf", fontSize: "18px", marginRight: "8px" }}
                    />
                  }
                  bordered={false}
                  style={{ fontSize: "16px", flex: 2 }}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onPressEnter={handleSearch}
                />
                <Divider type="vertical" style={{ height: "32px", margin: "0 16px" }} />
                <Select
                  size="large"
                  showSearch
                  placeholder="Tất cả địa điểm"
                  bordered={false}
                  style={{ flex: 1, fontSize: "16px" }}
                  suffixIcon={
                    <EnvironmentOutlined style={{ fontSize: "18px", color: "#bfbfbf" }} />
                  }
                  value={searchLocation}
                  onChange={(val) => setSearchLocation(val)}
                >
                  <Option value="all">Tất cả địa điểm</Option>
                  <Option value="hn">Hà Nội</Option>
                  <Option value="hcm">Hồ Chí Minh</Option>
                  <Option value="dn">Đà Nẵng</Option>
                </Select>
                <Button
                  type="primary"
                  size="large"
                  style={{
                    height: "48px",
                    padding: "0 36px",
                    fontSize: "16px",
                    borderRadius: "40px",
                    marginLeft: "8px",
                  }}
                  onClick={handleSearch}
                >
                  Tìm Kiếm
                </Button>
              </div>

              <div
                style={{
                  marginTop: "24px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <Text style={{ color: "#595959", marginRight: "12px", fontWeight: 500 }}>
                  Gợi ý tìm kiếm:
                </Text>
                <Space wrap>
                  <Tag
                    style={{
                      cursor: "pointer",
                      fontSize: "13px",
                      padding: "6px 16px",
                      borderRadius: 20,
                      border: "1px solid #e8e8e8",
                      background: "transparent",
                      color: "#595959",
                    }}
                    onClick={() => navigate("/jobs?keyword=Frontend")}
                  >
                    Frontend
                  </Tag>
                  <Tag
                    style={{
                      cursor: "pointer",
                      fontSize: "13px",
                      padding: "6px 16px",
                      borderRadius: 20,
                      border: "1px solid #e8e8e8",
                      background: "transparent",
                      color: "#595959",
                    }}
                    onClick={() => navigate("/jobs?keyword=Business Analyst")}
                  >
                    Business Analyst
                  </Tag>
                  <Tag
                    style={{
                      cursor: "pointer",
                      fontSize: "13px",
                      padding: "6px 16px",
                      borderRadius: 20,
                      border: "1px solid #e8e8e8",
                      background: "transparent",
                      color: "#595959",
                    }}
                    onClick={() => navigate("/jobs?keyword=Marketing")}
                  >
                    Marketing
                  </Tag>
                  <Tag
                    style={{
                      cursor: "pointer",
                      fontSize: "13px",
                      padding: "6px 16px",
                      borderRadius: 20,
                      border: "1px solid #e8e8e8",
                      background: "transparent",
                      color: "#595959",
                    }}
                    onClick={() => navigate("/jobs?keyword=ReactJS")}
                  >
                    ReactJS
                  </Tag>
                </Space>
              </div>
            </Col>
          </Row>
        </div>

        {/* Khối Thống kê thị trường việc làm */}
        <div
          style={{
            maxWidth: "94%",
            margin: "0 auto",
            transform: "translateY(50%)",
            zIndex: 10,
            position: "relative",
          }}
        >
          <Card
            bodyStyle={{ padding: "16px 24px" }}
            style={{
              borderRadius: "12px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
              border: "none",
            }}
          >
            <Row justify="space-around" align="middle">
              <Col>
                <Space align="center" size="middle">
                  <div
                    style={{
                      background: "#e6f4ff",
                      padding: "14px",
                      borderRadius: "50%",
                      color: "#1677ff",
                      display: "flex",
                    }}
                  >
                    <EnvironmentOutlined style={{ fontSize: "20px" }} />
                  </div>
                  <div>
                    <Text
                      type="secondary"
                      style={{ display: "block", fontSize: "13px", marginBottom: "2px" }}
                    >
                      Thị trường việc làm
                    </Text>
                    <Text strong style={{ fontSize: "16px" }}>
                      Hôm nay
                    </Text>
                  </div>
                </Space>
              </Col>
              <Col>
                <div style={{ textAlign: "center" }}>
                  <Text
                    type="secondary"
                    style={{ display: "block", fontSize: "13px", marginBottom: "2px" }}
                  >
                    Đang tuyển
                  </Text>
                  <Text strong style={{ color: "#1677ff", fontSize: "20px" }}>
                    45.113
                  </Text>
                </div>
              </Col>
              <Col>
                <div style={{ textAlign: "center" }}>
                  <Text
                    type="secondary"
                    style={{ display: "block", fontSize: "13px", marginBottom: "2px" }}
                  >
                    Việc làm mới
                  </Text>
                  <Text strong style={{ color: "#faad14", fontSize: "20px" }}>
                    5.262
                  </Text>
                </div>
              </Col>
              <Col>
                <div style={{ textAlign: "center" }}>
                  <Text
                    type="secondary"
                    style={{ display: "block", fontSize: "13px", marginBottom: "2px" }}
                  >
                    Hồ sơ cập nhật
                  </Text>
                  <Text strong style={{ color: "#52c41a", fontSize: "20px" }}>
                    10.345
                  </Text>
                </div>
              </Col>
            </Row>
          </Card>
        </div>
      </div>

      {/* Khoảng trống để bù cho Card Thống kê bị lồi xuống */}
      <div style={{ height: "70px" }}></div>

      <div style={{ background: "#fff", padding: "20px 0 60px" }}>
        <div style={{ maxWidth: "94%", margin: "0 auto" }}>
          {/* 1.5. TOP NGÀNH NGHỀ TRỌNG ĐIỂM (TRENDING CATEGORIES) */}
          <Title level={2} style={{ margin: "0 0 32px 0", textAlign: "center" }}>
            <StarOutlined style={{ color: "#faad14", marginRight: "12px" }} />
            Top Ngành Nghề Nổi Bật
          </Title>

          <Row gutter={[24, 24]}>
            {trendingCategories.map((cat) => (
              <Col xs={24} sm={12} md={8} lg={6} key={cat.id}>
                <Card
                  hoverable
                  onClick={() => navigate(`/jobs?categoryId=${cat.id}`)}
                  style={{
                    borderRadius: "12px",
                    border: "1px solid #f0f0f0",
                    transition: "all 0.3s",
                  }}
                  bodyStyle={{
                    padding: "24px",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                  }}
                >
                  <div
                    style={{
                      background: "#e6f4ff",
                      width: "56px",
                      height: "56px",
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                      color: "#1677ff",
                    }}
                  >
                    {getCategoryIcon(cat.name)}
                  </div>
                  <div>
                    <Text
                      strong
                      style={{ fontSize: "16px", display: "block", marginBottom: "4px" }}
                    >
                      {cat.name}
                    </Text>
                    <Text type="secondary" style={{ fontSize: "14px" }}>
                      {cat.count.toLocaleString("vi-VN")} việc làm
                    </Text>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          {/* 2. TOP CÔNG VIỆC MỚI NHẤT */}
          <div style={{ marginTop: 60 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginBottom: "32px",
              }}
            >
              <div>
                <Title level={2} style={{ margin: 0 }}>
                  <FireOutlined style={{ color: "#fa541c", marginRight: "12px" }} />
                  Việc Làm Nổi Bật
                </Title>
                <Paragraph
                  type="secondary"
                  style={{ fontSize: "16px", marginTop: "8px", margin: 0 }}
                >
                  Khám phá các cơ hội nghề nghiệp hấp dẫn vừa được cập nhật.
                </Paragraph>
              </div>
              <Button type="link" size="large" onClick={() => navigate("/jobs")}>
                Xem tất cả →
              </Button>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "50px 0" }}>
                <Spin size="large" />
              </div>
            ) : (
              <Row gutter={[24, 24]}>
                {recentJobs.map((job) => (
                  <Col xs={24} sm={12} lg={8} key={job.id}>
                    <Card
                      hoverable
                      style={{
                        height: "100%",
                        borderRadius: "12px",
                        border: "1px solid #f0f0f0",
                        display: "flex",
                        flexDirection: "column",
                      }}
                      bodyStyle={{
                        padding: "24px",
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                      }}
                      onClick={() => navigate(`/jobs/${job.id}`)}
                    >
                      <Title
                        level={4}
                        style={{ marginBottom: "12px", color: "#1677ff", flexGrow: 1 }}
                        ellipsis={{ rows: 2 }}
                      >
                        {job.position?.name || "Vị trí chưa cập nhật"}
                      </Title>

                      <Space
                        direction="vertical"
                        size={12}
                        style={{ width: "100%", marginBottom: 24 }}
                      >
                        <div style={{ display: "flex", alignItems: "center", color: "#595959" }}>
                          <EnvironmentOutlined style={{ marginRight: "8px", fontSize: "16px" }} />
                          <Text>{job.branch?.name || "Chi nhánh chưa cập nhật"}</Text>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", color: "#00b24f" }}>
                          <DollarOutlined style={{ marginRight: "8px", fontSize: "16px" }} />
                          <Text strong style={{ color: "inherit", fontSize: "15px" }}>
                            {job.salaryRange || "Thỏa thuận"}
                          </Text>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", color: "#8c8c8c" }}>
                          <ClockCircleOutlined style={{ marginRight: "8px", fontSize: "16px" }} />
                          <Text type="secondary">
                            Hạn nộp:{" "}
                            {job.deadline
                              ? new Date(job.deadline).toLocaleDateString("vi-VN")
                              : "N/A"}
                          </Text>
                        </div>
                      </Space>

                      <Button
                        type="primary"
                        block
                        style={{ marginTop: "auto", borderRadius: "8px", height: "40px" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/jobs/${job.id}`);
                        }}
                      >
                        Ứng tuyển ngay
                      </Button>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </div>
        </div>
      </div>

      {/* 3. AI ADVANTAGE & CV CREATION SECTION */}
      <div style={{ padding: "60px 20px", background: "#f0f2f5" }}>
        <div style={{ maxWidth: "94%", margin: "0 auto" }}>
          <Row gutter={[48, 48]} align="middle">
            <Col xs={24} md={12}>
              <div style={{ padding: "40px", background: "#e6f4ff", borderRadius: "24px" }}>
                <RobotOutlined
                  style={{ fontSize: "64px", color: "#1677ff", marginBottom: "24px" }}
                />
                <Title level={2}>Nâng Tầm Hồ Sơ Với Trợ Lý AI</Title>
                <Paragraph style={{ fontSize: "16px", color: "#595959", lineHeight: 1.8 }}>
                  Không chỉ là một trang web tuyển dụng thông thường. Hệ thống của chúng tôi được
                  tích hợp Trí tuệ nhân tạo (AI) giúp phân tích chuyên sâu hồ sơ của bạn.
                </Paragraph>
                <ul
                  style={{ paddingLeft: "20px", fontSize: "16px", color: "#595959", lineHeight: 2 }}
                >
                  <li>Tự động nhận diện kỹ năng từ CV (PDF, Word, Ảnh)</li>
                  <li>Chấm điểm mức độ phù hợp với yêu cầu công việc</li>
                  <li>Chỉ ra điểm mạnh và kỹ năng còn thiếu sót</li>
                  <li>Gợi ý lộ trình cải thiện CV để tăng cơ hội trúng tuyển</li>
                </ul>
                <Button
                  type="primary"
                  size="large"
                  style={{ marginTop: "24px", borderRadius: "8px" }}
                  onClick={() => navigate("/profile")}
                >
                  Tạo CV Miễn Phí Ngay
                </Button>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <img
                src="https://cdni.iconscout.com/illustration/premium/thumb/resume-7314415-5979521.png"
                alt="AI CV Analysis"
                style={{ width: "100%", height: "auto" }}
              />
            </Col>
          </Row>
        </div>
      </div>

      {/* 4. FOR EMPLOYERS CTA */}
      <div
        style={{ padding: "60px 20px", textAlign: "center", background: "#001529", color: "white" }}
      >
        <Title level={2} style={{ color: "white", marginBottom: "24px" }}>
          Bạn là Nhà Tuyển Dụng?
        </Title>
        <Paragraph
          style={{ color: "#bfbfbf", fontSize: "16px", maxWidth: "600px", margin: "0 auto 40px" }}
        >
          Trải nghiệm giải pháp sàng lọc hồ sơ tự động, tiết kiệm 80% thời gian đánh giá CV thủ công
          và tìm ra ứng viên sáng giá nhất.
        </Paragraph>
        <Button
          type="primary"
          size="large"
          style={{ height: "48px", padding: "0 40px", fontSize: "16px", borderRadius: "8px" }}
          onClick={() => navigate("/login")}
        >
          Đăng Nhập Dành Cho HR
        </Button>
      </div>
    </div>
  );
}

export default HomePage;
