import {
  LockOutlined,
  MailOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Form, Input, Typography, message } from "antd";
import { useNavigate } from "react-router-dom";

const { Title, Paragraph, Link, Text } = Typography;

function RegisterPage() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const handleRegister = () => {
    messageApi.success("Đăng ký thành công (demo). Vui lòng đăng nhập.");
    navigate("/login");
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
          Create account
        </Text>

        <Title level={2} style={{ marginBottom: 8 }}>
          Đăng ký tài khoản
        </Title>

        <Paragraph type="secondary" style={{ marginBottom: 28, lineHeight: 1.7 }}>
          Tạo tài khoản mới để bắt đầu trải nghiệm hệ thống tuyển dụng AI.
        </Paragraph>

        <Form layout="vertical" onFinish={handleRegister} requiredMark={false}>
          <Form.Item
            label="Họ và tên"
            name="fullName"
            rules={[
              { required: true, message: "Vui lòng nhập họ và tên" },
              { min: 3, message: "Họ và tên tối thiểu 3 ký tự" },
            ]}
          >
            <Input
              size="large"
              prefix={<UserOutlined style={{ color: "#94A3B8" }} />}
              placeholder="Nhập họ và tên"
            />
          </Form.Item>

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
              placeholder="Nhập email"
            />
          </Form.Item>

          <Form.Item
            label="Vai trò"
            name="role"
            rules={[{ required: true, message: "Vui lòng nhập vai trò" }]}
          >
            <Input
              size="large"
              prefix={<TeamOutlined style={{ color: "#94A3B8" }} />}
              placeholder="Ví dụ: Candidate / Recruiter"
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

          <Form.Item
            label="Xác nhận mật khẩu"
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Vui lòng xác nhận mật khẩu" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Mật khẩu xác nhận không khớp"),
                  );
                },
              }),
            ]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined style={{ color: "#94A3B8" }} />}
              placeholder="Nhập lại mật khẩu"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button type="primary" htmlType="submit" block size="large">
              Đăng ký
            </Button>
          </Form.Item>
        </Form>

        <Paragraph style={{ marginBottom: 0, textAlign: "center" }}>
          Đã có tài khoản?{" "}
          <Link onClick={() => navigate("/login")}>Đăng nhập ngay</Link>
        </Paragraph>
      </div>
    </>
  );
}

export default RegisterPage;