import { useState } from "react";
import { MailOutlined, SendOutlined, LockOutlined, SafetyCertificateOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Form, Input, Typography, message } from "antd";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../../services/axiosClient";

const { Title, Paragraph, Text } = Typography;

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Reset with OTP
  const [email, setEmail] = useState("");

  const handleRequestOtp = async (values: { email: string }) => {
    setLoading(true);
    try {
      await axiosClient.post("/auth/forgot-password", { email: values.email });
      setEmail(values.email);
      messageApi.success("Mã xác thực OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư!");
      setStep(2);
    } catch (error: any) {
      console.error("Lỗi gửi OTP:", error);
      const errMsg = error.response?.data?.message || error.response?.data || "Không tìm thấy tài khoản với email này.";
      messageApi.error(typeof errMsg === "string" ? errMsg : "Yêu cầu khôi phục mật khẩu thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (values: any) => {
    if (values.newPassword !== values.confirmPassword) {
      messageApi.error("Mật khẩu xác nhận không trùng khớp!");
      return;
    }
    if (values.newPassword.length < 6) {
      messageApi.error("Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }

    setLoading(true);
    try {
      await axiosClient.post("/auth/reset-password", {
        email: email,
        otp: values.otp,
        newPassword: values.newPassword,
      });
      messageApi.success("Khôi phục mật khẩu thành công! Đang chuyển hướng về trang đăng nhập...");
      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (error: any) {
      console.error("Lỗi reset password:", error);
      const errMsg = error.response?.data?.message || error.response?.data || "Mã xác thực OTP không chính xác hoặc đã hết hạn.";
      messageApi.error(typeof errMsg === "string" ? errMsg : "Khôi phục mật khẩu thất bại.");
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
          Password Recovery
        </Text>

        <Title level={2} style={{ marginBottom: 8 }}>
          {step === 1 ? "Quên mật khẩu" : "Đặt lại mật khẩu"}
        </Title>

        <Paragraph type="secondary" style={{ marginBottom: 28, lineHeight: 1.7 }}>
          {step === 1
            ? "Nhập email tài khoản của bạn. Hệ thống tuyển dụng AI sẽ gửi mã OTP xác thực khôi phục mật khẩu."
            : `Nhập mã OTP 6 chữ số đã được gửi đến email ${email} và mật khẩu mới của bạn.`}
        </Paragraph>

        {step === 1 ? (
          <Form layout="vertical" onFinish={handleRequestOtp} requiredMark={false}>
            <Form.Item
              label="Địa chỉ Email"
              name="email"
              rules={[
                { required: true, message: "Vui lòng nhập email" },
                { type: "email", message: "Email không đúng định dạng" },
              ]}
            >
              <Input
                size="large"
                prefix={<MailOutlined style={{ color: "#94A3B8" }} />}
                placeholder="email@example.com"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
                style={{ background: "#2563EB", borderColor: "#2563EB", borderRadius: 8 }}
              >
                Gửi mã xác nhận OTP <SendOutlined style={{ marginLeft: 6 }} />
              </Button>
            </Form.Item>

            <Button
              block
              size="large"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/login")}
              style={{ borderRadius: 8 }}
            >
              Quay lại đăng nhập
            </Button>
          </Form>
        ) : (
          <Form layout="vertical" onFinish={handleResetPassword} requiredMark={false}>
            <Form.Item
              label="Mã xác thực OTP (6 chữ số)"
              name="otp"
              rules={[
                { required: true, message: "Vui lòng nhập mã OTP" },
                { len: 6, message: "Mã OTP phải có đúng 6 chữ số" },
              ]}
            >
              <Input
                size="large"
                prefix={<SafetyCertificateOutlined style={{ color: "#94A3B8" }} />}
                placeholder="123456"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item
              label="Mật khẩu mới"
              name="newPassword"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu mới" },
                { min: 6, message: "Mật khẩu mới phải có tối thiểu 6 ký tự" },
              ]}
            >
              <Input.Password
                size="large"
                prefix={<LockOutlined style={{ color: "#94A3B8" }} />}
                placeholder="Mật khẩu mới"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item
              label="Xác nhận mật khẩu mới"
              name="confirmPassword"
              rules={[{ required: true, message: "Vui lòng xác nhận mật khẩu mới" }]}
            >
              <Input.Password
                size="large"
                prefix={<LockOutlined style={{ color: "#94A3B8" }} />}
                placeholder="Nhập lại mật khẩu mới"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
                style={{ background: "#2563EB", borderColor: "#2563EB", borderRadius: 8 }}
              >
                Cập nhật mật khẩu mới
              </Button>
            </Form.Item>

            <Button
              block
              size="large"
              onClick={() => setStep(1)}
              style={{ borderRadius: 8 }}
            >
              Quay lại bước trước
            </Button>
          </Form>
        )}
      </div>
    </>
  );
}

export default ForgotPasswordPage;
