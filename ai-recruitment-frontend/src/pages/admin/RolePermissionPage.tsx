import { Card, Typography } from "antd";

const { Title, Paragraph } = Typography;

function RolePermissionPage() {
  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Title level={2}>Phân quyền</Title>
        <Paragraph>Trang phân quyền base.</Paragraph>
      </Card>
    </div>
  );
}

export default RolePermissionPage;