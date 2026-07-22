import { Avatar, Button, Card, Input, Select, Space, Table, Tag, Tooltip, Typography, Row, Col } from "antd";
import {
  SearchOutlined,
  UserOutlined,
  MailOutlined,
  TrophyOutlined,
  LockOutlined,
  FilePdfOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import PageContainer from "../../../../components/common/PageContainer";
import { useTalentPool } from "./hooks/useTalentPool";
import type { TalentPoolCandidateDto } from "../../services/talentPoolService";

const { Text } = Typography;

export default function TalentPoolPage() {
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
    formatDate,
    filteredCandidates,
    readyCount,
    lockedCount,
    averageAiScore,
  } = useTalentPool();

  const columns = [
    {
      title: "Ứng viên",
      dataIndex: "fullName",
      key: "fullName",
      width: 260,
      render: (text: string, record: TalentPoolCandidateDto) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: "#2563EB" }} />
          <div style={{ maxWidth: 190 }}>
            <Text strong ellipsis style={{ display: "block" }}>
              {text || "Chưa cập nhật"}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
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
              <Tag color="blue" key={skill}>
                {skill}
              </Tag>
            ))}
            {skills.length > 5 && (
              <Tooltip title={skills.slice(5).join(", ")}>
                <Tag>+{skills.length - 5}</Tag>
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
          <Tag color="green" icon={<TrophyOutlined />} style={{ marginTop: 4 }}>
            AI Điểm cao nhất: {record.highestAiScore || 0}
          </Tag>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 210,
      render: (_: any, record: TalentPoolCandidateDto) => {
        if (record.isInviteLocked === true) {
          return (
            <Tooltip
              title={
                record.inviteLockReason ||
                "Ứng viên đang tham gia quy trình tuyển dụng ở một vị trí khác."
              }
            >
              <Tag color="orange" icon={<LockOutlined />}>
                Đang trong quy trình khác
              </Tag>
            </Tooltip>
          );
        }
        return <Tag color="success">Sẵn sàng tìm việc</Tag>;
      },
    },
    {
      title: (
        <Tooltip title="Cập nhật lần cuối">
          <span style={{ whiteSpace: "nowrap" }}>Cập nhật</span>
        </Tooltip>
      ),
      dataIndex: "lastUpdatedAt",
      key: "lastUpdatedAt",
      width: 120,
      align: "center" as const,
      render: (value: string) => (
        <Text
          type="secondary"
          style={{
            whiteSpace: "nowrap",
            display: "inline-block",
          }}
        >
          {formatDate(value)}
        </Text>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 320,
      render: (_: any, record: TalentPoolCandidateDto) => (
        <Space size="small" wrap={false}>
          <Button
            size="small"
            type="primary"
            ghost
            icon={<EyeOutlined />}
            onClick={() => {
              const talentPoolCandidateId =
                record.talentPoolCandidateId ||
                (record as any).talentPoolCandidateID ||
                (record as any).TalentPoolCandidateID;

              if (!talentPoolCandidateId) {
                return;
              }
              navigate(`/recruiter/talent-pool/${talentPoolCandidateId}`);
            }}
          >
            Xem chi tiết
          </Button>
          <Button
            size="small"
            type="dashed"
            icon={<FilePdfOutlined />}
            disabled={!record.latestCvUrl}
            onClick={() => {
              if (record.latestCvUrl) {
                const url = record.latestCvUrl.startsWith("http")
                  ? record.latestCvUrl
                  : `https://recruitinsightai.com${record.latestCvUrl.startsWith("/") ? "" : "/"}${record.latestCvUrl}`;
                window.open(url, "_blank");
              }
            }}
          >
            Xem CV
          </Button>
          <Button
            size="small"
            icon={<MailOutlined />}
            onClick={() => navigate(`/recruiter/candidates/${record.candidateId}/email`)}
          >
            Email
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title="Kho dữ liệu tài năng (Talent Pool)"
      subtitle="Lưu trữ, quản lý và gợi ý tự động ứng viên tiềm năng cho đợt tuyển dụng mới."
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Space size="middle" wrap>
          <Card style={{ width: 260, borderRadius: 12 }}>
            <Text type="secondary">Tổng ứng viên</Text>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>
              {talentPoolCandidates.length}
            </div>
            <Text type="secondary">Trong Ngân hàng Ứng viên</Text>
          </Card>
          <Card style={{ width: 260, borderRadius: 12 }}>
            <Text type="secondary">Sẵn sàng mời</Text>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{readyCount}</div>
            <Text type="secondary">Không bị khóa quy trình</Text>
          </Card>
          <Card style={{ width: 260, borderRadius: 12 }}>
            <Text type="secondary">Đang trong quy trình khác</Text>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{lockedCount}</div>
            <Text type="secondary">Không thể mời ứng tuyển</Text>
          </Card>
          <Card style={{ width: 260, borderRadius: 12 }}>
            <Text type="secondary">Điểm AI trung bình</Text>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8, color: "#16A34A" }}>
              {averageAiScore}/100
            </div>
            <Text type="secondary">Độ tương hợp bình quân</Text>
          </Card>
        </Space>

        <Card style={{ borderRadius: 12, overflow: "hidden" }}>
          <div style={{ marginBottom: 24 }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Input
                  size="large"
                  placeholder="Tìm kiếm theo kỹ năng, tên, email, vị trí..."
                  prefix={<SearchOutlined />}
                  style={{ width: "100%" }}
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  allowClear
                />
              </Col>
              <Col xs={12} md={4}>
                <Select
                  placeholder="Trạng thái mời"
                  style={{ width: "100%" }}
                  allowClear
                  value={filterStatus}
                  onChange={setFilterStatus}
                  size="large"
                  options={[
                    { label: "Sẵn sàng mời", value: "ready" },
                    { label: "Đang trong quy trình khác", value: "locked" },
                  ]}
                />
              </Col>
              <Col xs={12} md={4}>
                <Select
                  placeholder="Điểm AI tối thiểu"
                  style={{ width: "100%" }}
                  allowClear
                  value={filterMinScore}
                  onChange={setFilterMinScore}
                  size="large"
                  options={[
                    { label: "Xuất sắc (≥ 80)", value: 80 },
                    { label: "Khá tốt (≥ 60)", value: 60 },
                    { label: "Đạt yêu cầu (≥ 50)", value: 50 },
                  ]}
                />
              </Col>
              <Col xs={12} md={4}>
                <Select
                  placeholder="Ngành nghề / Lĩnh vực"
                  style={{ width: "100%" }}
                  allowClear
                  value={filterCategory}
                  onChange={setFilterCategory}
                  size="large"
                  options={categories.map(c => ({ label: c.name, value: c.id }))}
                />
              </Col>
              <Col xs={12} md={4}>
                <Select
                  placeholder="Cấp bậc ứng tuyển"
                  style={{ width: "100%" }}
                  allowClear
                  value={filterLevel}
                  onChange={setFilterLevel}
                  size="large"
                  options={jobLevels.map(l => ({ label: l, value: l }))}
                />
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 12 }}>
              <Col xs={24} md={8}>
                <Select
                  placeholder="Lọc ứng viên khớp Vị trí tuyển dụng mở"
                  style={{ width: "100%" }}
                  allowClear
                  value={filterPosition}
                  onChange={setFilterPosition}
                  size="large"
                  showSearch
                  optionFilterProp="label"
                  options={jobPositions.map(p => ({ label: p.name, value: p.id }))}
                />
              </Col>
            </Row>
          </div>

          <Table
            columns={columns}
            dataSource={filteredCandidates}
            rowKey="talentPoolCandidateId"
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1650 }}
          />
        </Card>
      </Space>
    </PageContainer>
  );
}
