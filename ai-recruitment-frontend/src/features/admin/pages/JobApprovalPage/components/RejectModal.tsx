import React from "react";
import { Modal, Input, Typography } from "antd";

const { Text } = Typography;

interface RejectModalProps {
  target: any | null;
  reasonText: string;
  rejecting: boolean;
  onReasonChange: (val: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function RejectModal({
  target,
  reasonText,
  rejecting,
  onReasonChange,
  onConfirm,
  onCancel,
}: RejectModalProps) {
  return (
    <Modal
      title="Từ chối tin tuyển dụng"
      open={target !== null}
      onCancel={onCancel}
      onOk={onConfirm}
      okText="Xác nhận từ chối"
      okButtonProps={{ danger: true, loading: rejecting }}
      cancelText="Hủy"
      width={520}
    >
      <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
        Vui lòng nhập lý do từ chối tin <strong>{target?.title}</strong>. Nhà tuyển dụng sẽ nhận được thông báo kèm lý do này.
      </Text>
      <Input.TextArea
        rows={4}
        placeholder="Ví dụ: Mô tả công việc chưa rõ ràng, thiếu thông tin mức lương..."
        value={reasonText}
        onChange={(e) => onReasonChange(e.target.value)}
        maxLength={500}
        showCount
      />
    </Modal>
  );
}
