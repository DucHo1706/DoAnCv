import { Card, Typography } from "antd";

const { Title, Paragraph } = Typography;

function UserManagementPage() {
  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Title level={2}>Quản lý người dùng</Title>
        <Paragraph>Trang quản lý người dùng base.</Paragraph>
      </Card>
    </div>
  );
}

export default UserManagementPage;