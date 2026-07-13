import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { Button, Form, Input, Typography, message } from "antd";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import { useState } from "react";

const { Title, Paragraph, Link, Text } = Typography;

function LoginPage() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values: any) => {
    setLoading(true);
    try {
      const response = await authService.login(values);
      messageApi.success("Đăng nhập thành công! Đang chuyển vào hệ thống...");

      const queryParams = new URLSearchParams(window.location.search);
      const redirectUrl = queryParams.get("redirect");

      // Kiểm tra Vai trò (Role) do Backend trả về để điều hướng cho đúng
      if (response.role === "Admin") {
        navigate(redirectUrl || "/admin/dashboard");
      } else if (response.role === "Recruiter") {
        navigate(redirectUrl || "/recruiter/dashboard");
      } else {
        navigate(redirectUrl || "/"); // Trở về trang chủ nếu là Candidate
      }
    } catch (error: any) {
      console.error("Lỗi đăng nhập:", error);
      messageApi.error(
        error.response?.data?.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại."
      );
    } finally {
      setLoading(false);
    }
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
          Welcome back
        </Text>

        <Title level={2} style={{ marginBottom: 8 }}>
          Đăng nhập hệ thống
        </Title>

        <Paragraph type="secondary" style={{ marginBottom: 28, lineHeight: 1.7 }}>
          Nhập email và mật khẩu của bạn để truy cập vào hệ thống quản trị tuyển dụng.
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
              placeholder="admin@recruitment.com"
            />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined style={{ color: "#94A3B8" }} />}
              placeholder="********"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button type="primary" htmlType="submit" block size="large" loading={loading} style={{ background: "#2563EB", borderColor: "#2563EB" }}>
              Đăng nhập
            </Button>
          </Form.Item>

          <Button
            block
            size="large"
            type="link"
            onClick={() => navigate("/forgot-password")}
            style={{ marginBottom: 8, color: "#2563EB" }}
          >
            Quên mật khẩu?
          </Button>
        </Form>

        <Paragraph style={{ marginTop: 24, marginBottom: 0, textAlign: "center" }}>
          Chưa có tài khoản? <Link onClick={() => navigate("/register")} style={{ color: "#2563EB" }}>Đăng ký ngay</Link>
        </Paragraph>
      </div>
    </>
  );
}

export default LoginPage;
