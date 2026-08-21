import { Card, Col, Row, Select, Typography } from "antd";
import { appTheme } from "../../../../../constants/theme";

const { Text } = Typography;

interface JobOption {
  jobId: number | string;
  jobTitle: string;
  status?: string;
  categoryName?: string;
  unreadCount?: number;
}

interface DashboardFilterBarProps {
  selectedCategory: string | null;
  categories: { value: string; label: string }[];
  handleCategoryChange: (value: string | undefined) => void;
  selectedJob?: number | string | null;
  handleChangeSelectedJob: (jobId?: number | string) => void;
  selectedPosition?: string | null;
  handlePositionChange: (value?: string) => void;
  positionOptions: { id: string; name: string }[];
  selectedJobLevel?: string | null;
  handleJobLevelChange: (value?: string) => void;
  jobLevelOptions: { id: string; name: string }[];
  selectedBranch?: string | null;
  handleBranchChange: (value?: string) => void;
  branchOptions: { id: string; name: string }[];
  loading: boolean;
  filteredJobOptions: JobOption[];
  selectedTimeRange: string;
  handleTimeRangeChange: (value: string) => void;
}

export default function DashboardFilterBar({
  selectedCategory,
  categories,
  handleCategoryChange,
  selectedJob,
  handleChangeSelectedJob,
  selectedPosition,
  handlePositionChange,
  positionOptions,
  selectedJobLevel,
  handleJobLevelChange,
  jobLevelOptions,
  selectedBranch,
  handleBranchChange,
  branchOptions,
  loading,
  filteredJobOptions,
  selectedTimeRange,
  handleTimeRangeChange,
}: DashboardFilterBarProps) {
  const getJobStatusLabel = (status?: string) => {
    switch ((status || "").toLowerCase()) {
      case "published":
        return "Đang mở";
      case "closed":
      case "locked":
      case "expired":
        return "Đã đóng";
      case "pending":
        return "Chờ duyệt";
      case "rejected":
        return "Từ chối";
      default:
        return status || "Chưa xác định";
    }
  };

  return (
    <Card
      style={{
        borderRadius: 16,
        boxShadow: appTheme.shadow.card,
        border: `1px solid ${appTheme.colors.border}`,
      }}
      bodyStyle={{ padding: 12 }}
    >
      <Row align="middle" gutter={[12, 12]}>
        <Col xs={24} lg={3}>
          <Text strong>Lọc dữ liệu:</Text>
        </Col>

        <Col xs={24} md={8} lg={7}>
          <Select
            allowClear
            size="large"
            placeholder="Lọc theo Lĩnh vực / Ngành"
            value={selectedCategory}
            onChange={handleCategoryChange}
            style={{ width: "100%" }}
            options={categories}
          />
        </Col>

        <Col xs={24} md={8} lg={8}>
          <Select showSearch allowClear size="large" placeholder="Vị trí công việc" value={selectedPosition} onChange={handlePositionChange} style={{ width: "100%" }} optionFilterProp="label" options={positionOptions.map((item) => ({ value: item.id, label: item.name }))} />
        </Col>

        <Col xs={24} md={8} lg={6}>
          <Select showSearch allowClear size="large" placeholder="Cấp bậc" value={selectedJobLevel} onChange={handleJobLevelChange} style={{ width: "100%" }} optionFilterProp="label" options={jobLevelOptions.map((item) => ({ value: item.id, label: item.name }))} />
        </Col>

        <Col xs={24} md={8} lg={6}>
          <Select showSearch allowClear size="large" placeholder="Chi nhánh làm việc" value={selectedBranch} onChange={handleBranchChange} style={{ width: "100%" }} optionFilterProp="label" options={branchOptions.map((item) => ({ value: item.id, label: item.name }))} />
        </Col>

        <Col xs={24} md={8} lg={8}>
          <Select
            showSearch
            allowClear
            size="large"
            placeholder="Chọn tin tuyển dụng"
            value={selectedJob}
            onChange={handleChangeSelectedJob}
            style={{ width: "100%" }}
            optionFilterProp="title"
            loading={loading}
            options={filteredJobOptions.map((job) => ({
              value: job.jobId,
              title: job.jobTitle,
              label: (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <span>
                    {job.jobTitle}
                    <span style={{ color: job.status === "Published" ? "#16A34A" : "#6B7280", fontSize: 12, marginLeft: 8 }}>
                      · {getJobStatusLabel(job.status)}
                    </span>
                  </span>
                  {job.unreadCount && job.unreadCount > 0 ? (
                    <span
                      style={{
                        background: "#FEF2F2",
                        border: "1px solid #FECACA",
                        color: "#EF4444",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "1px 8px",
                        borderRadius: 10,
                        marginLeft: 8,
                      }}
                    >
                      ● {job.unreadCount} CV mới
                    </span>
                  ) : null}
                </div>
              ),
            }))}
          />
        </Col>

        <Col xs={24} md={8} lg={6}>
          <Select
            size="large"
            value={selectedTimeRange}
            onChange={handleTimeRangeChange}
            style={{ width: "100%" }}
            options={[
              { value: "today", label: "Hôm nay" },
              { value: "week", label: "7 ngày gần nhất" },
              { value: "month", label: "30 ngày gần nhất" },
              { value: "quarter", label: "3 tháng gần nhất" },
              { value: "year", label: "12 tháng gần nhất" },
              { value: "all", label: "Toàn bộ thời gian" },
            ]}
          />
        </Col>
      </Row>
    </Card>
  );
}
