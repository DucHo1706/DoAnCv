import { useEffect, useMemo, useState } from "react";
import {
  Card,
  Table,
  Typography,
  Tag,
  Input,
  Button,
  Space,
  Row,
  Col,
  Avatar,
  Modal,
  Descriptions,
  message,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
  PrinterOutlined,
  UserOutlined,
  TrophyOutlined,
  FileTextOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import PageContainer from "../../../../components/common/PageContainer";
import { dashboardService } from "../../services/dashboardService";
import type { RecruiterPerformanceItem } from "../../services/dashboardService";
import { exportToCsv, exportToPdfPrint } from "../../../../utils/exportUtils";
import { appTheme } from "../../../../constants/theme";

const { Text, Title } = Typography;

export default function RecruiterPerformancePage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RecruiterPerformanceItem[]>([]);
  const [searchText, setSearchText] = useState("");
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRecruiter, setSelectedRecruiter] = useState<RecruiterPerformanceItem | null>(null);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getRecruiterPerformance();
      setData(res);
    } catch (err) {
      console.error(err);
      message.error("Không tải được báo cáo hiệu suất Chuyên viên Tuyển dụng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const filteredData = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (r) =>
        r.fullName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q) ||
        r.branches.toLowerCase().includes(q)
    );
  }, [data, searchText]);

  // Overall aggregate stats
  const aggregate = useMemo(() => {
    const totalHrs = data.length;
    const totalJobs = data.reduce((acc, curr) => acc + curr.totalJobs, 0);
    const totalApps = data.reduce((acc, curr) => acc + curr.totalApplications, 0);
    const validScores = data.filter((r) => r.avgMatchScore > 0);
    const systemAvgScore =
      validScores.length > 0
        ? Math.round((validScores.reduce((acc, curr) => acc + curr.avgMatchScore, 0) / validScores.length) * 10) / 10
        : 0;
    return { totalHrs, totalJobs, totalApps, systemAvgScore };
  }, [data]);

  const handleExportCsv = () => {
    const headers = [
      "Họ và tên HR",
      "Email",
      "Số điện thoại",
      "Chi nhánh",
      "Tổng tin tuyển dụng",
      "Tin đã đăng",
      "Tin chờ duyệt",
      "Tin từ chối",
      "Tổng hồ sơ ứng tuyển",
      "Số buổi phỏng vấn",
      "Tuyển dụng thành công",
      "Điểm AI trung bình (%)",
    ];

    const rows = filteredData.map((r) => [
      r.fullName,
      r.email,
      r.phone,
      r.branches,
      r.totalJobs,
      r.publishedJobs,
      r.pendingJobs,
      r.rejectedJobs,
      r.totalApplications,
      r.totalInterviews,
      r.hiredCount,
      r.avgMatchScore,
    ]);

    exportToCsv("Bao_Cao_Hieu_Suat_Recruiter", headers, rows);
    message.success("Đã xuất file báo cáo Excel (CSV) thành công!");
  };

  const handleExportPdf = () => {
    const headers = [
      "Họ và tên HR",
      "Chi nhánh",
      "Tin tuyển dụng",
      "Hồ sơ ứng tuyển",
      "Phỏng vấn",
      "Tuyển dụng thành công",
      "Điểm AI TB",
    ];

    const rows = filteredData.map((r) => [
      r.fullName,
      r.branches,
      `${r.publishedJobs}/${r.totalJobs}`,
      r.totalApplications,
      r.totalInterviews,
      r.hiredCount,
      `${r.avgMatchScore}%`,
    ]);

    exportToPdfPrint(
      "BÁO CÁO ĐỐI SÁNH HIỆU SUẤT RECRUITER",
      "Hệ thống Tuyển dụng AI Insight · Đánh giá & Năng lực tuyển dụng",
      headers,
      rows
    );
  };

  const columns = [
    {
      title: "Chuyên viên HR",
      dataIndex: "fullName",
      key: "fullName",
      render: (text: string, record: RecruiterPerformanceItem) => (
        <Space size={12}>
          <Avatar style={{ backgroundColor: appTheme.colors.primary }} icon={<UserOutlined />}>
            {text.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <Text strong style={{ display: "block", color: appTheme.colors.textPrimary }}>
              {text}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Chi nhánh",
      dataIndex: "branches",
      key: "branches",
      render: (branches: string) => (
        <Text style={{ fontSize: 13, color: appTheme.colors.textSecondary }}>{branches}</Text>
      ),
    },
    {
      title: "Tin tuyển dụng",
      key: "jobs",
      render: (_: any, r: RecruiterPerformanceItem) => (
        <div>
          <Text strong style={{ fontSize: 14 }}>
            {r.totalJobs}
          </Text>
          <div style={{ fontSize: 11, color: appTheme.colors.textSecondary, marginTop: 2 }}>
            <span style={{ color: "#10B981" }}>{r.publishedJobs} đã đăng</span> ·{" "}
            <span style={{ color: "#F59E0B" }}>{r.pendingJobs} chờ</span> ·{" "}
            <span style={{ color: "#EF4444" }}>{r.rejectedJobs} lỗi</span>
          </div>
        </div>
      ),
    },
    {
      title: "Hồ sơ ứng tuyển",
      dataIndex: "totalApplications",
      key: "totalApplications",
      sorter: (a: RecruiterPerformanceItem, b: RecruiterPerformanceItem) =>
        a.totalApplications - b.totalApplications,
      render: (val: number) => <Text strong style={{ fontSize: 14 }}>{val}</Text>,
    },
    {
      title: "Phỏng vấn & Trúng tuyển",
      key: "conversions",
      render: (_: any, r: RecruiterPerformanceItem) => (
        <div>
          <Tag color="blue">{r.totalInterviews} Phỏng vấn</Tag>
          <Tag color="green">{r.hiredCount} Trúng tuyển</Tag>
        </div>
      ),
    },
    {
      title: "Điểm AI TB",
      dataIndex: "avgMatchScore",
      key: "avgMatchScore",
      sorter: (a: RecruiterPerformanceItem, b: RecruiterPerformanceItem) =>
        a.avgMatchScore - b.avgMatchScore,
      render: (score: number) => {
        let color = "default";
        let label = "Chưa có";
        if (score >= 80) {
          color = "success";
          label = "Xuất sắc";
        } else if (score >= 60) {
          color = "processing";
          label = "Khá tốt";
        } else if (score > 0) {
          color = "warning";
          label = "Cần cải thiện";
        }
        return (
          <Space>
            <Text strong style={{ color: score >= 70 ? appTheme.colors.primary : undefined }}>
              {score > 0 ? `${score}%` : "N/A"}
            </Text>
            {score > 0 && <Tag color={color}>{label}</Tag>}
          </Space>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_: any, record: RecruiterPerformanceItem) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedRecruiter(record);
            setDetailModalOpen(true);
          }}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      title="Hiệu quả nhà tuyển dụng"
    >
      {/* Metric summary grid */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ borderRadius: appTheme.radius.lg, background: "#FFF" }}>
            <Space direction="vertical" size={4}>
              <Text type="secondary" style={{ fontSize: 12, fontWeight: 700 }}>
                TỔNG SỐ RECRUITER
              </Text>
              <Title level={3} style={{ margin: 0 }}>
                <TeamOutlined style={{ color: appTheme.colors.primary, marginRight: 8 }} />
                {aggregate.totalHrs}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Đang quản lý tin trong hệ thống
              </Text>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ borderRadius: appTheme.radius.lg, background: "#FFF" }}>
            <Space direction="vertical" size={4}>
              <Text type="secondary" style={{ fontSize: 12, fontWeight: 700 }}>
                TỔNG TIN TUYỂN DỤNG
              </Text>
              <Title level={3} style={{ margin: 0 }}>
                <FileTextOutlined style={{ color: "#10B981", marginRight: 8 }} />
                {aggregate.totalJobs}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Đã khởi tạo trên hệ thống
              </Text>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ borderRadius: appTheme.radius.lg, background: "#FFF" }}>
            <Space direction="vertical" size={4}>
              <Text type="secondary" style={{ fontSize: 12, fontWeight: 700 }}>
                HỒ SƠ ỨNG TUYỂN TIẾP NHẬN
              </Text>
              <Title level={3} style={{ margin: 0 }}>
                <CheckCircleOutlined style={{ color: "#F59E0B", marginRight: 8 }} />
                {aggregate.totalApps}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Nộp vào các tin của Recruiter
              </Text>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ borderRadius: appTheme.radius.lg, background: "#FFF" }}>
            <Space direction="vertical" size={4}>
              <Text type="secondary" style={{ fontSize: 12, fontWeight: 700 }}>
                ĐIỂM AI MATCHING TRUNG BÌNH
              </Text>
              <Title level={3} style={{ margin: 0 }}>
                <TrophyOutlined style={{ color: "#8B5CF6", marginRight: 8 }} />
                {aggregate.systemAvgScore > 0 ? `${aggregate.systemAvgScore}%` : "N/A"}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Chất lượng đầu vào của ứng viên
              </Text>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Table container & toolbar */}
      <Card
        bordered={false}
        style={{
          borderRadius: appTheme.radius.lg,
          border: `1px solid ${appTheme.colors.border}`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <Input
            placeholder="Tìm theo tên, email, sđt hoặc chi nhánh..."
            prefix={<SearchOutlined style={{ color: appTheme.colors.textSecondary }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 320, borderRadius: 8 }}
            allowClear
          />

          <Space size={8}>
            <Tooltip title="Tải lại dữ liệu báo cáo mới nhất">
              <Button icon={<ReloadOutlined />} onClick={fetchPerformanceData} loading={loading} />
            </Tooltip>

            <Button icon={<DownloadOutlined />} onClick={handleExportCsv}>
              Xuất Excel (CSV)
            </Button>

            <Button type="primary" icon={<PrinterOutlined />} onClick={handleExportPdf}>
              Xuất Báo cáo PDF
            </Button>
          </Space>
        </div>

        <Table
          rowKey="recruiterId"
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 900 }}
        />
      </Card>

      {/* Recruiter Detail Breakdown Modal */}
      <Modal
        title={`Chi tiết Năng lực: ${selectedRecruiter?.fullName || ""}`}
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={600}
      >
        {selectedRecruiter && (
          <Descriptions column={2} bordered style={{ marginTop: 16 }}>
            <Descriptions.Item label="Họ và tên" span={2}>
              <Text strong>{selectedRecruiter.fullName}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Email">{selectedRecruiter.email}</Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">{selectedRecruiter.phone}</Descriptions.Item>
            <Descriptions.Item label="Chi nhánh quản lý" span={2}>
              {selectedRecruiter.branches}
            </Descriptions.Item>
            <Descriptions.Item label="Tổng số tin tạo">{selectedRecruiter.totalJobs}</Descriptions.Item>
            <Descriptions.Item label="Tin đã duyệt phát hành">{selectedRecruiter.publishedJobs}</Descriptions.Item>
            <Descriptions.Item label="Tin chờ duyệt">{selectedRecruiter.pendingJobs}</Descriptions.Item>
            <Descriptions.Item label="Tin bị từ chối">{selectedRecruiter.rejectedJobs}</Descriptions.Item>
            <Descriptions.Item label="Tổng HS tiếp nhận">{selectedRecruiter.totalApplications}</Descriptions.Item>
            <Descriptions.Item label="Buổi phỏng vấn">{selectedRecruiter.totalInterviews}</Descriptions.Item>
            <Descriptions.Item label="Trúng tuyển">{selectedRecruiter.hiredCount}</Descriptions.Item>
            <Descriptions.Item label="Điểm AI TB">
              <Tag color="blue">{selectedRecruiter.avgMatchScore}%</Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </PageContainer>
  );
}
