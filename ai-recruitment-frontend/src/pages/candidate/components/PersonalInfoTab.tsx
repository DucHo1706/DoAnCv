import React, { useState } from "react";
import { Form, Input, Row, Col, Select, DatePicker, Button, Divider, Space, Card, message } from "antd";
import { KeyOutlined } from "@ant-design/icons";
import axiosClient from "../../../services/axiosClient";

interface PersonalInfoTabProps {
  form: any;
  submittingProfile: boolean;
  onFinish: (values: any) => void;
}

export const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({
  form,
  submittingProfile,
  onFinish,
}) => {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

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
      await axiosClient.post("/profile/change-password", {
        currentPassword,
        newPassword,
      });
      message.success("Đổi mật khẩu tài khoản thành công!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
    } catch (error: any) {
      const errText = error?.response?.data?.message || error?.response?.data || "Mật khẩu cũ không chính xác.";
      message.error(typeof errText === "string" ? errText : "Đổi mật khẩu thất bại.");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div style={{ marginTop: 16 }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        style={{ maxWidth: 650 }}
      >
        <Form.Item
          label="Họ và tên"
          name="fullName"
          rules={[{ required: true, message: "Vui lòng nhập họ và tên của bạn!" }]}
        >
          <Input placeholder="Nguyễn Văn A" style={{ borderRadius: 8, height: 40 }} />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Số điện thoại"
              name="phone"
              rules={[{ required: true, message: "Vui lòng nhập số điện thoại!" }]}
            >
              <Input placeholder="0987654321" style={{ borderRadius: 8, height: 40 }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Giới tính"
              name="gender"
              rules={[{ required: true }]}
            >
              <Select style={{ borderRadius: 8, height: 40 }}>
                <Select.Option value="Nam">Nam</Select.Option>
                <Select.Option value="Nữ">Nữ</Select.Option>
                <Select.Option value="Khác">Khác</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Ngày sinh"
          name="dob"
        >
          <DatePicker style={{ width: "100%", borderRadius: 8, height: 40 }} format="DD/MM/YYYY" placeholder="Chọn ngày sinh" />
        </Form.Item>

        <Form.Item
          label="Địa chỉ hiện tại"
          name="address"
        >
          <Input.TextArea placeholder="Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội" autoSize={{ minRows: 2, maxRows: 4 }} style={{ borderRadius: 8 }} />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={submittingProfile}
            style={{ borderRadius: 8, height: 40 }}
          >
            Lưu thông tin cá nhân
          </Button>
        </Form.Item>
      </Form>

      <Divider style={{ margin: "24px 0" }} />

      {/* Change Password Block */}
      <div style={{ maxWidth: 650 }}>
        {!showPasswordForm ? (
          <Button
            type="dashed"
            icon={<KeyOutlined />}
            onClick={() => setShowPasswordForm(true)}
            style={{ borderRadius: 8 }}
          >
            Thay đổi mật khẩu tài khoản
          </Button>
        ) : (
          <Card
            title={
              <Space>
                <KeyOutlined style={{ color: "#2563EB" }} />
                <span>Đổi mật khẩu bảo mật</span>
              </Space>
            }
            style={{ borderRadius: 12, border: "1px solid #E2E8F0" }}
          >
            <Form layout="vertical">
              <Form.Item label="Mật khẩu cũ" required>
                <Input.Password
                  placeholder="Nhập mật khẩu hiện tại"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={{ borderRadius: 8, height: 38 }}
                />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Mật khẩu mới" required>
                    <Input.Password
                      placeholder="Ít nhất 6 ký tự"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{ borderRadius: 8, height: 38 }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Xác nhận mật khẩu mới" required>
                    <Input.Password
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{ borderRadius: 8, height: 38 }}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Space>
                <Button
                  type="primary"
                  loading={changingPassword}
                  onClick={handleChangePassword}
                  style={{ borderRadius: 8 }}
                >
                  Xác nhận đổi
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
    </div>
  );
};
