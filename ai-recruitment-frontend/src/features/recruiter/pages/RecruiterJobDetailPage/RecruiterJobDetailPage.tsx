import {
  ArrowLeftOutlined,
  CalendarOutlined,
  DollarOutlined,
  UsergroupAddOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  StarOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Divider,
  message,
  Row,
  Space,
  Tag,
  Typography,
  Progress,
  Spin,
  Statistic,
  Skeleton,
} from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageContainer from "../../../../components/common/PageContainer";
import { jobService } from "../../services/jobService";
import type { JobReviewResponse } from "../../services/jobService";
import { appTheme } from "../../../../constants/theme";
import { formatJobDate, resolveJobLifecycle } from "../../../../utils/jobLifecycle";

const { Paragraph, Text, Title } = Typography;

function formatDate(value?: string | null) {
  return formatJobDate(value);
}

function getStatusMeta(lifecycleStatus: string) {
  if (lifecycleStatus === "Recruiting") return { label: "Đã duyệt · Đang tuyển", color: "green" as const };
  if (lifecycleStatus === "Scheduled") return { label: "Đã duyệt · Sắp mở", color: "processing" as const };
  if (lifecycleStatus === "Expired") return { label: "Đã duyệt · Hết hạn", color: "red" as const };
  if (lifecycleStatus === "Closed") return { label: "Đã duyệt · Tạm ẩn", color: "default" as const };
  if (lifecycleStatus === "Rejected") return { label: "Bị từ chối", color: "red" as const };
  if (lifecycleStatus === "Archived") return { label: "Đã lưu trữ", color: "default" as const };
  if (lifecycleStatus === "Flagged") return { label: "Đang kiểm duyệt", color: "orange" as const };
  return { label: "Chờ duyệt", color: "gold" as const };
}

