import { TrophyOutlined, UserOutlined } from "@ant-design/icons";
import { Avatar, Tag, Tooltip, Typography } from "antd";
import { useResponsive } from "../../../../../hooks/useResponsive";

const { Text } = Typography;

interface CandidateItem {
  applicationId: number | string;
  candidateName: string;
  email: string;
  featuredSkill: string;
  fitScore: number;
}

interface TopCandidateLeaderboardProps {
  topCandidates: CandidateItem[];
  getFitScoreColor: (score: number) => string;
  truncateText: (text: string, maxLength: number) => string;
}

export default function TopCandidateLeaderboard({
  topCandidates,
  getFitScoreColor,
  truncateText,
}: TopCandidateLeaderboardProps) {
  const { isMobile } = useResponsive();

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
            className="hover-card"
            style={{
              height: 56,
              display: "grid",
              gridTemplateColumns: isMobile ? "30px minmax(0, 1fr) 72px" : "34px 1fr 120px 82px",
              alignItems: "center",
              columnGap: 10,
              padding: "7px 10px",
              borderRadius: 8,
              border: isTopOne ? "1px solid #ffe58f" : "1px solid transparent",
              backgroundColor: isTopOne ? "#fffbe6" : "#ffffff",
              cursor: "pointer",
              transition: "all 0.2s ease",
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
                backgroundColor: isTopOne ? "#F59E0B" : "#EFF6FF",
                color: isTopOne ? "#ffffff" : "#2563EB",
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
                  color: isTopOne ? "#F97316" : "#2563EB",
                  border: isTopOne ? "1px solid rgba(249, 115, 22, 0.30)" : "1px solid #adc6ff",
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
                        color: "#F59E0B",
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

            {!isMobile && (
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
            )}

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
            gridTemplateColumns: isMobile ? "30px minmax(0, 1fr) 72px" : "34px 1fr 120px 82px",
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

          {!isMobile && <div />}
          <div />
        </div>
      ))}
    </div>
  );
}
