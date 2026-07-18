import { ArrowLeftOutlined, HourglassOutlined } from "@ant-design/icons";
import { Button, Card, Empty, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import PageContainer from "../../components/common/PageContainer";
import { appTheme } from "../../constants/theme";

const { Text } = Typography;

function CandidateComparisonPlaceholderPage() {
  const navigate = useNavigate();

  return (
    <PageContainer
      title="So sánh ứng viên"
      subtitle="Trang so sánh chi tiết sẽ được hoàn thiện ở giai đoạn tiếp theo."
    >
      <Card
        style={{
          border: `1px solid ${appTheme.colors.border}`,
          borderRadius: appTheme.radius.lg,
          boxShadow: appTheme.shadow.card,
        }}
        bodyStyle={{ padding: appTheme.spacing.xl }}
      >
        <Empty
          image={<HourglassOutlined style={{ fontSize: 56, color: appTheme.colors.primary }} />}
          description={
            <Text style={{ color: appTheme.colors.textSecondary }}>
              Danh sách ứng viên đã được truyền qua URL. Nội dung so sánh chưa nằm trong phạm vi
              Giai đoạn 2.
            </Text>
          }
        >
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/recruiter/applications")}
          >
            Quay lại danh sách hồ sơ
          </Button>
        </Empty>
      </Card>
    </PageContainer>
  );
}

export default CandidateComparisonPlaceholderPage;
