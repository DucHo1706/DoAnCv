import {
  SkillMatchedIcon,
  SkillMissingIcon,
} from "../../../../components/common/AppIcons";
import {
  Avatar,
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Input,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Timeline,
  Tooltip,
  Typography,
  Skeleton,
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
  SearchOutlined,

} from "@ant-design/icons";
import { useMemo } from "react";
import PageContainer from "../../../../components/common/PageContainer";
import { useTalentPoolDetail } from "./hooks/useTalentPoolDetail";
import { getApplicationStatusLabel } from "../../../../utils/statusLabels";

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
    filteredOpenJobs,
    categories,
    jobLevels,
    isSelectedJobValid,
    searchJobQuery,
    setSearchJobQuery,
    filterJobIndustry,
    filterJobSector,
    filterJobBranch,
    setFilterJobSector,
    setFilterJobBranch,
    filterJobLevel,
    setFilterJobLevel,
    handleSelectIndustry,
  } = useTalentPoolDetail();

  const industries = useMemo(() => {
    return categories.filter((c) => !c.parentId);
  }, [categories]);

  const sectors = useMemo(() => {
    return categories.filter((c) => c.parentId && (!filterJobIndustry || c.parentId === filterJobIndustry));
  }, [categories, filterJobIndustry]);

  const branches = useMemo(() => {
    const unique = new Map<string, string>();
    openJobs.forEach((job) => {
      if (job.branch?.id && job.branch?.name) {
        unique.set(job.branch.id, job.branch.name);
      }
    });
    return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
  }, [openJobs]);

  if (loading && !detail) {
    return (
      <PageContainer title="Chi tiết Ứng viên" subtitle="Đang tải thông tin ứng viên...">
        <Card style={{ borderRadius: 16, border: "1px solid #E2E8F0", padding: 24 }}>
          <Skeleton active paragraph={{ rows: 10 }} />
        </Card>
      </PageContainer>
    );
  }

  if (!detail || !candidate) {
    return (
      <PageContainer title="Chi tiết Ứng viên" subtitle="Không tìm thấy dữ liệu ứng viên.">
        <Alert type="warning" showIcon message="Không tìm thấy ứng viên trong Talent Pool." />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={`Chi tiết ứng viên: ${candidate?.fullName || ""}`}
      subtitle="Quản lý thông tin ứng viên, xem lịch sử tương tác và đối sánh năng lực với các vị trí tuyển dụng."
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
                <Space direction="vertical" style={{ width: "100%" }} size="middle">
                  {visibleSuggestedJobs.slice(0, 3).map((job: any) => (
                    <Card
                      key={job.jobId}
                      size="small"
                      style={{
                        borderRadius: 12,
                        border: selectedJobId === job.jobId ? "2px solid #2563EB" : "1px solid #E2E8F0",
                        background: selectedJobId === job.jobId ? "#FFFFFF" : "#F8FAFC",
                      }}
                      bodyStyle={{ padding: 14 }}
                    >
                      <Row align="middle" justify="space-between" gutter={[12, 12]}>
                        <Col flex="auto">
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <Text strong style={{ color: "#0F172A", fontSize: 14 }}>{job.jobTitle}</Text>
                            <Tag color="green" style={{ margin: 0, borderRadius: 4 }}>{job.matchScore}% khớp</Tag>
                          </div>
                          <div style={{ fontSize: 12, color: "#64748B", display: "flex", flexWrap: "wrap", gap: "4px 12px", marginBottom: 6 }}>
                            <span>🏢 {job.branchName}</span>
                            {job.salaryRange && <span>💵 {job.salaryRange}</span>}
                            {job.deadline && <span>📅 Hạn: {new Date(job.deadline).toLocaleDateString("vi-VN")}</span>}
                          </div>
                          <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
                            💡 {job.reason}
                          </Text>
                        </Col>

                        <Col>
                          <Space direction="vertical" size="small" style={{ alignItems: "flex-end" }}>
                            <Button size="small" type={selectedJobId === job.jobId ? "primary" : "default"} onClick={() => handleSelectSuggestedJob(job)}>
                              Chọn job này
                            </Button>
                            <Button size="small" type="link" onClick={() => navigate(`/recruiter/jobs/${job.jobId}`)} style={{ padding: 0, fontSize: 12 }}>
                              Xem chi tiết
                            </Button>
                          </Space>
                        </Col>
                      </Row>
                    </Card>
                  ))}
                </Space>
              ) : (
                <Text type="secondary">Chưa tìm thấy job đang mở phù hợp với ứng viên này.</Text>
              )}
            </div>

            <div style={{ marginTop: 20 }}>
              <Text strong style={{ display: "block", marginBottom: 12 }}>
                Hoặc tìm kiếm vị trí tuyển dụng khác trong hệ thống:
              </Text>

              <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
                <Col xs={24} sm={8}>
                  <Select
                    placeholder="Ngành nghề"
                    style={{ width: "100%" }}
                    allowClear
                    value={filterJobIndustry}
                    onChange={handleSelectIndustry}
                    options={industries.map(c => ({ label: c.name, value: c.id }))}
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <Select
                    placeholder="Lĩnh vực"
                    style={{ width: "100%" }}
                    allowClear
                    value={filterJobSector}
                    onChange={setFilterJobSector}
                    options={sectors.map(c => ({ label: c.name, value: c.id }))}
                    disabled={!filterJobIndustry}
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <Select
                    placeholder="Chi nhánh"
                    style={{ width: "100%" }}
                    allowClear
                    value={filterJobBranch}
                    onChange={setFilterJobBranch}
                    options={branches.map(b => ({ label: b.name, value: b.id }))}
                  />
                </Col>
              </Row>

              <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
                <Col xs={24} sm={16}>
                  <Input
                    placeholder="Tìm theo tên vị trí..."
                    prefix={<SearchOutlined />}
                    value={searchJobQuery}
                    onChange={(e) => setSearchJobQuery(e.target.value)}
                    allowClear
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <Select
                    placeholder="Cấp bậc"
                    style={{ width: "100%" }}
                    allowClear
                    value={filterJobLevel}
                    onChange={setFilterJobLevel}
                    options={jobLevels.map(l => ({ label: l, value: l }))}
                  />
                </Col>
              </Row>

              <Select
                showSearch
                style={{ width: "100%" }}
                placeholder={filteredOpenJobs.length > 0 ? "-- Chọn vị trí tuyển dụng trong kết quả lọc --" : "Không có vị trí tuyển dụng nào khớp bộ lọc"}
                value={selectedJobId}
                optionFilterProp="label"
                onChange={(value) => setSelectedJobId(value)}
                disabled={filteredOpenJobs.length === 0}
              >
                {filteredOpenJobs.map((job) => (
                  <Select.Option key={job.id} value={job.id} label={formatJobLabel(job)}>
                    {job.position?.name} ({job.branch?.name || "N/A"}) - {job.salaryRange || "Thỏa thuận"}
                  </Select.Option>
                ))}
              </Select>
            </div>

            {/* AI Match Preview Panel */}
            {selectedJobId && (() => {
              const selectedJob = openJobs.find((j: any) => j.id === selectedJobId);
              const selectedSuggested = visibleSuggestedJobs.find((j: any) => j.jobId === selectedJobId);

              if (!selectedJob) return null;

              // Calculate matched and missing skills
              const candidateSkillsSet = new Set(skills.map(s => s.toLowerCase().trim()));

              let jobSkills: string[] = [];
              try {
                if (selectedJob.jobLevel?.name || (selectedJob as any).jdExtractedSkills) {
                  const parsed = JSON.parse((selectedJob as any).jdExtractedSkills || "[]");
                  jobSkills = Array.isArray(parsed) ? parsed : [];
                }
              } catch {
                jobSkills = [];
              }

              if (jobSkills.length === 0 && selectedJob.requirements) {
                jobSkills = selectedJob.requirements.split(/[,;\n]/).map(s => s.trim()).filter(s => s.length > 3 && s.length < 30);
              }

              const matched = jobSkills.filter(s => candidateSkillsSet.has(s.toLowerCase().trim()));
              const missing = jobSkills.filter(s => !candidateSkillsSet.has(s.toLowerCase().trim()));
              const scoreVal = selectedSuggested ? selectedSuggested.matchScore : Math.round((matched.length / Math.max(1, jobSkills.length)) * 100);

              return (
                <div style={{
                  marginTop: 20,
                  padding: 20,
                  background: "#F8FAFC",
                  borderRadius: 12,
                  border: "1px solid #E2E8F0"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                    <Progress
                      type="circle"
                      percent={scoreVal}
                      width={60}
                      strokeColor={scoreVal >= 75 ? "#10B981" : scoreVal >= 50 ? "#F59E0B" : "#EF4444"}
                      format={p => `${p}%`}
                    />
                    <div>
                      <Text strong style={{ fontSize: 13, color: "#0F172A", display: "block" }}>
                        Báo cáo so khớp AI cho vị trí:
                      </Text>
                      <Text strong style={{ color: "#2563EB", fontSize: 15 }}>
                        {selectedJob.position?.name}
                      </Text>
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <Space size={4} style={{ display: "flex", marginBottom: 4 }}>
                      <SkillMatchedIcon size={13} />
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        Kỹ năng đáp ứng ({matched.length}):
                      </Text>
                    </Space>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {matched.length > 0 ? matched.map(s => (
                        <Tag color="green" key={s} style={{ margin: 0 }}>{s}</Tag>
                      )) : <Text type="secondary" style={{ fontSize: 12 }}>Chưa ghi nhận kỹ năng khớp trực tiếp.</Text>}
                    </div>
                  </div>

                  <div>
                    <Space size={4} style={{ display: "flex", marginBottom: 4 }}>
                      <SkillMissingIcon size={13} />
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        Kỹ năng còn thiếu so với yêu cầu ({missing.length}):
                      </Text>
                    </Space>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {missing.length > 0 ? missing.slice(0, 8).map(s => (
                        <Tag color="red" key={s} style={{ margin: 0 }}>{s}</Tag>
                      )) : <Tag color="blue" style={{ margin: 0 }}>Đáp ứng tối đa yêu cầu vị trí này.</Tag>}
                    </div>
                  </div>
                </div>
              );
            })()}

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
                  {candidate.source === "TalentPool" || candidate.source === "talent-pool" ? "Ngân hàng Ứng viên" : candidate.source || "Chưa cập nhật"}
                </Descriptions.Item>

                <Descriptions.Item label="Lần ứng tuyển gần nhất">
                  {formatDateTime(candidate.lastAppliedAt)}
                </Descriptions.Item>

                <Descriptions.Item label="Cập nhật lần cuối">
                  {formatDateTime(candidate.lastUpdatedAt)}
                </Descriptions.Item>
              </Descriptions>

              <Button
                block
                type="primary"
                ghost
                icon={<DownloadOutlined />}
                style={{ marginTop: 16, borderRadius: 8 }}
                disabled={!candidate.latestCvUrl}
                onClick={() => {
                  if (candidate.latestCvUrl) {
                    const url = candidate.latestCvUrl.replace(/https?:\/\/localhost:(7006|5286)/gi, window.location.origin);
                    window.open(url, "_blank");
                  }
                }}
              >
                {candidate.latestCvUrl ? "Xem CV Ứng viên" : "Chưa có file CV"}
              </Button>
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
                    Thêm ghi chú
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
                      items={detail.timeline.map((interaction: any) => ({
                        color: getTimelineColor(interaction),
                        dot: getTimelineDot(interaction),
                        children: (
                          <div style={{ background: "#F8FAFC", padding: "8px 12px", borderRadius: 8, border: "1px solid #E2E8F0", marginBottom: 4 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
                              <Text strong style={{ fontSize: 13, color: "#0F172A" }}>{interaction.title}</Text>
                              <Text type="secondary" style={{ fontSize: 11 }}>
                                {new Date(interaction.createdAt).toLocaleDateString("vi-VN")}
                              </Text>
                            </div>
                            <div style={{ marginTop: 4, display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
                              <Tag color="blue" style={{ fontSize: 10, margin: 0, padding: "0 4px", borderRadius: 4 }}>
                                {interaction.type === "HrNote" ? "Ghi chú HR" :
                                  interaction.type === "Invited" ? "Đã mời ứng tuyển" :
                                    interaction.type === "EmailSent" ? "Đã gửi Email" :
                                      interaction.type === "Rejected" ? "Từ chối" : interaction.type}
                              </Tag>
                              {interaction.aiScore !== null && interaction.aiScore !== undefined && (
                                <Tag color="green" style={{ fontSize: 10, margin: 0, padding: "0 4px", borderRadius: 4 }}>AI: {interaction.aiScore}/100</Tag>
                              )}
                              {interaction.statusSnapshot && (
                                <Tag style={{ fontSize: 10, margin: 0, padding: "0 4px", borderRadius: 4 }}>
                                  {getApplicationStatusLabel(interaction.statusSnapshot)}
                                </Tag>
                              )}
                            </div>
                            {interaction.content && (
                              <Paragraph style={{ margin: 0, fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
                                {interaction.content}
                              </Paragraph>
                            )}
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
