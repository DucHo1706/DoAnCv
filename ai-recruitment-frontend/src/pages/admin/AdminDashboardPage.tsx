import { Col, Row, Card, Typography, message, Spin, Select, Space } from "antd";
import { CheckCircleOutlined, TeamOutlined, RobotOutlined, FileTextOutlined, FilterOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { Pie, Column, Bar } from "@ant-design/plots";
import PageContainer from "../../components/common/PageContainer";
import StatCard from "../../components/common/StatCard";
import axiosClient from "../../services/axiosClient";
import { jobService } from "../../services/jobService";

const { Title, Paragraph } = Typography;
const { Option } = Select;

function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>("all");

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const res = await jobService.getJobs();
        setJobs(Array.isArray(res) ? res : (res as any)?.$values || []);
      } catch (e) {
        console.error(e);
      }
    };
    loadJobs();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // ĐÃ BỎ MOCK DATA: Gọi API lấy dữ liệu thực tế
        const response: any = await axiosClient.get("/Dashboard/stats", {
          params: { jobId: selectedJob, timeRange: timeRange }
        });
        setStats(response.data || response);
      } catch (error) {
        message.error("Lỗi khi tải dữ liệu thống kê");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedJob, timeRange]);

  const pieConfig = {
    data: stats?.degreeData || [],
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: {
      text: (d: any) => `${d.type}\n ${d.value}%`,
      position: 'spider',
    },
  };

  const columnConfig = {
    data: stats?.expData || [],
    xField: 'range',
    yField: 'count',
    color: '#1677ff',
    label: {
      position: 'top',
      style: { fill: '#000000', opacity: 0.6 },
    },
    xAxis: {
      label: { autoHide: true, autoRotate: false },
    },
  };

  const majorConfig = {
    data: stats?.majorData || [],
    angleField: 'value',
    colorField: 'type',
    innerRadius: 0.6,
    label: { text: 'value', style: { fontWeight: 'bold' } },
  };

  const barConfig = {
    data: stats?.universityData || [],
    xField: 'value',
    yField: 'type',
    color: '#faad14',
    label: { position: 'middle', style: { fill: '#fff' } },
  };

  return (
    <PageContainer
      title="Admin Dashboard"
      subtitle="Tổng quan hoạt động của hệ thống và thống kê hiệu suất xử lý AI."
    >
      <Card style={{ marginBottom: 24, borderRadius: 12 }}>
        <Space size="middle" wrap>
          <FilterOutlined style={{ color: "#1677ff", fontSize: 20 }} />
          <Typography.Text strong style={{ fontSize: 16 }}>Bộ Lọc Đa Chiều:</Typography.Text>
          <Select style={{ width: 350 }} placeholder="Lọc theo Tin tuyển dụng (JD)" allowClear value={selectedJob} onChange={setSelectedJob}>
            {jobs.map(j => (
              <Select.Option key={j.id} value={j.id}>{j.position?.name || 'Vị trí'} - {j.branch?.name || 'Chi nhánh'}</Select.Option>
            ))}
          </Select>
          <Select style={{ width: 200 }} value={timeRange} onChange={setTimeRange}>
            <Select.Option value="all">Toàn thời gian</Select.Option>
            <Select.Option value="month">Trong tháng này</Select.Option>
            <Select.Option value="quarter">Trong quý này</Select.Option>
            <Select.Option value="year">Trong năm nay</Select.Option>
          </Select>
        </Space>
      </Card>

      {loading ? (
        <div style={{ textAlign: "center", padding: "100px 0" }}>
          <Spin size="large" tip="Hệ thống đang truy xuất và tổng hợp dữ liệu thật..." />
        </div>
      ) : (
        <>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Tổng Người Dùng"
            value={stats?.totalUsers || 0}
            subtitle="HR, Candidate & Admin"
            icon={<TeamOutlined style={{ color: "#1677ff" }} />}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Tin Tuyển Dụng"
            value={stats?.totalJobs || 0}
            subtitle="Đang public trên hệ thống"
            icon={<FileTextOutlined style={{ color: "#52c41a" }} />}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="CV Đã Phân Tích (AI)"
            value={stats?.totalAnalyzedCVs || 0}
            subtitle="Xử lý thành công bằng Gemini"
            icon={<RobotOutlined style={{ color: "#722ed1" }} />}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Hệ Thống"
            value="Bình Thường"
            subtitle="Database & AI API Online"
            icon={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Thống kê Bằng cấp Ứng viên (AI bóc tách)">
            {stats?.degreeData ? (
              <Pie {...pieConfig} />
            ) : (
              <Paragraph>Chưa có dữ liệu thống kê</Paragraph>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Số lượng Ứng viên theo Năm kinh nghiệm">
            {stats?.expData ? (
              <Column {...columnConfig} />
            ) : (
              <Paragraph>Chưa có dữ liệu thống kê</Paragraph>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Top 5 Chuyên Ngành">
            {stats?.majorData && stats.majorData.length > 0 ? (
              <Pie {...majorConfig} />
            ) : (
              <Paragraph>Chưa có dữ liệu chuyên ngành</Paragraph>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Top Các Trường Đại Học">
            {stats?.universityData && stats.universityData.length > 0 ? (
              <Bar {...barConfig} />
            ) : (
              <Paragraph>Chưa có dữ liệu trường học</Paragraph>
            )}
          </Card>
        </Col>
      </Row>
        </>
      )}
    </PageContainer>
  );
}

export default AdminDashboardPage;