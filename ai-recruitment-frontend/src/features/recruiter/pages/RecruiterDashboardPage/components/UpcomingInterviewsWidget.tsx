import { Card, Typography, List, Tag, Space, Button } from "antd";
import { CalendarOutlined, ClockCircleOutlined, VideoCameraOutlined, EnvironmentOutlined, RightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { appTheme } from "../../../../../constants/theme";

const { Text } = Typography;

interface UpcomingInterviewItem {
  scheduleId: string;
  candidateName: string;
  jobTitle: string;
  interviewDate: string;
  format: string;
  locationOrLink: string;
  notes?: string;
}

interface UpcomingInterviewsWidgetProps {
  interviews?: UpcomingInterviewItem[];
}

export default function UpcomingInterviewsWidget({ interviews = [] }: UpcomingInterviewsWidgetProps) {
  const navigate = useNavigate();

  return (
    <Card
      title={
        <Space align="center">
          <CalendarOutlined style={{ color: "#2563EB" }} />
          <span style={{ fontSize: 15, fontWeight: 600, color: "#0F172A" }}>
            Lịch phỏng vấn sắp diễn ra
          </span>
        </Space>
      }
      extra={
        <Button
          type="link"
          size="small"
          onClick={() => navigate("/recruiter/schedules")}
          style={{ padding: 0, fontWeight: 500 }}
        >
          Xem lịch tuần <RightOutlined style={{ fontSize: 10 }} />
        </Button>
      }
      style={{
        borderRadius: 16,
        boxShadow: appTheme.shadow.card,
        border: `1px solid ${appTheme.colors.border}`,
        height: "100%",
      }}
      bodyStyle={{ padding: "12px 20px" }}
    >
      {interviews.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 0", color: "#94A3B8" }}>
          <CalendarOutlined style={{ fontSize: 32, marginBottom: 8, opacity: 0.4 }} />
          <div style={{ fontSize: 13 }}>Không có lịch phỏng vấn nào sắp tới</div>
        </div>
      ) : (
        <List
          dataSource={interviews}
          renderItem={(item) => {
            const dateObj = new Date(item.interviewDate);
            const timeStr = dateObj.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
            const dateStr = dateObj.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });

            return (
              <List.Item
                style={{
                  padding: "12px 0",
                  borderBottom: "1px solid #F1F5F9",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <Text strong style={{ fontSize: 14, color: "#0F172A", display: "block" }}>
                      {item.candidateName}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12, color: "#64748B" }}>
                      {item.jobTitle}
                    </Text>
                  </div>

                  <Space size="small" style={{ flexShrink: 0, marginLeft: 12 }}>
                    <Tag
                      color="blue"
                      icon={<ClockCircleOutlined />}
                      style={{ borderRadius: 8, fontWeight: 600, margin: 0 }}
                    >
                      {timeStr} ({dateStr})
                    </Tag>
                    <Tag
                      color={item.format === "Online" ? "purple" : "cyan"}
                      icon={item.format === "Online" ? <VideoCameraOutlined /> : <EnvironmentOutlined />}
                      style={{ borderRadius: 8, margin: 0 }}
                    >
                      {item.format}
                    </Tag>
                  </Space>
                </div>
              </List.Item>
            );
          }}
        />
      )}
    </Card>
  );
}
