import { Card, Typography, Tooltip, Space } from "antd";
import { LineChartOutlined, FallOutlined, RiseOutlined } from "@ant-design/icons";
import { appTheme } from "../../../../../constants/theme";

const { Text } = Typography;

interface TrendItem {
  date: string;
  count: number;
}

interface ApplicationTrendChartProps {
  trendData?: TrendItem[];
}

export default function ApplicationTrendChart({ trendData = [] }: ApplicationTrendChartProps) {
  const maxCount = Math.max(...trendData.map((d) => d.count), 1);
  const totalCount = trendData.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <Card
      title={
        <Space align="center">
          <LineChartOutlined style={{ color: "#2563EB" }} />
          <span style={{ fontSize: 15, fontWeight: 600, color: "#0F172A" }}>
            Xu hướng ứng tuyển 14 ngày gần nhất
          </span>
        </Space>
      }
      extra={
        <Text style={{ fontSize: 13, color: "#64748B" }}>
          Tổng cộng <strong style={{ color: "#2563EB" }}>{totalCount}</strong> CV
        </Text>
      }
      style={{
        borderRadius: 16,
        boxShadow: appTheme.shadow.card,
        border: `1px solid ${appTheme.colors.border}`,
      }}
      bodyStyle={{ padding: "20px 24px" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          height: 180,
          gap: 8,
          paddingTop: 20,
          paddingBottom: 24,
          borderBottom: "1px solid #E2E8F0",
        }}
      >
        {trendData.map((item, idx) => {
          const heightPercent = Math.max((item.count / maxCount) * 100, 6);
          const isHighest = item.count === maxCount && maxCount > 0;

          return (
            <div
              key={idx}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                height: "100%",
                justifyContent: "flex-end",
              }}
            >
              <Tooltip title={`${item.date}: ${item.count} CV ứng tuyển`}>
                <div
                  style={{
                    width: "80%",
                    maxWidth: 24,
                    height: `${heightPercent}%`,
                    backgroundColor: isHighest ? "#2563EB" : "#93C5FD",
                    borderRadius: "4px 4px 0 0",
                    transition: "all 200ms ease",
                    cursor: "pointer",
                  }}
                  className="hover-card"
                />
              </Tooltip>
              <Text
                type="secondary"
                style={{
                  fontSize: 10,
                  marginTop: 6,
                  whiteSpace: "nowrap",
                  color: isHighest ? "#2563EB" : "#64748B",
                  fontWeight: isHighest ? 700 : 400,
                }}
              >
                {item.date}
              </Text>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
