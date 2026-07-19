import {
  CloseOutlined,
  EyeOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Drawer,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import type { TableProps } from "antd";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "../../components/common/PageContainer";
import TableToolbar from "../../components/common/TableToolbar";
import { appTheme } from "../../constants/theme";
import {
  candidateComparisonService,
  type CandidateCriterionResult,
  type CandidateRankingItem,
  type CandidateRankingSortType,
} from "../../services/candidateComparisonService";
import { jobService, type JobDto } from "../../services/jobService";
import { recruitmentService, type ApplicationDto } from "../../services/recruitmentService";

const { Text, Title } = Typography;

function CVRankingPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [allCandidates, setAllCandidates] = useState<CandidateRankingItem[]>([]);
  const [candidateList, setCandidateList] = useState<CandidateRankingItem[]>([]);
  const [availableCriteria, setAvailableCriteria] = useState<
    Array<{ criterionName: string; weight: number; maxScore: number }>
  >([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedSortType, setSelectedSortType] =
    useState<CandidateRankingSortType>("overall");
  const [selectedCriterion, setSelectedCriterion] = useState<string | null>(null);
  const [selectedApplicationIds, setSelectedApplicationIds] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateRankingItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const [jobData, applicationData] = await Promise.all([
          jobService.getMyJobs(),
          recruitmentService.getHrApplications(),
        ]);

        const normalizedJobs = Array.isArray(jobData)
          ? jobData
          : ((jobData as { $values?: JobDto[] })?.$values ?? []);
        const normalizedApplications = Array.isArray(applicationData)
          ? applicationData
          : ((applicationData as { $values?: ApplicationDto[] })?.$values ?? []);
        const normalizedCandidates = mapApplicationsToRankingItems(normalizedApplications);

        setJobs(normalizedJobs);
        setAllCandidates(normalizedCandidates);
        setCandidateList(normalizedCandidates);
      } catch {
        setErrorMessage("Không thể tải danh sách công việc và hồ sơ ứng viên.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedJobId == null) {
      const normalizedKeyword = searchKeyword.trim().toLocaleLowerCase("vi");
      let filteredCandidates = allCandidates;

      if (normalizedKeyword.length > 0) {
        filteredCandidates = allCandidates.filter((candidate) => {
          const candidateName = candidate.candidateName.toLocaleLowerCase("vi");
          const candidateEmail = candidate.candidateEmail.toLocaleLowerCase("vi");
          return (
            candidateName.includes(normalizedKeyword) ||
            candidateEmail.includes(normalizedKeyword)
          );
        });
      }

      setCandidateList(filteredCandidates);
      setAvailableCriteria([]);
      setErrorMessage("");
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const query: {
          sortBy: CandidateRankingSortType;
          criterionName?: string;
          search?: string;
        } = {
          sortBy: selectedSortType,
        };

        if (selectedSortType === "criterion" && selectedCriterion != null) {
          query.criterionName = selectedCriterion;
        }

        if (searchKeyword.trim().length > 0) {
          query.search = searchKeyword.trim();
        }

        const response = await candidateComparisonService.getCandidateRankings(
          selectedJobId,
          query
        );

        setCandidateList(Array.isArray(response.candidates) ? response.candidates : []);
        setAvailableCriteria(
          Array.isArray(response.availableCriteria) ? response.availableCriteria : []
        );
      } catch (error: unknown) {
        const apiMessage = getApiErrorMessage(error);
        setCandidateList([]);
        setAvailableCriteria([]);
        setErrorMessage(apiMessage);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [selectedJobId, selectedSortType, selectedCriterion, searchKeyword, allCandidates]);

  const handleJobChange = (jobId: string | null) => {
    setSelectedJobId(jobId);
    setSelectedSortType("overall");
    setSelectedCriterion(null);
    setSelectedApplicationIds([]);
    setSelectionMode(false);
    setSelectedCandidate(null);
  };

  const handleSortTypeChange = (sortType: CandidateRankingSortType) => {
    setSelectedSortType(sortType);
    setSelectedApplicationIds([]);

    if (sortType === "overall") {
      setSelectedCriterion(null);
      return;
    }

    if (selectedCriterion == null && availableCriteria.length > 0) {
      setSelectedCriterion(availableCriteria[0].criterionName);
    }
  };

  const handleEnableSelection = () => {
    if (selectedJobId == null) {
      message.info("Vui lòng chọn một công việc trước khi chọn ứng viên.");
      return;
    }

    setSelectedApplicationIds([]);
    setSelectionMode(true);
  };

  const handleCancelSelection = () => {
    setSelectedApplicationIds([]);
    setSelectionMode(false);
  };

  const handleCompareCandidates = () => {
    if (selectedJobId == null || selectedApplicationIds.length < 2) {
      return;
    }

    const encodedJobId = encodeURIComponent(selectedJobId);
    const encodedApplicationIds = selectedApplicationIds
      .map((applicationId) => encodeURIComponent(applicationId))
      .join(",");

    navigate(
      `/recruiter/ranking/compare?jobId=${encodedJobId}&applicationIds=${encodedApplicationIds}`
    );
  };

  const selectedCriterionDefinition = useMemo(() => {
    return availableCriteria.find(
      (criterion) => criterion.criterionName === selectedCriterion
    );
  }, [availableCriteria, selectedCriterion]);

  const topCandidate = candidateList.find((candidate) => {
    if (selectedSortType === "criterion") {
      return candidate.selectedCriterionRank === 1;
    }

    return candidate.overallRank === 1;
  });

  const columns = useMemo<TableProps<CandidateRankingItem>["columns"]>(() => {
    const tableColumns: NonNullable<TableProps<CandidateRankingItem>["columns"]> = [
      {
        title: "Hạng",
        key: "rank",
        width: 120,
        render: (_, candidate) => {
          let rank = candidate.overallRank;
          if (selectedSortType === "criterion") {
            rank = candidate.selectedCriterionRank;
          }

          if (rank == null) {
            return <Tag>Chưa xếp hạng</Tag>;
          }

          if (rank === 1) {
            return <Tag color="gold">🏆 Hạng 1</Tag>;
          }

          if (rank === 2) {
            return <Tag color="default">🥈 Hạng 2</Tag>;
          }

          if (rank === 3) {
            return <Tag color="orange">🥉 Hạng 3</Tag>;
          }

          return <Tag>#{rank}</Tag>;
        },
      },
      {
        title: "Ứng viên",
        key: "candidate",
        render: (_, candidate) => (
          <Space direction="vertical" size={2}>
            <Text strong style={{ color: appTheme.colors.textPrimary }}>
              {candidate.candidateName}
            </Text>
            <Text style={{ color: appTheme.colors.textSecondary, fontSize: 13 }}>
              {candidate.candidateEmail || "Chưa cập nhật email"}
            </Text>
          </Space>
        ),
      },
      {
        title: "Vị trí ứng tuyển",
        dataIndex: "jobTitle",
        key: "jobTitle",
        render: (jobTitle: string) => jobTitle || "Chưa cập nhật",
      },
      {
        title: "Điểm tổng thể",
        dataIndex: "aiScore",
        key: "aiScore",
        width: 140,
        render: (aiScore: number | null) => renderScoreTag(aiScore, 100),
      },
    ];

    if (selectedSortType === "criterion" && selectedCriterion != null) {
      tableColumns.push({
        title: selectedCriterion,
        key: "selectedCriterionScore",
        width: 160,
        render: (_, candidate) => {
          const criterion = findCriterionResult(candidate, selectedCriterion);
          if (criterion == null || criterion.score == null || criterion.hasData === false) {
            return <Text type="secondary">Chưa có dữ liệu</Text>;
          }

          return renderScoreTag(criterion.score, criterion.maxScore);
        },
      });
    }

    tableColumns.push(
      {
        title: "Trạng thái AI",
        key: "aiDataStatus",
        width: 170,
        render: (_, candidate) => renderAiStatus(candidate),
      },
      {
        title: "Thao tác",
        key: "actions",
        width: 250,
        render: (_, candidate) => (
          <Space>
            <Button icon={<EyeOutlined />} onClick={() => setSelectedCandidate(candidate)}>
              Xem nhanh AI
            </Button>
            <Button
              type="primary"
              icon={<UserOutlined />}
              onClick={() => navigate(`/recruiter/candidates/${candidate.applicationId}`)}
            >
              Hồ sơ
            </Button>
          </Space>
        ),
      }
    );

    return tableColumns;
  }, [navigate, selectedCriterion, selectedSortType]);

  const rowSelection: TableProps<CandidateRankingItem>["rowSelection"] = selectionMode
    ? {
        selectedRowKeys: selectedApplicationIds,
        preserveSelectedRowKeys: false,
        onChange: (selectedRowKeys) => {
          const normalizedIds = selectedRowKeys.map((key) => String(key));
          if (normalizedIds.length > 4) {
            message.warning("Chỉ được chọn tối đa bốn ứng viên.");
            return;
          }

          setSelectedApplicationIds(normalizedIds);
        },
        getCheckboxProps: (candidate) => {
          const isSelected = selectedApplicationIds.includes(candidate.applicationId);
          const reachedSelectionLimit = selectedApplicationIds.length >= 4 && isSelected === false;
          const isEligible = isCandidateEligible(candidate);

          return {
            disabled: isEligible === false || reachedSelectionLimit,
            title: isEligible
              ? undefined
              : "Hồ sơ chưa có đủ dữ liệu AI để so sánh.",
          };
        },
      }
    : undefined;

  return (
    <PageContainer
      title="Xếp hạng ứng viên"
      subtitle="Sàng lọc hồ sơ theo điểm tổng thể hoặc từng tiêu chí của công việc."
    >
      {errorMessage.length > 0 ? (
        <Alert
          type="error"
          showIcon
          message="Không thể tải dữ liệu xếp hạng"
          description={errorMessage}
          style={{ marginBottom: 20, borderRadius: 12 }}
        />
      ) : null}

      <style dangerouslySetInnerHTML={{ __html: `
        .ant-table-row {
          transition: all 0.2s ease-in-out !important;
        }
        .ant-table-row:hover {
          background-color: #F8FAFC !important;
          transform: translateY(-1px);
        }
        .bento-stat-card {
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .bento-stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 16px 32px -10px rgba(15, 23, 42, 0.08) !important;
          border-color: #2563EB !important;
        }
      `}} />

      {/* Khối Thống kê Bento Grid không đối xứng */}
      <Row gutter={[20, 20]} style={{ marginBottom: 28 }}>
        {/* Bento Cell 1: Top 1 Ứng viên (Span 12) */}
        <Col xs={24} md={12}>
          <Card
            className="bento-stat-card"
            style={{
              height: "100%",
              borderRadius: 16,
              border: `1px solid ${appTheme.colors.border}`,
              background: `linear-gradient(135deg, ${appTheme.colors.surface} 0%, #EFF6FF 100%)`,
              boxShadow: appTheme.shadow.card,
            }}
            bodyStyle={{ padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <Text style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em", color: appTheme.colors.textSecondary, fontFamily: appTheme.font.family, fontWeight: 600 }}>
                  Ứng viên xuất sắc nhất
                </Text>
                <div style={{ background: "rgba(217, 119, 6, 0.1)", padding: 6, borderRadius: "50%", color: "#D97706", display: "flex" }}>
                  <TrophyOutlined style={{ fontSize: 18 }} />
                </div>
              </div>
              <Title level={3} style={{ margin: 0, fontSize: 20, color: appTheme.colors.textPrimary, fontFamily: appTheme.font.family, fontWeight: 700 }}>
                {candidateList[0]?.candidateName || "Chưa có ứng viên"}
              </Title>
              <Text style={{ fontSize: 14, color: appTheme.colors.textSecondary, display: "block", marginTop: 4, fontFamily: appTheme.font.family }}>
                Vị trí: {candidateList[0]?.jobTitle || "-"}
              </Text>
            </div>
            <div style={{ marginTop: 20 }}>
              <Tag
                style={{
                  background: "#FEF3C7",
                  color: "#D97706",
                  border: "1px solid #FDE68A",
                  fontWeight: 700,
                  fontSize: 13,
                  borderRadius: 6,
                  padding: "4px 12px",
                  fontFamily: appTheme.font.family,
                }}
              >
                Match Score: {candidateList[0]?.aiScore ? `${candidateList[0].aiScore}/100` : "-"}
              </Tag>
            </div>
          </Card>
        </Col>

        {/* Bento Cell 2: Điểm match cao nhất */}
        <Col xs={24} sm={12} md={6}>
          <Card
            className="bento-stat-card"
            style={{
              height: "100%",
              borderRadius: 16,
              border: `1px solid ${appTheme.colors.border}`,
              background: appTheme.colors.surface,
              boxShadow: appTheme.shadow.card,
            }}
            bodyStyle={{ padding: 24 }}
          >
            <Text style={{ fontSize: 13, color: appTheme.colors.textSecondary, fontFamily: appTheme.font.family, fontWeight: 600, display: "block", marginBottom: 16 }}>
              {selectedSortType === "criterion" ? "Tiêu chí xếp hạng" : "Điểm cao nhất"}
            </Text>
            <div style={{ fontSize: selectedSortType === "criterion" ? 18 : 32, fontWeight: 800, color: appTheme.colors.primary, fontFamily: appTheme.font.family, lineHeight: 1.2, wordBreak: "break-word" }}>
              {selectedSortType === "criterion"
                ? (selectedCriterionDefinition?.criterionName || "Chưa chọn")
                : (topCandidate?.aiScore != null ? `${topCandidate.aiScore}` : "-")}
              {selectedSortType !== "criterion" && topCandidate?.aiScore != null && (
                <span style={{ fontSize: 16, fontWeight: 500, color: appTheme.colors.textSecondary }}>/100</span>
              )}
            </div>
            <Text style={{ fontSize: 12, color: appTheme.colors.textSecondary, display: "block", marginTop: 12, fontFamily: appTheme.font.family }}>
              {selectedSortType === "criterion" && selectedCriterionDefinition != null
                ? `Trọng số ${selectedCriterionDefinition.weight}%`
                : "Best Fit Score"}
            </Text>
          </Card>
        </Col>

        {/* Bento Cell 3: Tổng số hồ sơ */}
        <Col xs={24} sm={12} md={6}>
          <Card
            className="bento-stat-card"
            style={{
              height: "100%",
              borderRadius: 16,
              border: `1px solid ${appTheme.colors.border}`,
              background: appTheme.colors.surface,
              boxShadow: appTheme.shadow.card,
            }}
            bodyStyle={{ padding: 24 }}
          >
            <Text style={{ fontSize: 13, color: appTheme.colors.textSecondary, fontFamily: appTheme.font.family, fontWeight: 600, display: "block", marginBottom: 16 }}>
              Số hồ sơ hiển thị
            </Text>
            <div style={{ fontSize: 32, fontWeight: 800, color: appTheme.colors.textPrimary, fontFamily: appTheme.font.family, lineHeight: 1 }}>
              {candidateList.length}
              <span style={{ fontSize: 16, fontWeight: 500, color: appTheme.colors.textSecondary }}> hồ sơ</span>
            </div>
            <Text style={{ fontSize: 12, color: appTheme.colors.textSecondary, display: "block", marginTop: 12, fontFamily: appTheme.font.family }}>
              {selectedJobId == null ? "Tất cả công việc" : "Theo công việc đã chọn"}
            </Text>
          </Card>
        </Col>
      </Row>

      <Card style={cardStyle} bodyStyle={{ padding: appTheme.spacing.lg }}>
        <TableToolbar
          searchPlaceholder="Tìm theo tên hoặc email ứng viên..."
          searchValue={searchKeyword}
          onSearchChange={setSearchKeyword}
          extra={
            <>
              <Select
                aria-label="Lọc theo công việc"
                style={{ width: 320 }}
                value={selectedJobId ?? "all"}
                onChange={(jobId) => handleJobChange(jobId === "all" ? null : jobId)}
                options={[
                  { label: "Tất cả công việc", value: "all" },
                  ...jobs.map((job) => ({
                    label: `${job.position?.name || "Vị trí"} (${job.branch?.name || "Chi nhánh"})`,
                    value: job.id,
                  })),
                ]}
              />
              <Select<CandidateRankingSortType>
                aria-label="Xếp hạng theo"
                style={{ width: 190 }}
                value={selectedSortType}
                disabled={selectedJobId == null}
                onChange={handleSortTypeChange}
                options={[
                  { label: "Điểm tổng thể", value: "overall" },
                  {
                    label: "Theo tiêu chí",
                    value: "criterion",
                    disabled: availableCriteria.length === 0,
                  },
                ]}
              />
              {selectedSortType === "criterion" ? (
                <Select
                  aria-label="Chọn tiêu chí"
                  placeholder="Chọn tiêu chí"
                  style={{ width: 220 }}
                  value={selectedCriterion}
                  onChange={(criterionName) => {
                    setSelectedCriterion(criterionName);
                    setSelectedApplicationIds([]);
                  }}
                  options={availableCriteria.map((criterion) => ({
                    label: `${criterion.criterionName} (${criterion.weight}%)`,
                    value: criterion.criterionName,
                  }))}
                />
              ) : null}
              <Tooltip
                title={
                  selectedJobId == null
                    ? "Vui lòng chọn một công việc cụ thể trước."
                    : undefined
                }
              >
                <span>
                  <Button
                    type="primary"
                    icon={<TeamOutlined />}
                    disabled={selectedJobId == null || selectionMode}
                    onClick={handleEnableSelection}
                  >
                    Chọn ứng viên
                  </Button>
                </span>
              </Tooltip>
            </>
          }
        />
      </Card>

      {selectionMode ? (
        <Card
          style={{ ...cardStyle, marginTop: appTheme.spacing.md }}
          bodyStyle={{ padding: appTheme.spacing.md }}
        >
          <Row gutter={[16, 12]} align="middle" justify="space-between">
            <Col>
              <Text strong style={{ color: appTheme.colors.textPrimary }}>
                Đã chọn {selectedApplicationIds.length}/4 ứng viên
              </Text>
              <Text style={{ marginLeft: 12, color: appTheme.colors.textSecondary }}>
                Chọn từ 2 đến 4 hồ sơ trong cùng một công việc.
              </Text>
            </Col>
            <Col>
              <Space wrap>
                <Button
                  onClick={() => setSelectedApplicationIds([])}
                  disabled={selectedApplicationIds.length === 0}
                >
                  Xóa lựa chọn
                </Button>
                <Button icon={<CloseOutlined />} onClick={handleCancelSelection}>
                  Hủy chọn
                </Button>
                <Button
                  type="primary"
                  icon={<TeamOutlined />}
                  disabled={selectedApplicationIds.length < 2}
                  onClick={handleCompareCandidates}
                >
                  So sánh ứng viên
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>
      ) : null}

      <Card
        style={{ ...cardStyle, marginTop: appTheme.spacing.md }}
        bodyStyle={{ padding: appTheme.spacing.lg }}
      >
        <Table<CandidateRankingItem>
          rowKey="applicationId"
          columns={columns}
          dataSource={candidateList}
          rowSelection={rowSelection}
          loading={loading}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          scroll={{ x: 1100 }}
          locale={{
            emptyText:
              selectedJobId == null
                ? "Chưa có hồ sơ ứng tuyển."
                : "Công việc này chưa có hồ sơ phù hợp với bộ lọc.",
          }}
        />
      </Card>

      <CandidateAiDrawer
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
      />
    </PageContainer>
  );
}

function mapApplicationsToRankingItems(applications: ApplicationDto[]): CandidateRankingItem[] {
  return [...applications]
    .sort((leftApplication, rightApplication) => rightApplication.aiScore - leftApplication.aiScore)
    .map((application, index) => {
      let aiDataStatus: CandidateRankingItem["aiDataStatus"] = "ready";
      let aiDataMessage = "Dữ liệu đánh giá AI đã sẵn sàng.";
      let aiScore: number | null = application.aiScore;

      if (application.classification === "AI_ERROR") {
        aiDataStatus = "error";
        aiDataMessage = "AI chưa thể hoàn tất đánh giá hồ sơ này.";
        aiScore = null;
      } else if (
        !application.classification ||
        application.classification === "Chưa phân loại"
      ) {
        aiDataStatus = "missing";
        aiDataMessage = "Hồ sơ chưa có đánh giá AI.";
        aiScore = null;
      }

      return {
        applicationId: application.id,
        candidateId: "",
        candidateName: application.candidateName,
        candidateEmail: application.email,
        candidatePhone: application.phone,
        jobId: application.jobId,
        jobTitle: application.jobTitle,
        applicationStatus: application.status || "",
        appliedAt: application.appliedAt || "",
        cvUrl: application.cvUrl,
        aiScore,
        overallRank: aiScore == null ? null : index + 1,
        selectedCriterionRank: null,
        classification: application.classification || "Chưa phân loại",
        summary: "Chọn một công việc cụ thể để xem dữ liệu AI đã chuẩn hóa.",
        aiDataStatus,
        aiDataMessage,
        matchedSkills: normalizeStringList(application.matchedSkills),
        missingSkills: normalizeStringList(application.missingSkills),
        strengths: [],
        weaknesses: [],
        degree: "",
        major: "",
        university: "",
        yearsOfExperience: null,
        certificates: [],
        criteriaResults: [],
      };
    });
}

function normalizeStringList(value: string[] | string): string[] {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === "string" && item.trim().length > 0);
  }

  return [];
}

function findCriterionResult(
  candidate: CandidateRankingItem,
  criterionName: string
): CandidateCriterionResult | undefined {
  return candidate.criteriaResults.find(
    (criterion) => criterion.criterionName.toLocaleLowerCase("vi") === criterionName.toLocaleLowerCase("vi")
  );
}

function isCandidateEligible(candidate: CandidateRankingItem): boolean {
  return candidate.aiDataStatus === "ready" || candidate.aiDataStatus === "partial";
}

function renderAiStatus(candidate: CandidateRankingItem) {
  let color = "default";
  let label = "Chưa có dữ liệu AI";

  if (candidate.aiDataStatus === "ready") {
    color = "green";
    label = "Đã đánh giá";
  } else if (candidate.aiDataStatus === "partial") {
    color = "gold";
    label = "Dữ liệu một phần";
  } else if (candidate.aiDataStatus === "error") {
    color = "red";
    label = "AI xử lý lỗi";
  } else if (candidate.aiDataStatus === "invalid") {
    color = "orange";
    label = "Dữ liệu không hợp lệ";
  }

  return (
    <Tooltip title={candidate.aiDataMessage}>
      <Tag color={color}>{label}</Tag>
    </Tooltip>
  );
}

function renderScoreTag(score: number | null, maxScore: number) {
  if (score == null) {
    return <Text type="secondary">Chưa có dữ liệu</Text>;
  }

  let color = "red";
  if (maxScore > 0 && score / maxScore >= 0.75) {
    color = "green";
  } else if (maxScore > 0 && score / maxScore >= 0.5) {
    color = "gold";
  }

  return <Tag color={color}>{score}/{maxScore}</Tag>;
}

function getApiErrorMessage(error: unknown): string {
  if (typeof error === "object" && error != null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) {
      return response.data.message;
    }
  }

  return "Không thể tải dữ liệu xếp hạng. Vui lòng thử lại.";
}

function SummaryCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <Card style={{ ...cardStyle, height: "100%" }} bodyStyle={{ padding: appTheme.spacing.lg }}>
      <Space align="start" style={{ width: "100%", justifyContent: "space-between" }}>
        <div>
          <Text style={{ color: appTheme.colors.textSecondary }}>{label}</Text>
          <Title level={4} style={{ margin: "8px 0 4px", color: appTheme.colors.textPrimary }}>
            {value}
          </Title>
          <Text style={{ color: appTheme.colors.textSecondary, fontSize: 13 }}>{detail}</Text>
        </div>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: appTheme.radius.md,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#EFF6FF",
            color: appTheme.colors.primary,
            fontSize: 20,
          }}
        >
          {icon}
        </div>
      </Space>
    </Card>
  );
}

function CandidateAiDrawer({
  candidate,
  onClose,
}: {
  candidate: CandidateRankingItem | null;
  onClose: () => void;
}) {
  return (
    <Drawer
      title="Phân tích nhanh hồ sơ"
      width={720}
      open={candidate != null}
      onClose={onClose}
      bodyStyle={{ background: appTheme.colors.background, padding: appTheme.spacing.lg }}
    >
      {candidate != null ? (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Card style={cardStyle}>
            <Row gutter={[16, 12]} align="middle">
              <Col flex="auto">
                <Title level={4} style={{ margin: 0 }}>
                  {candidate.candidateName}
                </Title>
                <Text style={{ color: appTheme.colors.textSecondary }}>
                  {candidate.candidateEmail}
                </Text>
              </Col>
              <Col>{renderScoreTag(candidate.aiScore, 100)}</Col>
            </Row>
          </Card>

          <Alert
            showIcon
            type={isCandidateEligible(candidate) ? "info" : "warning"}
            message={renderAiStatus(candidate)}
            description={candidate.aiDataMessage}
          />

          <Card title="Tóm tắt đánh giá" style={cardStyle}>
            <Text style={{ whiteSpace: "pre-wrap" }}>
              {candidate.summary || "Chưa có nhận xét AI."}
            </Text>
          </Card>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <SkillCard title="Kỹ năng phù hợp" skills={candidate.matchedSkills} color="green" />
            </Col>
            <Col xs={24} md={12}>
              <SkillCard title="Kỹ năng còn thiếu" skills={candidate.missingSkills} color="gold" />
            </Col>
          </Row>

          <Card title="Điểm theo tiêu chí" style={cardStyle}>
            <Table<CandidateCriterionResult>
              rowKey="criterionName"
              size="small"
              pagination={false}
              dataSource={candidate.criteriaResults}
              columns={[
                {
                  title: "Tiêu chí",
                  dataIndex: "criterionName",
                  key: "criterionName",
                },
                {
                  title: "Trọng số",
                  dataIndex: "weight",
                  key: "weight",
                  render: (weight: number) => `${weight}%`,
                },
                {
                  title: "Điểm",
                  key: "score",
                  render: (_, criterion) => renderScoreTag(criterion.score, criterion.maxScore),
                },
                {
                  title: "Nhận xét",
                  dataIndex: "comment",
                  key: "comment",
                },
              ]}
              locale={{ emptyText: "Chưa có dữ liệu điểm theo tiêu chí." }}
            />
          </Card>
        </Space>
      ) : null}
    </Drawer>
  );
}

function SkillCard({ title, skills, color }: { title: string; skills: string[]; color: string }) {
  return (
    <Card title={title} style={{ ...cardStyle, height: "100%" }}>
      {skills.length > 0 ? (
        <Space wrap>
          {skills.map((skill) => (
            <Tag color={color} key={skill}>
              {skill}
            </Tag>
          ))}
        </Space>
      ) : (
        <Text type="secondary">Chưa có dữ liệu.</Text>
      )}
    </Card>
  );
}

const cardStyle = {
  background: appTheme.colors.surface,
  border: `1px solid ${appTheme.colors.border}`,
  borderRadius: appTheme.radius.lg,
  boxShadow: appTheme.shadow.card,
};

export default CVRankingPage;
