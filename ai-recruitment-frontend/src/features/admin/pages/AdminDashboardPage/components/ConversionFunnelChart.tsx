import { Tooltip, Typography } from "antd";
import { formatNumber, formatPercent, chartColors } from "../hooks/useAdminDashboard";
import type { ConversionFunnelItem } from "../hooks/useAdminDashboard";
import EmptyChart from "./EmptyChart";

const { Text } = Typography;

export default function ConversionFunnelChart(props: { data: ConversionFunnelItem[] }) {
  const data = props.data || [];

  if (data.length === 0) {
    return <EmptyChart description="Chưa có dữ liệu phễu chuyển đổi." />;
  }

  const firstValue = data[0]?.value || 0;

  if (firstValue <= 0) {
    return <EmptyChart description="Chưa có dữ liệu phễu chuyển đổi." />;
  }

  return (
    <div style={{ minHeight: 300, padding: "8px 0" }}>
      {data.map((item, index) => {
        let widthPercent = item.percent;

        if (widthPercent <= 0) {
          widthPercent = (item.value / firstValue) * 100;
        }

        if (widthPercent > 100) {
          widthPercent = 100;
        }

        const visualWidth = Math.max(18, widthPercent);
        const backgroundColor = chartColors[index % chartColors.length];

        return (
          <div key={`${item.stage}-${index}`} style={{ marginBottom: 18 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 6,
              }}
            >
              <Tooltip title={item.stage}>
                <Text strong ellipsis style={{ maxWidth: "70%" }}>
                  {item.stage}
                </Text>
              </Tooltip>

              <Text type="secondary">
                {formatNumber(item.value)} · {formatPercent(widthPercent)}
              </Text>
            </div>

            <div
              style={{
                height: 34,
                backgroundColor: "#f5f5f5",
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <Tooltip
                title={`${item.stage}: ${formatNumber(item.value)} hồ sơ (${formatPercent(
                  widthPercent
                )})`}
              >
                <div
                  style={{
                    width: `${visualWidth}%`,
                    height: "100%",
                    background: `linear-gradient(90deg, ${backgroundColor}cc, ${backgroundColor})`,
                    borderRadius: 999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    paddingRight: 12,
                    color: "#fff",
                    fontWeight: 700,
                    transition: "width 0.25s ease",
                  }}
                >
                  {widthPercent >= 24 && formatPercent(widthPercent)}
                </div>
              </Tooltip>
            </div>
          </div>
        );
      })}
    </div>
  );
}
