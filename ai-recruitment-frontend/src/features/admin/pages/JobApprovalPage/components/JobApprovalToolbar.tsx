import React from "react";
import {
  Card,
  Row,
  Col,
  Input,
  Select,
  Segmented,
  Space,
  Typography,
  Divider,
  Button,
} from "antd";
import {
  SearchOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  DownloadOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

interface JobApprovalToolbarProps {
  searchText: string;
  setSearchText: (val: string) => void;
  selectedRecruiterEmail: string;
  setSelectedRecruiterEmail: (val: string) => void;
  selectedBranchName: string;
  setSelectedBranchName: (val: string) => void;
  selectedCategoryId: string;
  setSelectedCategoryId: (val: string) => void;
  statusTab: string;
  setStatusTab: (val: string) => void;
  viewMode: "table" | "grid";
  setViewMode: (val: "table" | "grid") => void;
  uniqueRecruiters: { name: string; email: string }[];
  uniqueBranches: string[];
  categories: any[];
  counts: { pending: number; active: number; closed: number; all: number };
  onExportCsv: () => void;
}

export function JobApprovalToolbar({
  searchText,
  setSearchText,
  selectedRecruiterEmail,
  setSelectedRecruiterEmail,
  selectedBranchName,
  setSelectedBranchName,
  selectedCategoryId,
  setSelectedCategoryId,
  statusTab,
  setStatusTab,
  viewMode,
  setViewMode,
  uniqueRecruiters,
  uniqueBranches,
  categories,
  counts,
  onExportCsv,
}: JobApprovalToolbarProps) {
  return (
    <Card
      style={{
        marginBottom: 20,
        borderRadius: 16,
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        boxShadow: "0 4px 20px rgba(15, 23, 42, 0.03)",
      }}
      bodyStyle={{ padding: "16px 20px" }}
    >
      {/* Hàng 1: Tabs Trạng thái & View mode toggle & Export CSV */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <Segmented
          value={statusTab}
          onChange={(value) => setStatusTab(value as string)}
          options={[
            { label: `Chờ phê duyệt (${counts.pending})`, value: "pending" },
            { label: `Đang hoạt động (${counts.active})`, value: "active" },
            { label: `Đã đóng (${counts.closed})`, value: "closed" },
            { label: `Tất cả tin (${counts.all})`, value: "all" },
          ]}
          style={{ background: "#F1F5F9", padding: 3, fontWeight: 600 }}
        />

        <Space size="middle">
          <Button
            icon={<DownloadOutlined />}
            onClick={onExportCsv}
            style={{ borderRadius: 8 }}
          >
            Xuất CSV
          </Button>

          <Segmented
            value={viewMode}
            onChange={(val) => setViewMode(val as "table" | "grid")}
            options={[
              { label: "Bảng", value: "table", icon: <UnorderedListOutlined /> },
              { label: "Lưới Bento", value: "grid", icon: <AppstoreOutlined /> },
            ]}
          />
        </Space>
      </div>

      <Divider style={{ margin: "12px 0 16px" }} />

      {/* Hàng 2: Multi-filter inputs */}
      <Row gutter={[12, 12]} align="middle">
        <Col xs={24} sm={12} md={7} lg={7}>
          <Input
            placeholder="Tìm theo vị trí, HR đăng, email..."
            prefix={<SearchOutlined style={{ color: "#94A3B8" }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            style={{ borderRadius: 8 }}
          />
        </Col>

        <Col xs={24} sm={12} md={6} lg={6}>
          <Select
            style={{ width: "100%" }}
            placeholder="Lọc theo Chuyên viên HR"
            value={selectedRecruiterEmail}
            onChange={(value) => setSelectedRecruiterEmail(value)}
            options={[
              { value: "all", label: "Tất cả HR" },
              ...uniqueRecruiters.map((r) => ({
                value: r.email,
                label: `${r.name} (${r.email})`,
              })),
            ]}
            dropdownStyle={{ borderRadius: 8 }}
          />
        </Col>

        <Col xs={24} sm={12} md={5} lg={5}>
          <Select
            style={{ width: "100%" }}
            placeholder="Chi nhánh"
            value={selectedBranchName}
            onChange={(value) => setSelectedBranchName(value)}
            options={[
              { value: "all", label: "Tất cả chi nhánh" },
              ...uniqueBranches.map((b) => ({ value: b, label: b })),
            ]}
            dropdownStyle={{ borderRadius: 8 }}
          />
        </Col>

        <Col xs={24} sm={12} md={6} lg={6}>
          <Select
            style={{ width: "100%" }}
            placeholder="Lĩnh vực ngành nghề"
            value={selectedCategoryId}
            onChange={(value) => setSelectedCategoryId(value)}
            options={[
              { value: "all", label: "Tất cả lĩnh vực" },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
            dropdownStyle={{ borderRadius: 8 }}
          />
        </Col>
      </Row>
    </Card>
  );
}
