import { Typography, Tooltip } from "antd";

const { Paragraph, Text } = Typography;

interface DistributionItem {
  range: string;
  count: number;
}

interface FitScoreDistributionChartProps {
  distributionData: DistributionItem[];
  getFitScoreColumnColor: (range: string) => string;
}

export default function FitScoreDistributionChart({
  distributionData,
  getFitScoreColumnColor,
}: FitScoreDistributionChartProps) {
  if (distributionData.length === 0) {
    return <Paragraph>Chưa có dữ liệu phân bổ điểm phù hợp.</Paragraph>;
  }

  const maxCount = Math.max(...distributionData.map((item) => item.count), 1);

  return (
    <div
      style={{
        height: 320,
        padding: "24px 20px 8px 20px",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-around",
        borderBottom: "1px solid #f0f0f0",
      }}
    >
      {distributionData.map((item) => {
        const heightPercent = Math.max((item.count / maxCount) * 82, item.count > 0 ? 10 : 0);
        const columnColor = getFitScoreColumnColor(item.range);

        return (
          <Tooltip key={item.range} title={`${item.range}: ${item.count} CV`}>
            <div
              style={{
                width: "20%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 8,
              }}
            >
              <Text
                strong
                style={{
                  fontSize: 13,
                  color: item.count > 0 ? columnColor : "#bfbfbf",
                }}
              >
                {item.count}
              </Text>

              <div
                style={{
                  width: 48,
                  height: `${heightPercent}%`,
                  backgroundColor: columnColor,
                  borderRadius: "8px 8px 0 0",
                  transition: "all 0.25s ease",
                }}
              />

              <Text
                style={{
                  fontSize: 12,
                  color: "#8c8c8c",
                  whiteSpace: "nowrap",
                }}
              >
                {item.range}
              </Text>
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
}
