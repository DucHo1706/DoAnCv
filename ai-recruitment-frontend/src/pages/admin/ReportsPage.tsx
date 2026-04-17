import { Card, Typography } from "antd";

const { Title, Paragraph } = Typography;

function ReportsPage() {
  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Title level={2}>Báo cáo thống kê</Title>
        <Paragraph>Trang báo cáo thống kê base.</Paragraph>
      </Card>
    </div>
  );
}

export default ReportsPage;