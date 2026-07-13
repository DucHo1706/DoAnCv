import { useEffect, useState } from "react";
import { Form, Input, Button, Card, Divider, Space, Spin, message } from "antd";
import { UserOutlined, PhoneOutlined, KeyOutlined } from "@ant-design/icons";
import PageContainer from "../../components/common/PageContainer";
import axiosClient from "../../services/axiosClient";
import { authService } from "../../services/authService";


export default function RecruiterProfilePage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [form] = Form.useForm();
  const currentUser = authService.getCurrentUser();

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/RecruiterProfile");
      form.setFieldsValue({
        fullName: res.data.fullName,
        phone: res.data.phone,
      });
    } catch (error) {
      message.error("Lỗi khi tải thông tin nhà tuyển dụng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (values: any) => {
    try {
      setSaving(true);
      await axiosClient.put("/RecruiterProfile", {
        fullName: values.fullName,
        phone: values.phone,
      });
      message.success("Cập nhật thông tin nhà tuyển dụng thành công!");
      
      const user = authService.getCurrentUser();
      if (user) {
        user.fullName = values.fullName;
        localStorage.setItem("user", JSON.stringify(user));
      }
    } catch (error) {
      message.error("Lỗi khi cập nhật thông tin cá nhân.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      message.error("Vui lòng nhập đầy đủ các ô mật khẩu!");
      return;
    }
    if (newPassword !== confirmPassword) {
      message.error("Mật khẩu xác nhận không khớp!");
      return;
    }
    if (newPassword.length < 6) {
      message.error("Mật khẩu mới phải dài từ 6 ký tự trở lên!");
      return;
    }

    try {
      setChangingPassword(true);
      await axiosClient.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      message.success("Thay đổi mật khẩu thành công!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
    } catch (error: any) {
      const errText = error?.response?.data?.message || error?.response?.data || "Đổi mật khẩu thất bại. Mật khẩu hiện tại không đúng.";
      message.error(typeof errText === "string" ? errText : "Lỗi đổi mật khẩu.");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <PageContainer title="Hồ sơ nhà tuyển dụng" subtitle="Quản lý thông tin cá nhân của Recruiter và mật khẩu.">
      <div style={{ maxWidth: 800 }}>
        {loading ? (
          <Card style={{ borderRadius: 16, textAlign: "center", padding: "40px 0" }}>
            <Spin tip="Đang tải thông tin hồ sơ..." />
          </Card>
        ) : (
          <Card
            style={{
              borderRadius: 16,
              boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
              border: "1px solid #E2E8F0",
            }}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleUpdateProfile}
              requiredMark={false}
              style={{ maxWidth: 650 }}
            >
              <Form.Item label="Địa chỉ Email (Đọc chỉ)" extra="Email là tài khoản đăng nhập và không thể thay đổi.">
                <Input
                  value={currentUser?.email || "recruiter@example.com"}
                  disabled
                  prefix={<UserOutlined style={{ color: "#94A3B8" }} />}
                  style={{ borderRadius: 8, height: 40 }}
                />
              </Form.Item>

              <Form.Item
                label="Họ và tên nhà tuyển dụng"
                name="fullName"
                rules={[{ required: true, message: "Vui lòng điền họ tên!" }]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: "#94A3B8" }} />}
                  placeholder="Họ và tên của bạn"
                  style={{ borderRadius: 8, height: 40 }}
                />
              </Form.Item>

              <Form.Item
                label="Số điện thoại liên lạc"
                name="phone"
                rules={[{ required: true, message: "Vui lòng nhập số điện thoại liên lạc!" }]}
              >
                <Input
                  prefix={<PhoneOutlined style={{ color: "#94A3B8" }} />}
                  placeholder="Số điện thoại di động"
                  style={{ borderRadius: 8, height: 40 }}
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={saving}
                  style={{ borderRadius: 8, height: 40 }}
                >
                  Lưu thông tin hồ sơ
                </Button>
              </Form.Item>
            </Form>

            <Divider style={{ margin: "28px 0" }} />

            {/* Change Password Collapsible Section */}
            <div style={{ maxWidth: 650 }}>
              {!showPasswordForm ? (
                <Button
                  type="dashed"
                  icon={<KeyOutlined />}
                  onClick={() => setShowPasswordForm(true)}
                  style={{ borderRadius: 8 }}
                >
                  Đổi mật khẩu tài khoản
                </Button>
              ) : (
                <Card
                  title={
                    <Space>
                      <KeyOutlined style={{ color: "#2563EB" }} />
                      <span style={{ fontSize: 15, fontWeight: 600 }}>Cập nhật mật khẩu bảo mật</span>
                    </Space>
                  }
                  style={{ borderRadius: 12, border: "1px solid #E2E8F0", background: "#F8FAFC" }}
                >
                  <Form layout="vertical">
                    <Form.Item label="Mật khẩu hiện tại" required>
                      <Input.Password
                        placeholder="Nhập mật khẩu cũ của bạn"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        style={{ borderRadius: 8, height: 38 }}
                      />
                    </Form.Item>

                    <Form.Item label="Mật khẩu mới" required>
                      <Input.Password
                        placeholder="Mật khẩu mới ít nhất 6 ký tự"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        style={{ borderRadius: 8, height: 38 }}
                      />
                    </Form.Item>

                    <Form.Item label="Xác nhận mật khẩu mới" required>
                      <Input.Password
                        placeholder="Nhập lại mật khẩu mới"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        style={{ borderRadius: 8, height: 38 }}
                      />
                    </Form.Item>

                    <Space>
                      <Button
                        type="primary"
                        loading={changingPassword}
                        onClick={handleChangePassword}
                        style={{ borderRadius: 8 }}
                      >
                        Xác nhận thay đổi
                      </Button>
                      <Button
                        onClick={() => {
                          setShowPasswordForm(false);
                          setCurrentPassword("");
                          setNewPassword("");
                          setConfirmPassword("");
                        }}
                        style={{ borderRadius: 8 }}
                      >
                        Hủy
                      </Button>
                    </Space>
                  </Form>
                </Card>
              )}
            </div>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
