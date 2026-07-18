import {
  CommentOutlined,
  CrownOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Empty,
  List,
  Popover,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { TableProps } from "antd";
import { useMemo, useState } from "react";
import { appTheme } from "../../../../constants/theme";
import type {
  CandidateCriterionDefinition,
  CandidateCriterionResult,
  CandidateRankingItem,
} from "../../../../services/candidateComparisonService";

const { Paragraph, Text, Title } = Typography;

type CriteriaRankingTabProps = {
  availableCriteria: CandidateCriterionDefinition[];
  candidates: CandidateRankingItem[];
};

type CriterionMatrixRow = {
  key: string;
  criterion: CandidateCriterionDefinition;
};

type RankedCandidate = {
  candidate: CandidateRankingItem;
  criterionResult: CandidateCriterionResult | null;
  percentage: number | null;
  rank: number | null;
  originalIndex: number;
};

function CriteriaRankingTab({ availableCriteria, candidates }: CriteriaRankingTabProps) {
  const [selectedCriterionName, setSelectedCriterionName] = useState("");

  const criteria = useMemo(
    () => buildCriteriaUnion(availableCriteria, candidates),
    [availableCriteria, candidates]
  );

  if (criteria.length === 0) {
    return (
      <div style={{ padding: appTheme.spacing.xxl }}>
        <Empty description="Chưa có dữ liệu tiêu chí để so sánh." />
      </div>
    );
  }

  const activeCriterionName = getActiveCriterionName(criteria, selectedCriterionName);
  const ranking = buildCriterionRanking(candidates, activeCriterionName);
  const summaryItems = buildRuleBasedSummary(candidates, criteria);
  const matrixRows: CriterionMatrixRow[] = criteria.map((criterion) => ({
    key: normalizeCriterionName(criterion.criterionName),
    criterion,
  }));
  const matrixColumns = buildMatrixColumns(candidates);

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card style={sectionCardStyle} bodyStyle={{ padding: appTheme.spacing.lg }}>
        <Title level={4} style={sectionTitleStyle}>
          Ma trận điểm theo tiêu chí
        </Title>
        <Paragraph style={sectionDescriptionStyle}>
          Điểm được giữ nguyên theo thang điểm của từng tiêu chí và chuẩn hóa theo tỷ lệ phần trăm
          để so sánh.
        </Paragraph>

        <Table<CriterionMatrixRow>
          bordered
          pagination={false}
          rowKey="key"
          columns={matrixColumns}
          dataSource={matrixRows}
          scroll={{ x: getMatrixWidth(candidates.length) }}
          size="middle"
        />
      </Card>

      <Card style={sectionCardStyle} bodyStyle={{ padding: appTheme.spacing.lg }}>
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col flex="auto">
            <Title level={4} style={sectionTitleStyle}>
              Xếp hạng trong nhóm ứng viên
            </Title>
            <Paragraph style={{ ...sectionDescriptionStyle, marginBottom: 0 }}>
              Chỉ ứng viên có dữ liệu hợp lệ mới được xếp hạng theo tiêu chí đã chọn.
            </Paragraph>
          </Col>
          <Col>
            <Space wrap>
              <Text strong>Tiêu chí:</Text>
              <Select
                value={activeCriterionName}
                style={{ width: 320, maxWidth: "100%" }}
                options={criteria.map((criterion) => ({
                  label: criterion.criterionName,
                  value: criterion.criterionName,
                }))}
                onChange={setSelectedCriterionName}
              />
            </Space>
          </Col>
        </Row>

        <div style={{ marginTop: appTheme.spacing.lg }}>
          <CriterionRankingList ranking={ranking} />
        </div>
      </Card>

      <Card style={sectionCardStyle} bodyStyle={{ padding: appTheme.spacing.lg }}>
        <Title level={4} style={sectionTitleStyle}>
          Tóm tắt kết quả
        </Title>
        <Paragraph style={sectionDescriptionStyle}>
          Nội dung được tạo theo quy tắc từ điểm hiện có, không thực hiện phân tích AI mới.
        </Paragraph>

        {summaryItems.length > 0 ? (
          <List
            dataSource={summaryItems}
            renderItem={(summaryItem) => (
              <List.Item style={{ paddingInline: 0 }}>
                <Space align="start">
                  <TrophyOutlined style={{ color: appTheme.colors.warning, marginTop: 4 }} />
                  <Text style={{ color: appTheme.colors.textPrimary }}>{summaryItem}</Text>
                </Space>
              </List.Item>
            )}
          />
        ) : (
          <Text type="secondary">Chưa có dữ liệu hợp lệ để tạo tóm tắt kết quả.</Text>
        )}
      </Card>
    </Space>
  );
}

