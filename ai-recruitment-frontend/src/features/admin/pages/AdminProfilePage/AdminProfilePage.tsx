import { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Avatar,
  Typography,
  Tag,
  Form,
  Input,
  Button,
  Tabs,
  Space,
  Divider,
  message,
  Spin,
  Badge,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
  KeyOutlined,
  CheckCircleOutlined,
  LockOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import PageContainer from "../../../../components/common/PageContainer";
import axiosClient from "../../../../services/axiosClient";
import { authService } from "../../../../services/authService";
import { appTheme } from "../../../../constants/theme";

const { Title, Text, Paragraph } = Typography;

export default function AdminProfilePage() {
  const [loading, setLoading] = useState(false);
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Change Password state
  const [formPass] = Form.useForm();
  const [changingPassword, setChangingPassword] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const user = authService.getCurrentUser();
      setCurrentUser(user);

      const res = await axiosClient.get("/AdminProfile");
      setAdminProfile(res.data);
    } catch (error) {
      // Fallback if custom profile api fails
      const user = authService.getCurrentUser();
      setAdminProfile({
        email: user?.email || "admin@system.com",
        role: "Admin",
        status: "Active",
        createdAt: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChangePassword = async (values: any) => {
    const { currentPassword, newPassword, confirmPassword } = values;
    if (newPassword !== confirmPassword) {
      message.error("Mật khẩu xác nhận không khớp!");
      return;
    }

    try {
      setChangingPassword(true);
      await axiosClient.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      message.success("Thay đổi mật khẩu Quản trị viên thành công!");
      formPass.resetFields();
    } catch (error: any) {
      const errText =
        error?.response?.data?.message ||
        error?.response?.data ||
        "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.";
      message.error(typeof errText === "string" ? errText : "Lỗi đổi mật khẩu.");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <PageContainer
      title="Tài khoản quản trị viên"
    >
      {loading ? (
        <Card style={{ borderRadius: appTheme.radius.lg, textAlign: "center", padding: 60 }}>
          <Spin tip="Đang tải thông tin tài khoản Quản trị..." size="large" />
        </Card>
      ) : (
        <Row gutter={[20, 20]}>
          {/* Left Column: Profile Brief Card */}
          <Col xs={24} lg={8}>
            <Card
              style={{
                borderRadius: appTheme.radius.lg,
                border: `1px solid ${appTheme.colors.border}`,
                boxShadow: appTheme.shadow.card,
                textAlign: "center",
              }}
              bodyStyle={{ padding: "32px 24px" }}
            >
              <Avatar
                size={96}
                icon={<UserOutlined />}
                style={{
                  backgroundColor: appTheme.colors.primary,
                  marginBottom: 16,
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                }}
              >
                {(currentUser?.fullName || adminProfile?.email || "A")
                  .charAt(0)
                  .toUpperCase()}
              </Avatar>

              <Title level={4} style={{ margin: "0 0 4px", color: appTheme.colors.textPrimary }}>
                {currentUser?.fullName || "Quản trị viên Hệ thống"}
              </Title>
              <Text type="secondary" style={{ fontSize: 13, display: "block", marginBottom: 12 }}>
                {adminProfile?.email || currentUser?.email}
              </Text>

              <Space size={6} style={{ marginBottom: 16 }}>
                <Tag color="blue" style={{ borderRadius: 12, padding: "2px 12px", fontWeight: 700 }}>
                  <SafetyCertificateOutlined style={{ marginRight: 4 }} /> QUẢN TRỊ VIÊN (ADMIN)
                </Tag>
                <Tag color="success" style={{ borderRadius: 12, padding: "2px 10px", fontWeight: 600 }}>
                  Đang hoạt động
                </Tag>
              </Space>

              <Divider style={{ margin: "16px 0" }} />

              <div style={{ textAlign: "left", fontSize: 13 }}>
                <Paragraph style={{ marginBottom: 8, color: "#64748B" }}>
                  <MailOutlined style={{ marginRight: 8, color: appTheme.colors.primary }} />
                  Email: <Text strong style={{ color: "#0F172A" }}>{adminProfile?.email}</Text>
                </Paragraph>
                <Paragraph style={{ marginBottom: 8, color: "#64748B" }}>
                  <SafetyCertificateOutlined style={{ marginRight: 8, color: appTheme.colors.accent }} />
                  Cấp độ quyền: <Text strong style={{ color: "#0F172A" }}>Toàn quyền (Root Admin)</Text>
                </Paragraph>
                <Paragraph style={{ marginBottom: 0, color: "#64748B" }}>
                  <HistoryOutlined style={{ marginRight: 8, color: appTheme.colors.info }} />
                  Ngày tạo:{" "}
                  <Text strong style={{ color: "#0F172A" }}>
                    {adminProfile?.createdAt
                      ? new Date(adminProfile.createdAt).toLocaleDateString("vi-VN")
                      : "2026-01-01"}
                  </Text>
                </Paragraph>
              </div>
            </Card>
          </Col>

          {/* Right Column: Detailed Tabs */}
          <Col xs={24} lg={16}>
            <Card
              style={{
                borderRadius: appTheme.radius.lg,
                border: `1px solid ${appTheme.colors.border}`,
                boxShadow: appTheme.shadow.card,
              }}
              bodyStyle={{ padding: "16px 24px 28px" }}
            >
              <Tabs
                defaultActiveKey="info"
                type="line"
                size="large"
                items={[
                  {
                    key: "info",
                    label: (
                      <Space size={6}>
                        <UserOutlined style={{ color: appTheme.colors.primary }} />
                        <span>Thông tin tài khoản</span>
                      </Space>
                    ),
                    children: (
                      <div style={{ paddingTop: 16 }}>
                        <Title level={5} style={{ marginBottom: 16, color: appTheme.colors.textPrimary }}>
                          Hồ sơ Quản trị viên
                        </Title>
                        <Form layout="vertical">
                          <Row gutter={16}>
                            <Col xs={24} sm={12}>
                              <Form.Item label="Họ và tên">
                                <Input
                                  value={currentUser?.fullName || "Quản trị viên Hệ thống"}
                                  disabled
                                  prefix={<UserOutlined style={{ color: "#94A3B8" }} />}
                                  style={{ borderRadius: 8 }}
                                />
                              </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                              <Form.Item label="Email quản trị">
                                <Input
                                  value={adminProfile?.email}
                                  disabled
                                  prefix={<MailOutlined style={{ color: "#94A3B8" }} />}
                                  style={{ borderRadius: 8 }}
                                />
                              </Form.Item>
                            </Col>
                          </Row>

                          <Row gutter={16}>
                            <Col xs={24} sm={12}>
                              <Form.Item label="Vai trò hệ thống">
                                <Input
                                  value="Quản trị viên (Super Admin)"
                                  disabled
                                  prefix={<SafetyCertificateOutlined style={{ color: "#94A3B8" }} />}
                                  style={{ borderRadius: 8 }}
                                />
                              </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                              <Form.Item label="Trạng thái tài khoản">
                                <Input
                                  value="🟢 Hoạt động bình thường"
                                  disabled
                                  style={{ borderRadius: 8, color: appTheme.colors.success, fontWeight: 600 }}
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                        </Form>
                      </div>
                    ),
                  },
                  {
                    key: "password",
                    label: (
                      <Space size={6}>
                        <KeyOutlined style={{ color: appTheme.colors.accent }} />
                        <span>Đổi mật khẩu</span>
                      </Space>
                    ),
                    children: (
                      <div style={{ paddingTop: 16 }}>
                        <Title level={5} style={{ marginBottom: 8, color: appTheme.colors.textPrimary }}>
                          Đổi mật khẩu tài khoản Admin
                        </Title>
                        <Paragraph type="secondary" style={{ marginBottom: 20 }}>
                          Vui lòng sử dụng mật khẩu mạnh bao gồm chữ hoa, chữ thường và chữ số để bảo vệ tài khoản quản trị.
                        </Paragraph>

                        <Form
                          form={formPass}
                          layout="vertical"
                          onFinish={handleChangePassword}
                          style={{ maxWidth: 500 }}
                        >
                          <Form.Item
                            name="currentPassword"
                            label="Mật khẩu hiện tại"
                            rules={[{ required: true, message: "Vui lòng nhập mật khẩu hiện tại!" }]}
                          >
                            <Input.Password
                              prefix={<LockOutlined style={{ color: "#94A3B8" }} />}
                              placeholder="Nhập mật khẩu hiện tại..."
                              style={{ borderRadius: 8 }}
                            />
                          </Form.Item>

                          <Form.Item
                            name="newPassword"
                            label="Mật khẩu mới"
                            rules={[
                              { required: true, message: "Vui lòng nhập mật khẩu mới!" },
                              { min: 6, message: "Mật khẩu mới phải từ 6 ký tự trở lên!" },
                            ]}
                          >
                            <Input.Password
                              prefix={<KeyOutlined style={{ color: "#94A3B8" }} />}
                              placeholder="Nhập mật khẩu mới..."
                              style={{ borderRadius: 8 }}
                            />
                          </Form.Item>

                          <Form.Item
                            name="confirmPassword"
                            label="Xác nhận mật khẩu mới"
                            rules={[{ required: true, message: "Vui lòng xác nhận mật khẩu mới!" }]}
                          >
                            <Input.Password
                              prefix={<KeyOutlined style={{ color: "#94A3B8" }} />}
                              placeholder="Nhập lại mật khẩu mới..."
                              style={{ borderRadius: 8 }}
                            />
                          </Form.Item>

                          <Form.Item style={{ marginTop: 24 }}>
                            <Button
                              type="primary"
                              htmlType="submit"
                              loading={changingPassword}
                              icon={<CheckCircleOutlined />}
                              style={{ background: appTheme.colors.primary, borderRadius: 8, height: 40, padding: "0 24px" }}
                            >
                              Cập nhật mật khẩu
                            </Button>
                          </Form.Item>
                        </Form>
                      </div>
                    ),
                  },
                  {
                    key: "permissions",
                    label: (
                      <Space size={6}>
                        <SafetyCertificateOutlined style={{ color: appTheme.colors.success }} />
                        <span>Quyền hạn Quản trị</span>
                      </Space>
                    ),
                    children: (
                      <div style={{ paddingTop: 16 }}>
                        <Title level={5} style={{ marginBottom: 16, color: appTheme.colors.textPrimary }}>
                          Danh sách Quyền hạn Tài khoản Admin
                        </Title>
                        <Space direction="vertical" size={12} style={{ width: "100%" }}>
                          <Card size="small" style={{ borderRadius: 8, background: "#F8FAFC" }}>
                            <Space align="start">
                              <Badge status="success" style={{ marginTop: 6 }} />
                              <div>
                                <Text strong style={{ color: "#0F172A" }}>Duyệt & Quản lý Tin tuyển dụng</Text>
                                <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                                  Toàn quyền duyệt tin chờ phê duyệt, khóa/gỡ bỏ tin tuyển dụng vi phạm.
                                </Text>
                              </div>
                            </Space>
                          </Card>

                          <Card size="small" style={{ borderRadius: 8, background: "#F8FAFC" }}>
                            <Space align="start">
                              <Badge status="success" style={{ marginTop: 6 }} />
                              <div>
                                <Text strong style={{ color: "#0F172A" }}>Quản lý Nhân sự & Phân quyền</Text>
                                <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                                  Thêm mới, khóa/mở khóa tài khoản Recruiter, phân vai trò & quyền hạn hệ thống.
                                </Text>
                              </div>
                            </Space>
                          </Card>

                          <Card size="small" style={{ borderRadius: 8, background: "#F8FAFC" }}>
                            <Space align="start">
                              <Badge status="success" style={{ marginTop: 6 }} />
                              <div>
                                <Text strong style={{ color: "#0F172A" }}>Quản trị Cơ cấu Tổ chức</Text>
                                <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                                  Thêm/Sửa/Khóa các Chi nhánh, Lĩnh vực Ngành nghề, Cấp bậc và Vị trí công việc.
                                </Text>
                              </div>
                            </Space>
                          </Card>

                          <Card size="small" style={{ borderRadius: 8, background: "#F8FAFC" }}>
                            <Space align="start">
                              <Badge status="success" style={{ marginTop: 6 }} />
                              <div>
                                <Text strong style={{ color: "#0F172A" }}>Nhật ký Bảo mật & Cài đặt Hệ thống</Text>
                                <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                                  Theo dõi toàn bộ nhật ký truy cập (Audit Logs) và cấu hình thông số hệ thống.
                                </Text>
                              </div>
                            </Space>
                          </Card>
                        </Space>
                      </div>
                    ),
                  },
                ]}
              />
            </Card>
          </Col>
        </Row>
      )}
    </PageContainer>
  );
}
