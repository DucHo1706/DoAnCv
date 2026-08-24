import { Avatar, Button, Card, Input, Select, Space, Table, Tag, Tooltip, Typography, Row, Col, Modal, message, Tabs } from "antd";
import {
  SearchOutlined,
  UserOutlined,
  MailOutlined,
  TrophyOutlined,
  LockOutlined,
  FilePdfOutlined,
  EyeOutlined,
  RedoOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import PageContainer from "../../../../components/common/PageContainer";
import { useTalentPool } from "./hooks/useTalentPool";
import { talentPoolService, type TalentPoolCandidateDto } from "../../services/talentPoolService";
import { appTheme } from "../../../../constants/theme";
import CandidateSearchPage from "../CandidateSearchPage/CandidateSearchPage";
import { useState } from "react";

const { Text } = Typography;

export default function TalentPoolPage() {
  const [activeView, setActiveView] = useState("saved");
  const {
    navigate,
    searchText,
    setSearchText,
    filterStatus,
    setFilterStatus,
    filterMinScore,
    setFilterMinScore,
    filterCategory,
    setFilterCategory,
    filterPosition,
    setFilterPosition,
    filterLevel,
    setFilterLevel,
    talentPoolCandidates,
    categories,
    jobPositions,
    jobLevels,
    loading,
    parseSkills,
    filteredCandidates,
    readyCount,
    lockedCount,
    averageAiScore,
    refreshTalentPool,
  } = useTalentPool();

  const handleRemoveFromPool = (record: TalentPoolCandidateDto) => {
    Modal.confirm({
      title: "Loại ứng viên khỏi kho tiềm năng?",
      content: "Thao tác này chỉ loại ứng viên khỏi kho. Tài khoản, CV và lịch sử ứng tuyển vẫn được giữ nguyên.",
      okText: "Loại khỏi kho",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await talentPoolService.removeTalentPoolCandidate(record.talentPoolCandidateId);
          message.success("Đã loại ứng viên khỏi kho tiềm năng.");
          await refreshTalentPool();
        } catch (error: any) {
          message.error(error?.response?.data?.message || "Không thể loại ứng viên khỏi kho lúc này.");
          throw error;
        }
      },
    });
  };

  const handleResetFilters = () => {
    setSearchText("");
    setFilterStatus(null);
    setFilterMinScore(null);
    setFilterCategory(null);
    setFilterPosition(null);
    setFilterLevel(null);
  };

  const hasActiveFilter =
    searchText.trim() !== "" ||
    filterStatus != null ||
    filterMinScore != null ||
    filterCategory != null ||
    filterPosition != null ||
    filterLevel != null;

  const columns = [
    {
      title: "Ứng viên",
      dataIndex: "fullName",
      key: "fullName",
      width: 260,
      render: (text: string, record: TalentPoolCandidateDto) => (
        <Space align="center">
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: "#2563EB" }} />
          <div style={{ maxWidth: 190 }}>
            <Text strong ellipsis style={{ display: "block", color: "#0F172A" }}>
              {text || "Chưa cập nhật"}
            </Text>
            <Text type="secondary" style={{ fontSize: 12, color: "#64748B" }} ellipsis>
              {record.email || "Chưa có email"}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Kỹ năng nổi bật",
      dataIndex: "highlightSkillsJson",
      key: "highlightSkillsJson",
      width: 340,
      render: (skillsJson: string) => {
        const skills = parseSkills(skillsJson);
        if (skills.length === 0) {
          return <Text type="secondary">Chưa có kỹ năng</Text>;
        }
        return (
          <Space wrap>
            {skills.slice(0, 5).map((skill: string) => (
              <Tag color="geekblue" key={skill} style={{ borderRadius: 8 }}>
                {skill}
              </Tag>
            ))}
            {skills.length > 5 && (
              <Tooltip title={skills.slice(5).join(", ")}>
                <Tag style={{ borderRadius: 8 }}>+{skills.length - 5}</Tag>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: "Lịch sử cao nhất",
      key: "highestHistory",
      width: 280,
      render: (_: any, record: TalentPoolCandidateDto) => (
        <div>
          <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
            Từng nộp: {record.highestScoreJobTitle || "Chưa cập nhật"}
          </Text>
          <Tag color="green" icon={<TrophyOutlined />} style={{ marginTop: 4, borderRadius: 8 }}>
            {record.highestAiScore ? `${record.highestAiScore}/100` : "N/A"}
          </Tag>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "isInviteLocked",
      key: "status",
      width: 160,
      render: (isLocked: boolean) =>
        isLocked ? (
          <Tag color="error" icon={<LockOutlined />} style={{ borderRadius: 8 }}>
            Đã khóa
          </Tag>
        ) : (
          <Tag color="success" icon={<EyeOutlined />} style={{ borderRadius: 8 }}>
            Sẵn sàng
          </Tag>
        ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 350,
      fixed: "right" as const,
      render: (_: any, record: TalentPoolCandidateDto) => (
        <Space size="small">
          <Button
            size="small"
            type="primary"
            ghost
            icon={<EyeOutlined />}
            style={{ borderRadius: 8 }}
            onClick={() => {
              const id =
                record.talentPoolCandidateId ||
                (record as any).talentPoolCandidateID ||
                (record as any).TalentPoolCandidateID;
              if (id) navigate(`/recruiter/talent-pool/${id}`);
            }}
          >
            Chi tiết
          </Button>
          <Button
            size="small"
            icon={<FilePdfOutlined />}
            disabled={!record.latestCvUrl}
            style={{ borderRadius: 8 }}
            onClick={() => {
              if (record.latestCvUrl) {
                const url = record.latestCvUrl.startsWith("http")
                  ? record.latestCvUrl
                  : `${window.location.origin}${record.latestCvUrl.startsWith("/") ? "" : "/"}${record.latestCvUrl}`;
                window.open(url, "_blank");
              }
            }}
          >
            CV
          </Button>
          <Button
            size="small"
            icon={<MailOutlined />}
            style={{ borderRadius: 8 }}
            onClick={() =>
              navigate(`/recruiter/candidates/${record.candidateId}/email`, {
                state: {
                  source: "talent-pool",
                  emailType: "invite",
                  emailContext: `Mời ứng viên trong kho tiềm năng trao đổi về vị trí ${record.highestScoreJobTitle || "phù hợp"}`,
                  talentPoolCandidateId: record.talentPoolCandidateId,
                  candidate: {
                    candidateId: record.candidateId,
                    candidateName: record.fullName,
                    fullName: record.fullName,
                    email: record.email,
                    cvEmail: record.email,
                    phone: record.phone,
                    jobTitle: record.highestScoreJobTitle || "Vị trí phù hợp",
                    aiScore: record.highestAiScore || 0,
                    classification: "Kho ứng viên tiềm năng",
                    matchedSkills: parseSkills(record.highlightSkillsJson),
                    missingSkills: [],
                    source: "TalentPool",
                  },
                },
              })
            }
          >
            Email
          </Button>
          <Tooltip title="Chỉ loại khỏi kho, không xóa hồ sơ ứng viên">
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              style={{ borderRadius: 8 }}
              onClick={() => handleRemoveFromPool(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title="Kho ứng viên tiềm năng"
      subtitle="Ứng viên được lưu từ quy trình xét duyệt hồ sơ; bạn có thể ghi chú, liên hệ hoặc loại khỏi kho."
      extra={
        <Space>
          <Button icon={<PlusOutlined />} onClick={() => navigate("/recruiter/applications")}>
            Chọn từ hồ sơ ứng viên
          </Button>
        </Space>
      }
    >
      <Tabs
        activeKey={activeView}
        onChange={setActiveView}
        items={[{ key: "saved", label: "Ứng viên đã lưu" }, { key: "search", label: "Tìm ứng viên" }]}
        style={{ marginBottom: 16 }}
      />
      {activeView === "search" ? <CandidateSearchPage embedded /> : <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Stat Cards Grid */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card
              bodyStyle={{ padding: 20 }}
              style={{
                borderRadius: appTheme.radius.md,
                border: "1px solid #E2E8F0",
                boxShadow: appTheme.shadow.card,
              }}
            >
              <Space align="center" size="middle">
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <UserOutlined style={{ fontSize: 22, color: "#2563EB" }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 13 }}>Tổng ứng viên</Text>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", lineHeight: 1.2 }}>
                    {talentPoolCandidates.length}
                  </div>
                </div>
              </Space>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card
              bodyStyle={{ padding: 20 }}
              style={{
                borderRadius: appTheme.radius.md,
                border: "1px solid #E2E8F0",
                boxShadow: appTheme.shadow.card,
              }}
            >
              <Space align="center" size="middle">
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <EyeOutlined style={{ fontSize: 22, color: "#10B981" }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 13 }}>Sẵn sàng mời</Text>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", lineHeight: 1.2 }}>
                    {readyCount}
                  </div>
                </div>
              </Space>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card
              bodyStyle={{ padding: 20 }}
              style={{
                borderRadius: appTheme.radius.md,
                border: "1px solid #E2E8F0",
                boxShadow: appTheme.shadow.card,
              }}
            >
              <Space align="center" size="middle">
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <LockOutlined style={{ fontSize: 22, color: "#EF4444" }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 13 }}>Đang quy trình khác</Text>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", lineHeight: 1.2 }}>
                    {lockedCount}
                  </div>
                </div>
              </Space>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card
              bodyStyle={{ padding: 20 }}
              style={{
                borderRadius: appTheme.radius.md,
                border: "1px solid #E2E8F0",
                boxShadow: appTheme.shadow.card,
              }}
            >
              <Space align="center" size="middle">
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#FFFBEB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <TrophyOutlined style={{ fontSize: 22, color: "#F59E0B" }} />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 13 }}>Điểm AI TB</Text>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", lineHeight: 1.2 }}>
                    {averageAiScore} <span style={{ fontSize: 13, fontWeight: 400, color: "#64748B" }}>/100</span>
                  </div>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Filter Bar Card & Main Data Table */}
        <Card
          style={{
            borderRadius: appTheme.radius.lg,
            border: "1px solid #E2E8F0",
            boxShadow: appTheme.shadow.card,
          }}
          bodyStyle={{ padding: 24 }}
        >
          <div style={{ marginBottom: 20 }}>
            <Row gutter={[12, 12]} align="middle">
              <Col xs={24} md={6}>
                <Input
                  placeholder="Tìm theo kỹ năng, tên, email..."
                  prefix={<SearchOutlined style={{ color: "#94A3B8" }} />}
                  style={{ borderRadius: 8, height: 40 }}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                />
              </Col>
              <Col xs={12} md={4}>
                <Select
                  placeholder="Trạng thái"
                  style={{ width: "100%", height: 40 }}
                  value={filterStatus}
                  onChange={setFilterStatus}
                  allowClear
                  options={[
                    { value: "ready", label: "Sẵn sàng" },
                    { value: "locked", label: "Đã khóa" },
                  ]}
                />
              </Col>
              <Col xs={12} md={4}>
                <Select
                  placeholder="Điểm AI tối thiểu"
                  style={{ width: "100%", height: 40 }}
                  value={filterMinScore}
                  onChange={setFilterMinScore}
                  allowClear
                  options={[
                    { value: 50, label: ">= 50 điểm" },
                    { value: 70, label: ">= 70 điểm" },
                    { value: 85, label: ">= 85 điểm" },
                  ]}
                />
              </Col>
              <Col xs={12} md={4}>
                <Select
                  placeholder="Lĩnh vực"
                  style={{ width: "100%", height: 40 }}
                  value={filterCategory}
                  onChange={setFilterCategory}
                  allowClear
                  options={categories.map((c) => ({ label: c.name, value: c.id }))}
                />
              </Col>
              <Col xs={12} md={4}>
                <Select
                  placeholder="Cấp bậc"
                  style={{ width: "100%", height: 40 }}
                  value={filterLevel}
                  onChange={setFilterLevel}
                  allowClear
                  options={jobLevels.map((l) => ({ label: l, value: l }))}
                />
              </Col>
              {hasActiveFilter && (
                <Col xs={12} md={2}>
                  <Button
                    icon={<RedoOutlined />}
                    onClick={handleResetFilters}
                    style={{ borderRadius: 8, height: 40 }}
                  >
                    Xóa lọc
                  </Button>
                </Col>
              )}
            </Row>
          </div>

          <Table scroll={{ x: "max-content" }}
            columns={columns}
            dataSource={filteredCandidates}
            rowKey={(record) => record.talentPoolCandidateId || record.candidateId}
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng cộng ${total} ứng viên`,
            }}
            bordered={false}
            size="middle"
            style={{ borderRadius: appTheme.radius.md }}
          />
        </Card>
      </Space>}
    </PageContainer>
  );
}
