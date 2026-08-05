import { ArrowLeftOutlined, CalendarOutlined, EnvironmentOutlined, TeamOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Col, Descriptions, Row, Skeleton, Statistic, Table, Tag, Typography, message } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageContainer from "../../../../components/common/PageContainer";
import { appTheme } from "../../../../constants/theme";
import { jobService } from "../../../recruiter/services/jobService";
import type { JobDto, JobReviewResponse } from "../../../recruiter/services/jobService";

const { Paragraph, Text, Title } = Typography;

const formatDate = (value?: string | null) => {
  if (!value) return "Chưa cập nhật";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("vi-VN");
};

const statusMeta = (status?: string) => {
  if (status === "Published") return { color: "success", label: "Đang hoạt động" };
  if (status === "Closed" || status === "Locked") return { color: "default", label: "Đã đóng" };
  if (status === "Rejected") return { color: "error", label: "Đã từ chối" };
  if (status === "Archived") return { color: "default", label: "Đã lưu trữ" };
  if (status === "Flagged") return { color: "warning", label: "Đang kiểm duyệt" };
  return { color: "warning", label: "Chờ duyệt" };
};

export default function AdminJobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<JobReviewResponse | null>(null);
  const [adminJob, setAdminJob] = useState<JobDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([jobService.getJobReview(id), jobService.getAdminJobs()])
      .then(([review, jobs]) => {
        const list = Array.isArray(jobs) ? jobs : (jobs as any)?.$values || [];
        setDetail(review);
        setAdminJob(list.find((job: JobDto) => job.id === id) || null);
      })
      .catch((err) => {
        console.error(err);
        setError("Không tải được chi tiết tin tuyển dụng.");
        message.error("Không tải được chi tiết tin tuyển dụng");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <PageContainer title="Chi tiết tin tuyển dụng"><Card><Skeleton active paragraph={{ rows: 10 }} /></Card></PageContainer>;
  }

  if (error || !detail) {
    return (
      <PageContainer title="Chi tiết tin tuyển dụng">
        <Alert type="error" showIcon message={error || "Không tìm thấy tin tuyển dụng"} action={<Button onClick={() => navigate("/admin/approval")}>Quay lại</Button>} />
      </PageContainer>
    );
  }

  const job = detail.jobInfo;
  const status = statusMeta(job.status);
  const criteria = job.criteria || [];

  return (
    <PageContainer
      title="Chi tiết tin tuyển dụng"
      extra={<Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/admin/approval")}>Quay lại danh sách</Button>}
    >
      <Card style={{ borderRadius: 16, border: `1px solid ${appTheme.colors.border}`, marginBottom: 16 }}>
        <Tag color={status.color}>{status.label}</Tag>
        <Title level={2} style={{ margin: "12px 0 4px", color: appTheme.colors.textPrimary }}>
          {job.position?.name || "Chưa cập nhật vị trí"}
        </Title>
        <Text type="secondary">
          HR phụ trách: {adminJob?.recruiter?.name || "Chưa cập nhật"} · {adminJob?.recruiter?.email || "Chưa cập nhật email"}
        </Text>
      </Card>

      {job.status === "Rejected" && (
        <Alert type="error" showIcon message="Lý do từ chối" description={job.rejectReason || "Chưa có lý do cụ thể"} style={{ marginBottom: 16 }} />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}><Card><Statistic title="Lượt xem" value={detail.stats?.viewsCount || 0} prefix={<TeamOutlined />} /></Card></Col>
        <Col xs={24} md={8}><Card><Statistic title="Hồ sơ ứng tuyển" value={detail.stats?.applicationsCount || 0} prefix={<TeamOutlined />} /></Card></Col>
        <Col xs={24} md={8}><Card><Statistic title="Tỷ lệ ứng tuyển" value={detail.stats?.applyRate || 0} suffix="%" /></Card></Col>
      </Row>

      <Card title="Thông tin tuyển dụng" style={{ borderRadius: 16, border: `1px solid ${appTheme.colors.border}`, marginBottom: 16 }}>
        <Descriptions bordered column={{ xs: 1, md: 2 }}>
          <Descriptions.Item label="Lĩnh vực">{job.category?.name || "Chưa cập nhật"}</Descriptions.Item>
          <Descriptions.Item label="Cấp bậc">{job.jobLevel?.name || "Chưa cập nhật"}</Descriptions.Item>
          <Descriptions.Item label="Chi nhánh"><EnvironmentOutlined /> {job.branch?.name || "Chưa cập nhật"}</Descriptions.Item>
          <Descriptions.Item label="Mức lương">{job.salaryRange || "Chưa cập nhật"}</Descriptions.Item>
          <Descriptions.Item label="Ngày bắt đầu"><CalendarOutlined /> {formatDate(job.startDate)}</Descriptions.Item>
          <Descriptions.Item label="Hạn nộp"><CalendarOutlined /> {formatDate(job.deadline)}</Descriptions.Item>
          <Descriptions.Item label="Số lượng cần tuyển">{job.maxCandidates ?? "Không giới hạn"}</Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">{formatDate(job.createdAt)}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card title="Nội dung công việc" style={{ borderRadius: 16, border: `1px solid ${appTheme.colors.border}`, marginBottom: 16 }}>
            <Title level={5}>Mô tả công việc</Title>
            <Paragraph style={{ whiteSpace: "pre-line", color: appTheme.colors.textSecondary }}>{job.description || "Chưa có mô tả"}</Paragraph>
            <Title level={5} style={{ marginTop: 24 }}>Yêu cầu công việc</Title>
            <Paragraph style={{ whiteSpace: "pre-line", color: appTheme.colors.textSecondary }}>{job.requirements || "Chưa có yêu cầu"}</Paragraph>
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card title="Tiêu chí đánh giá CV của HR" style={{ borderRadius: 16, border: `1px solid ${appTheme.colors.border}` }}>
            <Table
              rowKey={(record) => record.id || record.name}
              dataSource={criteria}
              pagination={false}
              size="small"
              locale={{ emptyText: "HR chưa thiết lập tiêu chí" }}
              columns={[
                { title: "Tiêu chí", dataIndex: "name", key: "name", render: (value: string) => <Text strong>{value}</Text> },
                { title: "Trọng số", dataIndex: "weight", key: "weight", width: 110, align: "center", render: (value: number) => <Tag color="blue">{value}%</Tag> },
              ]}
              summary={(data) => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0}><Text strong>Tổng trọng số</Text></Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="center"><Text strong>{data.reduce((sum, item) => sum + Number(item.weight || 0), 0)}%</Text></Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
}
