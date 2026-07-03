import React from "react";
import { Avatar, Button, Card, Input, Select, Space, Table, Tag, Tooltip, Typography, message } from "antd";
import {
  SearchOutlined,
  UserOutlined,
  SendOutlined,
  MailOutlined,
  TrophyOutlined,
  LockOutlined,
} from "@ant-design/icons";
import PageContainer from "../../../components/common/PageContainer";
import { useTalentPool } from "./hooks/useTalentPool";
import type { TalentPoolCandidateDto } from "../../../services/talentPoolService";

const { Text } = Typography;

export default function TalentPoolPage() {
  const {
    navigate,
    searchText,
    setSearchText,
    filterStatus,
    setFilterStatus,
    talentPoolCandidates,
    loading,
    parseSkills,
    formatDate,
    filteredCandidates,
    readyCount,
    lockedCount,
  } = useTalentPool();

  const columns = [
    {
      title: "Ứng viên",
      dataIndex: "fullName",
      key: "fullName",
      width: 260,
      render: (text: string, record: TalentPoolCandidateDto) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: "#1677ff" }} />
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
      width: 280,
      render: (_: any, record: TalentPoolCandidateDto) => (
        <Space size="small" wrap={false}>
          <Tooltip
            title={
              record.isInviteLocked
                ? record.inviteLockReason ||
                  "Ứng viên đang tham gia quy trình tuyển dụng ở một vị trí khác."
                : "Mời ứng viên ứng tuyển vị trí phù hợp"
            }
          >
            <Button
              size="small"
              type="primary"
              ghost
              icon={<SendOutlined />}
              disabled={record.isInviteLocked}
              onClick={() => {
                const talentPoolCandidateId =
                  record.talentPoolCandidateId ||
                  (record as any).talentPoolCandidateID ||
                  (record as any).TalentPoolCandidateID;

                if (!talentPoolCandidateId) {
                  message.error("Không tìm thấy ID ứng viên Talent Pool.");
                  return;
                }
                navigate(`/recruiter/talent-pool/${talentPoolCandidateId}`);
              }}
            >
              Mời ứng tuyển
            </Button>
          </Tooltip>
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
      title="Ngân hàng Ứng viên (Talent Pool)"
      subtitle="Quản lý và tìm kiếm lại những ứng viên tiềm năng cũ cho các chiến dịch mới."
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
        </Space>

        <Card style={{ borderRadius: 12, overflow: "hidden" }}>
          <div
            style={{
              marginBottom: 24,
              display: "flex",
              gap: 16,
              justifyContent: "space-between",
              flexWrap: "wrap",
            }}
          >
            <Space wrap>
              <Input
                size="large"
                placeholder="Tìm kiếm theo kỹ năng, tên, email, vị trí..."
                prefix={<SearchOutlined />}
                style={{ width: 380 }}
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                allowClear
              />
              <Select
                placeholder="Lọc trạng thái"
                style={{ width: 220 }}
                allowClear
                value={filterStatus}
                onChange={setFilterStatus}
                size="large"
                options={[
                  { label: "Sẵn sàng mời", value: "ready" },
                  { label: "Đang trong quy trình khác", value: "locked" },
                ]}
              />
              <Button
                size="large"
                type="primary"
                onClick={() => message.info("Tìm kiếm AI theo ngữ nghĩa chưa phát triển")}
              >
                Tìm kiếm AI
              </Button>
            </Space>
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
