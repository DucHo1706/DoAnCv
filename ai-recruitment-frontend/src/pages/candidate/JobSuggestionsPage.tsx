import { Card, Typography } from "antd";

const { Title, Paragraph } = Typography;

function JobSuggestionsPage() {
  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Title level={2}>Gợi ý việc làm</Title>
        <Paragraph>Trang gợi ý việc làm base.</Paragraph>
      </Card>
    </div>
  );
}

export default JobSuggestionsPage;
