import {
  BarChartOutlined,
  LeftOutlined,
  RiseOutlined,
  RightOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserAddOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  Carousel,
  Col,
  Row,
  Select,
  Spin,
  Statistic,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import React from "react";
import PageContainer from "../../../components/common/PageContainer";
import { useRecruiterDashboard } from "./hooks/useRecruiterDashboard";

const { Paragraph, Text } = Typography;

export default function RecruiterDashboardPage() {
  const {
    loading,
    stats,
    selectedJob,
    carouselRef,
    isAutoSlide,
    activeSlide,
    handleCarouselPrevious,
    handleCarouselNext,
    handleCarouselDotClick,
    handleCarouselAfterChange,
    getFitScoreColor,
    getAverageFitScoreColor,
    handleChangeSelectedJob,
    carouselTitles,
    getTopSkillData,
    getFitScoreColumnColor,
    getExperienceData,
    getUniversityCarouselData,
    truncateText,
  } = useRecruiterDashboard();

  const renderSkillHorizontalBarChart = () => {
    const topSkillData = getTopSkillData();

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
                gridTemplateColumns: "190px 1fr 36px",
                alignItems: "center",
                gap: 12,
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
                      background: "linear-gradient(90deg, #69b1ff, #1677ff)",
                      borderRadius: 999,
                    }}
                  />
                </div>
              </Tooltip>

              <Text strong style={{ color: "#1677ff" }}>
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
  };

  const renderFitScoreDistributionChart = () => {
    const distributionData = stats.fitScoreDistribution || [];

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
  };

  const renderTopCandidateLeaderboard = () => {
    const topCandidates = stats.topCandidates || [];

    if (topCandidates.length === 0) {
      return (
        <div
          style={{
            height: "100%",
            minHeight: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#8c8c8c",
          }}
        >
          Chưa có ứng viên nào được AI chấm điểm.
        </div>
      );
    }

    const displayCandidates = topCandidates.slice(0, 5);
    const emptySlotCount = 5 - displayCandidates.length;
    const emptySlots = Array.from({ length: emptySlotCount });

    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {displayCandidates.map((candidate, index) => {
          const scoreColor = getFitScoreColor(candidate.fitScore);
          const isTopOne = index === 0;

          return (
            <div
              key={candidate.applicationId}
              style={{
                height: 56,
                display: "grid",
                gridTemplateColumns: "34px 1fr 120px 82px",
                alignItems: "center",
                columnGap: 10,
                padding: "7px 10px",
                borderRadius: 8,
                border: isTopOne ? "1px solid #ffe58f" : "1px solid transparent",
                backgroundColor: isTopOne ? "#fffbe6" : "#ffffff",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.backgroundColor = isTopOne ? "#fff7d6" : "#f5f8ff";
                event.currentTarget.style.borderColor = isTopOne ? "#ffd666" : "#d6e4ff";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.backgroundColor = isTopOne ? "#fffbe6" : "#ffffff";
                event.currentTarget.style.borderColor = isTopOne ? "#ffe58f" : "transparent";
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isTopOne ? "#faad14" : "#e6f4ff",
                  color: isTopOne ? "#ffffff" : "#1677ff",
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                {index + 1}
              </div>

              <div
                style={{
                  minWidth: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Avatar
                  size={32}
                  icon={<UserOutlined />}
                  style={{
                    flexShrink: 0,
                    backgroundColor: isTopOne ? "#fff7e6" : "#f0f5ff",
                    color: isTopOne ? "#fa8c16" : "#1677ff",
                    border: isTopOne ? "1px solid #ffd591" : "1px solid #adc6ff",
                  }}
                />

                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      minWidth: 0,
                    }}
                  >
                    <Tooltip title={candidate.candidateName}>
                      <Text
                        strong
                        style={{
                          display: "block",
                          maxWidth: 160,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {candidate.candidateName}
                      </Text>
                    </Tooltip>

                    {isTopOne && (
                      <TrophyOutlined
                        style={{
                          color: "#faad14",
                          fontSize: 14,
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>

                  <Tooltip title={candidate.email}>
                    <div
                      style={{
                        maxWidth: 190,
                        color: "#8c8c8c",
                        fontSize: 12,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {candidate.email}
                    </div>
                  </Tooltip>
                </div>
              </div>

              <Tooltip title={candidate.featuredSkill}>
                <Tag
                  color="blue"
                  style={{
                    maxWidth: 120,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    marginInlineEnd: 0,
                    textAlign: "center",
                  }}
                >
                  {truncateText(candidate.featuredSkill, 16)}
                </Tag>
              </Tooltip>

              <Tag
                style={{
                  color: scoreColor,
                  borderColor: scoreColor,
                  backgroundColor: `${scoreColor}14`,
                  fontWeight: 700,
                  fontSize: 13,
                  padding: "3px 8px",
                  marginInlineEnd: 0,
                  textAlign: "center",
                }}
              >
                {candidate.fitScore}/100
              </Tag>
            </div>
          );
        })}

        {emptySlots.map((_, index) => (
          <div
            key={`empty-candidate-slot-${index}`}
            style={{
              height: 56,
              display: "grid",
              gridTemplateColumns: "34px 1fr 120px 82px",
              alignItems: "center",
              columnGap: 10,
              padding: "7px 10px",
              borderRadius: 8,
              border: "1px dashed #f0f0f0",
              backgroundColor: "#fafafa",
              opacity: 0.7,
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                backgroundColor: "#f0f0f0",
              }}
            />

            <Text
              style={{
                color: "#bfbfbf",
                fontSize: 13,
              }}
            >
              Chưa có ứng viên ở vị trí này
            </Text>

            <div />

            <div />
          </div>
        ))}
      </div>
    );
  };

  const renderExperienceColumnChart = () => {
    const experienceData = getExperienceData();

    if (experienceData.length === 0) {
      return (
        <div
          style={{
            height: 260,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#8c8c8c",
          }}
        >
          Chưa có dữ liệu kinh nghiệm.
        </div>
      );
    }

    const maxCount = Math.max(...experienceData.map((item) => item.count), 1);

    return (
      <div
        style={{
          height: 260,
          padding: "18px 20px 6px 20px",
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
                <Text
                  strong
                  style={{
                    color: item.count > 0 ? "#1677ff" : "#bfbfbf",
                  }}
                >
                  {item.count}
                </Text>

                <div
                  style={{
                    width: 46,
                    height: `${heightPercent}%`,
                    backgroundColor: item.count > 0 ? "#1677ff" : "#f0f0f0",
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
  };

  const renderDegreePieChart = () => {
    const degreeData = stats.degreeData || [];

    if (degreeData.length === 0) {
      return (
        <div
          style={{
            height: 260,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#8c8c8c",
          }}
        >
          Chưa có dữ liệu học vấn.
        </div>
      );
    }

    const colors = ["#1677ff", "#52c41a", "#faad14", "#722ed1", "#13c2c2", "#ff4d4f"];
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
          height: 260,
          display: "grid",
          gridTemplateColumns: "220px 1fr",
          alignItems: "center",
          gap: 28,
          padding: "10px 24px",
        }}
      >
        <div
          style={{
            width: 190,
            height: 190,
            borderRadius: "50%",
            background: pieBackground,
            margin: "0 auto",
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.04)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {degreeData.map((item, index) => {
            const percent = totalValue > 0 ? Math.round((item.value / totalValue) * 100) : 0;

            return (
              <Tooltip key={item.type} title={`${item.type}: ${item.value} CV`}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "12px 1fr auto",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      backgroundColor: colors[index % colors.length],
                    }}
                  />

                  <Text
                    style={{
                      fontSize: 13,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
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
    const universityData = getUniversityCarouselData();

    if (universityData.length === 0) {
      return (
        <div
          style={{
            height: 260,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#8c8c8c",
          }}
        >
          Chưa có dữ liệu trường đại học.
        </div>
      );
    }

    const maxValue = Math.max(...universityData.map((item) => item.value), 1);

    return (
      <div
        style={{
          height: 260,
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
                gridTemplateColumns: "190px 1fr 38px",
                alignItems: "center",
                gap: 12,
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
                      background: "linear-gradient(90deg, #ffd666, #faad14)",
                      borderRadius: 999,
                      transition: "all 0.25s ease",
                    }}
                  />
                </div>
              </Tooltip>

              <Text strong style={{ color: "#fa8c16" }}>
                {item.value}
              </Text>
            </div>
          );
        })}
      </div>
    );
  };

  const renderAutoSliderAnalytics = () => {
    return (
      <Card
        title={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <span>
              <BarChartOutlined style={{ marginRight: 8 }} />
              {carouselTitles[activeSlide]}
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Button
                size="small"
                shape="circle"
                icon={<LeftOutlined />}
                onClick={handleCarouselPrevious}
              />

              <Button
                size="small"
                shape="circle"
                icon={<RightOutlined />}
                onClick={handleCarouselNext}
              />
            </div>
          </div>
        }
        style={{
          borderRadius: 8,
          height: 400,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
        }}
        bodyStyle={{
          padding: "12px 16px",
          height: 344,
        }}
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

        <div
          style={{
            height: 34,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginTop: 6,
          }}
        >
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
                  backgroundColor: activeSlide === index ? "#1677ff" : "#d9d9d9",
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
  };

  return (
    <PageContainer
      title="Recruiter Dashboard"
      subtitle="Tổng quan nhanh về chiến dịch tuyển dụng, chất lượng hồ sơ và kết quả chấm điểm AI."
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card
            style={{
              borderRadius: 8,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
            }}
            bodyStyle={{
              padding: 12,
            }}
          >
            <Row align="middle" gutter={[12, 12]}>
              <Col xs={24} md={7} lg={6}>
                <Text strong>Lọc dữ liệu theo Tin tuyển dụng:</Text>
              </Col>

              <Col xs={24} md={17} lg={18}>
                <Select
                  showSearch
                  allowClear
                  size="large"
                  placeholder="Tất cả tin tuyển dụng"
                  value={selectedJob}
                  onChange={handleChangeSelectedJob}
                  style={{ width: "100%" }}
                  optionFilterProp="label"
                  loading={loading}
                  options={stats.jobOptions.map((job) => ({
                    value: job.jobId,
                    label: job.jobTitle,
                  }))}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card
            style={{
              borderRadius: 8,
              height: "100%",
              width: "100%",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
            }}
            bodyStyle={{
              padding: 16,
            }}
          >
            <Statistic
              title="Tổng số CV đã nhận"
              value={stats.quickMetrics.totalApplications}
              valueStyle={{
                fontSize: 30,
                fontWeight: 700,
                lineHeight: 1.1,
              }}
              prefix={<TeamOutlined style={{ color: "#1677ff" }} />}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card
            style={{
              borderRadius: 8,
              height: "100%",
              width: "100%",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
            }}
            bodyStyle={{
              padding: 16,
            }}
          >
            <Statistic
              title="CV mới chưa đọc"
              value={stats.quickMetrics.newApplications}
              valueStyle={{
                fontSize: 30,
                fontWeight: 700,
                lineHeight: 1.1,
              }}
              prefix={<UserAddOutlined style={{ color: "#ff4d4f" }} />}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card
            style={{
              borderRadius: 8,
              height: "100%",
              width: "100%",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
            }}
            bodyStyle={{
              padding: 16,
            }}
          >
            <Statistic
              title="Điểm Fit Score trung bình"
              value={stats.quickMetrics.averageFitScore}
              precision={1}
              suffix="/100"
              valueStyle={{
                fontSize: 30,
                fontWeight: 700,
                lineHeight: 1.1,
                color: getAverageFitScoreColor(stats.quickMetrics.averageFitScore),
              }}
              prefix={<RiseOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {loading ? (
        <div style={{ textAlign: "center", padding: "50px 0" }}>
          <Spin size="large" tip="Đang truy xuất dữ liệu CV..." />
        </div>
      ) : (
        <>
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Card
                title="Top năng lực nổi bật trong tập ứng viên"
                style={{
                  borderRadius: 8,
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                }}
              >
                {renderSkillHorizontalBarChart()}
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card
                title="Chất lượng Ứng viên (Fit Score Distribution)"
                style={{
                  borderRadius: 8,
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                }}
              >
                {renderFitScoreDistributionChart()}
              </Card>
            </Col>
          </Row>

          <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
            <Col xs={24} lg={10}>
              <Card
                title="Top 5 Ứng viên tiềm năng nhất"
                style={{
                  borderRadius: 8,
                  height: 400,
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                }}
                bodyStyle={{
                  padding: "12px 14px",
                  height: 344,
                  overflow: "hidden",
                }}
              >
                {renderTopCandidateLeaderboard()}
              </Card>
            </Col>

            <Col xs={24} lg={14}>
              {renderAutoSliderAnalytics()}
            </Col>
          </Row>
        </>
      )}
    </PageContainer>
  );
}
