import { Card, Space, Typography } from "antd";
import { ArrowDownOutlined, ArrowUpOutlined } from "@ant-design/icons";
import type { ReactNode } from "react";
import { appTheme } from "../../constants/theme";

const { Text, Title } = Typography;

export type StatCardAccent = "primary" | "success" | "warning" | "error" | "info" | "accent";

export type StatCardTrend = {
  percent: number | null;
  direction: "up" | "down" | "flat";
};

type StatCardProps = {
  title: string;
  value: string | number;
  icon?: ReactNode;
  subtitle?: string;
  /** Semantic accent color driving the icon chip + top accent bar. Defaults to "primary". */
  accent?: StatCardAccent;
  /** So sánh với kỳ trước, ví dụ +12% (xanh) hoặc -5% (đỏ). */
  trend?: StatCardTrend | null;
  /** Optional stagger index for entry animation when rendered in a grid (CSS var --i). */
  index?: number;
};

const ACCENT_MAP: Record<StatCardAccent, { fg: string; bg: string }> = {
  primary: { fg: appTheme.colors.primary, bg: "#EFF6FF" },
  success: { fg: appTheme.colors.success, bg: "#F0FDF4" },
  warning: { fg: appTheme.colors.warning, bg: "#FFFBEB" },
  error: { fg: appTheme.colors.error, bg: "#FEF2F2" },
  info: { fg: appTheme.colors.info, bg: "#F0F9FF" },
  accent: { fg: appTheme.colors.accent, bg: "#FFF7ED" },
};

function StatCard({ title, value, icon, subtitle, accent = "primary", trend, index }: StatCardProps) {
  const { fg, bg } = ACCENT_MAP[accent];
  const showTrend = trend && trend.percent !== null && trend.direction !== "flat";
  const trendColor = trend?.direction === "up" ? appTheme.colors.success : appTheme.colors.error;

  return (
    <Card
      className="hover-card entry-anim"
      style={
        {
          borderRadius: appTheme.radius.lg,
          border: `1px solid ${appTheme.colors.border}`,
          boxShadow: appTheme.shadow.card,
          overflow: "hidden",
          position: "relative",
          "--i": index ?? 0,
        } as React.CSSProperties
      }
      styles={{ body: { padding: "20px 22px" } }}
    >
      {/* Top accent bar - reinforces semantic color at a glance */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: fg,
        }}
      />

      <Space align="start" style={{ width: "100%", justifyContent: "space-between" }}>
        <div style={{ minWidth: 0 }}>
          <Space size={8} align="center">
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
              {title}
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
          <Title level={3} style={{ margin: "6px 0 4px", color: appTheme.colors.textPrimary, fontWeight: 800 }}>
            {value}
          </Title>
          {subtitle ? (
            <Text type="secondary" style={{ fontSize: 12.5 }}>
              {subtitle}
            </Text>
          ) : null}
        </div>

        {icon ? (
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: appTheme.radius.md,
              background: bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: fg,
              fontSize: 21,
              flexShrink: 0,
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
