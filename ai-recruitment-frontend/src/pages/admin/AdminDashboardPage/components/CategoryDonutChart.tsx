import React from "react";
import { Tooltip, Typography } from "antd";
import { formatNumber, formatPercent, chartColors } from "../hooks/useAdminDashboard";
import type { JobCategoryShareItem } from "../hooks/useAdminDashboard";
import EmptyChart from "./EmptyChart";

const { Text, Title } = Typography;

export default function CategoryDonutChart(props: { data: JobCategoryShareItem[] }) {
  const data = props.data || [];

  if (data.length === 0) {
    return <EmptyChart description="Chưa có dữ liệu phân bổ lĩnh vực." />;
  }

  const totalValue = data.reduce((total, item) => {
    return total + item.value;
  }, 0);

  if (totalValue <= 0) {
    return <EmptyChart description="Chưa có dữ liệu phân bổ lĩnh vực." />;
  }

  let currentPercent = 0;

  const gradientParts = data.map((item, index) => {
    const itemPercent = (item.value / totalValue) * 100;
    const startPercent = currentPercent;
    const endPercent = currentPercent + itemPercent;
    currentPercent = endPercent;

    return `${chartColors[index % chartColors.length]} ${startPercent}% ${endPercent}%`;
  });

  const donutBackground = `conic-gradient(${gradientParts.join(", ")})`;

  return (
    <div style={{ minHeight: 290, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: donutBackground,
          position: "relative",
          marginTop: 8,
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            width: 108,
            height: 108,
            borderRadius: "50%",
            backgroundColor: "#fff",
            position: "absolute",
            top: 36,
            left: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            boxShadow: "0 4px 16px rgba(15, 23, 42, 0.08)",
          }}
        >
          <Text type="secondary" style={{ fontSize: 12 }}>
            Tổng tin
          </Text>
          <Title level={3} style={{ margin: 0 }}>
            {formatNumber(totalValue)}
          </Title>
        </div>
      </div>

      <div style={{ width: "100%", marginTop: 18 }}>
        {data.slice(0, 7).map((item, index) => {
          const percent = (item.value / totalValue) * 100;

          return (
            <Tooltip
              key={`${item.categoryName}-${index}`}
              title={`${item.categoryName}: ${formatNumber(item.value)} tin (${formatPercent(percent)})`}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 10,
                  gap: 8,
                  width: "100%",
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    backgroundColor: chartColors[index % chartColors.length],
                    flexShrink: 0,
                  }}
                />

                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    paddingRight: 12,
                  }}
                >
                  <Text
                    style={{
                      display: "block",
                      width: "100%",
                    }}
                    ellipsis
                  >
                    {item.categoryName}
                  </Text>
                </div>

                <div
                  style={{
                    minWidth: 56,
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  <Text strong>{formatPercent(percent)}</Text>
                </div>
              </div>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
