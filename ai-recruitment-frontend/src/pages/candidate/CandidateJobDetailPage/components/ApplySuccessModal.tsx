import React from "react";
import { Modal, Typography, Space, Button } from "antd";
import { TrophyOutlined, BarChartOutlined, ArrowRightOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

interface ApplySuccessModalProps {
  open: boolean;
  onCancel: () => void;
  onGoToAiEvaluation: () => void;
}

const ApplySuccessModal: React.FC<ApplySuccessModalProps> = ({
  open,
  onCancel,
  onGoToAiEvaluation,
}) => {
  return (
    <Modal open={open} onCancel={onCancel} footer={null} centered width={520}>
      <div style={{ textAlign: "center", padding: "16px 8px 4px" }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 18px",
          }}
        >
          <TrophyOutlined style={{ fontSize: 34, color: "#22c55e" }} />
        </div>

        <Title level={4} style={{ marginBottom: 8 }}>
          Hồ sơ của bạn đã được gửi thành công!
        </Title>

        <Text type="secondary">
          Chúc mừng! Tuyển Dụng AI đã nhận được CV của bạn và sẽ gửi đến nhà tuyển dụng sớm nhất.
        </Text>

        <div
          style={{
            marginTop: 24,
            padding: 18,
            border: "1px solid #dbeafe",
            background: "#f8fbff",
            borderRadius: 12,
            textAlign: "left",
          }}
        >
          <Space align="start">
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "#eff6ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#2563eb",
                flexShrink: 0,
              }}
            >
              <BarChartOutlined />
            </div>

            <div>
              <Text strong>Cải thiện CV với AI Insights</Text>

              <div style={{ marginTop: 4 }}>
                <Text type="secondary">Xem phân tích chi tiết mức độ phù hợp của bạn.</Text>
              </div>

              <div style={{ marginTop: 14 }}>
                <Text type="secondary">
                  Hệ thống AI đang phân tích CV của bạn dựa trên tiêu chí tuyển dụng. Kết quả sẽ
                  sẵn sàng sau vài giây.
                </Text>
              </div>

              <div
                style={{
                  marginTop: 16,
                  padding: 14,
                  border: "1px dashed #d9e3f0",
                  borderRadius: 10,
                  background: "#ffffff",
                }}
              >
                <Text type="secondary">Đang đọc CV và đối chiếu kỹ năng...</Text>

                <div
                  style={{
                    height: 6,
                    background: "#e5e7eb",
                    borderRadius: 999,
                    marginTop: 12,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: "58%",
                      height: "100%",
                      background: "#2563eb",
                      borderRadius: 999,
                    }}
                  />
                </div>

                <Space style={{ marginTop: 12 }}>
                  <Text
                    style={{
                      background: "#ecfdf5",
                      color: "#16a34a",
                      padding: "2px 8px",
                      borderRadius: 999,
                      fontSize: 12,
                    }}
                  >
                    Điểm mạnh
                  </Text>

                  <Text
                    style={{
                      background: "#eff6ff",
                      color: "#2563eb",
                      padding: "2px 8px",
                      borderRadius: 999,
                      fontSize: 12,
                    }}
                  >
                    Kỹ năng phù hợp
                  </Text>
                </Space>
              </div>
            </div>
          </Space>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            marginTop: 24,
          }}
        >
          <Button onClick={onCancel}>Đóng</Button>

          <Button type="primary" icon={<ArrowRightOutlined />} onClick={onGoToAiEvaluation}>
            Xem AI đánh giá
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ApplySuccessModal;
