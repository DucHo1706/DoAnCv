import {
  StatusPendingIcon,
  StatusRunningIcon,
  StatusClosedIcon,
} from "../../../../components/common/AppIcons";
import { AppstoreOutlined, CalendarOutlined, CheckCircleOutlined, CheckOutlined, DollarOutlined, EyeOutlined, FileTextOutlined, FireOutlined, LockOutlined, SearchOutlined, StopOutlined, UnlockOutlined, UnorderedListOutlined, UserOutlined } from "@ant-design/icons";
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
  Segmented,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import PageContainer from "../../../../components/common/PageContainer";
import AppPagination from "../../../../components/common/AppPagination";
import { jobService, categoryService } from "../../services/jobService";
import type { JobDto, JobReviewResponse } from "../../services/jobService";
import { EnvironmentOutlined } from "@ant-design/icons";

const { Paragraph, Text, Title } = Typography;

type PendingJobTableItem = {
  id: string;
  title: string;
  location: string;
  salaryRange: string;
  createdAt: string;
  deadline?: string | null;
  recruiterName: string;
  recruiterEmail: string;
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

  // View Mode: 'table' | 'grid'
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Grid & Table Pagination States
  const [gridPage, setGridPage] = useState(1);
  const [gridPageSize, setGridPageSize] = useState(9);

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
      message.error("Không tải được danh sách tin tuyển dụng");
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
      const searchKey = searchText.trim().toLowerCase();
      const titleMatch = (job.position?.name || "").toLowerCase().includes(searchKey);
      const recruiterMatch = (job.recruiter?.name || "").toLowerCase().includes(searchKey) ||
        (job.recruiter?.email || "").toLowerCase().includes(searchKey);
      const branchMatch = (job.branch?.name || "").toLowerCase().includes(searchKey);
      const matchesSearch = searchKey.length === 0 || titleMatch || recruiterMatch || branchMatch;

      const matchesCategory =
        selectedCategoryId === "all" ||
        (job.position as any)?.categoryId === selectedCategoryId ||
        job.category?.id === selectedCategoryId;

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
      recruiterName: job.recruiter?.name || "HR Mặc định",
      recruiterEmail: job.recruiter?.email || "hr@system.com",
      raw: job,
    }));
  }, [filteredJobs]);

  // Paginated data for Grid View
  const paginatedGridData = useMemo(() => {
    const startIndex = (gridPage - 1) * gridPageSize;
    return tableData.slice(startIndex, startIndex + gridPageSize);
  }, [tableData, gridPage, gridPageSize]);

  // Reset grid page on filter change
  useEffect(() => {
    setGridPage(1);
  }, [searchText, selectedCategoryId, selectedStatus]);

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
      fetchAdminJobs();
      if (jobDetail?.jobInfo.id === record.id) {
        setDetailOpen(false);
        setJobDetail(null);
      }
    } catch (error: any) {
      console.error("Approve error:", error);
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

  // Metrics count
  const totalJobsCount = jobs.length;
  const pendingJobsCount = jobs.filter((j) => j.status === "Pending").length;
  const publishedJobsCount = jobs.filter((j) => j.status === "Published").length;
  const closedJobsCount = jobs.filter((j) => j.status === "Closed" || j.status === "Locked").length;

  const columns = [
    {
      title: "Vị trí tuyển dụng",
      dataIndex: "title",
      key: "title",
      width: 280,
      render: (text: string) => (
        <div style={{ wordBreak: "break-word", fontWeight: 700, color: "#0F172A", fontSize: 14 }}>
          {text}
        </div>
      ),
    },
    {
      title: "HR Đăng tuyển",
      key: "recruiter",
      width: 230,
      render: (_: any, record: PendingJobTableItem) => (
        <Space direction="vertical" size={0}>
          <Space size={6}>
            <UserOutlined style={{ color: "#2563EB" }} />
            <Text strong style={{ fontSize: 13, color: "#1E293B" }}>{record.recruiterName}</Text>
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.recruiterEmail}</Text>
        </Space>
      ),
    },
    {
      title: "Chi nhánh",
      dataIndex: "location",
      key: "location",
      width: 140,
      render: (text: string) => (
        <Space size={4}>
          <EnvironmentOutlined style={{ color: "#64748B" }} />
          <Text style={{ color: "#334155" }}>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Mức lương",
      dataIndex: "salaryRange",
      key: "salaryRange",
      width: 160,
      render: (text: string) => (
        <Tag color="blue" style={{ borderRadius: 6, padding: "2px 8px", fontWeight: 600 }}>
          {text}
        </Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 130,
      render: (value: string) => formatDate(value),
    },
    {
      title: "Hạn nộp",
      dataIndex: "deadline",
      key: "deadline",
      width: 130,
      render: (value?: string | null) => formatDate(value),
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 150,
      render: (_: any, record: PendingJobTableItem) => {
        const st = record.raw.status;
        if (st === "Published") {
          return (
            <Tag color="success" style={{ borderRadius: 6, fontWeight: 700, padding: "3px 10px" }}>
              Đang chạy
            </Tag>
          );
        }
        if (st === "Closed" || st === "Locked") {
          return (
            <Tag color="default" style={{ borderRadius: 6, fontWeight: 600, padding: "3px 10px", color: "#64748B" }}>
              Đã đóng
            </Tag>
          );
        }
        return (
          <Tag color="warning" style={{ borderRadius: 6, fontWeight: 800, padding: "3px 10px", backgroundColor: "#FFF7ED", borderColor: "#FFEDD5", color: "#C2410C" }}>
            Chờ duyệt
          </Tag>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 180,
      fixed: "right" as const,
      render: (_: unknown, record: PendingJobTableItem) => (
        <Space size="small">
          <Button icon={<EyeOutlined />} onClick={() => handleViewJob(record)} size="middle">
            Xem
          </Button>
          {record.raw.status === "Pending" && (
            <Button
              type="primary"
              icon={<CheckOutlined />}
              loading={approvingId === record.id}
              disabled={approvingId !== null}
              onClick={() => handleApproveJob(record)}
              style={{ background: "#F97316", borderColor: "#F97316", fontWeight: 700 }}
              size="middle"
            >
              Duyệt
            </Button>
          )}
          {(record.raw.status === "Published" || record.raw.status === "Closed") && (
            <Popconfirm
              title={
                record.raw.status === "Published"
                  ? "Bạn có chắc muốn tạm ẩn tin này?"
                  : "Mở hiển thị lại tin này?"
              }
              onConfirm={() => handleToggleStatus(record.id)}
              okText="Đồng ý"
              cancelText="Hủy"
            >
              <Button
                icon={record.raw.status === "Published" ? <LockOutlined /> : <UnlockOutlined />}
                danger={record.raw.status === "Published"}
                size="middle"
              >
                {record.raw.status === "Published" ? "Tạm ẩn" : "Mở"}
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title="Quản lý & Duyệt Tin tuyển dụng"
    >
      {/* Stat Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              background: "#FFFFFF",
              border: "1px solid rgba(226, 232, 240, 0.8)",
              boxShadow: "0 4px 20px rgba(148, 163, 184, 0.06)",
            }}
            bodyStyle={{ padding: 20 }}
          >
            <Space direction="vertical" size={2} style={{ width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>TỔNG TIN TRONG DB</Text>
                <FileTextOutlined style={{ fontSize: 22, color: "#2563EB" }} />
              </div>
              <Title level={2} style={{ margin: 0, fontWeight: 800, color: "#0F172A" }}>{totalJobsCount}</Title>
              <Text type="secondary" style={{ fontSize: 12 }}>Toàn bộ tin trên CSDL</Text>
            </Space>
          </Card>
        </Col>

        {/* 10% Accent Orange Card */}
        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              background: "#FFF7ED",
              border: "1.5px solid #FFEDD5",
              boxShadow: "0 4px 20px rgba(249, 115, 22, 0.08)",
            }}
            bodyStyle={{ padding: 20 }}
          >
            <Space direction="vertical" size={2} style={{ width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: 13, fontWeight: 700, color: "#C2410C" }}>TIN CHỜ DUYỆT</Text>
                <FireOutlined style={{ fontSize: 22, color: "#F97316" }} />
              </div>
              <Title level={2} style={{ margin: 0, fontWeight: 800, color: "#EA580C" }}>{pendingJobsCount}</Title>
              <Text style={{ fontSize: 12, color: "#9A3412", fontWeight: 500 }}>Yêu cầu cần Admin xử lý ngay</Text>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              background: "#FFFFFF",
              border: "1px solid rgba(226, 232, 240, 0.8)",
              boxShadow: "0 4px 20px rgba(148, 163, 184, 0.06)",
            }}
            bodyStyle={{ padding: 20 }}
          >
            <Space direction="vertical" size={2} style={{ width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>ĐANG CHẠY</Text>
                <CheckCircleOutlined style={{ fontSize: 22, color: "#10B981" }} />
              </div>
              <Title level={2} style={{ margin: 0, fontWeight: 800, color: "#0F172A" }}>{publishedJobsCount}</Title>
              <Text type="secondary" style={{ fontSize: 12 }}>Đang công khai tuyển dụng</Text>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              background: "#FFFFFF",
              border: "1px solid rgba(226, 232, 240, 0.8)",
              boxShadow: "0 4px 20px rgba(148, 163, 184, 0.06)",
            }}
            bodyStyle={{ padding: 20 }}
          >
            <Space direction="vertical" size={2} style={{ width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>ĐÃ KHÓA / TẠM ẨN</Text>
                <StopOutlined style={{ fontSize: 22, color: "#94A3B8" }} />
              </div>
              <Title level={2} style={{ margin: 0, fontWeight: 800, color: "#475569" }}>{closedJobsCount}</Title>
              <Text type="secondary" style={{ fontSize: 12 }}>Tin ngưng nhận hồ sơ</Text>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Filter & View Switcher Bar */}
      <Card style={{ marginBottom: 20, borderRadius: 16, border: "1px solid rgba(226, 232, 240, 0.8)" }} bodyStyle={{ padding: "18px 24px" }}>
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col xs={24} lg={16}>
            <Row gutter={[12, 12]}>
              <Col xs={24} sm={10}>
                <Input
                  placeholder="Tìm theo vị trí, HR đăng, chi nhánh..."
                  prefix={<SearchOutlined style={{ color: "#94A3B8" }} />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                  style={{ borderRadius: 8 }}
                />
              </Col>
              <Col xs={24} sm={7}>
                <Select
                  style={{ width: "100%" }}
                  placeholder="Lĩnh vực"
                  value={selectedCategoryId}
                  onChange={(value) => setSelectedCategoryId(value)}
                  options={[
                    { value: "all", label: "Tất cả lĩnh vực" },
                    ...categories.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                  dropdownStyle={{ borderRadius: 8 }}
                />
              </Col>
              <Col xs={24} sm={7}>
                <Select
                  style={{ width: "100%" }}
                  placeholder="Trạng thái"
                  value={selectedStatus}
                  onChange={(value) => setSelectedStatus(value)}
                  options={[
                    { value: "all", label: "Tất cả trạng thái (DB)" },
                    {
                      value: "Pending",
                      label: (
                        <Space size={6}>
                          <StatusPendingIcon size={14} />
                          <span>Chờ duyệt</span>
                        </Space>
                      ),
                    },
                    {
                      value: "Published",
                      label: (
                        <Space size={6}>
                          <StatusRunningIcon size={14} />
                          <span>Đang chạy</span>
                        </Space>
                      ),
                    },
                    {
                      value: "Closed",
                      label: (
                        <Space size={6}>
                          <StatusClosedIcon size={14} />
                          <span>Đã đóng</span>
                        </Space>
                      ),
                    },
                  ]}
                  dropdownStyle={{ borderRadius: 8 }}
                />
              </Col>
            </Row>
          </Col>

          <Col xs={24} lg={8} style={{ textAlign: "right" }}>
            <Space size={12}>
              <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Chế độ xem:</Text>
              <Segmented
                value={viewMode}
                onChange={(value) => setViewMode(value as "table" | "grid")}
                options={[
                  { label: "Bảng (Table)", value: "table", icon: <UnorderedListOutlined /> },
                  { label: "Thẻ (Grid)", value: "grid", icon: <AppstoreOutlined /> },
                ]}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Main Content Render: Table View or Bento Grid View */}
      {viewMode === "table" ? (
        <Card bodyStyle={{ padding: 0 }} style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(226, 232, 240, 0.8)" }}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={tableData}
            loading={loading}
            scroll={{ x: 1100 }}
            pagination={{ pageSize: 8, showSizeChanger: true, pageSizeOptions: ["8", "16", "32"] }}
          />
        </Card>
      ) : (
        <div>
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>Đang tải dữ liệu...</div>
          ) : tableData.length === 0 ? (
            <Card style={{ borderRadius: 16, textAlign: "center", padding: "60px 0" }}>
              <Text type="secondary">Không tìm thấy tin tuyển dụng nào phù hợp.</Text>
            </Card>
          ) : (
            <>
              <Row gutter={[20, 20]}>
                {paginatedGridData.map((item) => (
                  <Col xs={24} sm={12} lg={8} key={item.id}>
                    <Card
                      hoverable
                      style={{
                        borderRadius: 16,
                        border: "1px solid #E2E8F0",
                        boxShadow: "0 2px 8px rgba(148, 163, 184, 0.05)",
                        background: "#FFFFFF",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                      bodyStyle={{ padding: 22 }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                          <Title level={5} style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0F172A", maxWidth: "75%" }}>
                            {item.title}
                          </Title>
                          {item.raw.status === "Published" ? (
                            <Tag color="success" style={{ borderRadius: 6, fontWeight: 700 }}>Đang chạy</Tag>
                          ) : item.raw.status === "Closed" ? (
                            <Tag color="default" style={{ borderRadius: 6 }}>Đã đóng</Tag>
                          ) : (
                            <Tag color="warning" style={{ borderRadius: 6, fontWeight: 800, backgroundColor: "#FFF7ED", color: "#C2410C" }}>Chờ duyệt</Tag>
                          )}
                        </div>

                        <div style={{ marginBottom: 14 }}>
                          <Space size={6} style={{ marginBottom: 4, display: "flex" }}>
                            <UserOutlined style={{ color: "#2563EB" }} />
                            <Text strong style={{ fontSize: 13, color: "#334155" }}>{item.recruiterName}</Text>
                          </Space>
                          <Text type="secondary" style={{ fontSize: 12, display: "block" }}>{item.recruiterEmail}</Text>
                        </div>

                        <Space direction="vertical" size={6} style={{ width: "100%", marginBottom: 14, fontSize: 13 }}>
                          <Space>
                            <EnvironmentOutlined style={{ color: "#64748B" }} />
                            <Text type="secondary">{item.location}</Text>
                          </Space>
                          <Space>
                            <DollarOutlined style={{ color: "#16A34A" }} />
                            <Text strong style={{ color: "#16A34A" }}>{item.salaryRange}</Text>
                          </Space>
                          <Space>
                            <CalendarOutlined style={{ color: "#64748B" }} />
                            <Text type="secondary">Tạo lúc: {formatDate(item.createdAt)}</Text>
                          </Space>
                        </Space>
                      </div>

                      <Divider style={{ margin: "12px 0" }} />

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Button icon={<EyeOutlined />} onClick={() => handleViewJob(item)}>
                          Chi tiết
                        </Button>
                        {item.raw.status === "Pending" ? (
                          <Button
                            type="primary"
                            icon={<CheckOutlined />}
                            loading={approvingId === item.id}
                            onClick={() => handleApproveJob(item)}
                            style={{ background: "#F97316", borderColor: "#F97316", fontWeight: 700 }}
                          >
                            Duyệt ngay
                          </Button>
                        ) : (
                          <Popconfirm
                            title={item.raw.status === "Published" ? "Bạn có chắc muốn tạm ẩn tin này?" : "Mở hiển thị lại tin này?"}
                            onConfirm={() => handleToggleStatus(item.id)}
                            okText="Đồng ý"
                            cancelText="Hủy"
                          >
                            <Button
                              icon={item.raw.status === "Published" ? <LockOutlined /> : <UnlockOutlined />}
                              danger={item.raw.status === "Published"}
                            >
                              {item.raw.status === "Published" ? "Tạm ẩn" : "Mở lại"}
                            </Button>
                          </Popconfirm>
                        )}
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>

              {/* UNIFIED PAGINATION COMPONENT FOR GRID VIEW */}
              <AppPagination
                current={gridPage}
                pageSize={gridPageSize}
                total={tableData.length}
                onChange={(page, pSize) => {
                  setGridPage(page);
                  setGridPageSize(pSize);
                }}
                pageSizeOptions={["9", "18", "36"]}
              />
            </>
          )}
        </div>
      )}

      {/* Detail Modal */}
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
                    recruiterName: jobDetail.jobInfo.recruiter?.name || "HR Mặc định",
                    recruiterEmail: jobDetail.jobInfo.recruiter?.email || "hr@system.com",
                    raw: jobDetail.jobInfo,
                  })
                }
                style={{ background: "#F97316", borderColor: "#F97316", fontWeight: 700 }}
              >
                Duyệt tin tuyển dụng
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
                <Tag color="success">Đang chạy</Tag>
              ) : jobDetail.jobInfo.status === "Closed" ? (
                <Tag color="default">Đã đóng</Tag>
              ) : (
                <Tag color="warning" style={{ backgroundColor: "#FFF7ED", borderColor: "#FFEDD5", color: "#C2410C", fontWeight: 700 }}>Chờ duyệt</Tag>
              )}
              <Text type="secondary">Tạo lúc: {formatDate(jobDetail.jobInfo.createdAt)}</Text>
            </Space>

            <Descriptions bordered column={2} size="middle">
              <Descriptions.Item label="Vị trí tuyển dụng" span={2}>
                <Text strong style={{ fontSize: 16 }}>{jobDetail.jobInfo.position?.name || "Chưa cập nhật"}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="HR Đăng tuyển" span={2}>
                <Text strong style={{ color: "#2563EB" }}>
                  {jobDetail.jobInfo.recruiter?.name || "HR Mặc định"} ({jobDetail.jobInfo.recruiter?.email || "hr@system.com"})
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Địa điểm Chi nhánh">
                {jobDetail.jobInfo.branch?.name || "Chưa cập nhật"}
              </Descriptions.Item>
              <Descriptions.Item label="Mức lương">
                {jobDetail.jobInfo.salaryRange || "Chưa cập nhật"}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày bắt đầu">
                {formatDate(jobDetail.jobInfo.startDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Hạn nộp hồ sơ">
                {formatDate(jobDetail.jobInfo.deadline)}
              </Descriptions.Item>
              <Descriptions.Item label="Chỉ tiêu số lượng" span={2}>
                {jobDetail.jobInfo.maxCandidates ?? "Không giới hạn"}
              </Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: "16px 0" }} />

            <div style={{ marginBottom: 16 }}>
              <Text strong>Mô tả công việc</Text>
              <Paragraph style={{ marginTop: 8, whiteSpace: "pre-line" }}>
                {jobDetail.jobInfo.description || "Chưa có mô tả"}
              </Paragraph>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong>Yêu cầu công việc</Text>
              <Paragraph style={{ marginTop: 8, whiteSpace: "pre-line" }}>
                {jobDetail.jobInfo.requirements || "Chưa có yêu cầu"}
              </Paragraph>
            </div>

            <div>
              <Text strong>Từ khóa AI bóc tách</Text>
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
                  <Text type="secondary">Chưa có từ khóa AI</Text>
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
