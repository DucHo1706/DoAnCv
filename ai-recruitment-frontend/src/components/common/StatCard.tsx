import { Card, Space, Typography } from "antd";
import type { ReactNode } from "react";
import { appTheme } from "../../constants/theme";

const { Text, Title } = Typography;

type StatCardAccent = "primary" | "success" | "warning" | "error" | "info";

type StatCardProps = {
  title: string;
  value: string | number;
  icon?: ReactNode;
  subtitle?: string;
  /** Semantic accent color driving the icon chip + top accent bar. Defaults to "primary". */
  accent?: StatCardAccent;
  /** Optional stagger index for entry animation when rendered in a grid (CSS var --i). */
  index?: number;
};

const ACCENT_MAP: Record<StatCardAccent, { fg: string; bg: string }> = {
  primary: { fg: appTheme.colors.primary, bg: "#EFF6FF" },
  success: { fg: appTheme.colors.success, bg: "#F0FDF4" },
  warning: { fg: appTheme.colors.warning, bg: "#FFFBEB" },
  error: { fg: appTheme.colors.error, bg: "#FEF2F2" },
  info: { fg: appTheme.colors.info, bg: "#F0F9FF" },
};

function StatCard({ title, value, icon, subtitle, accent = "primary", index }: StatCardProps) {
  const { fg, bg } = ACCENT_MAP[accent];

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
          <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
            {title}
          </Text>
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
