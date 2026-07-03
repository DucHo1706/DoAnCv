import React, { useMemo } from "react";
import { Tooltip, Typography, Space } from "antd";
import dayjs from "dayjs";
import { formatShortDate, formatNumber } from "../hooks/useAdminDashboard";
import type { ActivityTrendItem } from "../hooks/useAdminDashboard";
import EmptyChart from "./EmptyChart";

const { Text } = Typography;

export default function ActivityTrendChart(props: { data: ActivityTrendItem[] }) {
  const data = props.data || [];

  const chartData = useMemo(() => {
    if (data.length <= 45) {
      return data;
    }

    const groupedData = new Map<string, ActivityTrendItem>();

    data.forEach((item) => {
      const parsedDate = dayjs(item.date);
      let groupKey = item.date;

      if (parsedDate.isValid() === true) {
        groupKey = parsedDate.format("MM/YYYY");
      }

      const existingItem = groupedData.get(groupKey);

      if (existingItem) {
        existingItem.cvSubmissions = existingItem.cvSubmissions + item.cvSubmissions;
        existingItem.newJobs = existingItem.newJobs + item.newJobs;
      } else {
        groupedData.set(groupKey, {
          date: groupKey,
          cvSubmissions: item.cvSubmissions,
          newJobs: item.newJobs,
        });
      }
    });

    return Array.from(groupedData.values());
  }, [data]);

  if (chartData.length === 0) {
    return <EmptyChart description="Chưa có dữ liệu lưu lượng hoạt động." />;
  }

  const maxValue = Math.max(
    1,
    ...chartData.map((item) => {
      return Math.max(item.cvSubmissions, item.newJobs);
    })
  );

  return (
    <div style={{ height: 290, paddingTop: 12 }}>
      <div
        style={{
          height: 226,
          borderLeft: "1px solid #f0f0f0",
          borderBottom: "1px solid #f0f0f0",
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
          padding: "0 8px",
        }}
      >
        {chartData.map((item, index) => {
          const cvHeight = Math.max(6, (item.cvSubmissions / maxValue) * 200);
          const jobHeight = Math.max(6, (item.newJobs / maxValue) * 200);
          const label = chartData.length > 45 ? item.date : formatShortDate(item.date);

          return (
            <Tooltip
              key={`${item.date}-${index}`}
              title={
                <div>
                  <div>
                    <b>
                      {chartData.length > 45 ? item.date : dayjs(item.date).format("DD/MM/YYYY")}
                    </b>
                  </div>
                  <div>CV nộp: {formatNumber(item.cvSubmissions)}</div>
                  <div>Tin đăng mới: {formatNumber(item.newJobs)}</div>
                </div>
              }
            >
              <div
                style={{
                  flex: 1,
                  minWidth: chartData.length > 20 ? 8 : 18,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    height: 205,
                    width: "100%",
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    gap: 3,
                  }}
                >
                  <div
                    style={{
                      height: cvHeight,
                      width: chartData.length > 20 ? 6 : 10,
                      borderRadius: "8px 8px 0 0",
                      background: "linear-gradient(180deg, #69b1ff 0%, #1677ff 100%)",
                    }}
                  />

                  <div
                    style={{
                      height: jobHeight,
                      width: chartData.length > 20 ? 6 : 10,
                      borderRadius: "8px 8px 0 0",
                      background: "linear-gradient(180deg, #ffd591 0%, #fa8c16 100%)",
                    }}
                  />
                </div>

                {index % Math.ceil(chartData.length / 8) === 0 && (
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 10,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {label}
                  </Text>
                )}
              </div>
            </Tooltip>
          );
        })}
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 18, justifyContent: "center" }}>
        <Space size={6}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              backgroundColor: "#1677ff",
              display: "inline-block",
            }}
          />
          <Text type="secondary">CV nộp</Text>
        </Space>

        <Space size={6}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              backgroundColor: "#fa8c16",
              display: "inline-block",
            }}
          />
          <Text type="secondary">Tin đăng mới</Text>
        </Space>
      </div>
    </div>
  );
}
