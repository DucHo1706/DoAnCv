import React, { useEffect, useMemo, useState } from "react";
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
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  FileTextOutlined,
  LockOutlined,
  MessageOutlined,
  PlusOutlined,
  RobotOutlined,
  SendOutlined,
  TrophyOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import PageContainer from "../../components/common/PageContainer";
import { jobService } from "../../services/jobService";
import type { JobDto } from "../../services/jobService";
import { talentPoolService } from "../../services/talentPoolService";
import type {
  TalentPoolDetailDto,
  TalentPoolInteractionDto,
  TalentPoolInviteSuggestionDto,
  TalentPoolSuggestedJobDto,
} from "../../services/talentPoolService";

const { Text, Title, Paragraph } = Typography;

export default function TalentPoolDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [detail, setDetail] = useState<TalentPoolDetailDto | null>(null);
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [inviteSuggestion, setInviteSuggestion] =
    useState<TalentPoolInviteSuggestionDto | null>(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>();

  const fetchDetail = async () => {
    if (!id) {
      message.error("Không tìm thấy mã ứng viên Talent Pool.");
      return;
    }

    try {
      setLoading(true);

      const data = await talentPoolService.getTalentPoolDetail(id);

      setDetail(data);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "Không thể tải chi tiết Talent Pool.";

      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const data = await jobService.getMyJobs();

      if (Array.isArray(data)) {
        setJobs(data);
      } else {
        const values = (data as any)?.$values;

        if (Array.isArray(values)) {
          setJobs(values);
        } else {
          setJobs([]);
        }
      }
    } catch (error) {
      message.error("Không thể tải danh sách công việc để dựng UI mời ứng tuyển.");
    }
  };

  const fetchInviteSuggestions = async () => {
    if (!id) {
      message.error("Không tìm thấy mã ứng viên Talent Pool.");
      return;
    }

    try {
      setSuggestionLoading(true);

      const data = await talentPoolService.getInviteSuggestions(id);

      setInviteSuggestion(data);

      const firstVisibleJob = data.suggestedJobs.find(
        (job) => Number(job.matchScore || 0) > 0
      );

      if (firstVisibleJob) {
        setSelectedJobId(firstVisibleJob.jobId);
      } else {
        setSelectedJobId(undefined);
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        "Không thể tải danh sách job gợi ý.";

      message.error(errorMessage);
    } finally {
      setSuggestionLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    fetchJobs();
    fetchInviteSuggestions();
  }, [id]);

  const parseSkills = (skillsData?: string[] | string | null): string[] => {
    if (!skillsData) {
      return [];
    }

    if (Array.isArray(skillsData)) {
      return skillsData
        .filter((skill) => typeof skill === "string")
        .map((skill) => skill.trim())
        .filter((skill) => skill.length > 0);
    }

    if (typeof skillsData === "string") {
      try {
        const parsedSkills = JSON.parse(skillsData);

        if (Array.isArray(parsedSkills)) {
          return parsedSkills
            .map((skillItem) => {
              if (typeof skillItem === "string") {
                return skillItem;
              }

              if (skillItem?.name) {
                return skillItem.name;
              }

              if (skillItem?.skillName) {
                return skillItem.skillName;
              }

              if (skillItem?.skill) {
                return skillItem.skill;
              }

              return "";
            })
            .map((skill) => skill.trim())
            .filter((skill) => skill.length > 0);
        }

        return [];
      } catch {
        return skillsData
          .split(",")
          .map((skill) => skill.trim())
          .filter((skill) => skill.length > 0);
      }
    }

    return [];
  };

  const formatDateTime = (value?: string) => {
    if (!value) {
      return "Chưa cập nhật";
    }

    const dateValue = new Date(value);

    if (Number.isNaN(dateValue.getTime())) {
      return "Chưa cập nhật";
    }

    return dateValue.toLocaleString("vi-VN");
  };

  const formatJobLabel = (job: JobDto) => {
    const positionName = job.position?.name || "Vị trí";
    const branchName = job.branch?.name || "Chi nhánh";

    return `${positionName} (${branchName})`;
  };

  const isOpenJob = (job: JobDto) => {
    const normalizedStatus = (job.status || "").toLowerCase();

    if (job.isActive === true && job.isApproved === true) {
      return true;
    }

    if (normalizedStatus === "published" || normalizedStatus === "open") {
      return true;
    }

    if (normalizedStatus === "đang mở" || normalizedStatus === "dang mo") {
      return true;
    }

    return false;
  };

  const getTimelineDot = (interaction: TalentPoolInteractionDto) => {
    if (interaction.type === "Rejected") {
      return <CloseCircleOutlined style={{ color: "#ff4d4f" }} />;
    }

    if (interaction.type === "HrNote") {
      return <MessageOutlined style={{ color: "#1677ff" }} />;
    }

    if (interaction.type === "Invited" || interaction.type === "EmailSent") {
      return <SendOutlined style={{ color: "#52c41a" }} />;
    }

    return <FileTextOutlined style={{ color: "#722ed1" }} />;
  };

  const getTimelineColor = (interaction: TalentPoolInteractionDto) => {
    if (interaction.type === "Rejected") {
      return "red";
    }

    if (interaction.type === "HrNote") {
      return "blue";
    }

    if (interaction.type === "Invited" || interaction.type === "EmailSent") {
      return "green";
    }

    return "purple";
  };

  const handleAddNote = async () => {
    if (!id) {
      message.error("Không tìm thấy mã ứng viên Talent Pool.");
      return;
    }

    if (note.trim().length === 0) {
      message.warning("Vui lòng nhập nội dung ghi chú.");
      return;
    }

    try {
      setNoteSubmitting(true);

      await talentPoolService.addTalentPoolNote(id, {
        note: note.trim(),
      });

      message.success("Đã thêm ghi chú.");

      setNote("");
      await fetchDetail();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "Không thể thêm ghi chú.";

      message.error(errorMessage);
    } finally {
      setNoteSubmitting(false);
    }
  };

  const candidate = inviteSuggestion?.candidate ?? detail?.candidate;
  const skills = parseSkills(candidate?.highlightSkillsJson);

  const visibleSuggestedJobs = useMemo(() => {
    return (inviteSuggestion?.suggestedJobs || []).filter(
      (job) => Number(job.matchScore || 0) > 0
    );
  }, [inviteSuggestion]);

  const openJobs = useMemo(() => {
    return jobs.filter((job) => isOpenJob(job));
  }, [jobs]);

  const isSelectedJobValid = useMemo(() => {
    if (!selectedJobId) {
      return false;
    }

    const isSuggestedJob = visibleSuggestedJobs.some(
      (job) => job.jobId === selectedJobId
    );

    const isOpenJobSelected = openJobs.some((job) => job.id === selectedJobId);

    return isSuggestedJob || isOpenJobSelected;
  }, [selectedJobId, visibleSuggestedJobs, openJobs]);

  const handleSelectSuggestedJob = (job: TalentPoolSuggestedJobDto) => {
    setSelectedJobId(job.jobId);
    message.success(`Đã chọn job: ${job.jobTitle}`);
  };

  const handleSendInvite = async () => {
  if (!detail) {
    message.error("Không tìm thấy thông tin ứng viên.");
    return;
  }

  if (!selectedJobId) {
    message.warning("Vui lòng chọn job trước khi gửi lời mời.");
    return;
  }

  if (inviteSuggestion?.isLocked === true || detail.candidate.isInviteLocked === true) {
    message.warning(
      inviteSuggestion?.lockReason ||
        detail.candidate.inviteLockReason ||
        "Ứng viên đang tham gia quy trình tuyển dụng ở vị trí khác."
    );
    return;
  }

  try {
    const selectedSuggestedJob = visibleSuggestedJobs.find(
      (job) => job.jobId === selectedJobId
    );

    const selectedOpenJob = openJobs.find((job) => job.id === selectedJobId);

    if (!selectedSuggestedJob && !selectedOpenJob) {
      message.warning("Vui lòng chọn một job trước khi gửi lời mời.");
      return;
    }

    const selectedJobForEmail = selectedSuggestedJob
      ? {
          jobId: selectedSuggestedJob.jobId,
          jobTitle: selectedSuggestedJob.jobTitle,
          branchName: selectedSuggestedJob.branchName,
          matchScore: selectedSuggestedJob.matchScore,
          reason: selectedSuggestedJob.reason,
        }
      : {
          jobId: selectedOpenJob!.id,
          jobTitle: selectedOpenJob!.position?.name || formatJobLabel(selectedOpenJob!),
          branchName: selectedOpenJob!.branch?.name || "Chưa cập nhật",
          matchScore: 0,
          reason: "HR tự chọn JD ngoài danh sách AI đề xuất.",
        };

    const candidateForEmail = inviteSuggestion?.candidate ?? detail.candidate;

    // ✅ Validation before navigation
    if (!candidateForEmail.candidateId || !candidateForEmail.talentPoolCandidateId) {
      message.error("Dữ liệu ứng viên không đầy đủ. Vui lòng thử lại.");
      return;
    }

    // ✅ Show loading state
    message.loading("Đang chuyển hướng...", 0);

    // ✅ Navigate with complete state
    navigate(`/recruiter/candidates/${candidateForEmail.candidateId}/email`, {
      state: {
        source: "talent-pool",
        emailType: "invite",
        emailContext: `Ứng viên Talent Pool - Mời ứng tuyển vị trí ${selectedJobForEmail.jobTitle}`,
        talentPoolCandidateId: candidateForEmail.talentPoolCandidateId,
        selectedJob: {
          jobId: selectedJobForEmail.jobId,
          jobTitle: selectedJobForEmail.jobTitle,
          branchName: selectedJobForEmail.branchName,
          matchScore: selectedJobForEmail.matchScore,
          reason: selectedJobForEmail.reason,
        },
        candidate: {
          id: undefined,
          candidateId: candidateForEmail.candidateId,
          candidateName: candidateForEmail.fullName,
          fullName: candidateForEmail.fullName,
          email: candidateForEmail.email,
          cvEmail: candidateForEmail.email,
          accountEmail: "",
          phone: candidateForEmail.phone,
          jobId: selectedJobForEmail.jobId,
          jobTitle: selectedJobForEmail.jobTitle,
          aiScore: selectedJobForEmail.matchScore,
          classification: "Talent Pool",
          aiReason: selectedJobForEmail.reason,
          matchedSkills: parseSkills(candidateForEmail.highlightSkillsJson),
          missingSkills: [],
          source: "TalentPool",
          emailContext: `Ứng viên Talent Pool - Mời ứng tuyển vị trí ${selectedJobForEmail.jobTitle}`,
        },
      },
    });

    message.destroy(); // Close loading message
  } catch (error: any) {
    message.error("Lỗi khi gửi lời mời. Vui lòng thử lại.");
    console.error("Error in handleSendInvite:", error);
  }
};

  if (loading && !detail) {
    return (
      <PageContainer
        title="Single Candidate Hub"
        subtitle="Đang tải thông tin ứng viên..."
      >
        <div style={{ textAlign: "center", padding: 80 }}>
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  if (!detail || !candidate) {
    return (
      <PageContainer
        title="Single Candidate Hub"
        subtitle="Không tìm thấy dữ liệu ứng viên."
      >
        <Alert
          type="warning"
          showIcon
          message="Không tìm thấy ứng viên trong Talent Pool."
        />
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
                        background:
                          selectedJobId === job.jobId ? "#ffffff" : "#fbfffc",
                      }}
                    >
                      <Row align="middle" justify="space-between" gutter={[12, 12]}>
                        <Col flex="auto">
                          <Text strong>{job.jobTitle}</Text>

                          <br />

                          <Text type="secondary">{job.branchName}</Text>

                          <br />

                          <Text type="success">
                            Độ phù hợp: {job.matchScore}%
                          </Text>

                          <br />

                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {job.reason}
                          </Text>
                        </Col>

                        <Col>
                          <Button
                            size="small"
                            onClick={() => handleSelectSuggestedJob(job)}
                          >
                            Chọn job này
                          </Button>
                        </Col>
                      </Row>
                    </Card>
                  ))}
                </Space>
              ) : (
                <Text type="secondary">
                  Chưa tìm thấy job đang mở phù hợp với ứng viên này.
                </Text>
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
                <Avatar
                  size={72}
                  icon={<UserOutlined />}
                  style={{ backgroundColor: "#1677ff" }}
                />

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

              <Descriptions
                bordered
                column={1}
                size="small"
                style={{ marginTop: 24 }}
              >
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
                                  <Tag color="green">
                                    AI: {interaction.aiScore}/100
                                  </Tag>
                                )}

                              {interaction.statusSnapshot && (
                                <Tag color="default">
                                  Trạng thái: {interaction.statusSnapshot}
                                </Tag>
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