export default function RecruiterJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [jobDetail, setJobDetail] = useState<JobReviewResponse | null>(null);

  const fetchJobDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await jobService.getJobReview(id);
      setJobDetail(data);
    } catch {
      message.error("Không tải được chi tiết tin tuyển dụng.");
      navigate("/recruiter/jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobDetail();
  }, [id]);

  if (loading) {
    return (
      <PageContainer title="Chi tiết tin tuyển dụng">
        <Card style={{ borderRadius: 16, border: "1px solid #E2E8F0", padding: 24 }}>
          <Skeleton active paragraph={{ rows: 10 }} />
        </Card>
      </PageContainer>
    );
  }

  if (!jobDetail) {
    return (
      <PageContainer title="Chi tiết tin tuyển dụng">
        <Card style={{ textAlign: "center", padding: 24 }}>
          <Text type="secondary">Không tìm thấy thông tin tin tuyển dụng này.</Text>
          <div style={{ marginTop: 16 }}>
            <Button onClick={() => navigate("/recruiter/jobs")}>Quay lại danh sách</Button>
          </div>
        </Card>
      </PageContainer>
    );
  }

  const lifecycleStatus = resolveJobLifecycle(jobDetail.jobInfo);
  const isExpired = lifecycleStatus === "Expired";
  const statusMeta = getStatusMeta(lifecycleStatus);

  return (
    <PageContainer title="Chi tiết tin tuyển dụng">
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/recruiter/jobs")}
          style={{ borderRadius: 8 }}
        >
          Quay lại danh sách
        </Button>
        {isExpired && id && (
          <Button
            type="primary"
            icon={<CopyOutlined />}
            onClick={() => navigate(`/recruiter/jobs/${id}/repost`)}
            style={{ borderRadius: 8 }}
          >
            Đăng lại tin này
          </Button>
        )}
      </div>
      {/* Top Header Card */}
      {/* Top Header Card */}
      <Card
        style={{
          borderRadius: 16,
          border: `1px solid ${appTheme.colors.border}`,
          boxShadow: appTheme.shadow.card,
          marginBottom: 24,
        }}
      >
        <Row align="middle" justify="space-between" gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Space align="start" size={16}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  background: "rgba(37, 99, 235, 0.08)",
                  color: "#2563EB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 28,
                }}
              >
                <TrophyOutlined />
              </div>
              <div>
                <Title level={3} style={{ margin: 0, color: "#0F172A", fontFamily: appTheme.font.family }}>
                  {jobDetail.jobInfo.position?.name || "Chưa cập nhật"}
                </Title>
                <Text type="secondary" style={{ fontSize: 14, display: "block", marginBottom: 12 }}>
                  Công Ty AI Recruitment
                </Text>
                
                <Space size={24} wrap>
                  <Space>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", background: "#EFF6FF" }}>
                      <DollarOutlined style={{ color: "#2563EB" }} />
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: 11, display: "block" }}>Mức lương</Text>
                      <Text strong style={{ color: "#16A34A" }}>{jobDetail.jobInfo.salaryRange || "Thỏa thuận"}</Text>
                    </div>
                  </Space>

                  <Space>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", background: "#EFF6FF" }}>
                      <EnvironmentOutlined style={{ color: "#2563EB" }} />
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: 11, display: "block" }}>Địa điểm</Text>
                      <Text strong>{jobDetail.jobInfo.branch?.name || "Chưa cập nhật"}</Text>
                    </div>
                  </Space>

                  <Space>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", background: "#EFF6FF" }}>
                      <CalendarOutlined style={{ color: "#2563EB" }} />
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: 11, display: "block" }}>Hạn nộp hồ sơ</Text>
                      <Text strong>{formatDate(jobDetail.jobInfo.deadline)}</Text>
                    </div>
                  </Space>
                </Space>
              </div>
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: "right" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
              <Space>
                <Tag color={statusMeta.color} style={{ borderRadius: 8, padding: "2px 8px" }}>
                  {statusMeta.label}
                </Tag>
              </Space>
              <Text type="secondary" style={{ fontSize: 12, marginTop: 4 }}>
                Ngày tạo tin: {formatDate(jobDetail.jobInfo.createdAt)}
              </Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Statistics Dashboard Cards */}
      {jobDetail.stats && (
        <Card
          title="Thống kê hiệu quả tuyển dụng"
          style={{
            borderRadius: 16,
            border: `1px solid ${appTheme.colors.border}`,
            boxShadow: appTheme.shadow.card,
            marginBottom: 24,
          }}
          bodyStyle={{ padding: "20px 24px" }}
        >
          <Row gutter={[16, 16]} style={{ textAlign: "center" }}>
            <Col xs={12} sm={6}>
              <Card style={{ borderRadius: 12, background: "#F8FAFC" }} bodyStyle={{ padding: 12 }}>
                <Statistic
                  title="Lượt xem tin"
                  value={jobDetail.stats.viewsCount}
                  valueStyle={{ color: "#2563EB", fontWeight: 700, fontSize: 24 }}
                  prefix={<EyeOutlined style={{ marginRight: 6 }} />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card style={{ borderRadius: 12, background: "#F8FAFC" }} bodyStyle={{ padding: 12 }}>
                <Statistic
                  title="Lượt quan tâm"
                  value={jobDetail.stats.interestedCount}
                  valueStyle={{ color: "#7C3AED", fontWeight: 700, fontSize: 24 }}
                  prefix={<TrophyOutlined style={{ marginRight: 6 }} />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card style={{ borderRadius: 12, background: "#F8FAFC" }} bodyStyle={{ padding: 12 }}>
                <Statistic
                  title="Hồ sơ nộp"
                  value={jobDetail.stats.applicationsCount}
                  valueStyle={{ color: "#10B981", fontWeight: 700, fontSize: 24 }}
                  prefix={<UsergroupAddOutlined style={{ marginRight: 6 }} />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card style={{ borderRadius: 12, background: "#F8FAFC" }} bodyStyle={{ padding: 12 }}>
                <Statistic
                  title="Tỷ lệ ứng tuyển"
                  value={jobDetail.stats.applyRate}
                  precision={1}
                  suffix="%"
                  valueStyle={{ color: "#F59E0B", fontWeight: 700, fontSize: 24 }}
                  prefix={<CheckCircleOutlined style={{ marginRight: 6 }} />}
                />
              </Card>
            </Col>
          </Row>
        </Card>
      )}

      {/* Main Details Section */}
      <Row gutter={[24, 24]}>
        {/* Left Column: Job Description and Requirements */}
        <Col xs={24} lg={15}>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <Card
              title="Chi tiết tin tuyển dụng"
              style={{
                borderRadius: 16,
                border: `1px solid ${appTheme.colors.border}`,
                boxShadow: appTheme.shadow.card,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <Title level={5} style={{ fontSize: 16, marginTop: 0, marginBottom: 12, fontWeight: 600, color: "#0F172A" }}>
                    Mô tả công việc
                  </Title>
                  <Paragraph style={{ fontSize: 14, whiteSpace: "pre-line", lineHeight: 1.7, color: "#475569" }}>
                    {jobDetail.jobInfo.description || "Đang cập nhật nội dung..."}
                  </Paragraph>
                </div>

                <div>
                  <Title level={5} style={{ fontSize: 16, marginTop: 12, marginBottom: 12, fontWeight: 600, color: "#0F172A" }}>
                    Yêu cầu ứng viên
                  </Title>
                  <Paragraph style={{ fontSize: 14, whiteSpace: "pre-line", lineHeight: 1.7, color: "#475569" }}>
                    {jobDetail.jobInfo.requirements || "Đang cập nhật nội dung..."}
                  </Paragraph>
                </div>

                <Divider style={{ margin: "24px 0 16px" }} />

                <div>
                  <Title level={5} style={{ fontSize: 16, marginBottom: 16, fontWeight: 600, color: "#0F172A" }}>
                    Cách thức ứng tuyển
                  </Title>
                  <div
                    style={{
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      padding: 20,
                      borderRadius: 12,
                    }}
                  >
                    <Text style={{ fontSize: 14, display: "block", color: "#166534" }}>
                      Ứng viên nộp hồ sơ trực tuyến bằng cách bấm vào nút <strong>Ứng tuyển ngay</strong> hoặc <strong>AI Phân tích & Ứng tuyển</strong> ở đầu trang. Trợ lý AI sẽ tiếp nhận, phân tích CV và tự động trả về báo cáo đánh giá năng lực chi tiết ngay lập tức.
                    </Text>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </Col>

        {/* Right Column: General Info, Company Info, AI Engine Config */}
        <Col xs={24} lg={9}>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Thông tin chung */}
            <Card
              title="Thông tin chung"
              style={{
                borderRadius: 16,
                border: `1px solid ${appTheme.colors.border}`,
                boxShadow: appTheme.shadow.card,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <StarOutlined style={{ fontSize: 18, color: "#2563EB", marginTop: 2 }} />
                  <div>
                    <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Cấp bậc</Text>
                    <Text strong style={{ fontSize: 14 }}>{jobDetail.jobInfo.jobLevel?.name || "Nhân viên"}</Text>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <UserOutlined style={{ fontSize: 18, color: "#2563EB", marginTop: 2 }} />
                  <div>
                    <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Số lượng tuyển</Text>
                    <Text strong style={{ fontSize: 14 }}>{jobDetail.jobInfo.maxCandidates ?? "Không giới hạn"}</Text>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <ClockCircleOutlined style={{ fontSize: 18, color: "#2563EB", marginTop: 2 }} />
                  <div>
                    <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Hình thức làm việc</Text>
                    <Text strong style={{ fontSize: 14 }}>Toàn thời gian</Text>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <CalendarOutlined style={{ fontSize: 18, color: "#2563EB", marginTop: 2 }} />
                  <div>
                    <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Hạn nộp hồ sơ</Text>
                    <Text strong style={{ fontSize: 14, color: isExpired ? "#EF4444" : "inherit" }}>
                      {formatDate(jobDetail.jobInfo.deadline)}
                    </Text>
                  </div>
                </div>
              </div>
            </Card>

            {/* Thông tin công ty */}
            <Card
              title="Thông tin công ty"
              style={{
                borderRadius: 16,
                border: `1px solid ${appTheme.colors.border}`,
                boxShadow: appTheme.shadow.card,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      background: "rgba(37, 99, 235, 0.08)",
                      color: "#2563EB",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                    }}
                  >
                    <HomeOutlined />
                  </div>
                  <div>
                    <Text strong style={{ display: "block" }}>Công ty AI Recruitment</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>Quy mô: 100 - 499 nhân viên</Text>
                  </div>
                </div>
                
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <EnvironmentOutlined style={{ color: "#64748B", marginTop: 3 }} />
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Địa chỉ: {jobDetail.jobInfo.branch?.name || "Chưa cập nhật"}
                  </Text>
                </div>
              </div>
            </Card>

            {/* AI Config Weight Card */}
            <Card
              title="Tiêu chí đánh giá của hệ thống AI"
              style={{
                borderRadius: 16,
                border: `1px solid ${appTheme.colors.border}`,
                boxShadow: appTheme.shadow.card,
              }}
            >
              <div>
                <Text strong style={{ fontSize: 13, color: "#475569" }}>
                  Từ khóa AI nhận diện nổi bật:
                </Text>
                <div style={{ marginTop: 8 }}>
                  {jobDetail.wordsToHighlight?.length ? (
                    <Space wrap>
                      {jobDetail.wordsToHighlight.map((word: string) => (
                        <Tag
                          key={word}
                          style={{
                            background: "rgba(37, 99, 235, 0.05)",
                            border: "1.5px solid rgba(37, 99, 235, 0.15)",
                            color: "#2563EB",
                            borderRadius: 8,
                            padding: "2px 8px",
                          }}
                        >
                          {word}
                        </Tag>
                      ))}
                    </Space>
                  ) : (
                    <Text type="secondary" style={{ fontSize: 13 }}>Không có từ khóa nổi bật.</Text>
                  )}
                </div>
              </div>

              <Divider style={{ margin: "16px 0 12px 0" }} />

              <div>
                <Text strong style={{ fontSize: 13, color: "#475569" }}>
                  Trọng số điểm năng lực (%):
                </Text>
                <div style={{ marginTop: 12 }}>
                  {(jobDetail.jobInfo as any).criteria?.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {(jobDetail.jobInfo as any).criteria.map((c: any) => (
                        <div key={c.name}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 13, color: "#334155" }}>{c.name}</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#2563EB" }}>{c.weight}%</span>
                          </div>
                          <Progress percent={c.weight} size="small" strokeColor="#2563EB" showInfo={false} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Text type="secondary" style={{ fontSize: 13 }}>Sử dụng cấu hình đánh giá tiêu chuẩn.</Text>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </Col>
      </Row>
    </PageContainer>
  );
}
