import { Tooltip, Typography } from "antd";
import { formatNumber, formatPercent } from "../hooks/useAdminDashboard";
import type { OcrErrorRateItem } from "../hooks/useAdminDashboard";
import EmptyChart from "./EmptyChart";

const { Text } = Typography;

export default function OcrErrorRateChart(props: { data: OcrErrorRateItem[] }) {
  const data = props.data || [];

  if (data.length === 0) {
    return <EmptyChart description="Chưa có dữ liệu lỗi OCR/NLP." />;
  }

  const maxRate = Math.max(
    1,
    ...data.map((item) => {
      return item.errorRate;
    })
  );

  return (
    <div style={{ minHeight: 300, padding: "8px 0" }}>
      {data.map((item, index) => {
        const barWidth = Math.max(4, (item.errorRate / maxRate) * 100);
        let barColor = "#52c41a";

        if (item.errorRate >= 30) {
          barColor = "#ff4d4f";
        } else if (item.errorRate >= 10) {
          barColor = "#faad14";
        }

        return (
          <div key={`${item.fileType}-${index}`} style={{ marginBottom: 18 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 6,
              }}
            >
              <Tooltip title={item.fileType}>
                <Text strong ellipsis style={{ maxWidth: "55%" }}>
                  {item.fileType}
                </Text>
              </Tooltip>

              <Text type="secondary">
                {formatPercent(item.errorRate)} · {formatNumber(item.failed)}/
                {formatNumber(item.total)} lỗi
              </Text>
            </div>

            <div
              style={{
                height: 28,
                backgroundColor: "#f5f5f5",
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <Tooltip title={`${item.fileType}: ${formatPercent(item.errorRate)} lỗi nhận diện`}>
                <div
                  style={{
                    width: `${barWidth}%`,
                    height: "100%",
                    backgroundColor: barColor,
                    borderRadius: 999,
                    transition: "width 0.25s ease",
                  }}
                />
              </Tooltip>
            </div>
          </div>
        );
      })}
    </div>
  );
}
