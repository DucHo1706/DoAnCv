import { Card, Typography } from "antd";

const { Title, Paragraph } = Typography;

function ApplicationStatusPage() {
  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Title level={2}>Trạng thái ứng tuyển</Title>
        <Paragraph>Trang trạng thái ứng tuyển base.</Paragraph>
      </Card>
    </div>
  );
}

export default ApplicationStatusPage;