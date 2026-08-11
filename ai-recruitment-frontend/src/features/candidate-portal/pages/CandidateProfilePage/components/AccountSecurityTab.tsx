import React, { useState, useEffect } from "react";
import { Form, Input, Row, Col, Button, Space, Card, message, Progress, Alert } from "antd";
import { 
  LockOutlined, 
  UnlockOutlined, 
  KeyOutlined,
  SafetyCertificateOutlined,
  ArrowLeftOutlined,
  MailOutlined
} from "@ant-design/icons";
import axiosClient from "../../../../../services/axiosClient";
import { authService } from "../../../../../services/authService";

export const AccountSecurityTab: React.FC = () => {
  const [step, setStep] = useState(1); // 1: Normal Change Password, 2: Reset with OTP
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  
  // OTP Reset Flow states
  const [otpValue, setOtpValue] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resetingPassword, setResetingPassword] = useState(false);
  
  // Real-time password strength meter state
  const [pwdStrength, setPwdStrength] = useState({ 
    percent: 0, 
    status: "exception" as "success" | "normal" | "exception" | "active", 
    label: "Chưa nhập" 
  });

  const currentUserEmail = authService.getCurrentUser()?.email;

  useEffect(() => {
    if (!newPassword) {
      setPwdStrength({ percent: 0, status: "exception", label: "Chưa nhập" });
      return;
    }

    let score = 0;
    if (newPassword.length >= 6) score += 30;
    if (newPassword.length >= 8) score += 20;
    if (/[A-Z]/.test(newPassword)) score += 15;
    if (/[0-9]/.test(newPassword)) score += 15;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 20;

    let status: "success" | "normal" | "exception" | "active" = "exception";
    let label = "Yếu";
    if (score >= 80) {
      status = "success";
      label = "Mạnh (An toàn)";
    } else if (score >= 50) {
      status = "normal";
      label = "Trung bình";
    }

    setPwdStrength({ percent: score, status, label });
  }, [newPassword]);

  const handleRequestOtp = async () => {
    if (!currentUserEmail) {
      message.error("Không tìm thấy email tài khoản.");
      return;
    }

    try {
      setSendingOtp(true);
      await axiosClient.post("/auth/forgot-password", { email: currentUserEmail });
      message.success("Mã OTP xác thực đã được gửi về email của bạn!");
      // Switch view to OTP input form
      setStep(2);
      // Clear fields
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      message.error("Không thể gửi OTP: " + (err.response?.data?.message || err.message));
    } finally {
      setSendingOtp(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      message.error("Vui lòng điền đầy đủ các ô mật khẩu!");
      return;
    }
    if (newPassword !== confirmPassword) {
      message.error("Mật khẩu xác nhận không khớp với mật khẩu mới!");
      return;
    }
    if (newPassword.length < 6) {
      message.error("Mật khẩu mới phải từ 6 ký tự trở lên!");
      return;
    }

    try {
      setChangingPassword(true);
      await axiosClient.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      message.success("Đổi mật khẩu tài khoản thành công!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      const errText = error?.response?.data?.message || error?.response?.data || "Mật khẩu cũ không chính xác.";
      message.error(typeof errText === "string" ? errText : "Đổi mật khẩu thất bại.");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleOtpResetPassword = async () => {
    if (!otpValue || !newPassword || !confirmPassword) {
      message.error("Vui lòng nhập đầy đủ mã OTP và mật khẩu!");
      return;
    }
    if (otpValue.length !== 6) {
      message.error("Mã OTP phải có đúng 6 chữ số!");
      return;
    }
    if (newPassword !== confirmPassword) {
      message.error("Mật khẩu xác nhận không khớp với mật khẩu mới!");
      return;
    }
    if (newPassword.length < 6) {
      message.error("Mật khẩu mới phải từ 6 ký tự trở lên!");
      return;
    }

    try {
      setResetingPassword(true);
      await axiosClient.post("/auth/reset-password", {
        email: currentUserEmail,
        otp: otpValue,
        newPassword: newPassword,
      });
      message.success("Đặt lại mật khẩu thành công bằng mã OTP!");
      // Switch back to normal view
      setStep(1);
      setOtpValue("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      const errText = error?.response?.data?.message || error?.response?.data || "Mã OTP không chính xác hoặc đã hết hạn.";
      message.error(typeof errText === "string" ? errText : "Khôi phục mật khẩu thất bại.");
    } finally {
      setResetingPassword(false);
    }
  };

  const getStrengthColor = () => {
    if (pwdStrength.percent >= 80) return "#10B981";
    if (pwdStrength.percent >= 50) return "#F59E0B";
    return "#EF4444";
  };

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ maxWidth: 700 }}>
        {step === 1 ? (
          <Card
            title={
              <Space>
                <KeyOutlined style={{ color: "#2563EB" }} />
                <span style={{ fontWeight: 600 }}>Cập nhật mật khẩu bảo mật</span>
              </Space>
            }
            extra={
              <Button 
                type="link" 
                size="small" 
                loading={sendingOtp} 
                onClick={handleRequestOtp}
                style={{ fontWeight: 500 }}
              >
                Quên mật khẩu hiện tại?
              </Button>
            }
            style={{ borderRadius: 16, border: "1px solid #E2E8F0" }}
          >
            <Form layout="vertical">
              <Form.Item 
                label={<span style={{ fontWeight: 600, color: "#475569" }}>Mật khẩu hiện tại</span>} 
                required
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: "#94A3B8" }} />}
                  placeholder="Nhập mật khẩu cũ"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={{ borderRadius: 8, height: 40 }}
                />
              </Form.Item>
              
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item 
                    label={<span style={{ fontWeight: 600, color: "#475569" }}>Mật khẩu mới</span>} 
                    required
                  >
                    <Input.Password
                      prefix={<UnlockOutlined style={{ color: "#94A3B8" }} />}
                      placeholder="Tối thiểu 6 ký tự"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{ borderRadius: 8, height: 40 }}
                    />
                  </Form.Item>
                  
                  {/* Real-time Password Strength Meter */}
                  {newPassword && (
                    <div style={{ marginTop: -12, marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                        <span style={{ fontSize: 11, color: "#64748B" }}>Độ mạnh mật khẩu:</span>
                        <span style={{ fontSize: 11, fontWeight: "bold", color: getStrengthColor() }}>
                          {pwdStrength.label}
                        </span>
                      </div>
                      <Progress 
                        percent={pwdStrength.percent} 
                        showInfo={false} 
                        strokeColor={getStrengthColor()} 
                        size="small" 
                      />
                    </div>
                  )}
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item 
                    label={<span style={{ fontWeight: 600, color: "#475569" }}>Xác nhận mật khẩu mới</span>} 
                    required
                  >
                    <Input.Password
                      prefix={<LockOutlined style={{ color: "#94A3B8" }} />}
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{ borderRadius: 8, height: 40 }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button
                  type="primary"
                  loading={changingPassword}
                  onClick={handleChangePassword}
                  style={{ borderRadius: 8, height: 40, background: "#2563EB", fontWeight: 600 }}
                >
                  Xác nhận thay đổi
                </Button>
              </Form.Item>
            </Form>
          </Card>
        ) : (
          <Card
            title={
              <Space>
                <SafetyCertificateOutlined style={{ color: "#2563EB" }} />
                <span style={{ fontWeight: 600 }}>Đặt lại mật khẩu bằng mã OTP</span>
              </Space>
            }
            style={{ borderRadius: 16, border: "1px solid #E2E8F0" }}
          >
            <Alert
              message={`Mã xác thực OTP đã được gửi đến email ${currentUserEmail}`}
              type="info"
              showIcon
              style={{ borderRadius: 8, marginBottom: 20 }}
            />

            <Form layout="vertical">
              <Form.Item 
                label={<span style={{ fontWeight: 600, color: "#475569" }}>Mã xác thực OTP (6 chữ số)</span>} 
                required
              >
                <Input
                  prefix={<SafetyCertificateOutlined style={{ color: "#94A3B8" }} />}
                  placeholder="Nhập mã OTP"
                  value={otpValue}
                  maxLength={6}
                  onChange={(e) => setOtpValue(e.target.value)}
                  style={{ borderRadius: 8, height: 40 }}
                />
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item 
                    label={<span style={{ fontWeight: 600, color: "#475569" }}>Mật khẩu mới</span>} 
                    required
                  >
                    <Input.Password
                      prefix={<UnlockOutlined style={{ color: "#94A3B8" }} />}
                      placeholder="Tối thiểu 6 ký tự"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{ borderRadius: 8, height: 40 }}
                    />
                  </Form.Item>

                  {/* Real-time Password Strength Meter */}
                  {newPassword && (
                    <div style={{ marginTop: -12, marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                        <span style={{ fontSize: 11, color: "#64748B" }}>Độ mạnh mật khẩu:</span>
                        <span style={{ fontSize: 11, fontWeight: "bold", color: getStrengthColor() }}>
                          {pwdStrength.label}
                        </span>
                      </div>
                      <Progress 
                        percent={pwdStrength.percent} 
                        showInfo={false} 
                        strokeColor={getStrengthColor()} 
                        size="small" 
                      />
                    </div>
                  )}
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item 
                    label={<span style={{ fontWeight: 600, color: "#475569" }}>Xác nhận mật khẩu mới</span>} 
                    required
                  >
                    <Input.Password
                      prefix={<LockOutlined style={{ color: "#94A3B8" }} />}
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{ borderRadius: 8, height: 40 }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item style={{ marginBottom: 0 }}>
                <Space>
                  <Button
                    type="primary"
                    loading={resetingPassword}
                    onClick={handleOtpResetPassword}
                    style={{ borderRadius: 8, height: 40, background: "#2563EB", fontWeight: 600 }}
                  >
                    Xác nhận đặt lại
                  </Button>
                  <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => {
                      setStep(1);
                      setOtpValue("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    style={{ borderRadius: 8, height: 40 }}
                  >
                    Quay lại
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        )}
      </div>
    </div>
  );
};
