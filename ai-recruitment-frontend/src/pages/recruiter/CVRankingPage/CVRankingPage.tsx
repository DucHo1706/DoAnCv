import { useMemo } from "react";
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
import PageContainer from "../../../components/common/PageContainer";
import TableToolbar from "../../../components/common/TableToolbar";
import { appTheme } from "../../../constants/theme";
import type { CandidateRankingItem, CandidateRankingSortType } from "../../../services/candidateComparisonService";
import { useCVRanking } from "./hooks/useCVRanking";
import CandidateAiDrawer, {
  isCandidateEligible,
  renderScoreTag,
} from "./components/CandidateAiDrawer";

const { Text, Title } = Typography;

const cardStyle = {
  background: appTheme.colors.surface,
  border: `1px solid ${appTheme.colors.border}`,
  borderRadius: appTheme.radius.lg,
  boxShadow: appTheme.shadow.card,
};

export default function CVRankingPage() {
  const {
    navigate,
    jobs,
    candidateList,
    availableCriteria,
    selectedJobId,
    searchKeyword,
    setSearchKeyword,
    selectedSortType,
    selectedCriterion,
    setSelectedCriterion,
    selectedApplicationIds,
    setSelectedApplicationIds,
    selectionMode,
    selectedCandidate,
    setSelectedCandidate,
    loading,
    errorMessage,
    handleJobChange,
    handleSortTypeChange,
    handleEnableSelection,
    handleCancelSelection,
    handleCompareCandidates,
    topCandidate,
  } = useCVRanking();

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
          const criterion = candidate.criteriaResults.find(
            (c) => c.criterionName.toLocaleLowerCase("vi") === selectedCriterion.toLocaleLowerCase("vi")
          );
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
        render: (_, candidate) => renderAiStatusTag(candidate),
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
  }, [navigate, selectedCriterion, selectedSortType, setSelectedCandidate]);

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
      subtitle="Đánh giá và sắp xếp ứng viên theo tiêu chuẩn năng lực và chỉ số phù hợp."
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

      <Row gutter={[20, 20]} style={{ marginBottom: 28 }}>
        <Col xs={24} md={12}>
          <Card
            style={{
              height: "100%",
              borderRadius: 16,
              background: "linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 100%)",
              border: "1px solid #BFDBFE",
              boxShadow: "0 4px 20px rgba(37, 99, 235, 0.06)",
            }}
            bodyStyle={{ padding: 24 }}
          >
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Tag color="gold" style={{ fontSize: 13, padding: "4px 10px", borderRadius: 8, fontWeight: 700 }}>
                  ỨNG VIÊN HÀNG ĐẦU
                </Tag>
                <TrophyOutlined style={{ fontSize: 28, color: "#D97706" }} />
              </div>
              <div>
                <Title level={3} style={{ margin: "4px 0 2px", color: "#0F172A", fontWeight: 800 }}>
                  {topCandidate ? topCandidate.candidateName : "Chưa xác định"}
                </Title>
                <Text style={{ color: "#475569", fontSize: 14 }}>
                  {topCandidate ? (topCandidate.jobTitle || "Chưa chọn công việc") : "Vui lòng chọn công việc để xếp hạng"}
                </Text>
              </div>
              <div style={{ marginTop: 8, paddingTop: 12, borderTop: "1px solid #DBEAFE", display: "flex", gap: 16, alignItems: "center" }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>ĐIỂM TỔNG THỂ</Text>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#2563EB" }}>
                    {topCandidate?.aiScore != null ? `${topCandidate.aiScore}/100` : "--"}
                  </div>
                </div>
                {selectedSortType === "criterion" && selectedCriterion ? (
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>TIÊU CHÍ: {selectedCriterion.toUpperCase()}</Text>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#059669" }}>
                      {topCandidate ? (
                        (() => {
                          const crit = topCandidate.criteriaResults.find((c: any) => c.criterionName.toLowerCase() === selectedCriterion.toLowerCase());
                          return crit?.score != null ? `${crit.score}/${crit.maxScore}` : "--";
                        })()
                      ) : "--"}
                    </div>
                  </div>
                ) : null}
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card style={{ ...cardStyle, borderRadius: 16 }} bodyStyle={{ padding: 20 }}>
                <Space direction="vertical" size={4}>
                  <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>TỔNG HỒ SƠ</Text>
                  <Title level={3} style={{ margin: 0, fontWeight: 800 }}>{candidateList.length}</Title>
                  <Text type="secondary" style={{ fontSize: 12 }}>Hồ sơ trong danh sách</Text>
                </Space>
              </Card>
            </Col>
            <Col span={12}>
              <Card style={{ ...cardStyle, borderRadius: 16 }} bodyStyle={{ padding: 20 }}>
                <Space direction="vertical" size={4}>
                  <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>ĐÃ ĐÁNH GIÁ AI</Text>
                  <Title level={3} style={{ margin: 0, fontWeight: 800, color: "#10B981" }}>
                    {candidateList.filter((c) => c.aiDataStatus === "ready").length}
                  </Title>
                  <Text type="secondary" style={{ fontSize: 12 }}>Hồ sơ sẵn sàng xếp hạng</Text>
                </Space>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      <Card style={{ ...cardStyle, borderRadius: 16 }} bodyStyle={{ padding: appTheme.spacing.lg }}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={8}>
              <Text strong style={{ display: "block", marginBottom: 6 }}>Chọn công việc:</Text>
              <Select
                placeholder="Chọn công việc để xem xếp hạng"
                allowClear
                style={{ width: "100%" }}
                value={selectedJobId}
                onChange={handleJobChange}
                options={jobs.map((job) => ({
                  value: job.id,
                  label: job.position?.name || (job as any).title || "Tin tuyển dụng",
                }))}
              />
            </Col>

            <Col xs={24} md={8}>
              <Text strong style={{ display: "block", marginBottom: 6 }}>Tiêu chí sắp xếp:</Text>
              <Select<CandidateRankingSortType>
                value={selectedSortType}
                onChange={handleSortTypeChange}
                style={{ width: "100%" }}
                options={[
                  { value: "overall", label: "Điểm tổng thể" },
                  {
                    value: "criterion",
                    label: "Theo tiêu chí cụ thể",
                    disabled: availableCriteria.length === 0,
                  },
                ]}
              />
            </Col>

            {selectedSortType === "criterion" ? (
              <Col xs={24} md={8}>
                <Text strong style={{ display: "block", marginBottom: 6 }}>Tiêu chí cụ thể:</Text>
                <Select
                  placeholder="Chọn tiêu chí"
                  value={selectedCriterion}
                  onChange={(val) => setSelectedCriterion(val)}
                  style={{ width: "100%" }}
                  options={availableCriteria.map((item) => ({
                    value: item.criterionName,
                    label: `${item.criterionName} (Trọng số ${item.weight}%)`,
                  }))}
                />
              </Col>
            ) : null}
          </Row>

          <TableToolbar
            searchPlaceholder="Tìm kiếm theo tên hoặc email ứng viên..."
            searchValue={searchKeyword}
            onSearchChange={setSearchKeyword}
            action={
              selectionMode ? (
                <Space wrap>
                  <Button
                    type="primary"
                    icon={<TeamOutlined />}
                    disabled={selectedApplicationIds.length < 2}
                    onClick={handleCompareCandidates}
                  >
                    Đối sánh {selectedApplicationIds.length} ứng viên
                  </Button>
                  <Button icon={<CloseOutlined />} onClick={handleCancelSelection}>
                    Hủy chọn
                  </Button>
                </Space>
              ) : (
                <Button
                  type="primary"
                  icon={<TeamOutlined />}
                  onClick={handleEnableSelection}
                  disabled={selectedJobId == null}
                >
                  So sánh ứng viên
                </Button>
              )
            }
          />

          <Table<CandidateRankingItem>
            rowKey="applicationId"
            loading={loading}
            dataSource={candidateList}
            columns={columns}
            rowSelection={rowSelection}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng số ${total} ứng viên`,
            }}
          />
        </Space>
      </Card>

      <CandidateAiDrawer
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
      />
    </PageContainer>
  );
}

function renderAiStatusTag(candidate: CandidateRankingItem) {
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
