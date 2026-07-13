import { CheckOutlined, EyeOutlined, LockOutlined, UnlockOutlined, SearchOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  message,
  Modal,
  Row,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
  Input,
  Select,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import PageContainer from "../../components/common/PageContainer";
import StatCard from "../../components/common/StatCard";
import { jobService, categoryService } from "../../services/jobService";
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
  const [categories, setCategories] = useState<any[]>([]);

  // Search & filter states
  const [searchText, setSearchText] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [jobDetail, setJobDetail] = useState<JobReviewResponse | null>(null);

  const fetchAdminJobs = async () => {
    try {
      setLoading(true);
      const data: any = await jobService.getAdminJobs();
      setJobs(Array.isArray(data) ? data : data?.$values || []);
    } catch (error) {
      console.error(error);
      message.error("Không tải được danh sách tin chờ duyệt");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(Array.isArray(data) ? data : (data as any)?.$values || []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách lĩnh vực: ", error);
    }
  };

  useEffect(() => {
    fetchAdminJobs();
    fetchCategories();
  }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // 1. Search text mapping
      const searchKey = searchText.trim().toLowerCase();
      const titleMatch = (job.position?.name || "").toLowerCase().includes(searchKey);
      const companyMatch = ((job as any).company || "").toLowerCase().includes(searchKey);
      const matchesSearch = searchKey.length === 0 || titleMatch || companyMatch;

      // 2. Category matching
      const matchesCategory =
        selectedCategoryId === "all" ||
        (job.position as any)?.categoryId === selectedCategoryId;

      // 3. Status matching
      const matchesStatus =
        selectedStatus === "all" ||
        job.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [jobs, searchText, selectedCategoryId, selectedStatus]);

  const tableData: PendingJobTableItem[] = useMemo(() => {
    return filteredJobs.map((job) => ({
      id: job.id,
      title: job.position?.name || "Chưa cập nhật",
      location: job.branch?.name || "Chưa cập nhật",
      salaryRange: job.salaryRange || "Chưa cập nhật",
      createdAt: job.createdAt,
      deadline: job.deadline,
      raw: job,
    }));
  }, [filteredJobs]);

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
      fetchAdminJobs();
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

  const handleToggleStatus = async (id: string) => {
    try {
      await jobService.toggleJobStatus(id);
      message.success("Cập nhật trạng thái thành công");
      fetchAdminJobs();
      if (jobDetail?.jobInfo.id === id) {
        setDetailOpen(false);
        setJobDetail(null);
      }
    } catch (error: any) {
      message.error("Lỗi khi thay đổi trạng thái!");
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
      render: (_: any, record: any) => {
        const st = record.raw.status;
        if (st === "Published") return <Tag color="green">Đã duyệt</Tag>;
        if (st === "Closed" || st === "Locked") return <Tag color="red">Đã khóa</Tag>;
        return <Tag color="gold">Chờ duyệt</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_: unknown, record: PendingJobTableItem) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => handleViewJob(record)}>
            Xem
          </Button>
          {record.raw.status === "Pending" && (
            <Button
              type="primary"
              icon={<CheckOutlined />}
              loading={approvingId === record.id}
              disabled={approvingId !== null}
              onClick={() => handleApproveJob(record)}
            >
              Duyệt
            </Button>
          )}
          {(record.raw.status === "Published" || record.raw.status === "Closed") && (
            <Popconfirm
              title={
                record.raw.status === "Published"
                  ? "Bạn có chắc muốn khóa tin này?"
                  : "Mở khóa tin này?"
              }
              onConfirm={() => handleToggleStatus(record.id)}
              okText="Đồng ý"
              cancelText="Hủy"
            >
              <Button
                icon={record.raw.status === "Published" ? <LockOutlined /> : <UnlockOutlined />}
                danger={record.raw.status === "Published"}
              >
                {record.raw.status === "Published" ? "Khóa" : "Mở khóa"}
              </Button>
            </Popconfirm>
          )}
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
            title="Tổng tin tuyển dụng"
            value={jobs.length}
            subtitle="Tất cả các bài đăng"
          />
        </Col>
        <Col xs={24} sm={12}>
          <StatCard
            title="Tin đã duyệt"
            value={jobs.filter((j) => j.status === "Published").length}
            subtitle="Danh sách tin đang được công khai"
          />
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }} bodyStyle={{ padding: "16px 24px" }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Input
              placeholder="Tìm theo vị trí, công ty..."
              prefix={<SearchOutlined style={{ color: "#94A3B8" }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{ borderRadius: 8 }}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              style={{ width: "100%" }}
              placeholder="Lọc theo lĩnh vực"
              value={selectedCategoryId}
              onChange={(value) => setSelectedCategoryId(value)}
              options={[
                { value: "all", label: "Tất cả lĩnh vực" },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
              dropdownStyle={{ borderRadius: 8 }}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              style={{ width: "100%" }}
              placeholder="Lọc theo trạng thái"
              value={selectedStatus}
              onChange={(value) => setSelectedStatus(value)}
              options={[
                { value: "all", label: "Tất cả trạng thái" },
                { value: "Pending", label: "Chờ duyệt" },
                { value: "Published", label: "Đang tuyển" },
                { value: "Closed", label: "Đã khóa / Đã đóng" },
              ]}
              dropdownStyle={{ borderRadius: 8 }}
            />
          </Col>
        </Row>
      </Card>

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
          jobDetail && jobDetail.jobInfo.status === "Pending"
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
              {jobDetail.jobInfo.status === "Published" ? (
                <Tag color="green">Đã duyệt</Tag>
              ) : jobDetail.jobInfo.status === "Closed" ? (
                <Tag color="red">Đã khóa</Tag>
              ) : (
                <Tag color="gold">Chờ duyệt</Tag>
              )}
              <Text type="secondary">Tạo lúc: {formatDate(jobDetail.jobInfo.createdAt)}</Text>
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
              <Descriptions.Item label="Số lượng cần tuyển" span={2}>
                {jobDetail.jobInfo.maxCandidates ?? "Không giới hạn"}
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
