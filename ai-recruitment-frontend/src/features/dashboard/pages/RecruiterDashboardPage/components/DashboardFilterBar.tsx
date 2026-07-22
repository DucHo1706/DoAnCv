import { Card, Col, Row, Select, Typography } from "antd";
import { appTheme } from "../../../../../constants/theme";

const { Text } = Typography;

interface JobOption {
  jobId: number | string;
  jobTitle: string;
  categoryName?: string;
}

interface DashboardFilterBarProps {
  selectedCategory: string | null;
  categories: string[];
  handleCategoryChange: (value: string | undefined) => void;
  selectedJob?: number | string | null;
  handleChangeSelectedJob: (jobId?: number | string) => void;
  loading: boolean;
  filteredJobOptions: JobOption[];
}

export default function DashboardFilterBar({
  selectedCategory,
  categories,
  handleCategoryChange,
  selectedJob,
  handleChangeSelectedJob,
  loading,
  filteredJobOptions,
}: DashboardFilterBarProps) {
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
        <Col xs={24} md={4}>
          <Text strong>Lọc dữ liệu:</Text>
        </Col>

        <Col xs={24} md={10}>
          <Select
            allowClear
            size="large"
            placeholder="Lọc theo Lĩnh vực / Ngành"
            value={selectedCategory}
            onChange={handleCategoryChange}
            style={{ width: "100%" }}
            options={categories.map((cat) => ({
              value: cat,
              label: cat,
            }))}
          />
        </Col>

        <Col xs={24} md={10}>
          <Select
            showSearch
            allowClear
            size="large"
            placeholder="Chọn tin tuyển dụng"
            value={selectedJob}
            onChange={handleChangeSelectedJob}
            style={{ width: "100%" }}
            optionFilterProp="label"
            loading={loading}
            options={filteredJobOptions.map((job) => ({
              value: job.jobId,
              label: job.jobTitle,
            }))}
          />
        </Col>
      </Row>
    </Card>
  );
}
