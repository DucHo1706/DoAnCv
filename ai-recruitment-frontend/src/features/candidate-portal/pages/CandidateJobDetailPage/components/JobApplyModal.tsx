import React from "react";
import { Modal, Button, Upload, Radio, Space, Tag } from "antd";
import { UploadOutlined, FilePdfOutlined } from "@ant-design/icons";

interface JobApplyModalProps {
  open: boolean;
  title: string;
  onOk: () => void;
  onCancel: () => void;
  confirmLoading: boolean;
  uploadProps: any;
  hasDefaultCv: boolean;
  defaultCvName: string | null;
  useDefaultCv: boolean;
  setUseDefaultCv: (val: boolean) => void;
}

const JobApplyModal: React.FC<JobApplyModalProps> = ({
  open,
  title,
  onOk,
  onCancel,
  confirmLoading,
  uploadProps,
  hasDefaultCv,
  defaultCvName,
  useDefaultCv,
  setUseDefaultCv,
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
      width={500}
    >
      <div style={{ marginBottom: 20, color: "#64748b", fontSize: "14px" }}>
        Vui lòng chọn phương thức nộp CV của bạn. Hệ thống sẽ phân tích CV để đánh giá độ phù hợp với tin tuyển dụng này.
      </div>

      {hasDefaultCv ? (
        <div style={{ marginBottom: 20 }}>
          <Radio.Group 
            value={useDefaultCv ? "default" : "new"} 
            onChange={(e) => setUseDefaultCv(e.target.value === "default")}
            style={{ width: "100%" }}
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              <Radio value="default" style={{ width: "100%" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span>Sử dụng CV mặc định trong hồ sơ</span>
                  <Tag color="blue" style={{ display: "inline-flex", alignItems: "center", gap: 4, margin: 0 }}>
                    <FilePdfOutlined /> {defaultCvName || "CV mẫu"}
                  </Tag>
                </div>
              </Radio>
              <Radio value="new">Tải lên CV mới từ thiết bị</Radio>
            </Space>
          </Radio.Group>
        </div>
      ) : null}

      {(!hasDefaultCv || !useDefaultCv) && (
        <div style={{ padding: "16px 20px", background: "#f8fafc", borderRadius: 12, border: "1px dashed #cbd5e1" }}>
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />} type="primary" ghost>Chọn file CV của bạn</Button>
          </Upload>
          <div style={{ marginTop: 8, color: "#94a3b8", fontSize: "12px" }}>
            Hỗ trợ PDF, DOCX, PNG, JPG, WEBP; dung lượng tối đa 10MB
          </div>
        </div>
      )}
    </Modal>
  );
};

export default JobApplyModal;
