import React from "react";
import { Modal, Button, Upload, Radio, Space, Tag } from "antd";
import { UploadOutlined, FilePdfOutlined } from "@ant-design/icons";
import type { CvBuilderDocumentSummary } from "../../../services/cvBuilderService";

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
  savedCvs: Array<{ id: string; name: string; isDefault: boolean; createdAt: string }>;
  selectedSavedCvId: string | null;
  setSelectedSavedCvId: (id: string | null) => void;
  builderDocuments: CvBuilderDocumentSummary[];
  selectedBuilderDocumentId: string | null;
  setSelectedBuilderDocumentId: (id: string | null) => void;
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
  savedCvs,
  selectedSavedCvId,
  setSelectedSavedCvId,
  builderDocuments,
  selectedBuilderDocumentId,
  setSelectedBuilderDocumentId,
}) => {
  const selectedMethod = selectedBuilderDocumentId
    ? `builder:${selectedBuilderDocumentId}`
    : selectedSavedCvId ? `saved:${selectedSavedCvId}` : useDefaultCv ? "default" : "new";
  const uploadedCvs = savedCvs.filter((cv) => !cv.isDefault);

  return (
    <Modal
      className="candidate-job-apply-modal"
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

      {(hasDefaultCv || uploadedCvs.length > 0 || builderDocuments.length > 0) ? (
        <div style={{ marginBottom: 20 }}>
          <Radio.Group 
            value={selectedMethod}
            onChange={(e) => {
              const value = String(e.target.value);
              setUseDefaultCv(value === "default");
              setSelectedSavedCvId(value.startsWith("saved:") ? value.slice(6) : null);
              setSelectedBuilderDocumentId(value.startsWith("builder:") ? value.slice(8) : null);
            }}
            style={{ width: "100%" }}
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              {hasDefaultCv && <Radio value="default" style={{ width: "100%" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span>Sử dụng CV mặc định trong hồ sơ</span>
                  <Tag color="blue" style={{ display: "inline-flex", alignItems: "center", gap: 4, margin: 0 }}>
                    <FilePdfOutlined /> {defaultCvName || "CV mẫu"}
                  </Tag>
                </div>
              </Radio>}
              {uploadedCvs.map((cv) => (
                <Radio key={cv.id} value={`saved:${cv.id}`} style={{ width: "100%" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span>CV đã lưu trên hệ thống</span>
                    <Tag style={{ display: "inline-flex", alignItems: "center", gap: 4, margin: 0 }}>
                      <FilePdfOutlined /> {cv.name}
                    </Tag>
                  </div>
                </Radio>
              ))}
              {builderDocuments.map((document) => (
                <Radio key={document.id} value={`builder:${document.id}`} style={{ width: "100%" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span>CV tạo trực tuyến</span>
                    <Tag color="purple" style={{ display: "inline-flex", alignItems: "center", gap: 4, margin: 0 }}>
                      <FilePdfOutlined /> {document.name}{document.isDefault ? " · Mặc định" : ""}
                    </Tag>
                  </div>
                </Radio>
              ))}
              <Radio value="new">Tải lên CV mới từ thiết bị</Radio>
            </Space>
          </Radio.Group>
        </div>
      ) : null}

      {selectedMethod === "new" && (
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
