import { useState } from "react";
import { Card, Typography, Upload, message, Button, Space, Tag } from "antd";
import { InboxOutlined, CloudUploadOutlined, CheckCircleFilled, FilePdfOutlined } from "@ant-design/icons";
import { appTheme } from "../../../../constants/theme";

const { Title, Paragraph, Text } = Typography;
const { Dragger } = Upload;

function UploadCVPage() {
  const [fileList, setFileList] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  const props = {
    name: "file",
    multiple: false,
    accept: ".pdf,.doc,.docx",
    fileList,
    onChange(info: any) {
      const { status } = info.file;
      let newFileList = [...info.fileList];
      
      // Limit to 1 file
      newFileList = newFileList.slice(-1);
      setFileList(newFileList);

      if (status === "done") {
        message.success(`${info.file.name} đã được tải lên thành công.`);
      } else if (status === "error") {
        message.error(`${info.file.name} tải lên thất bại.`);
      }
    },
    beforeUpload(file: any) {
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error("Kích thước file không được vượt quá 10MB!");
        return Upload.LIST_IGNORE;
      }
      return true;
    },
    onRemove() {
      setFileList([]);
    }
  };

  const handleUpload = () => {
    if (fileList.length === 0) return;
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      message.success("Hệ thống đã bắt đầu phân tích CV của bạn. Vui lòng kiểm tra kết quả tại Lịch sử ứng tuyển!");
    }, 1500);
  };

  return (
    <div style={{ background: appTheme.colors.background, minHeight: "100vh", padding: "48px 24px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <Card
          style={{
            borderRadius: 20,
            border: `1px solid ${appTheme.colors.border}`,
            boxShadow: appTheme.shadow.card,
            background: appTheme.colors.surface,
          }}
          bodyStyle={{ padding: "40px" }}
        >
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                background: "rgba(37, 99, 235, 0.06)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: appTheme.colors.primary,
                fontSize: 28,
                marginBottom: 16
              }}
            >
              <CloudUploadOutlined />
            </div>
            <Title level={2} style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 700, color: appTheme.colors.textPrimary }}>
              Tải lên CV cá nhân
            </Title>
            <Paragraph style={{ color: appTheme.colors.textSecondary, fontSize: 14, margin: 0 }}>
              Tải lên hồ sơ của bạn để hệ thống phân tích chuyên sâu các kỹ năng, điểm mạnh và đề xuất cơ hội phù hợp.
            </Paragraph>
          </div>

          <Dragger {...props} style={{ borderRadius: 16, border: "2px dashed #E2E8F0", padding: "24px 16px" }}>
            <p className="ant-upload-drag-icon" style={{ color: appTheme.colors.primary, fontSize: 40, marginBottom: 12 }}>
              <InboxOutlined />
            </p>
            <p className="ant-upload-text" style={{ fontSize: 15, fontWeight: 600, color: appTheme.colors.textPrimary, marginBottom: 4 }}>
              Kéo thả CV của bạn vào đây hoặc click để duyệt file
            </p>
            <p className="ant-upload-hint" style={{ fontSize: 12, color: appTheme.colors.textSecondary }}>
              Hỗ trợ định dạng PDF, DOC, DOCX. Dung lượng tối đa 10MB.
            </p>
          </Dragger>

          {fileList.length > 0 && (
            <div style={{ marginTop: 24, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16 }}>
              <Space style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Space>
                  <FilePdfOutlined style={{ fontSize: 20, color: "#EF4444" }} />
                  <div>
                    <Text strong style={{ display: "block", fontSize: 14 }}>{fileList[0].name}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{(fileList[0].size / 1024 / 1024).toFixed(2)} MB</Text>
                  </div>
                </Space>
                <Tag color="success" icon={<CheckCircleFilled />} style={{ borderRadius: 4 }}>Đã chọn</Tag>
              </Space>
            </div>
          )}

          <div style={{ marginTop: 32, textAlign: "right" }}>
            <Button
              type="primary"
              size="large"
              loading={uploading}
              disabled={fileList.length === 0}
              onClick={handleUpload}
              style={{
                borderRadius: 10,
                background: fileList.length === 0 ? undefined : appTheme.colors.primary,
                borderColor: fileList.length === 0 ? undefined : appTheme.colors.primary,
                fontWeight: 600,
                height: 44,
                padding: "0 32px"
              }}
            >
              Phân tích CV
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default UploadCVPage;
