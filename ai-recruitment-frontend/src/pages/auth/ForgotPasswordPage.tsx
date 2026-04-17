import { MailOutlined, SendOutlined } from "@ant-design/icons";
import { Button, Form, Input, Typography, message } from "antd";
import { useNavigate } from "react-router-dom";

const { Title, Paragraph, Text } = Typography;

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const handleSubmit = () => {
    messageApi.success("Đã gửi yêu cầu khôi phục mật khẩu (demo).");
  };

  return (
    <>
      {contextHolder}

      <div>
        <Text
          style={{
            color: "#2563EB",
            fontWeight: 600,
            fontSize: 14,
            display: "block",
            marginBottom: 8,
          }}
        >
          Password recovery
        </Text>

        <Title level={2} style={{ marginBottom: 8 }}>
          Quên mật khẩu
        </Title>

        <Paragraph type="secondary" style={{ marginBottom: 28, lineHeight: 1.7 }}>
          Nhập email đã đăng ký, hệ thống sẽ gửi hướng dẫn khôi phục mật khẩu.
        </Paragraph>

        <Form layout="vertical" onFinish={handleSubmit} requiredMark={false}>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { type: "email", message: "Email không đúng định dạng" },
            ]}
          >
            <Input
              size="large"
              prefix={<MailOutlined style={{ color: "#94A3B8" }} />}
              placeholder="Nhập email của bạn"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button type="primary" htmlType="submit" block size="large">
              Gửi yêu cầu <SendOutlined />
            </Button>
          </Form.Item>

          <Button block size="large" onClick={() => navigate("/login")}>
            Quay lại đăng nhập
          </Button>
        </Form>

        <Paragraph
          type="secondary"
          style={{
            marginTop: 24,
            marginBottom: 0,
            textAlign: "center",
            fontSize: 13,
          }}
        >
          Đây là luồng giao diện demo, chưa kết nối chức năng gửi mail thực tế.
        </Paragraph>
      </div>
    </>
  );
}

export default ForgotPasswordPage;