import React from "react";
import { Card, Typography, Progress, Divider, Table } from "antd";
import type { CriteriaResultDto } from "../../../../services/recruitmentService";

const { Text, Title } = Typography;

interface AiReportCardProps {
  candidateName: string;
  email?: string;
  phone?: string;
  aiScore: number;
  classification?: string;
  aiReason: string | any;
  matchedSkills: string | string[];
  missingSkills: string | string[];
  criteriaResults?: CriteriaResultDto[];
  showContactInfo?: boolean;
  showCriteriaTable?: boolean;
  bordered?: boolean;
}

export const AiReportCard: React.FC<AiReportCardProps> = ({
  candidateName,
  email,
  phone,
  aiScore,
  classification,
  aiReason,
  matchedSkills,
  missingSkills,
  criteriaResults = [],
  showContactInfo = true,
  showCriteriaTable = true,
  bordered = true,
}) => {
  const getParsedAnalysis = () => {
    if (!aiReason) return null;
    if (typeof aiReason === "object" && !Array.isArray(aiReason)) return aiReason;
    try {
      let reasonStr = String(aiReason).trim();
      const firstBrace = reasonStr.indexOf("{");
      if (firstBrace > 0) reasonStr = reasonStr.substring(firstBrace);
      if (reasonStr.startsWith("{")) {
        return JSON.parse(reasonStr);
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  const safeParseSkills = (value: string | string[] | undefined) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const parsed = getParsedAnalysis();
  const summaryText = parsed?.summary || parsed?.score_analysis?.summary || (typeof aiReason === "string" ? aiReason : "") || "Chưa có nhận xét từ AI";
  const pros = parsed?.pros || parsed?.score_analysis?.pros || [];
  const cons = parsed?.cons || parsed?.score_analysis?.cons || [];
  const questions = parsed?.interview_questions || parsed?.score_analysis?.interview_questions || [];

  const finalMatched = safeParseSkills(matchedSkills);
  const finalMissing = safeParseSkills(missingSkills);

  return (
    <Card
      style={{
        borderRadius: 16,
        border: bordered ? "1px solid #E2E8F0" : "none",
        boxShadow: bordered ? "0 4px 20px rgba(0,0,0,0.02)" : "none",
        background: bordered ? "rgba(255, 255, 255, 0.85)" : "transparent",
        backdropFilter: bordered ? "blur(20px)" : "none",
        height: "100%",
      }}
      bodyStyle={{ padding: bordered ? 24 : 0 }}
    >
      {/* Score and Identification */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <Progress
          type="circle"
          percent={aiScore}
          strokeColor={
            aiScore >= 80
              ? "#10B981"
              : aiScore >= 60
                ? "#F59E0B"
                : "#EF4444"
          }
          width={90}
          format={(percent) => (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>{percent}đ</span>
              <span style={{ fontSize: 10, color: "#64748B" }}>Độ phù hợp</span>
            </div>
          )}
        />
        <Title level={4} style={{ margin: "16px 0 4px 0", color: "#0F172A", fontSize: 18 }}>
          {candidateName}
        </Title>
        {showContactInfo && (email || phone) && (
          <Text type="secondary" style={{ display: "block", fontSize: 13, marginBottom: 8 }}>
            {email} {phone ? `| ${phone}` : ""}
          </Text>
        )}
        {(() => {
          const isHighFit = classification === "Phù hợp" || classification === "Phù hợp cao";
          const isWarningFit = classification === "Nên xem xét";
          const color = isHighFit ? "#166534" : isWarningFit ? "#9a3412" : "#991B1B";
          const bg = isHighFit ? "#DCFCE7" : isWarningFit ? "#FFEDD5" : "#FEE2E2";
          const border = isHighFit ? "#BBF7D0" : isWarningFit ? "#FED7AA" : "#FCA5A5";
          return (
            <span
              style={{
                display: "inline-block",
                padding: "4px 12px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: 600,
                color: color,
                backgroundColor: bg,
                border: `1px solid ${border}`,
              }}
            >
              {classification || "Chưa phân loại"}
            </span>
          );
        })()}
      </div>

      <Divider style={{ margin: "16px 0" }} />

      {/* AI Summary Block */}
      <div style={{ marginBottom: 20 }}>
        <Text strong style={{ display: "block", marginBottom: 8, color: "#0F172A", fontSize: 13 }}>
          Nhận xét tổng quan từ AI:
        </Text>
        <p
          style={{
            fontSize: 13,
            lineHeight: 1.6,
            color: "#475569",
            background: "#F8FAFC",
            padding: 12,
            borderRadius: 8,
            borderLeft: "4px solid #2563EB",
            margin: 0,
          }}
        >
          {summaryText}
        </p>
      </div>

      {/* Pros Block */}
      <div style={{ marginBottom: 20 }}>
        <Text strong style={{ display: "block", marginBottom: 8, color: "#10B981", fontSize: 13 }}>
          Ưu điểm nổi bật:
        </Text>
        {pros.length > 0 ? (
          <ul style={{ paddingLeft: 16, margin: 0, fontSize: 13, color: "#475569" }}>
            {pros.map((pro: string, idx: number) => (
              <li key={idx} style={{ marginBottom: 4 }}>{pro}</li>
            ))}
          </ul>
        ) : (
          <Text type="secondary" style={{ fontSize: 13 }}>Không được ghi nhận cụ thể.</Text>
        )}
      </div>

      {/* Cons Block */}
      <div style={{ marginBottom: 20 }}>
        <Text strong style={{ display: "block", marginBottom: 8, color: "#EF4444", fontSize: 13 }}>
          Điểm cần lưu ý / Rủi ro:
        </Text>
        {cons.length > 0 ? (
          <ul style={{ paddingLeft: 16, margin: 0, fontSize: 13, color: "#475569" }}>
            {cons.map((con: string, idx: number) => (
              <li key={idx} style={{ marginBottom: 4 }}>{con}</li>
            ))}
          </ul>
        ) : (
          <Text type="secondary" style={{ fontSize: 13 }}>Không có rủi ro đáng kể.</Text>
        )}
      </div>

      {/* Matched Skills */}
      <div style={{ marginBottom: 20 }}>
        <Text strong style={{ display: "block", marginBottom: 8, color: "#0F172A", fontSize: 13 }}>
          Kỹ năng đáp ứng:
        </Text>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {finalMatched.length > 0 ? (
            finalMatched.map((skill: string) => (
              <span 
                key={skill} 
                style={{ 
                  display: "inline-block",
                  padding: "4px 10px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  backgroundColor: "#F0FDF4",
                  border: "1px solid #BBF7D0",
                  color: "#10B981"
                }}
              >
                {skill}
              </span>
            ))
          ) : (
            <Text type="secondary" style={{ fontSize: 13 }}>Không khớp kỹ năng nào.</Text>
          )}
        </div>
      </div>

      {/* Missing Skills */}
      <div style={{ marginBottom: 20 }}>
        <Text strong style={{ display: "block", marginBottom: 8, color: "#0F172A", fontSize: 13 }}>
          Kỹ năng còn thiếu so với JD:
        </Text>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {finalMissing.length > 0 ? (
            finalMissing.map((skill: string) => (
              <span 
                key={skill} 
                style={{ 
                  display: "inline-block",
                  padding: "4px 10px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  backgroundColor: "#FEF2F2",
                  border: "1px solid #FECACA",
                  color: "#EF4444"
                }}
              >
                {skill}
              </span>
            ))
          ) : (
            <span 
              style={{ 
                display: "inline-block",
                padding: "4px 10px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                backgroundColor: "#EFF6FF",
                border: "1px solid #DBEAFE",
                color: "#2563EB"
              }}
            >
              Đáp ứng đầy đủ JD
            </span>
          )}
        </div>
      </div>

      {/* Questions Block */}
      {questions.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <Text strong style={{ display: "block", marginBottom: 8, color: "#F59E0B", fontSize: 13 }}>
            Gợi ý câu hỏi phỏng vấn:
          </Text>
          <ul style={{ paddingLeft: 16, margin: 0, fontSize: 13, color: "#475569" }}>
            {questions.map((q: string, idx: number) => (
              <li key={idx} style={{ marginBottom: 4 }}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Criteria detail table */}
      {showCriteriaTable && criteriaResults && criteriaResults.length > 0 && (
        <div>
          <Text strong style={{ display: "block", marginBottom: 8, color: "#0F172A", fontSize: 13 }}>
            Điểm số theo tiêu chí:
          </Text>
          <Table
            dataSource={criteriaResults}
            rowKey={(record: any) => record.criterionName || record.criterion_name}
            pagination={false}
            size="small"
            bordered
            columns={[
              {
                title: "Tiêu chí",
                key: "criterionName",
                width: "60%",
                render: (_: any, record: any) =>
                  record.criterionName || record.criterion_name || "Chưa rõ",
              },
              {
                title: "Điểm số",
                key: "score",
                width: "40%",
                render: (_: any, record: any) => (
                  <Text strong>
                    {record.score || 0}/{record.maxScore || record.max_score || 0}
                  </Text>
                ),
              },
            ]}
          />
        </div>
      )}
    </Card>
  );
};
