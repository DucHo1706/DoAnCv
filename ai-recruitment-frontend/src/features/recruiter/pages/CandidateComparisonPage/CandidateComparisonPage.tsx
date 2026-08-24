import { ArrowLeftOutlined, TeamOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Empty, Space, Spin, Tabs, Tag, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import PageContainer from "../../../../components/common/PageContainer";
import { appTheme } from "../../../../constants/theme";
import CandidateOverviewTab from "./components/CandidateOverviewTab";
import CompetencyAnalysisTab from "./components/CompetencyAnalysisTab";
import CriteriaRankingTab from "./components/CriteriaRankingTab";
import { useCandidateComparison } from "./hooks/useCandidateComparison";

const { Text } = Typography;

function CandidateComparisonPage() {
  const navigate = useNavigate();
  const { comparisonData, loading, errorMessage } = useCandidateComparison();

  const backButton = (
    <Button
      icon={<ArrowLeftOutlined />}
      onClick={() => navigate("/recruiter/applications")}
    >
      Quay lại danh sách hồ sơ
    </Button>
  );

  return (
    <PageContainer
      title="So sánh ứng viên"
      extra={backButton}
    >
      {loading ? (
        <Card style={stateCardStyle}>
          <div style={{ padding: appTheme.spacing.xxl, textAlign: "center" }}>
            <Spin size="large" tip="Đang tải dữ liệu so sánh..." />
          </div>
        </Card>
      ) : null}

      {loading === false && errorMessage.length > 0 ? (
        <Card style={stateCardStyle}>
          <Alert
            showIcon
            type="error"
            message="Không thể mở trang so sánh"
            description={errorMessage}
          />
        </Card>
      ) : null}

      {loading === false && errorMessage.length === 0 && comparisonData != null ? (
        comparisonData.candidates.length >= 2 ? (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Card
              style={{
                background: appTheme.colors.surface,
                border: `1px solid ${appTheme.colors.border}`,
                borderRadius: appTheme.radius.lg,
                boxShadow: appTheme.shadow.card,
              }}
              bodyStyle={{ padding: appTheme.spacing.md }}
            >
              <Space wrap size="middle">
                <div>
                  <Text style={{ display: "block", color: appTheme.colors.textSecondary }}>
                    Công việc đang so sánh
                  </Text>
                  <Text strong style={{ color: appTheme.colors.textPrimary, fontSize: 16 }}>
                    {comparisonData.jobTitle || "Chưa có dữ liệu"}
                  </Text>
                </div>
                <Tag color="blue" icon={<TeamOutlined />}>
                  {comparisonData.candidates.length} ứng viên
                </Tag>
              </Space>
            </Card>

            <Card
              style={{
                background: appTheme.colors.surface,
                border: `1px solid ${appTheme.colors.border}`,
                borderRadius: appTheme.radius.lg,
                boxShadow: appTheme.shadow.card,
              }}
              bodyStyle={{ padding: appTheme.spacing.lg }}
            >
              <Tabs
                defaultActiveKey="overview"
                items={[
                  {
                    key: "overview",
                    label: "Tổng quan",
                    children: <CandidateOverviewTab candidates={comparisonData.candidates} />,
                  },
                  {
                    key: "competency",
                    label: "Phân tích năng lực",
                    children: <CompetencyAnalysisTab candidates={comparisonData.candidates} />,
                  },
                  {
                    key: "criteria-ranking",
                    label: "Xếp hạng theo tiêu chí",
                    children: (
                      <CriteriaRankingTab
                        availableCriteria={comparisonData.availableCriteria}
                        candidates={comparisonData.candidates}
                      />
                    ),
                  },
                ]}
              />
            </Card>
          </Space>
        ) : (
          <Card style={stateCardStyle}>
            {comparisonData.candidates.length === 1 ? (
              <Alert
                showIcon
                type="warning"
                message="Chưa đủ ứng viên để so sánh"
                description="Cần ít nhất 2 ứng viên để thực hiện so sánh."
              />
            ) : (
              <Empty description="Không có dữ liệu ứng viên để so sánh." />
            )}
          </Card>
        )
      ) : null}
    </PageContainer>
  );
}

const stateCardStyle = {
  background: appTheme.colors.surface,
  border: `1px solid ${appTheme.colors.border}`,
  borderRadius: appTheme.radius.lg,
  boxShadow: appTheme.shadow.card,
};

export default CandidateComparisonPage;