function CriterionRankingList({ ranking }: { ranking: RankedCandidate[] }) {
  const validRanking = ranking.filter((rankingItem) => rankingItem.rank != null);

  if (validRanking.length === 0) {
    return <Empty description="Chưa có dữ liệu hợp lệ để xếp hạng theo tiêu chí này." />;
  }

  return (
    <List
      dataSource={ranking}
      renderItem={(rankingItem) => {
        const isBest = rankingItem.rank === 1;
        const comment = getCriterionComment(rankingItem.criterionResult);

        return (
          <List.Item
            style={{
              marginBottom: appTheme.spacing.sm,
              padding: appTheme.spacing.md,
              background: isBest ? "#F0FDF4" : appTheme.colors.background,
              border: `1px solid ${isBest ? "#BBF7D0" : appTheme.colors.border}`,
              borderRadius: appTheme.radius.md,
            }}
          >
            <Row gutter={[16, 12]} align="middle" style={{ width: "100%" }}>
              <Col xs={24} md={3}>
                {rankingItem.rank == null ? (
                  <Tag>Chưa xếp hạng</Tag>
                ) : (
                  <Tag color={isBest ? "green" : "blue"}>Hạng {rankingItem.rank}</Tag>
                )}
              </Col>
              <Col xs={24} md={5}>
                <Text strong style={{ color: appTheme.colors.textPrimary }}>
                  {getCandidateName(rankingItem.candidate)}
                </Text>
              </Col>
              <Col xs={12} md={4}>
                <Text style={{ display: "block", color: appTheme.colors.textSecondary }}>
                  Điểm
                </Text>
                <Text strong>
                  {formatCriterionScore(rankingItem.criterionResult, rankingItem.percentage)}
                </Text>
              </Col>
              <Col xs={12} md={3}>
                <Text style={{ display: "block", color: appTheme.colors.textSecondary }}>
                  Tỷ lệ
                </Text>
                <Text strong>{formatPercentage(rankingItem.percentage)}</Text>
              </Col>
              <Col xs={24} md={7}>
                <Text style={{ display: "block", color: appTheme.colors.textSecondary }}>
                  Nhận xét
                </Text>
                <Text
                  ellipsis={{ tooltip: comment }}
                  style={{ display: "block", maxWidth: 420, color: appTheme.colors.textPrimary }}
                >
                  {comment}
                </Text>
              </Col>
              <Col xs={24} md={2}>
                {isBest ? (
                  <Tag color="green" icon={<CrownOutlined />}>
                    Tốt nhất
                  </Tag>
                ) : null}
              </Col>
            </Row>
          </List.Item>
        );
      }}
    />
  );
}

function buildMatrixColumns(
  candidates: CandidateRankingItem[]
): NonNullable<TableProps<CriterionMatrixRow>["columns"]> {
  const columns: NonNullable<TableProps<CriterionMatrixRow>["columns"]> = [
    {
      title: "Tiêu chí",
      key: "criterionName",
      fixed: "left",
      width: 220,
      render: (_value, row) => (
        <Text
          strong
          style={{ color: appTheme.colors.textPrimary, overflowWrap: "anywhere" }}
        >
          {row.criterion.criterionName}
        </Text>
      ),
    },
    {
      title: "Trọng số",
      key: "weight",
      width: 110,
      align: "center",
      render: (_value, row) => <Text>{formatNumber(row.criterion.weight)}%</Text>,
    },
  ];

  candidates.forEach((candidate) => {
    columns.push({
      title: (
        <div>
          <Text
            strong
            style={{
              display: "block",
              color: appTheme.colors.textPrimary,
              overflowWrap: "anywhere",
            }}
          >
            {getCandidateName(candidate)}
          </Text>
          <Text
            style={{
              color: appTheme.colors.textSecondary,
              fontSize: 12,
              overflowWrap: "anywhere",
            }}
          >
            {candidate.candidateEmail || "Chưa có dữ liệu"}
          </Text>
          {renderCandidateAiStatusTag(candidate)}
        </div>
      ),
      key: candidate.applicationId,
      width: 250,
      render: (_value, row) => (
        <CriterionMatrixCell
          candidate={candidate}
          criterionName={row.criterion.criterionName}
          candidates={candidates}
        />
      ),
    });
  });

  return columns;
}

