import { Empty, Typography } from "antd";

const { Paragraph } = Typography;

type EmptyStateProps = {
  description?: string;
};

function EmptyState({ description = "Hiện chưa có dữ liệu để hiển thị." }: EmptyStateProps) {
  return (
    <div
      style={{
        padding: "32px 0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Empty description={false} />
      <Paragraph type="secondary" style={{ marginTop: 8 }}>
        {description}
      </Paragraph>
    </div>
  );
}

export default EmptyState;
