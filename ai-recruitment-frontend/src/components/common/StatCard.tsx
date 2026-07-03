import { Card, Space, Typography } from "antd";
import type { ReactNode } from "react";

const { Text, Title } = Typography;

type StatCardProps = {
  title: string;
  value: string | number;
  icon?: ReactNode;
  subtitle?: string;
};

function StatCard({ title, value, icon, subtitle }: StatCardProps) {
  return (
    <Card>
      <Space align="start" style={{ width: "100%", justifyContent: "space-between" }}>
        <div>
          <Text type="secondary">{title}</Text>
          <Title level={3} style={{ margin: "8px 0 4px" }}>
            {value}
          </Title>
          {subtitle ? <Text type="secondary">{subtitle}</Text> : null}
        </div>

        {icon ? (
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#DBEAFE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#2563EB",
              fontSize: 20,
            }}
          >
            {icon}
          </div>
        ) : null}
      </Space>
    </Card>
  );
}

export default StatCard;
