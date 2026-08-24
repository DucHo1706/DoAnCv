import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { Button, Card, Carousel, Tooltip, Typography } from "antd";

const { Text } = Typography;
import React from "react";
import { appTheme } from "../../../../../constants/theme";
import { useResponsive } from "../../../../../hooks/useResponsive";

interface ExperienceItem {
  range: string;
  count: number;
}

interface DegreeItem {
  type: string;
  value: number;
}

interface UniversityItem {
  type: string;
  shortType: string;
  value: number;
}

interface AutoSliderAnalyticsProps {
  carouselRef: React.RefObject<any>;
  carouselTitles: string[];
  activeSlide: number;
  isAutoSlide: boolean;
  handleCarouselPrevious: () => void;
  handleCarouselNext: () => void;
  handleCarouselDotClick: (index: number) => void;
  handleCarouselAfterChange: (current: number) => void;
  experienceData: ExperienceItem[];
  degreeData: DegreeItem[];
  universityData: UniversityItem[];
}

export default function AutoSliderAnalytics({
  carouselRef,
  carouselTitles,
  activeSlide,
  isAutoSlide,
  handleCarouselPrevious,
  handleCarouselNext,
  handleCarouselDotClick,
  handleCarouselAfterChange,
  experienceData,
  degreeData,
  universityData,
}: AutoSliderAnalyticsProps) {
  const { isMobile } = useResponsive();
  const chartHeight = isMobile ? 320 : 260;

  const renderExperienceColumnChart = () => {
    if (experienceData.length === 0) {
      return (
        <div style={{ height: chartHeight, display: "flex", alignItems: "center", justifyContent: "center", color: "#8c8c8c" }}>
          Chưa có dữ liệu kinh nghiệm.
        </div>
      );
    }

    const maxCount = Math.max(...experienceData.map((item) => item.count), 1);

    return (
      <div
        style={{
          height: chartHeight,
          padding: isMobile ? "18px 4px 6px" : "18px 20px 6px",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-around",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        {experienceData.map((item) => {
          const heightPercent = Math.max((item.count / maxCount) * 78, item.count > 0 ? 10 : 0);

          return (
            <Tooltip key={item.range} title={`${item.range}: ${item.count} CV`}>
              <div
                style={{
                  width: "22%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 8,
                }}
              >
                <Text strong style={{ color: item.count > 0 ? "#2563EB" : "#bfbfbf" }}>
                  {item.count}
                </Text>
                <div
                  style={{
                    width: isMobile ? 28 : 46,
                    height: `${heightPercent}%`,
                    backgroundColor: item.count > 0 ? "#2563EB" : "#f0f0f0",
                    borderRadius: "8px 8px 0 0",
                    transition: "all 0.25s ease",
                  }}
                />
                <Text style={{ fontSize: isMobile ? 10 : 12, color: "#8c8c8c", whiteSpace: "nowrap" }}>
                  {item.range}
                </Text>
              </div>
            </Tooltip>
          );
        })}
      </div>
    );
  };

  const renderDegreePieChart = () => {
    if (degreeData.length === 0) {
      return (
        <div style={{ height: chartHeight, display: "flex", alignItems: "center", justifyContent: "center", color: "#8c8c8c" }}>
          Chưa có dữ liệu học vấn.
        </div>
      );
    }

    const colors = ["#2563EB", "#10B981", "#F59E0B", "#F97316", "#0EA5E9", "#EF4444"];
    const totalValue = degreeData.reduce((total, item) => total + item.value, 0);

    let currentPercent = 0;
    const gradientParts = degreeData.map((item, index) => {
      const percent = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
      const startPercent = currentPercent;
      const endPercent = currentPercent + percent;
      currentPercent = endPercent;
      return `${colors[index % colors.length]} ${startPercent}% ${endPercent}%`;
    });

    const pieBackground = `conic-gradient(${gradientParts.join(", ")})`;

    return (
      <div
        style={{
          height: chartHeight,
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "220px 1fr",
          alignItems: "center",
          gap: isMobile ? 10 : 28,
          padding: isMobile ? "8px 4px" : "10px 24px",
        }}
      >
        <div
          style={{
            width: isMobile ? 140 : 190,
            height: isMobile ? 140 : 190,
            borderRadius: "50%",
            background: pieBackground,
            margin: "0 auto",
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.04)",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 6 : 10, minWidth: 0 }}>
          {degreeData.map((item, index) => {
            const percent = totalValue > 0 ? Math.round((item.value / totalValue) * 100) : 0;

            return (
              <Tooltip key={item.type} title={`${item.type}: ${item.value} CV`}>
                <div style={{ display: "grid", gridTemplateColumns: "12px 1fr auto", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      backgroundColor: colors[index % colors.length],
                    }}
                  />
                  <Text style={{ fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.type}
                  </Text>
                  <Text strong>{percent}%</Text>
                </div>
              </Tooltip>
            );
          })}
        </div>
      </div>
    );
  };

  const renderUniversityBarChart = () => {
    if (universityData.length === 0) {
      return (
        <div style={{ height: chartHeight, display: "flex", alignItems: "center", justifyContent: "center", color: "#8c8c8c" }}>
          Chưa có dữ liệu trường đại học.
        </div>
      );
    }

    const maxValue = Math.max(...universityData.map((item) => item.value), 1);

    return (
      <div
        style={{
          height: chartHeight,
          padding: "12px 8px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 16,
        }}
      >
        {universityData.map((item) => {
          const widthPercent = Math.max((item.value / maxValue) * 100, 8);

          return (
            <div
              key={item.type}
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "minmax(80px, 110px) 1fr 30px" : "190px 1fr 38px",
                alignItems: "center",
                gap: isMobile ? 6 : 12,
              }}
            >
              <Tooltip title={item.type}>
                <Text
                  style={{
                    fontSize: 13,
                    color: "#595959",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {item.shortType}
                </Text>
              </Tooltip>

              <Tooltip title={`${item.type}: ${item.value} CV`}>
                <div
                  style={{
                    height: 18,
                    backgroundColor: "#fff7e6",
                    borderRadius: 999,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${widthPercent}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, rgba(245, 158, 11, 0.55), #F59E0B)",
                      borderRadius: 999,
                      transition: "all 0.25s ease",
                    }}
                  />
                </div>
              </Tooltip>

              <Text strong style={{ color: "#F97316" }}>
                {item.value}
              </Text>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span>{carouselTitles[activeSlide]}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Button size="small" shape="circle" icon={<LeftOutlined />} onClick={handleCarouselPrevious} />
            <Button size="small" shape="circle" icon={<RightOutlined />} onClick={handleCarouselNext} />
          </div>
        </div>
      }
      style={{
        borderRadius: 16,
        height: isMobile ? 460 : 400,
        boxShadow: appTheme.shadow.card,
        border: `1px solid ${appTheme.colors.border}`,
      }}
      bodyStyle={{ padding: isMobile ? "12px 10px" : "12px 16px", height: isMobile ? 404 : 344 }}
    >
      <Carousel
        ref={carouselRef}
        autoplay={isAutoSlide}
        autoplaySpeed={3000}
        dots={false}
        afterChange={handleCarouselAfterChange}
      >
        <div>{renderExperienceColumnChart()}</div>
        <div>{renderDegreePieChart()}</div>
        <div>{renderUniversityBarChart()}</div>
      </Carousel>

      <div style={{ height: 34, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 6 }}>
        {carouselTitles.map((title, index) => (
          <Tooltip key={title} title={title}>
            <button
              type="button"
              onClick={() => handleCarouselDotClick(index)}
              style={{
                width: activeSlide === index ? 22 : 8,
                height: 8,
                borderRadius: 999,
                border: "none",
                backgroundColor: activeSlide === index ? "#2563EB" : "#d9d9d9",
                cursor: "pointer",
                transition: "all 0.2s ease",
                padding: 0,
              }}
            />
          </Tooltip>
        ))}
      </div>
    </Card>
  );
}
