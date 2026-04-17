import { Card, Typography } from "antd";

const { Title, Paragraph } = Typography;

function UploadCVPage() {
  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Title level={2}>Upload CV</Title>
        <Paragraph>Trang upload CV base.</Paragraph>
      </Card>
    </div>
  );
}

export default UploadCVPage;