function CriterionMatrixCell({
  candidate,
  criterionName,
  candidates,
}: {
  candidate: CandidateRankingItem;
  criterionName: string;
  candidates: CandidateRankingItem[];
}) {
  const criterionResult = findCriterionResult(candidate, criterionName);
  const percentage = getValidCriterionPercentage(criterionResult);
  const bestPercentage = getBestCriterionPercentage(candidates, criterionName);
  const isBest =
    percentage != null &&
    bestPercentage != null &&
    percentagesAreEqual(percentage, bestPercentage);

  return (
    <div
      style={{
        minHeight: 116,
        padding: appTheme.spacing.sm,
        background: isBest ? "#F0FDF4" : appTheme.colors.surface,
        border: `1px solid ${isBest ? "#BBF7D0" : appTheme.colors.border}`,
        borderRadius: appTheme.radius.sm,
      }}
    >
      {percentage == null ? (
        <Text type="secondary" style={{ display: "block" }}>
          Chưa có dữ liệu
        </Text>
      ) : (
        <>
          <Text strong style={{ display: "block", color: appTheme.colors.textPrimary }}>
            {formatCriterionScore(criterionResult, percentage)}
          </Text>
          <Text style={{ display: "block", color: appTheme.colors.textSecondary }}>
            {formatPercentage(percentage)}
          </Text>
          {isBest ? (
            <Tag color="green" icon={<CrownOutlined />} style={{ marginTop: appTheme.spacing.xs }}>
              Tốt nhất
            </Tag>
          ) : null}
        </>
      )}

      <div style={{ marginTop: appTheme.spacing.xs }}>
        <Popover
          trigger="click"
          title={`Nhận xét - ${criterionName}`}
          content={
            <Text
              style={{ display: "block", maxWidth: 360, overflowWrap: "anywhere" }}
            >
              {getCriterionComment(criterionResult)}
            </Text>
          }
        >
          <Button type="link" size="small" icon={<CommentOutlined />} style={{ padding: 0 }}>
            Xem nhận xét
          </Button>
        </Popover>
      </div>
    </div>
  );
}

function buildCriteriaUnion(
  availableCriteria: CandidateCriterionDefinition[],
  candidates: CandidateRankingItem[]
): CandidateCriterionDefinition[] {
  const criteriaByName = new Map<string, CandidateCriterionDefinition>();

  availableCriteria.forEach((criterion) => {
    addCriterionToUnion(criteriaByName, criterion);
  });

  candidates.forEach((candidate) => {
    candidate.criteriaResults.forEach((criterionResult) => {
      addCriterionToUnion(criteriaByName, criterionResult);
    });
  });

  return Array.from(criteriaByName.values());
}

function addCriterionToUnion(
  criteriaByName: Map<string, CandidateCriterionDefinition>,
  criterion: CandidateCriterionDefinition
) {
  const criterionName = criterion.criterionName.trim();
  if (criterionName.length === 0) {
    return;
  }

  const normalizedName = normalizeCriterionName(criterionName);
  if (criteriaByName.has(normalizedName)) {
    return;
  }

  criteriaByName.set(normalizedName, {
    criterionName,
    weight: criterion.weight,
    maxScore: criterion.maxScore,
  });
}

function getActiveCriterionName(
  criteria: CandidateCriterionDefinition[],
  selectedCriterionName: string
): string {
  const selectedCriterion = criteria.find(
    (criterion) =>
      normalizeCriterionName(criterion.criterionName) ===
      normalizeCriterionName(selectedCriterionName)
  );

  if (selectedCriterion != null) {
    return selectedCriterion.criterionName;
  }

  return criteria[0].criterionName;
}

