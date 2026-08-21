import React from "react";
import { Modal, Typography, Button } from "antd";
import { TrophyOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

interface ApplySuccessModalProps {
  open: boolean;
  onCancel: () => void;
  onContinueBrowsing: () => void;
}

const ApplySuccessModal: React.FC<ApplySuccessModalProps> = ({
  open,
  onCancel,
  onContinueBrowsing,
}) => {
  return (
    <Modal open={open} onCancel={onCancel} footer={null} centered width={520}>
      <div style={{ textAlign: "center", padding: "24px 8px 12px" }}>
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

        <Title level={4} style={{ marginBottom: 12 }}>
          Hồ sơ của bạn đã được gửi thành công!
        </Title>

        <Text type="secondary" style={{ fontSize: "15px", display: "block", marginBottom: 32 }}>
          Hồ sơ đã được ghi nhận. AI sẽ tiếp tục phân tích trong nền; bạn có thể ứng tuyển công việc khác ngay mà không cần chờ kết quả.
        </Text>

        <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <Button size="large" onClick={onCancel} style={{ borderRadius: 8 }}>
            Ở lại trang này
          </Button>
          <Button type="primary" size="large" onClick={onContinueBrowsing} style={{ borderRadius: 8, background: "#2563EB" }}>
            Tiếp tục tìm việc
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ApplySuccessModal;
