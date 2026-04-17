import { InboxOutlined } from "@ant-design/icons";
import { Typography, Upload } from "antd";

const { Dragger } = Upload;
const { Paragraph } = Typography;

function UploadBox() {
  return (
    <Dragger
      multiple={false}
      beforeUpload={() => false}
      style={{
        padding: 16,
        borderRadius: 16,
        background: "#FFFFFF",
      }}
    >
      <p className="ant-upload-drag-icon">
        <InboxOutlined style={{ color: "#2563EB" }} />
      </p>
      <p className="ant-upload-text">Nhấn hoặc kéo thả file vào đây để tải lên</p>
      <Paragraph type="secondary" style={{ marginBottom: 0 }}>
        Hỗ trợ PDF, DOC, DOCX. Đây là upload giả lập cho giao diện base.
      </Paragraph>
    </Dragger>
  );
}

export default UploadBox;