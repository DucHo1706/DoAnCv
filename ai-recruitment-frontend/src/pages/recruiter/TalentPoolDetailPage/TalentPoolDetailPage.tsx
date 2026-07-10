import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Input,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Timeline,
  Tooltip,
  Typography,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  DownloadOutlined,
  LockOutlined,
  PlusOutlined,
  RobotOutlined,
  SendOutlined,
  TrophyOutlined,
  UserOutlined,
} from "@ant-design/icons";
import PageContainer from "../../../components/common/PageContainer";
import { useTalentPoolDetail } from "./hooks/useTalentPoolDetail";

const { Text, Title, Paragraph } = Typography;

export default function TalentPoolDetailPage() {
  const {
    navigate,
    detail,
    loading,
    note,
    setNote,
    noteSubmitting,
    inviteSuggestion,
    suggestionLoading,
    selectedJobId,
    setSelectedJobId,
    handleAddNote,
    handleSelectSuggestedJob,
    handleSendInvite,
    formatDateTime,
    formatJobLabel,
    getTimelineDot,
    getTimelineColor,
    candidate,
    skills,
    visibleSuggestedJobs,
    openJobs,
    isSelectedJobValid,
  } = useTalentPoolDetail();

  if (loading && !detail) {
    return (
      <PageContainer title="Single Candidate Hub" subtitle="Đang tải thông tin ứng viên...">
        <div style={{ textAlign: "center", padding: 80 }}>
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  if (!detail || !candidate) {
    return (
      <PageContainer title="Single Candidate Hub" subtitle="Không tìm thấy dữ liệu ứng viên.">
        <Alert type="warning" showIcon message="Không tìm thấy ứng viên trong Talent Pool." />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={`Mời ứng tuyển: ${candidate?.fullName || ""}`}
      subtitle="Sử dụng AI để phân tích, xem hồ sơ, ghi chú timeline và đề xuất công việc phù hợp trong cùng một màn hình."
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          Quay lại
        </Button>
      }
    >
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={15}>
          <Card style={{ borderRadius: 12 }}>
            <Title level={5}>Ứng viên này sở hữu các kỹ năng:</Title>

            <Space
              wrap
              style={{
                maxHeight: 100,
                overflowY: "auto",
                width: "100%",
              }}
            >
              {skills.length > 0 ? (
                skills.map((skill) => (
                  <Tag color="blue" key={skill}>
                    {skill}
                  </Tag>
                ))
              ) : (
                <Text type="secondary">Chưa có dữ liệu kỹ năng.</Text>
              )}
            </Space>

            <div
              style={{
                marginTop: 24,
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 8,
                padding: 16,
              }}
            >
              <Space style={{ marginBottom: 12 }}>
                <RobotOutlined style={{ color: "#16a34a" }} />
                <Text strong style={{ color: "#16a34a" }}>
                  AI Phân tích & Đề xuất
                </Text>
              </Space>

              {suggestionLoading ? (
                <div style={{ textAlign: "center", padding: 24 }}>
                  <Spin />
                </div>
              ) : visibleSuggestedJobs.length > 0 ? (
                <Space direction="vertical" style={{ width: "100%" }}>
                  {visibleSuggestedJobs.slice(0, 3).map((job) => (
                    <Card
                      key={job.jobId}
                      size="small"
                      style={{
                        borderRadius: 8,
                        background: selectedJobId === job.jobId ? "#ffffff" : "#fbfffc",
                      }}
                    >
                      <Row align="middle" justify="space-between" gutter={[12, 12]}>
                        <Col flex="auto">
                          <Text strong>{job.jobTitle}</Text>

                          <br />

                          <Text type="secondary">{job.branchName}</Text>

                          <br />

                          <Text type="success">Độ phù hợp: {job.matchScore}%</Text>

                          <br />

                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {job.reason}
                          </Text>
                        </Col>

                        <Col>
                          <Button size="small" onClick={() => handleSelectSuggestedJob(job)}>
                            Chọn job này
                          </Button>
                        </Col>
                      </Row>
                    </Card>
                  ))}
                </Space>
              ) : (
                <Text type="secondary">Chưa tìm thấy job đang mở phù hợp với ứng viên này.</Text>
              )}
            </div>

            <Divider />

            <Text strong>Hoặc bạn tự tìm công việc khác theo nhóm ngành:</Text>

            <Select
              showSearch
              style={{ width: "100%", marginTop: 12 }}
              placeholder="-- Nhập tên vị trí để tìm nhanh --"
              value={selectedJobId}
              optionFilterProp="label"
              onChange={(value) => setSelectedJobId(value)}
              options={openJobs.map((job) => ({
                value: job.id,
                label: formatJobLabel(job),
              }))}
            />

            {(inviteSuggestion?.isLocked === true || candidate.isInviteLocked === true) && (
              <Alert
                type="warning"
                showIcon
                style={{ marginTop: 16 }}
                message={
                  inviteSuggestion?.lockReason ||
                  candidate.inviteLockReason ||
                  "Ứng viên đang tham gia quy trình tuyển dụng ở một vị trí khác."
                }
              />
            )}

            <div style={{ textAlign: "right", marginTop: 24 }}>
              <Button size="large" style={{ marginRight: 12 }} onClick={() => navigate(-1)}>
                Hủy bỏ
              </Button>

              <Button
                size="large"
                type="primary"
                icon={<SendOutlined />}
                disabled={
                  inviteSuggestion?.isLocked === true ||
                  candidate.isInviteLocked === true ||
                  !selectedJobId ||
                  !isSelectedJobValid
                }
                onClick={handleSendInvite}
              >
                Gửi Lời Mời Ngay
              </Button>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={9}>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Card title="Thông tin tóm tắt" style={{ borderRadius: 12 }}>
              <Space align="start" size="large" style={{ width: "100%" }}>
                <Avatar size={72} icon={<UserOutlined />} style={{ backgroundColor: "#1677ff" }} />

                <div style={{ flex: 1 }}>
                  <Title level={4} style={{ marginBottom: 4, marginTop: 0 }}>
                    {candidate.fullName || "Chưa cập nhật"}
                  </Title>

                  <Text type="secondary">{candidate.email || "Chưa có email"}</Text>

                  <div style={{ marginTop: 12 }}>
                    {candidate.isInviteLocked ? (
                      <Tooltip title={candidate.inviteLockReason}>
                        <Tag color="orange" icon={<LockOutlined />}>
                          Đang trong quy trình khác
                        </Tag>
                      </Tooltip>
                    ) : (
                      <Tag color="success" icon={<CheckCircleOutlined />}>
                        Sẵn sàng tìm việc
                      </Tag>
                    )}

                    <Tag color="gold" icon={<TrophyOutlined />}>
                      AI cao nhất: {candidate.highestAiScore || 0}/100
                    </Tag>
                  </div>
                </div>
              </Space>

              <Descriptions bordered column={1} size="small" style={{ marginTop: 24 }}>
                <Descriptions.Item label="Email">
                  {candidate.email || "Chưa cập nhật"}
                </Descriptions.Item>

                <Descriptions.Item label="Số điện thoại">
                  {candidate.phone || "Chưa cập nhật"}
                </Descriptions.Item>

                <Descriptions.Item label="Từng nộp vị trí">
                  {candidate.highestScoreJobTitle || "Chưa cập nhật"}
                </Descriptions.Item>

                <Descriptions.Item label="Nguồn">
                  {candidate.source || "Chưa cập nhật"}
                </Descriptions.Item>

                <Descriptions.Item label="Lần ứng tuyển gần nhất">
                  {formatDateTime(candidate.lastAppliedAt)}
                </Descriptions.Item>

                <Descriptions.Item label="Cập nhật lần cuối">
                  {formatDateTime(candidate.lastUpdatedAt)}
                </Descriptions.Item>
              </Descriptions>

              <Tooltip title="Chưa nối API tải CV gốc trong bước layout mock.">
                <Button
                  block
                  type="dashed"
                  icon={<DownloadOutlined />}
                  style={{ marginTop: 16 }}
                  disabled={!candidate.latestCvId}
                >
                  Tải CV Gốc
                </Button>
              </Tooltip>
            </Card>

            <div style={{ position: "sticky", top: 24, zIndex: 1 }}>
              <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <Card title="Thêm ghi chú HR" style={{ borderRadius: 12 }}>
                  <Input.TextArea
                    rows={4}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Nhập ghi chú về ứng viên này..."
                  />

                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    block
                    style={{ marginTop: 12 }}
                    loading={noteSubmitting}
                    onClick={handleAddNote}
                  >
                    Thêm Note
                  </Button>
                </Card>

                <Card
                  title="Timeline tương tác"
                  style={{ borderRadius: 12 }}
                  bodyStyle={{
                    maxHeight: 500,
                    overflowY: "auto",
                    paddingRight: 8,
                  }}
                >
                  {detail.timeline.length === 0 ? (
                    <Text type="secondary">Chưa có lịch sử tương tác.</Text>
                  ) : (
                    <Timeline
                      items={detail.timeline.map((interaction) => ({
                        color: getTimelineColor(interaction),
                        dot: getTimelineDot(interaction),
                        children: (
                          <div>
                            <Space wrap>
                              <Text strong>{interaction.title}</Text>

                              <Tag>{interaction.type}</Tag>

                              {interaction.aiScore !== null &&
                                interaction.aiScore !== undefined && (
                                  <Tag color="green">AI: {interaction.aiScore}/100</Tag>
                                )}

                              {interaction.statusSnapshot && (
                                <Tag color="default">Trạng thái: {interaction.statusSnapshot}</Tag>
                              )}
                            </Space>

                            <Paragraph style={{ marginTop: 8, marginBottom: 4 }}>
                              {interaction.content || "Không có nội dung."}
                            </Paragraph>

                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {formatDateTime(interaction.createdAt)}
                            </Text>
                          </div>
                        ),
                      }))}
                    />
                  )}
                </Card>
              </Space>
            </div>
          </Space>
        </Col>
      </Row>
    </PageContainer>
  );
}
