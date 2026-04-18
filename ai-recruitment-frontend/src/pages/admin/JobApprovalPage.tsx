import { CheckOutlined, EyeOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  message,
  Modal,
  Row,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import PageContainer from "../../components/common/PageContainer";
import StatCard from "../../components/common/StatCard";
import { jobService } from "../../services/jobService";
import type { JobDto, JobReviewResponse } from "../../services/jobService";

const { Paragraph, Text } = Typography;

type PendingJobTableItem = {
  id: string;
  title: string;
  location: string;
  salaryRange: string;
  createdAt: string;
  deadline?: string | null;
  raw: JobDto;
};

function formatDate(value?: string | null) {
  if (!value) return "Chưa cập nhật";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("vi-VN");
}

function JobApprovalPage() {
  const [loading, setLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobDto[]>([]);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [jobDetail, setJobDetail] = useState<JobReviewResponse | null>(null);

  const fetchPendingJobs = async () => {
    try {
      setLoading(true);
      const data: any = await jobService.getPendingJobs();
      // Bảo vệ giao diện: Chống sập White Screen nếu API trả về Object lỗi
      setJobs(Array.isArray(data) ? data : (data?.$values || []));
    } catch (error) {
      console.error(error);
      message.error("Không tải được danh sách tin chờ duyệt");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingJobs();
  }, []);

  const tableData: PendingJobTableItem[] = useMemo(() => {
    return jobs.map((job) => ({
      id: job.id,
      title: job.position?.name || "Chưa cập nhật",
      location: job.branch?.name || "Chưa cập nhật",
      salaryRange: job.salaryRange || "Chưa cập nhật",
      createdAt: job.createdAt,
      deadline: job.deadline,
      raw: job,
    }));
  }, [jobs]);

  const handleViewJob = async (record: PendingJobTableItem) => {
    try {
      setDetailOpen(true);
      setDetailLoading(true);
      const data = await jobService.getJobReview(record.id);
      setJobDetail(data);
    } catch (error) {
      console.error(error);
      message.error("Không tải được chi tiết tin tuyển dụng");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleApproveJob = async (record: PendingJobTableItem) => {
  if (approvingId) return;

  setApprovingId(record.id);

  try {
    const response = await jobService.approveJob(record.id);
    message.success(response?.message || "Duyệt tin tuyển dụng thành công");
    setJobs((prev) => prev.filter((job) => job.id !== record.id));
    if (jobDetail?.jobInfo.id === record.id) {
      setDetailOpen(false);
      setJobDetail(null);
    }
    jobService
      .getPendingJobs()
      .then((data) => {
        setJobs(data);
      })
      .catch((refreshError) => {
        console.error("Refresh pending jobs failed:", refreshError);
      });
  } catch (error: any) {
    console.error("Approve error:", error);
    console.error("Response data:", error?.response?.data);
    console.error("Status:", error?.response?.status);

    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "Duyệt tin tuyển dụng thất bại";

    message.error(errorMessage);
  } finally {
    setApprovingId(null);
  }
};

  const columns = [
    {
      title: "Vị trí",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Địa điểm",
      dataIndex: "location",
      key: "location",
    },
    {
      title: "Mức lương",
      dataIndex: "salaryRange",
      key: "salaryRange",
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value: string) => formatDate(value),
    },
    {
      title: "Hạn chót",
      dataIndex: "deadline",
      key: "deadline",
      render: (value?: string | null) => formatDate(value),
    },
    {
      title: "Trạng thái",
      key: "status",
      render: () => <Tag color="gold">Chờ duyệt</Tag>,
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_: unknown, record: PendingJobTableItem) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => handleViewJob(record)}>
            Xem
          </Button>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            loading={approvingId === record.id}
            disabled={approvingId !== null}
            onClick={() => handleApproveJob(record)}
          >
            Duyệt
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title="Duyệt tin tuyển dụng"
      subtitle="Xem và duyệt các bài tuyển dụng đang chờ Admin xét duyệt."
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12}>
          <StatCard
            title="Tin chờ duyệt"
            value={tableData.length}
            subtitle="Danh sách hiện tại cần xử lý"
          />
        </Col>
        <Col xs={24} sm={12}>
          <StatCard
            title="Đã sẵn sàng xử lý"
            value={tableData.length}
            subtitle="Có thể xem chi tiết và duyệt ngay"
          />
        </Col>
      </Row>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={tableData}
          loading={loading}
          pagination={{ pageSize: 5 }}
        />
      </Card>

      <Modal
        title="Chi tiết tin tuyển dụng"
        open={detailOpen}
        onCancel={() => {
          setDetailOpen(false);
          setJobDetail(null);
        }}
        footer={
          jobDetail
            ? [
                <Button
                  key="approve"
                  type="primary"
                  icon={<CheckOutlined />}
                  loading={approvingId === jobDetail.jobInfo.id}
                  disabled={approvingId !== null}
                  onClick={() =>
                    handleApproveJob({
                      id: jobDetail.jobInfo.id,
                      title: jobDetail.jobInfo.position?.name || "Chưa cập nhật",
                      location: jobDetail.jobInfo.branch?.name || "Chưa cập nhật",
                      salaryRange: jobDetail.jobInfo.salaryRange,
                      createdAt: jobDetail.jobInfo.createdAt,
                      deadline: jobDetail.jobInfo.deadline,
                      raw: jobDetail.jobInfo,
                    })
                  }
                >
                  Duyệt tin
                </Button>,
              ]
            : null
        }
        width={820}
      >
        {detailLoading && <Text type="secondary">Đang tải dữ liệu...</Text>}

        {jobDetail && (
          <>
            <Space style={{ marginBottom: 16 }}>
              <Tag color="gold">Chờ duyệt</Tag>
              <Text type="secondary">
                Tạo lúc: {formatDate(jobDetail.jobInfo.createdAt)}
              </Text>
            </Space>

            <Descriptions bordered column={2} size="middle">
              <Descriptions.Item label="Tên vị trí" span={2}>
                {jobDetail.jobInfo.position?.name || "Chưa cập nhật"}
              </Descriptions.Item>
              <Descriptions.Item label="Địa điểm">
                {jobDetail.jobInfo.branch?.name || "Chưa cập nhật"}
              </Descriptions.Item>
              <Descriptions.Item label="Mức lương">
                {jobDetail.jobInfo.salaryRange || "Chưa cập nhật"}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày bắt đầu">
                {formatDate(jobDetail.jobInfo.startDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày kết thúc">
                {formatDate(jobDetail.jobInfo.deadline)}
              </Descriptions.Item>
              <Descriptions.Item label="Số lượng ứng viên tối đa" span={2}>
                {jobDetail.jobInfo.maxCandidates ?? "Chưa cập nhật"}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <div style={{ marginBottom: 16 }}>
              <Text strong>Mô tả công việc</Text>
              <Paragraph style={{ marginTop: 8, whiteSpace: "pre-line" }}>
                {jobDetail.jobInfo.description || "Chưa có mô tả"}
              </Paragraph>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong>Yêu cầu</Text>
              <Paragraph style={{ marginTop: 8, whiteSpace: "pre-line" }}>
                {jobDetail.jobInfo.requirements || "Chưa có yêu cầu"}
              </Paragraph>
            </div>

            <div>
              <Text strong>Từ khóa AI phát hiện</Text>
              <div style={{ marginTop: 8 }}>
                {jobDetail.wordsToHighlight?.length ? (
                  <Space wrap>
                    {jobDetail.wordsToHighlight.map((word) => (
                      <Tag color="blue" key={word}>
                        {word}
                      </Tag>
                    ))}
                  </Space>
                ) : (
                  <Text type="secondary">Không có từ khóa mới</Text>
                )}
              </div>
            </div>
          </>
        )}
      </Modal>
    </PageContainer>
  );
}

export default JobApprovalPage;