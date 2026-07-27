import React from "react";
import { Modal, Typography, Button } from "antd";
import { TrophyOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

interface ApplySuccessModalProps {
  open: boolean;
  onCancel: () => void;
}

const ApplySuccessModal: React.FC<ApplySuccessModalProps> = ({
  open,
  onCancel,
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
          Chúc mừng! Tuyển Dụng AI đã nhận được CV của bạn và sẽ gửi đến nhà tuyển dụng xem xét trong thời gian sớm nhất.
        </Text>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <Button type="primary" size="large" onClick={onCancel} style={{ padding: "0 40px", borderRadius: 8 }}>
            Xác nhận & Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ApplySuccessModal;
