import React from "react";
import { Modal, Button, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";

interface JobApplyModalProps {
  open: boolean;
  title: string;
  onOk: () => void;
  onCancel: () => void;
  confirmLoading: boolean;
  uploadProps: any;
}

const JobApplyModal: React.FC<JobApplyModalProps> = ({
  open,
  title,
  onOk,
  onCancel,
  confirmLoading,
  uploadProps,
}) => {
  return (
    <Modal
      title={`Ứng tuyển vị trí: ${title}`}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      okText="Nộp hồ sơ"
      cancelText="Hủy"
    >
      <div style={{ marginBottom: 16, color: "#64748b", fontSize: "14px" }}>
        Vui lòng tải lên CV của bạn (định dạng PDF, DOC, DOCX, PNG, JPG, JPEG). AI sẽ tự động
        phân tích và gửi đến nhà tuyển dụng.
      </div>
      <Upload {...uploadProps}>
        <Button icon={<UploadOutlined />}>Chọn file CV của bạn</Button>
      </Upload>
    </Modal>
  );
};

export default JobApplyModal;
