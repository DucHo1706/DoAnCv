import React, { useState } from "react";
import { Card, Row, Col, Button, Upload, Typography, Tag, Modal } from "antd";
import { FilePdfOutlined, InboxOutlined, CheckCircleOutlined, EyeOutlined } from "@ant-design/icons";

const { Text } = Typography;
const { Dragger } = Upload;

interface DefaultCvTabProps {
  defaultCvUrl?: string;
  defaultCvName?: string;
  onRemove: () => void;
  onUpload: (info: any) => void;
}

export const DefaultCvTab: React.FC<DefaultCvTabProps> = ({
  defaultCvUrl,
  defaultCvName,
  onRemove,
  onUpload,
}) => {
  const [previewVisible, setPreviewVisible] = useState(false);

  return (
    <div style={{ marginTop: 16 }}>
      <Row gutter={[24, 24]}>
        {/* Left Side: Current CV Template */}
        <Col xs={24} md={12}>
          <Text strong style={{ fontSize: 15, display: "block", marginBottom: 12 }}>
            CV Mẫu Mặc Định Hiện Tại
          </Text>
          {defaultCvUrl ? (
            <Card
              style={{
                background: "rgba(255, 255, 255, 0.9)",
                border: "1px solid #E2E8F0",
                borderRadius: 12,
                boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
                height: "180px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
              bodyStyle={{ padding: 20, display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between", width: "100%" }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div
                  style={{
                    background: "#FEF2F2",
                    width: 44,
                    height: 44,
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid #FEE2E2",
                  }}
                >
                  <FilePdfOutlined style={{ fontSize: 24, color: "#EF4444" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text strong style={{ fontSize: 15, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {defaultCvName || "CV_MacDinh.pdf"}
                  </Text>
                  <Tag color="success" style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <CheckCircleOutlined /> Đang kích hoạt
                  </Tag>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
                <Button
                  type="primary"
                  ghost
                  icon={<EyeOutlined />}
                  onClick={() => setPreviewVisible(true)}
                  style={{ borderRadius: 8 }}
                >
                  Xem nhanh
                </Button>
                <Button
                  danger
                  onClick={onRemove}
                  style={{ borderRadius: 8 }}
                >
                  Gỡ bỏ
                </Button>
              </div>
            </Card>
          ) : (
            <Card
              style={{
                background: "#F8FAFC",
                border: "1px dashed #CBD5E1",
                borderRadius: 12,
                height: "180px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center"
              }}
              bodyStyle={{ padding: 20 }}
            >
              <div>
                <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>Chưa có cấu hình CV mẫu</Text>
                <Text type="secondary" style={{ fontSize: 13 }}>Hãy tải lên CV mới ở khung bên phải để kích hoạt.</Text>
              </div>
            </Card>
          )}
        </Col>

        {/* Right Side: Upload / Replace Dragger */}
        <Col xs={24} md={12}>
          <Text strong style={{ fontSize: 15, display: "block", marginBottom: 12 }}>
            {defaultCvUrl ? "Thay Thế Bằng CV Mới" : "Tải Lên CV Mẫu Đầu Tiên"}
          </Text>
          <Dragger
            showUploadList={false}
            beforeUpload={() => false}
            onChange={onUpload}
            accept=".pdf,.doc,.docx"
            style={{ borderRadius: 12, border: "2px dashed #CBD5E1", background: "#F8FAFC", height: "180px", padding: "16px 24px" }}
          >
            <p className="ant-upload-drag-icon" style={{ marginBottom: 8 }}>
              <InboxOutlined style={{ color: "#2563EB", fontSize: 28 }} />
            </p>
            <p className="ant-upload-text" style={{ fontSize: 13, fontWeight: 500, margin: "0 0 4px" }}>
              Click để chọn file hoặc kéo thả vào đây
            </p>
            <p className="ant-upload-hint" style={{ fontSize: 11, color: "#94A3B8" }}>
              Hỗ trợ PDF, DOC, DOCX dưới 10MB
            </p>
          </Dragger>
        </Col>
      </Row>

      {/* PDF Inline Preview Modal */}
      {defaultCvUrl && (
        <Modal
          title={<span style={{ fontWeight: 600 }}>Xem nhanh CV Mẫu</span>}
          open={previewVisible}
          onCancel={() => setPreviewVisible(false)}
          footer={null}
          width={900}
          bodyStyle={{ padding: 0 }}
          style={{ top: 30 }}
          destroyOnClose
        >
          <iframe
            src={defaultCvUrl}
            title="CV Preview"
            width="100%"
            height="700px"
            style={{ border: "none", borderRadius: "0 0 8px 8px" }}
          />
        </Modal>
      )}
    </div>
  );
};
