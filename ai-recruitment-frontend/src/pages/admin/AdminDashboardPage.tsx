import { Typography } from "antd";

const { Title, Paragraph } = Typography;

function AdminDashboardPage() {
  return (
    <div>
      <Title level={2}>Admin Dashboard</Title>
      <Paragraph>Trang dashboard admin base.</Paragraph>
    </div>
  );
}

export default AdminDashboardPage;