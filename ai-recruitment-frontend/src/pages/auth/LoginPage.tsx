import {
  LockOutlined,
  MailOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { Button, Checkbox, Form, Input, Typography } from "antd";
import { useNavigate } from "react-router-dom";

const { Title, Paragraph, Link, Text } = Typography;

function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate("/recruiter/dashboard");
  };

  return (
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
        Welcome back
      </Text>

      <Title level={2} style={{ marginBottom: 8 }}>
        Đăng nhập
      </Title>

      <Paragraph type="secondary" style={{ marginBottom: 28, lineHeight: 1.7 }}>
        Nhập thông tin tài khoản để truy cập hệ thống tuyển dụng AI.
      </Paragraph>

      <Form layout="vertical" onFinish={handleLogin} requiredMark={false}>
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
            placeholder="example@email.com"
          />
        </Form.Item>

        <Form.Item
          label="Mật khẩu"
          name="password"
          rules={[
            { required: true, message: "Vui lòng nhập mật khẩu" },
            { min: 6, message: "Mật khẩu tối thiểu 6 ký tự" },
          ]}
        >
          <Input.Password
            size="large"
            prefix={<LockOutlined style={{ color: "#94A3B8" }} />}
            placeholder="Nhập mật khẩu"
          />
        </Form.Item>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox>Ghi nhớ đăng nhập</Checkbox>
          </Form.Item>

          <Link onClick={() => navigate("/forgot-password")}>
            Quên mật khẩu?
          </Link>
        </div>

        <Form.Item style={{ marginBottom: 16 }}>
          <Button type="primary" htmlType="submit" block size="large">
            Đăng nhập
          </Button>
        </Form.Item>

        <Button block size="large" onClick={() => navigate("/register")}>
          Tạo tài khoản mới <RightOutlined />
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
        Giao diện demo chưa kết nối API, nút đăng nhập sẽ chuyển sang dashboard
        để test luồng UI.
      </Paragraph>
    </div>
  );
}

export default LoginPage;