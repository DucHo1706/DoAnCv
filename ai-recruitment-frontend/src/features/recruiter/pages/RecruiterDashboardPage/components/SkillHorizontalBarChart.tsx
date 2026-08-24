import { Typography, Tooltip } from "antd";
import { useResponsive } from "../../../../../hooks/useResponsive";

const { Paragraph, Text } = Typography;

interface SkillItem {
  skill: string;
  shortSkill: string;
  count: number;
}

interface SkillHorizontalBarChartProps {
  topSkillData: SkillItem[];
}

export default function SkillHorizontalBarChart({ topSkillData }: SkillHorizontalBarChartProps) {
  const { isMobile } = useResponsive();

  if (topSkillData.length === 0) {
    return <Paragraph>Chưa có dữ liệu kỹ năng để hiển thị.</Paragraph>;
  }

  const maxCount = Math.max(...topSkillData.map((item) => item.count), 1);

  return (
    <div
      style={{
        height: 320,
        padding: "8px 4px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 14,
      }}
    >
      {topSkillData.map((item) => {
        const widthPercent = Math.max((item.count / maxCount) * 100, 8);

        return (
          <div
            key={item.skill}
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "minmax(78px, 105px) 1fr 30px" : "190px 1fr 36px",
              alignItems: "center",
              gap: isMobile ? 6 : 12,
            }}
          >
            <Tooltip title={item.skill}>
              <div
                style={{
                  fontSize: 13,
                  color: "#595959",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {item.shortSkill}
              </div>
            </Tooltip>

            <Tooltip title={`${item.skill}: ${item.count} CV`}>
              <div
                style={{
                  height: 18,
                  backgroundColor: "#f0f5ff",
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${widthPercent}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, rgba(37, 99, 235, 0.55), #2563EB)",
                    borderRadius: 999,
                  }}
                />
              </div>
            </Tooltip>

            <Text strong style={{ color: "#2563EB" }}>
              {item.count}
            </Text>
          </div>
        );
      })}

      <div
        style={{
          marginTop: 4,
          textAlign: "right",
          fontSize: 12,
          color: "#8c8c8c",
        }}
      >
        Tần suất xuất hiện trong CV
      </div>
    </div>
  );
}
