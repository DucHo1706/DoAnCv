import React, { useState } from "react";
import { Modal, Upload, Button, Typography, Space, Spin, Alert } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

interface CvAiPreviewModalProps {
  open: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  jobDescription: string;
  companyName?: string;
}

const PYTHON_AI_URL = "http://127.0.0.1:8000";

export default function CvAiPreviewModal({
  open,
  onClose,
  jobId,
  jobTitle,
  jobDescription,
  companyName = "AI Recruitment",
}: CvAiPreviewModalProps) {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingSteps = [
    "Đang đọc và trích xuất nội dung CV...",
    "AI đang đối chiếu với yêu cầu công việc...",
    "Phân tích điểm mạnh, điểm yếu...",
    "Tạo gợi ý tối ưu CV...",
    "Hoàn thiện báo cáo phân tích...",
  ];

  const handleClose = () => {
    if (analyzing) return;
    setFile(null);
    setError(null);
    setLoadingStep(0);
    onClose();
  };

  const beforeUpload = (uploadFile: any) => {
    const name = uploadFile.name?.toLowerCase() || "";
    const isValidType =
      uploadFile.type === "application/pdf" ||
      uploadFile.type === "application/msword" ||
      uploadFile.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      uploadFile.type.startsWith("image/") ||
      name.endsWith(".pdf") ||
      name.endsWith(".doc") ||
      name.endsWith(".docx") ||
      name.endsWith(".png") ||
      name.endsWith(".jpg") ||
      name.endsWith(".jpeg");

    if (!isValidType) {
      setError("Vui lòng chọn đúng file CV (hỗ trợ PDF, DOC, DOCX, PNG, JPG, JPEG).");
      return false;
    }
    if (uploadFile.size / 1024 / 1024 >= 10) {
      setError("File không được vượt quá 10MB.");
      return false;
    }
    setFile(uploadFile);
    setError(null);
    return false;
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError("Vui lòng chọn file CV trước khi phân tích.");
      return;
    }
    handleClose();
    navigate(`/jobs/${jobId}/cv-analysis`, {
      state: {
        file,
        jobTitle,
        companyName,
        jobDescription,
        triggerAnalysis: true,
      },
    });
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      centered
      width={560}
      closable={true}
      maskClosable={true}
      bodyStyle={{ padding: "32px 32px 24px" }}
    >
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, color: "#1e1b4b" }}>
          AI Phân tích CV trước khi nộp
        </Title>
        <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0, fontSize: 14 }}>
          Tải CV lên để AI phân tích điểm mạnh, điểm yếu và mức độ phù hợp so với vị trí{" "}
          <strong style={{ color: "#6366f1" }}>{jobTitle}</strong>
        </Paragraph>
      </div>

      <>
        <Dragger
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          beforeUpload={beforeUpload}
          fileList={file ? [{ uid: "1", name: file.name, status: "done" as const }] : []}
          onRemove={() => setFile(null)}
          showUploadList={file ? { showRemoveIcon: true, removeIcon: <CloseOutlined /> } : false}
          style={{
            borderRadius: 12,
            border: file ? "2px solid #6366f1" : "2px dashed #d1d5db",
            background: file ? "#f5f3ff" : "#fafafa",
            padding: "20px 0",
          }}
        >
          <p
            className="ant-upload-text"
            style={{
              fontSize: 15,
              color: file ? "#6366f1" : "#374151",
              fontWeight: file ? 600 : 400,
              margin: 0,
            }}
          >
            {file ? file.name : "Kéo thả hoặc click để chọn file CV"}
          </p>
          <p
            className="ant-upload-hint"
            style={{ color: "#9ca3af", marginTop: 8, marginBottom: 0 }}
          >
            Hỗ trợ PDF, DOC, DOCX, PNG, JPG, JPEG · Tối đa 10MB
          </p>
        </Dragger>
        {error && (
          <Alert type="error" message={error} style={{ marginTop: 12, borderRadius: 8 }} showIcon />
        )}
        <div style={{ height: 16 }} />
        <Space style={{ width: "100%", justifyContent: "flex-end" }} size={12}>
          <Button onClick={handleClose} size="large">
            Hủy
          </Button>
          <Button
            type="primary"
            size="large"
            onClick={handleAnalyze}
            disabled={!file}
            style={{
              background: file ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" : undefined,
              border: "none",
              fontWeight: 600,
              paddingInline: 28,
            }}
          >
            Phân tích CV với AI
          </Button>
        </Space>
      </>
    </Modal>
  );
}