function buildCriterionRanking(
  candidates: CandidateRankingItem[],
  criterionName: string
): RankedCandidate[] {
  const ranking: RankedCandidate[] = candidates.map((candidate, originalIndex) => {
    const criterionResult = findCriterionResult(candidate, criterionName);

    return {
      candidate,
      criterionResult,
      percentage: getValidCriterionPercentage(criterionResult),
      rank: null,
      originalIndex,
    };
  });

  ranking.sort(compareRankedCandidates);

  let previousPercentage: number | null = null;
  let previousRank = 0;

  ranking.forEach((rankingItem, index) => {
    if (rankingItem.percentage == null) {
      return;
    }

    if (
      previousPercentage != null &&
      percentagesAreEqual(previousPercentage, rankingItem.percentage)
    ) {
      rankingItem.rank = previousRank;
      return;
    }

    rankingItem.rank = index + 1;
    previousRank = rankingItem.rank;
    previousPercentage = rankingItem.percentage;
  });

  return ranking;
}

function compareRankedCandidates(left: RankedCandidate, right: RankedCandidate): number {
  if (left.percentage == null && right.percentage == null) {
    return left.originalIndex - right.originalIndex;
  }

  if (left.percentage == null) {
    return 1;
  }

  if (right.percentage == null) {
    return -1;
  }

  if (percentagesAreEqual(left.percentage, right.percentage) === false) {
    return right.percentage - left.percentage;
  }

  const aiScoreComparison = compareOptionalNumbersDescending(
    left.candidate.aiScore,
    right.candidate.aiScore
  );
  if (aiScoreComparison !== 0) {
    return aiScoreComparison;
  }

  const appliedAtComparison = compareApplicationDates(
    left.candidate.appliedAt,
    right.candidate.appliedAt
  );
  if (appliedAtComparison !== 0) {
    return appliedAtComparison;
  }

  return left.originalIndex - right.originalIndex;
}

function compareOptionalNumbersDescending(left: number | null, right: number | null): number {
  if (left == null && right == null) {
    return 0;
  }

  if (left == null) {
    return 1;
  }

  if (right == null) {
    return -1;
  }

  return right - left;
}

function compareApplicationDates(left: string, right: string): number {
  const leftTime = Date.parse(left);
  const rightTime = Date.parse(right);
  const leftIsValid = Number.isNaN(leftTime) === false;
  const rightIsValid = Number.isNaN(rightTime) === false;

  if (leftIsValid === false && rightIsValid === false) {
    return 0;
  }

  if (leftIsValid === false) {
    return 1;
  }

  if (rightIsValid === false) {
    return -1;
  }

  return leftTime - rightTime;
}

function buildRuleBasedSummary(
  candidates: CandidateRankingItem[],
  criteria: CandidateCriterionDefinition[]
): string[] {
  const summaryItems: string[] = [];
  const candidatesWithOverallScore = candidates.filter((candidate) => candidate.aiScore != null);

  if (candidatesWithOverallScore.length > 0) {
    const highestOverallScore = Math.max(
      ...candidatesWithOverallScore.map((candidate) => candidate.aiScore as number)
    );
    const highestOverallCandidates = candidatesWithOverallScore.filter(
      (candidate) => candidate.aiScore === highestOverallScore
    );
    const candidateNames = formatCandidateNames(highestOverallCandidates);

    if (highestOverallCandidates.length === 1) {
      summaryItems.push(`${candidateNames} có điểm tổng thể cao nhất.`);
    } else {
      summaryItems.push(`${candidateNames} cùng có điểm tổng thể cao nhất.`);
    }
  }

  criteria.forEach((criterion) => {
    const bestPercentage = getBestCriterionPercentage(candidates, criterion.criterionName);
    if (bestPercentage == null) {
      return;
    }

    const bestCandidates = candidates.filter((candidate) => {
      const result = findCriterionResult(candidate, criterion.criterionName);
      const percentage = getValidCriterionPercentage(result);

      return percentage != null && percentagesAreEqual(percentage, bestPercentage);
    });
    const candidateNames = formatCandidateNames(bestCandidates);

    if (bestCandidates.length === 1) {
      summaryItems.push(`${candidateNames} nổi bật nhất về ${criterion.criterionName}.`);
    } else {
      summaryItems.push(
        `${candidateNames} cùng đạt kết quả cao nhất về ${criterion.criterionName}.`
      );
    }
  });

  return summaryItems;
}

