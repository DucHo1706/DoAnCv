import {
  FileTextOutlined,
  FilterOutlined,
  UsergroupAddOutlined,
  BarChartOutlined
} from "@ant-design/icons";
import { Card, Col, Row, Table, Tag, Typography, message, Spin, Select, Space } from "antd";
import { useEffect, useState } from "react";
import { Column, Pie, Bar } from "@ant-design/plots";
import PageContainer from "../../components/common/PageContainer";
import StatCard from "../../components/common/StatCard";
import axiosClient from "../../services/axiosClient";

const { Paragraph, Text } = Typography;

function RecruiterDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);

  // Lấy danh sách tin tuyển dụng của HR để làm bộ lọc
  useEffect(() => {
    const loadMyJobs = async () => {
      try {
        const res = await axiosClient.get("/Jobs/my-jobs");
        setJobs(Array.isArray(res.data) ? res.data : (res.data?.$values || []));
      } catch (e) {
        console.error("Lỗi khi tải danh sách công việc:", e);
      }
    };
    loadMyJobs();
  }, []);

  // Gọi API lấy dữ liệu thống kê thật
  useEffect(() => {
    const fetchHrStats = async () => {
      setLoading(true);
      try {
        const response: any = await axiosClient.get("/Dashboard/hr-stats", {
          params: { jobId: selectedJob }
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
    xField: 'jobName',
    yField: 'count',
    color: '#52c41a',
    label: { position: 'top', style: { fill: '#000', opacity: 0.6 } },
  };

  const degreeConfig = {
    data: stats?.degreeData || [],
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: {
      text: (d: any) => `${d.type}\n ${d.value} CV`,
      position: 'spider',
    },
  };

  const majorConfig = {
    data: stats?.majorData || [],
    angleField: 'value',
    colorField: 'type',
    innerRadius: 0.6,
    label: { text: 'value', style: { fontWeight: 'bold' } },
  };

  const uniConfig = {
    data: stats?.universityData || [],
    xField: 'value',
    yField: 'type',
    color: '#faad14',
    label: { position: 'middle', style: { fill: '#fff' } },
  };

  const expConfig = {
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

  const certConfig = {
    data: stats?.certificateData || [],
    xField: 'value',
    yField: 'type',
    color: '#722ed1',
    label: { position: 'middle', style: { fill: '#fff' } },
  };

  const candidateColumns = [
    { title: "Ứng viên", dataIndex: "candidateName", key: "candidateName", render: (text: string) => <Text strong>{text}</Text> },
    { title: "Vị trí ứng tuyển", dataIndex: "jobTitle", key: "jobTitle" },
    {
      title: "Fit Score",
      dataIndex: "aiScore",
      key: "aiScore",
      render: (score: number) => (
        <Tag color={score >= 80 ? "green" : score >= 60 ? "gold" : "red"}>{score}/100</Tag>
      ),
    },
    {
      title: "Phân loại",
      dataIndex: "classification",
      key: "classification",
      render: (text: string) => <Tag color={text === "Phù hợp" ? "green" : text === "Nên xem xét" ? "orange" : "red"}>{text || "Chưa phân loại"}</Tag>,
    },
  ];

  return (
    <PageContainer
      title="Recruiter Dashboard"
      subtitle="Tổng quan nhanh về các vị trí đang tuyển, hồ sơ mới và kết quả chấm điểm AI."
    >
      <Card style={{ marginBottom: 24, borderRadius: 12 }}>
        <Space size="middle" wrap>
          <FilterOutlined style={{ color: "#1677ff", fontSize: 20 }} />
          <Text strong>Lọc dữ liệu theo Tin tuyển dụng:</Text>
          <Select style={{ width: 350 }} placeholder="Tất cả tin tuyển dụng" allowClear value={selectedJob} onChange={setSelectedJob}>
            {jobs.map(j => (
              <Select.Option key={j.id} value={j.id}>{j.position?.name || 'Vị trí'} - {j.branch?.name || 'Chi nhánh'}</Select.Option>
            ))}
          </Select>
        </Space>
      </Card>

      {loading ? (
        <div style={{ textAlign: "center", padding: "50px 0" }}><Spin size="large" tip="Đang truy xuất dữ liệu CV..." /></div>
      ) : (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12}>
              <StatCard title="Tin tuyển dụng của tôi" value={stats?.totalJobs || 0} icon={<FileTextOutlined style={{ color: "#1677ff" }} />} />
            </Col>
            <Col xs={24} sm={12}>
              <StatCard title="Tổng số CV đã nhận" value={stats?.totalApplications || 0} icon={<UsergroupAddOutlined style={{ color: "#52c41a" }} />} />
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title={<span><BarChartOutlined /> Thống kê Bằng cấp</span>}>
                {stats?.degreeData?.length ? <Pie {...degreeConfig} /> : <Paragraph>Chưa có dữ liệu</Paragraph>}
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title={<span><BarChartOutlined /> Phân bổ Số năm Kinh nghiệm</span>}>
                {stats?.expData?.length ? <Column {...expConfig} /> : <Paragraph>Chưa có dữ liệu</Paragraph>}
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
            <Col xs={24} lg={12}>
              <Card title={<span><BarChartOutlined /> Top Chuyên ngành</span>}>
                {stats?.majorData?.length ? <Pie {...majorConfig} /> : <Paragraph>Chưa có dữ liệu</Paragraph>}
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title={<span><BarChartOutlined /> Top Trường Đại học</span>}>
                {stats?.universityData?.length ? <Bar {...uniConfig} /> : <Paragraph>Chưa có dữ liệu</Paragraph>}
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
            <Col xs={24} lg={12}>
              <Card title={<span><BarChartOutlined /> Số lượng CV theo vị trí ứng tuyển</span>}>
                {stats?.applicationsPerJob?.length ? <Column {...applicationsPerJobConfig} /> : <Paragraph>Chưa có CV nào được nộp</Paragraph>}
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title={<span><BarChartOutlined /> Top Chứng chỉ Ứng viên sở hữu</span>}>
                {stats?.certificateData?.length ? <Bar {...certConfig} /> : <Paragraph>Chưa có dữ liệu chứng chỉ</Paragraph>}
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
            <Col xs={24} lg={12}>
              <Card title="Ứng viên tiềm năng mới nhất (AI Xếp hạng)">
                <Table dataSource={stats?.recentApplications || []} columns={candidateColumns} rowKey="id" pagination={false} size="small" locale={{ emptyText: "Chưa có ứng viên nào nộp CV" }} />
              </Card>
            </Col>
          </Row>
        </>
      )}
    </PageContainer>
  );
}

export default RecruiterDashboardPage;