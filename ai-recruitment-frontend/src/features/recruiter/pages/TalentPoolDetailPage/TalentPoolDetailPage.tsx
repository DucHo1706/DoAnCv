import {
  SkillMatchedIcon,
  SkillMissingIcon,
} from "../../../../components/common/AppIcons";
import {
  Avatar,
  Alert,
  Button,
  Card,
  Collapse,
  Col,
  Descriptions,
  Input,
  Progress,
  Row,
  Select,
  Segmented,
  Space,
  Spin,
  Tag,
  Timeline,
  Tooltip,
  Typography,
  Form,
  InputNumber,
  Skeleton,
} from "antd";
import {
  ArrowLeftOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  DownloadOutlined,
  LockOutlined,
  PlusOutlined,
  SendOutlined,
  TrophyOutlined,
  UserOutlined,
  SearchOutlined,

} from "@ant-design/icons";
import { useMemo, useState } from "react";
import PageContainer from "../../../../components/common/PageContainer";
import { useTalentPoolDetail } from "./hooks/useTalentPoolDetail";
import { getApplicationStatusLabel, getSourcingPriorityLabel, getSourcingStageLabel } from "../../../../utils/statusLabels";
import { talentPoolService } from "../../../talent-pool/services/talentPoolService";
import { useRecruitmentMetadata } from "../../hooks/useRecruitmentMetadata";

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
    clearJobFilters,
    jobFilterCount,
  } = useTalentPoolDetail();
  const [profileSaving, setProfileSaving] = useState(false);
  const [workspaceSection, setWorkspaceSection] = useState<"profile" | "matching">("profile");
  const [profileForm] = Form.useForm();
  const { categories: profileCategories, positions: profilePositions, levels: profileLevels } = useRecruitmentMetadata();

  const profileCategoryOptions = useMemo(() => {
    const byId = new Map(profileCategories.map((item) => [item.id, item]));
    return profileCategories.filter((item) => item.isActive !== false).map((item) => ({
      value: item.name,
      label: item.parentId && byId.get(item.parentId)
        ? `${byId.get(item.parentId)!.name} · ${item.name}`
        : item.name,
    }));
  }, [profileCategories]);

  const profilePositionOptions = useMemo(() =>
    profilePositions.filter((item) => item.isActive !== false).map((item) => ({ value: item.name, label: item.name })),
  [profilePositions]);

  const profileLevelOptions = useMemo(() =>
    profileLevels
      .filter((item) => item.isActive !== false && Boolean(item.parentId))
      .map((item) => ({ value: item.name, label: item.name })),
  [profileLevels]);

  const parseList = (value?: string) => {
    try {
      const parsed = value ? JSON.parse(value) : [];
      return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
    } catch { return []; }
  };

  const industries = useMemo(() => {
    const usedRootIds = new Set(
      openJobs
        .map((job) => categories.find((category) => category.id === job.category?.id))
        .filter(Boolean)
        .map((category) => category!.parentId || category!.id),
    );
    return categories.filter((category) => !category.parentId && usedRootIds.has(category.id));
  }, [categories, openJobs]);

  const sectors = useMemo(() => {
    const usedCategoryIds = new Set(openJobs.map((job) => job.category?.id).filter(Boolean));
    return categories.filter((category) =>
      category.parentId &&
      usedCategoryIds.has(category.id) &&
      (!filterJobIndustry || category.parentId === filterJobIndustry),
    );
  }, [categories, filterJobIndustry, openJobs]);

  const branches = useMemo(() => {
    const unique = new Map<string, string>();
    openJobs.forEach((job) => {
      if (job.branch?.id && job.branch?.name) {
        unique.set(job.branch.id, job.branch.name);
      }
    });
    return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
  }, [openJobs]);

  const sourcingDomains = parseList(candidate?.domainJson);
  const sourcingPositions = parseList(candidate?.targetPositionsJson);
  const sourcingTags = parseList(candidate?.tagsJson);
  const hasSourcingContext = sourcingDomains.length > 0 || sourcingPositions.length > 0 || sourcingTags.length > 0;

  if (loading && !detail) {
    return (
      <PageContainer title="Chi tiết ứng viên">
        <Card style={{ borderRadius: 16, border: "1px solid #E2E8F0", padding: 24 }}>
          <Skeleton active paragraph={{ rows: 10 }} />
        </Card>
      </PageContainer>
    );
  }

  if (!detail || !candidate) {
    return (
      <PageContainer title="Chi tiết ứng viên">
        <Alert type="warning" showIcon message="Không tìm thấy ứng viên trong kho ứng viên tiềm năng." />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={`Chi tiết ứng viên: ${candidate?.fullName || ""}`}
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          Quay lại
        </Button>
      }
    >
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={15}>
          <Card style={{ borderRadius: 12 }}>
            <Segmented
              block
              value={workspaceSection}
              onChange={(value) => setWorkspaceSection(value as "profile" | "matching")}
              options={[{ label: "Hồ sơ & sourcing", value: "profile" }, { label: "Đối sánh & mời", value: "matching" }]}
              style={{ marginBottom: 20 }}
            />
            {workspaceSection === "profile" ? <>
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

            <Card size="small" style={{ marginTop: 20, borderRadius: 10, background: "#F8FAFC" }}>
              <Title level={5} style={{ marginTop: 0, marginBottom: 4 }}>Thông tin sourcing</Title>
              <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
                Context do HR ghi nhận để phân loại, tìm lại và cấp dữ liệu cho hệ thống đề xuất.
              </Text>
              {!hasSourcingContext && (
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 14 }}
                  message="Ứng viên chưa có context sourcing"
                  description="Hãy nhập ít nhất một lĩnh vực hoặc vị trí mục tiêu bên dưới để HR có thể phân loại và hệ thống có cơ sở đề xuất job."
                />
              )}
              {hasSourcingContext && (
                <Space wrap size={[6, 6]} style={{ marginBottom: 14 }}>
                  {sourcingDomains.map((value) => <Tag color="blue" key={`domain-${value}`}>{value}</Tag>)}
                  {sourcingPositions.map((value) => <Tag color="purple" key={`position-${value}`}>{value}</Tag>)}
                  {sourcingTags.map((value) => <Tag key={`tag-${value}`}>{value}</Tag>)}
                  {candidate.sourcingStage && <Tag color="gold">Giai đoạn: {getSourcingStageLabel(candidate.sourcingStage)}</Tag>}
                  {candidate.sourcingPriority && <Tag color={candidate.sourcingPriority === "High" ? "red" : "default"}>Ưu tiên: {getSourcingPriorityLabel(candidate.sourcingPriority)}</Tag>}
                </Space>
              )}
              <Collapse
                ghost
                defaultActiveKey={hasSourcingContext ? [] : ["edit-sourcing"]}
                style={{ margin: "0 -8px" }}
                items={[{
                  key: "edit-sourcing",
                  label: hasSourcingContext ? "Chỉnh sửa phân loại sourcing" : "Bổ sung thông tin sourcing",
                  children: (
              <Form
                form={profileForm}
                layout="vertical"
                initialValues={{
                  domains: parseList(candidate.domainJson),
                  targetPositions: parseList(candidate.targetPositionsJson),
                  tags: parseList(candidate.tagsJson),
                  jobLevel: candidate.jobLevel,
                  sourcingPriority: candidate.sourcingPriority || "Normal",
                  sourcingStage: candidate.sourcingStage || "Saved",
                  expectedSalary: candidate.expectedSalary,
                }}
                onFinish={async (values) => {
                  setProfileSaving(true);
                  try {
                    await talentPoolService.updateTalentPoolProfile(candidate.talentPoolCandidateId, values);
                    window.location.reload();
                  } finally { setProfileSaving(false); }
                }}
              >
                <Row gutter={[12, 0]}>
                  <Col xs={24} md={12}><Form.Item label="Lĩnh vực" name="domains"><Select mode="multiple" showSearch optionFilterProp="label" options={profileCategoryOptions} placeholder="Chọn lĩnh vực trong danh mục hệ thống" /></Form.Item></Col>
                  <Col xs={24} md={12}><Form.Item label="Vị trí mục tiêu" name="targetPositions"><Select mode="multiple" showSearch optionFilterProp="label" options={profilePositionOptions} placeholder="Chọn vị trí trong danh mục hệ thống" /></Form.Item></Col>
                   <Col xs={12} md={6}><Form.Item label="Cấp bậc" name="jobLevel"><Select allowClear options={profileLevelOptions} placeholder="Chọn cấp bậc" /></Form.Item></Col>
                  <Col xs={12} md={6}><Form.Item label="Ưu tiên" name="sourcingPriority"><Select options={[{label:"Thấp",value:"Low"},{label:"Bình thường",value:"Normal"},{label:"Cao",value:"High"}]} /></Form.Item></Col>
                  <Col xs={12} md={6}><Form.Item label="Giai đoạn" name="sourcingStage" extra="Tiến độ HR xử lý hồ sơ, không phải trạng thái ứng tuyển."><Select options={["Saved", "Reviewed", "ContactPlanned", "Contacted", "Responded", "Interested", "Screening", "Interview", "Archived", "NotSuitable"].map(value => ({ label: getSourcingStageLabel(value), value, title: getSourcingStageLabel(value) }))} /></Form.Item></Col>
                  <Col xs={12} md={6}><Form.Item label="Lương kỳ vọng" name="expectedSalary"><InputNumber min={0} style={{ width: "100%" }} /></Form.Item></Col>
                  <Col xs={24}><Form.Item label="Tag" name="tags"><Select mode="tags" placeholder="Ví dụ: Có thể nhận việc trong 30 ngày" /></Form.Item></Col>
                </Row>
                <Button type="primary" htmlType="submit" loading={profileSaving}>Lưu thông tin sourcing</Button>
              </Form>
                  ),
                }]}
              />
            </Card>

            </> : <>
            <div
              style={{
                marginTop: 24,
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <Space style={{ marginBottom: 12 }}>
                <BarChartOutlined style={{ color: "#2563EB" }} />
                <Text strong style={{ color: "#0F172A" }}>
                  Phân tích phù hợp
                </Text>
              </Space>
              <Text type="secondary" style={{ display: "block", fontSize: 12, marginBottom: 12 }}>
                Điểm đề xuất kết hợp kỹ năng hồ sơ, yêu cầu tin tuyển dụng và luật đối sánh của hệ thống; đây không phải cam kết tuyển dụng.
              </Text>

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
                            <Tag color="green" style={{ margin: 0, borderRadius: 4 }}>Bao phủ {job.matchScore}% kỹ năng</Tag>
                          </div>
                          <div style={{ fontSize: 12, color: "#64748B", display: "flex", flexWrap: "wrap", gap: "4px 12px", marginBottom: 6 }}>
                            <span>{job.branchName}</span>
                            {job.salaryRange && <span>{job.salaryRange}</span>}
                            {job.deadline && <span>Hạn: {new Date(job.deadline).toLocaleDateString("vi-VN")}</span>}
                          </div>
                          <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
                            {job.reason}
                          </Text>
                          {(job.matchedSkills || []).length > 0 && (
                            <Space wrap size={[4, 4]} style={{ marginTop: 8 }}>
                              {(job.matchedSkills || []).slice(0, 5).map((skill: string) => <Tag color="blue" key={`${job.jobId}-matched-${skill}`}>{skill}</Tag>)}
                            </Space>
                          )}
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
                <Alert
                  type="info"
                  showIcon
                  message="Chưa có đề xuất nổi bật"
                  description="Bạn vẫn có thể chọn một tin đang mở ở khu vực tìm kiếm bên dưới để xem đối sánh."
                />
              )}
            </div>

            <Card size="small" style={{ marginTop: 20, borderRadius: 10, border: "1px solid #E2E8F0" }}>
              <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
                <Col>
                  <Text strong style={{ display: "block" }}>Chọn tin tuyển dụng khác</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>Chỉ hiển thị tin đang mở của tài khoản HR này.</Text>
                </Col>
                <Col>
                  <Space size="small">
                    <Tag color={jobFilterCount.visible > 0 ? "blue" : "default"}>
                      {jobFilterCount.visible}/{jobFilterCount.total} tin
                    </Tag>
                    <Button type="link" size="small" onClick={clearJobFilters}>Xóa lọc</Button>
                  </Space>
                </Col>
              </Row>

              <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
                <Col xs={24} sm={8}>
                  <Select
                    placeholder="Nhóm ngành"
                    style={{ width: "100%" }}
                    allowClear
                    value={filterJobIndustry}
                    onChange={handleSelectIndustry}
                    options={industries.map(c => ({ label: c.name, value: c.id }))}
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <Select
                    placeholder="Lĩnh vực / chuyên môn"
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
                    placeholder="Chi nhánh làm việc"
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
                    placeholder="Tìm vị trí, kỹ năng, mô tả..."
                    prefix={<SearchOutlined />}
                    value={searchJobQuery}
                    onChange={(e) => setSearchJobQuery(e.target.value)}
                    allowClear
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <Select
                    placeholder="Cấp bậc tuyển dụng"
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
            </Card>

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
              const selectedReason = selectedSuggested?.reason || "Điểm được tính từ các kỹ năng có thể đối chiếu trực tiếp với yêu cầu tin tuyển dụng.";
              const jobRequirements = (selectedJob.requirements || "").trim();
              const contextDomains = parseList(candidate.domainJson);
              const contextPositions = parseList(candidate.targetPositionsJson);

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
                        Kết quả đối sánh cho vị trí:
                      </Text>
                      <Text strong style={{ color: "#2563EB", fontSize: 15 }}>
                        {selectedJob.position?.name}
                      </Text>
                      <Text type="secondary" style={{ display: "block", fontSize: 12, marginTop: 4 }}>
                        {selectedJob.branch?.name || "Chưa cập nhật chi nhánh"}
                        {selectedJob.jobLevel?.name ? ` · ${selectedJob.jobLevel.name}` : ""}
                      </Text>
                    </div>
                  </div>

                  <Alert
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                    message="Cơ sở đối sánh"
                    description={
                      <div>
                        <div style={{ marginBottom: 6 }}>{selectedReason}</div>
                        {contextDomains.length > 0 && <div><Text type="secondary">Lĩnh vực sourcing: </Text>{contextDomains.join(", ")}</div>}
                        {contextPositions.length > 0 && <div><Text type="secondary">Vị trí mục tiêu: </Text>{contextPositions.join(", ")}</div>}
                      </div>
                    }
                  />

                  {jobRequirements && (
                    <div style={{ marginBottom: 14 }}>
                      <Text type="secondary" style={{ fontSize: 13 }}>Tóm tắt yêu cầu tin tuyển dụng: </Text>
                      <Text style={{ fontSize: 13 }}>{jobRequirements.length > 260 ? `${jobRequirements.slice(0, 260)}…` : jobRequirements}</Text>
                    </div>
                  )}

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
            </>}
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