function findCriterionResult(
  candidate: CandidateRankingItem,
  criterionName: string
): CandidateCriterionResult | null {
  const normalizedName = normalizeCriterionName(criterionName);
  const criterionResult = candidate.criteriaResults.find(
    (result) => normalizeCriterionName(result.criterionName) === normalizedName
  );

  return criterionResult || null;
}

function getValidCriterionPercentage(result: CandidateCriterionResult | null): number | null {
  if (result == null || result.hasData === false || result.score == null || result.maxScore <= 0) {
    return null;
  }

  return (result.score / result.maxScore) * 100;
}

function getBestCriterionPercentage(
  candidates: CandidateRankingItem[],
  criterionName: string
): number | null {
  const percentages = candidates
    .map((candidate) => findCriterionResult(candidate, criterionName))
    .map(getValidCriterionPercentage)
    .filter((percentage): percentage is number => percentage != null);

  if (percentages.length === 0) {
    return null;
  }

  return Math.max(...percentages);
}

function getCriterionComment(result: CandidateCriterionResult | null): string {
  if (result == null || result.comment.trim().length === 0) {
    return "Chưa có nhận xét.";
  }

  return result.comment.trim();
}

function formatCriterionScore(
  result: CandidateCriterionResult | null,
  percentage: number | null
): string {
  if (result == null || percentage == null || result.score == null) {
    return "Chưa có dữ liệu";
  }

  return `${formatNumber(result.score)}/${formatNumber(result.maxScore)}`;
}

function formatPercentage(percentage: number | null): string {
  if (percentage == null) {
    return "Chưa có dữ liệu";
  }

  return `${formatNumber(percentage)}%`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCandidateNames(candidates: CandidateRankingItem[]): string {
  return candidates.map(getCandidateName).join(" và ");
}

function getCandidateName(candidate: CandidateRankingItem): string {
  const candidateName = candidate.candidateName.trim();
  if (candidateName.length === 0) {
    return "Ứng viên chưa có tên";
  }

  return candidateName;
}

function renderCandidateAiStatusTag(candidate: CandidateRankingItem) {
  let color = "default";
  let label = "";

  if (candidate.aiDataStatus === "partial") {
    color = "gold";
    label = "AI chưa đầy đủ";
  } else if (candidate.aiDataStatus === "missing") {
    label = "Chưa phân tích AI";
  } else if (candidate.aiDataStatus === "error") {
    color = "red";
    label = "AI xử lý lỗi";
  } else if (candidate.aiDataStatus === "invalid") {
    color = "orange";
    label = "Dữ liệu AI không hợp lệ";
  }

  if (label.length === 0) {
    return null;
  }

  return (
    <Tag
      color={color}
      title={candidate.aiDataMessage || label}
      style={{ marginTop: appTheme.spacing.xs, whiteSpace: "normal" }}
    >
      {label}
    </Tag>
  );
}

function normalizeCriterionName(criterionName: string): string {
  return criterionName.trim().toLocaleLowerCase("vi-VN");
}

function percentagesAreEqual(left: number, right: number): boolean {
  return Math.abs(left - right) < 0.000001;
}

function getMatrixWidth(candidateCount: number): number {
  return 330 + candidateCount * 250;
}

const sectionCardStyle = {
  background: appTheme.colors.surface,
  border: `1px solid ${appTheme.colors.border}`,
  borderRadius: appTheme.radius.lg,
  boxShadow: appTheme.shadow.card,
};

const sectionTitleStyle = {
  marginTop: 0,
  marginBottom: appTheme.spacing.xs,
  color: appTheme.colors.textPrimary,
};

const sectionDescriptionStyle = {
  marginBottom: appTheme.spacing.lg,
  color: appTheme.colors.textSecondary,
};

export default CriteriaRankingTab;
