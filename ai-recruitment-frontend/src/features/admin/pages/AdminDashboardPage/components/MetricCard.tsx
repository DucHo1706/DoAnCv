import React from "react";
import { Card, Space, Typography, Statistic } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import { appTheme } from "../../../../../constants/theme";
import type { TrendInfo } from "../hooks/useAdminDashboard";

const { Text } = Typography;

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  valueSuffix?: string;
  /** Optional stagger index for entry animation when rendered in a grid (CSS var --i). */
  index?: number;
  /** So sánh với kỳ trước, ví dụ +12% (xanh) hoặc -5% (đỏ). */
  trend?: TrendInfo | null;
}

export default function MetricCard(props: MetricCardProps) {
  const trend = props.trend;
  const showTrend = trend && trend.percent !== null && trend.direction !== "flat";
  const trendColor = trend?.direction === "up" ? appTheme.colors.success : appTheme.colors.error;

  return (
    <Card
      bordered={false}
      className="hover-card entry-anim"
      style={
        {
          height: "100%",
          borderRadius: appTheme.radius.lg,
          border: `1px solid ${appTheme.colors.border}`,
          boxShadow: appTheme.shadow.card,
          overflow: "hidden",
          position: "relative",
          "--i": props.index ?? 0,
        } as React.CSSProperties
      }
      styles={{ body: { padding: 20 } }}
    >
      {/* Top accent bar - matches the metric's semantic color */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: props.color,
        }}
      />

      <Space align="start" style={{ width: "100%", justifyContent: "space-between" }}>
        <div style={{ minWidth: 0 }}>
          <Space size={8} align="center">
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
              {props.title}
            </Text>
            {showTrend ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 2,
                  fontSize: 12,
                  fontWeight: 700,
                  color: trendColor,
                }}
              >
                {trend!.direction === "up" ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                {trend!.percent}%
              </span>
            ) : null}
          </Space>

          <Statistic
            value={props.value}
            suffix={props.valueSuffix}
            valueStyle={{
              color: appTheme.colors.textPrimary,
              fontSize: 30,
              fontWeight: 800,
              lineHeight: "40px",
            }}
          />

          <Text type="secondary" style={{ fontSize: 12.5 }}>
            {props.subtitle}
          </Text>
        </div>

        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: appTheme.radius.md,
            backgroundColor: `${props.color}14`,
            color: props.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 21,
            flexShrink: 0,
          }}
        >
          {props.icon}
        </div>
      </Space>
    </Card>
  );
}
