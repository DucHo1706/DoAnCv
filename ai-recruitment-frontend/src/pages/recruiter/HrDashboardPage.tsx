import { Col, Row, Card, Typography, message, Spin, Select, Space, Table, Tag } from "antd";
import {
  FilterOutlined,
  FileTextOutlined,
  UsergroupAddOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { Column } from "@ant-design/plots";
import PageContainer from "../../components/common/PageContainer";
import axiosClient from "../../services/axiosClient";
import { appTheme } from "../../constants/theme";

const { Paragraph, Text } = Typography;

const glassCardStyle = {
  background: "rgba(255, 255, 255, 0.85)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(226, 232, 240, 0.8)",
  boxShadow: "0 8px 32px 0 rgba(148, 163, 184, 0.08)",
  borderRadius: "16px",
};

export default function HrDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);

  // Lấy danh sách tin tuyển dụng của HR để làm bộ lọc
  useEffect(() => {
    const loadMyJobs = async () => {
      try {
        const res = await axiosClient.get("/Jobs/my-jobs");
        setJobs(Array.isArray(res.data) ? res.data : res.data?.$values || []);
      } catch (e) {
        console.error("Lỗi khi tải danh sách công việc:", e);
      }
    };
    loadMyJobs();
  }, []);

  // Gọi API lấy dữ liệu thống kê
  useEffect(() => {
    const fetchHrStats = async () => {
      setLoading(true);
      try {
        const response: any = await axiosClient.get("/Dashboard/hr-stats", {
          params: { jobId: selectedJob },
        });
        setStats(response.data || response);
      } catch (error) {
        message.error("Lỗi khi tải dữ liệu thống kê tuyển dụng");
      } finally {
        setLoading(false);
      }
    };
    fetchHrStats();
  }, [selectedJob]);

  // Cấu hình Biểu đồ Cột (Số lượng CV theo Job)
  const applicationsPerJobConfig = {
    data: stats?.applicationsPerJob || [],
    xField: "jobName",
    yField: "count",
    color: appTheme.colors.primary,
    label: { position: "top", style: { fill: appTheme.colors.textPrimary, opacity: 0.8 } },
  };

  const columns = [
    {
      title: "Ứng viên",
      dataIndex: "candidateName",
      key: "candidateName",
      render: (text: string) => (
        <Text strong style={{ color: appTheme.colors.textPrimary, fontFamily: appTheme.font.family }}>
          {text}
        </Text>
      ),
    },
    {
      title: "Vị trí ứng tuyển",
      dataIndex: "jobTitle",
      key: "jobTitle",
      render: (text: string) => (
        <Text style={{ color: appTheme.colors.textSecondary, fontFamily: appTheme.font.family }}>
          {text}
        </Text>
      ),
    },
    {
      title: "Điểm AI",
      dataIndex: "aiScore",
      key: "aiScore",
      render: (score: number) => {
        let color = appTheme.colors.error;
        let bg = "#FEF2F2";
        let border = "#FECACA";
        if (score >= 75) {
          color = appTheme.colors.success;
          bg = "#F0FDF4";
          border = "#BBF7D0";
        } else if (score >= 50) {
          color = appTheme.colors.warning;
          bg = "#FFFBEB";
          border = "#FDE68A";
        }
        return (
          <Tag
            style={{
              background: bg,
              color: color,
              border: `1px solid ${border}`,
              fontWeight: 700,
              borderRadius: 6,
              padding: "3px 8px",
              fontFamily: appTheme.font.family,
            }}
          >
            {score}/100
          </Tag>
        );
      },
    },
    {
      title: "Phân loại",
      dataIndex: "classification",
      key: "classification",
      render: (text: string) => {
        let color = "#64748B";
        let bg = "#F1F5F9";
        let border = "#E2E8F0";

        if (text) {
          if (text.includes("Phù hợp cao") || text === "Phù hợp") {
            color = appTheme.colors.success;
            bg = "#F0FDF4";
            border = "#BBF7D0";
          } else if (text.includes("Nên xem xét")) {
            color = appTheme.colors.warning;
            bg = "#FFFBEB";
            border = "#FDE68A";
          } else {
            color = appTheme.colors.error;
            bg = "#FEF2F2";
            border = "#FECACA";
          }
        }

        return (
          <Tag
            style={{
              background: bg,
              color: color,
              border: `1px solid ${border}`,
              borderRadius: 6,
              padding: "3px 10px",
              fontWeight: 600,
              fontFamily: appTheme.font.family,
            }}
          >
            {text || "Chưa phân loại"}
          </Tag>
        );
      },
    },
  ];

  return (
    <PageContainer
      title="Báo cáo Dashboard tuyển dụng"
      subtitle="Thống kê hiệu quả tuyển dụng và danh sách ứng viên tiềm năng do AI chấm điểm."
    >
      {/* Bộ lọc kính mờ Glassmorphism */}
      <Card
        style={{
          ...glassCardStyle,
          marginBottom: 24,
        }}
        bodyStyle={{ padding: 20 }}
      >
        <Space size="middle" wrap>
          <FilterOutlined style={{ color: appTheme.colors.primary, fontSize: 18 }} />
          <Text strong style={{ fontFamily: appTheme.font.family, color: appTheme.colors.textPrimary }}>
            Lọc dữ liệu theo Tin tuyển dụng:
          </Text>
          <Select
            style={{ width: 350 }}
            placeholder="Tất cả tin tuyển dụng"
            allowClear
            value={selectedJob}
            onChange={setSelectedJob}
            size="large"
            dropdownStyle={{ borderRadius: 8 }}
          >
            {jobs.map((j) => (
              <Select.Option key={j.id} value={j.id}>
                {j.position?.name || "Vị trí"} - {j.branch?.name || "Chi nhánh"}
              </Select.Option>
            ))}
          </Select>
        </Space>
      </Card>

      {loading ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <Spin size="large" tip="Đang truy xuất dữ liệu thống kê tuyển dụng..." />
        </div>
      ) : (
        <>
          {/* Thẻ Thống kê Bento Grid */}
          <Row gutter={[20, 20]} style={{ marginBottom: 28 }}>
            <Col xs={24} sm={12}>
              <Card
                style={{
                  borderRadius: 16,
                  border: `1px solid ${appTheme.colors.border}`,
                  background: appTheme.colors.surface,
                  boxShadow: appTheme.shadow.card,
                }}
                bodyStyle={{ padding: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}
              >
                <div style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, color: appTheme.colors.textSecondary, fontFamily: appTheme.font.family, fontWeight: 600, display: "block", marginBottom: 8 }}>
                    Tin tuyển dụng của tôi
                  </Text>
                  <div style={{ fontSize: 32, fontWeight: 800, color: appTheme.colors.textPrimary, fontFamily: appTheme.font.family, lineHeight: 1 }}>
                    {stats?.totalJobs || 0}
                  </div>
                </div>
                <div style={{ background: "rgba(37, 99, 235, 0.1)", padding: 12, borderRadius: "50%", color: appTheme.colors.primary, display: "flex" }}>
                  <FileTextOutlined style={{ fontSize: 24 }} />
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card
                style={{
                  borderRadius: 16,
                  border: `1px solid ${appTheme.colors.border}`,
                  background: appTheme.colors.surface,
                  boxShadow: appTheme.shadow.card,
                }}
                bodyStyle={{ padding: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}
              >
                <div style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, color: appTheme.colors.textSecondary, fontFamily: appTheme.font.family, fontWeight: 600, display: "block", marginBottom: 8 }}>
                    Tổng số CV đã nhận
                  </Text>
                  <div style={{ fontSize: 32, fontWeight: 800, color: appTheme.colors.success, fontFamily: appTheme.font.family, lineHeight: 1 }}>
                    {stats?.totalApplications || 0}
                  </div>
                </div>
                <div style={{ background: "rgba(16, 185, 129, 0.1)", padding: 12, borderRadius: "50%", color: appTheme.colors.success, display: "flex" }}>
                  <UsergroupAddOutlined style={{ fontSize: 24 }} />
                </div>
              </Card>
            </Col>
          </Row>

          {/* Biểu đồ & Bảng tiềm năng */}
          <Row gutter={[20, 20]}>
            <Col xs={24} lg={12}>
              <Card
                title={
                  <span style={{ fontFamily: appTheme.font.family, fontWeight: 700, fontSize: 15, color: appTheme.colors.textPrimary }}>
                    <BarChartOutlined style={{ marginRight: 8, color: appTheme.colors.primary }} />
                    Số lượng CV theo vị trí ứng tuyển
                  </span>
                }
                style={{
                  borderRadius: 16,
                  border: `1px solid ${appTheme.colors.border}`,
                  background: appTheme.colors.surface,
                  boxShadow: appTheme.shadow.card,
                  height: "100%",
                }}
                bodyStyle={{ padding: 24 }}
              >
                {stats?.applicationsPerJob?.length ? (
                  <Column {...applicationsPerJobConfig} />
                ) : (
                  <Paragraph style={{ fontFamily: appTheme.font.family, color: appTheme.colors.textSecondary }}>Chưa có CV nào được nộp</Paragraph>
                )}
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card
                title={
                  <span style={{ fontFamily: appTheme.font.family, fontWeight: 700, fontSize: 15, color: appTheme.colors.textPrimary }}>
                    Ứng viên tiềm năng mới nhất 
                  </span>
                }
                style={{
                  borderRadius: 16,
                  border: `1px solid ${appTheme.colors.border}`,
                  background: appTheme.colors.surface,
                  boxShadow: appTheme.shadow.card,
                  height: "100%",
                }}
                bodyStyle={{ padding: 24 }}
              >
                <Table
                  dataSource={stats?.recentApplications || []}
                  columns={columns}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  locale={{ emptyText: "Chưa có ứng viên nào nộp CV" }}
                  style={{ fontFamily: appTheme.font.family }}
                />
              </Card>
            </Col>
          </Row>
        </>
      )}
    </PageContainer>
  );
}
