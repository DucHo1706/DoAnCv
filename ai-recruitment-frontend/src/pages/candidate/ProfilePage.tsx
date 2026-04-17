import { Card, Typography } from "antd";

const { Title, Paragraph } = Typography;

function ProfilePage() {
  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Title level={2}>Hồ sơ ứng viên</Title>
        <Paragraph>Trang hồ sơ ứng viên base.</Paragraph>
      </Card>
    </div>
  );
}

export default ProfilePage;