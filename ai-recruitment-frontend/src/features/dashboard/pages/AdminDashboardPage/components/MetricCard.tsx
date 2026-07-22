import React from "react";
import { Card, Space, Typography, Statistic } from "antd";

const { Text } = Typography;

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  valueSuffix?: string;
}

export default function MetricCard(props: MetricCardProps) {
  return (
    <Card
      bordered={false}
      style={{
        height: "100%",
        borderRadius: 16,
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
      }}
      bodyStyle={{ padding: 20 }}
    >
      <Space align="start" style={{ width: "100%", justifyContent: "space-between" }}>
        <div>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {props.title}
          </Text>

          <Statistic
            value={props.value}
            suffix={props.valueSuffix}
            valueStyle={{
              color: props.color,
              fontSize: 30,
              fontWeight: 800,
              lineHeight: "40px",
            }}
          />

          <Text type="secondary" style={{ fontSize: 12 }}>
            {props.subtitle}
          </Text>
        </div>

        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: `${props.color}14`,
            color: props.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
          }}
        >
          {props.icon}
        </div>
      </Space>
    </Card>
  );
}
