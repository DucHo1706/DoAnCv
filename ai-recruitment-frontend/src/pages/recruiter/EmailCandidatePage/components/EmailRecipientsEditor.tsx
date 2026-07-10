import { useState } from "react";
import { Modal, Typography, Input, Button, message } from "antd";

const { Text } = Typography;

interface EmailRecipientsEditorProps {
  toEmail: string;
  ccEmail: string;
  onToEmailChange: (email: string) => void;
  onCcEmailChange: (email: string) => void;
  onCancel: () => void;
}

export default function EmailRecipientsEditor({
  toEmail,
  ccEmail,
  onToEmailChange,
  onCcEmailChange,
  onCancel,
}: EmailRecipientsEditorProps) {
  const [localToEmail, setLocalToEmail] = useState(toEmail);
  const [localCcEmail, setLocalCcEmail] = useState(ccEmail);

  const handleSave = () => {
    if (!localToEmail.trim()) {
      message.error("Email người nhận (To) không được để trống.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(localToEmail)) {
      message.error("Email người nhận (To) không đúng định dạng.");
      return;
    }

    if (localCcEmail && !emailRegex.test(localCcEmail)) {
      message.error("Email CC không đúng định dạng.");
      return;
    }

    onToEmailChange(localToEmail.trim());
    onCcEmailChange(localCcEmail.trim());
    onCancel();
  };

  return (
    <Modal
      title="Chỉnh sửa người nhận email"
      open={true}
      onCancel={onCancel}
      footer={[
        <Button key="back" onClick={onCancel}>
          Hủy
        </Button>,
        <Button key="submit" type="primary" onClick={handleSave}>
          Lưu
        </Button>,
      ]}
    >
      <div style={{ marginBottom: 16 }}>
        <Text strong>Gửi tới (To) *</Text>
        <Input
          style={{ marginTop: 8 }}
          placeholder="Nhập email người nhận"
          value={localToEmail}
          onChange={(e) => setLocalToEmail(e.target.value)}
          size="large"
        />
        <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: "block" }}>
          Email người nhận (bắt buộc) - thường là email từ CV
        </Text>
      </div>

      <div>
        <Text strong>Sao chép tới (CC)</Text>
        <Input
          style={{ marginTop: 8 }}
          placeholder="Nhập email CC (tùy chọn)"
          value={localCcEmail}
          onChange={(e) => setLocalCcEmail(e.target.value)}
          size="large"
        />
        <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: "block" }}>
          Email sao chép (tùy chọn) - Là email tài khoản nếu khác với email CV
        </Text>
      </div>
    </Modal>
  );
}
