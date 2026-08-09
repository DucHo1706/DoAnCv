import { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Row,
  Col,
  Avatar,
  Tag,
  Tabs,
  Space,
  Skeleton,
  Table,
  Badge,
  Typography,
  Progress,
  Divider,
  message,
  Tooltip,
} from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  KeyOutlined,
  IdcardOutlined,
  BankOutlined,
  LinkedinOutlined,
  FileTextOutlined,
  LockOutlined,
  CalendarOutlined,
  CheckCircleFilled,
  ClockCircleFilled,
  CloseCircleFilled,
  CheckOutlined,
  FileSearchOutlined,
  TeamOutlined,
  SolutionOutlined,
  SafetyCertificateOutlined,
  RightOutlined,
  EyeOutlined,
  GlobalOutlined,
  MailOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import PageContainer from "../../../../components/common/PageContainer";
import axiosClient from "../../../../services/axiosClient";
import { authService } from "../../../../services/authService";
import { appTheme } from "../../../../constants/theme";

const { Text, Title, Paragraph } = Typography;

interface RecruiterProfileData {
  recruiterId: string;
  fullName: string;
  phone: string;
  department: string;
  companyBranch: string;
  bio: string;
  linkedInUrl: string;
  email: string;
  createdAt: string;
  status: string;
  stats: {
    totalJobsPosted: number;
    totalApplications: number;
    totalInterviewsScheduled: number;
  };
  recentJobs: Array<{
    jobId: string;
    status: string;
    createdAt: string;
    deadline: string;
    viewCount: number;
    positionName: string;
    categoryName: string;
  }>;
}

export default function RecruiterProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<RecruiterProfileData | null>(null);

  // Change password states
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
      setProfileData(res.data);
      form.setFieldsValue({
        fullName: res.data.fullName,
        phone: res.data.phone,
        department: res.data.department,
        companyBranch: res.data.companyBranch,
        bio: res.data.bio,
        linkedInUrl: res.data.linkedInUrl,
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
        department: values.department,
        companyBranch: values.companyBranch,
        bio: values.bio,
        linkedInUrl: values.linkedInUrl,
      });
      message.success("Cập nhật hồ sơ nhà tuyển dụng thành công!");

      const user = authService.getCurrentUser();
      if (user) {
        user.fullName = values.fullName;
        localStorage.setItem("user", JSON.stringify(user));
      }

      fetchProfile();
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
      message.success("Thay đổi mật khẩu tài khoản thành công!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      const errText =
        error?.response?.data?.message ||
        error?.response?.data ||
        "Mật khẩu hiện tại không đúng.";
      message.error(typeof errText === "string" ? errText : "Lỗi đổi mật khẩu.");
    } finally {
      setChangingPassword(false);
    }
  };

  // Compute initials for Avatar
  const getInitials = (name?: string) => {
    if (!name) return "HR";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Calculate profile completeness score
  const getProfileCompleteness = () => {
    if (!profileData) return 50;
    let score = 40; // Base score
    if (profileData.fullName) score += 15;
    if (profileData.phone) score += 15;
    if (profileData.department) score += 10;
    if (profileData.companyBranch) score += 10;
    if (profileData.bio) score += 5;
    if (profileData.linkedInUrl) score += 5;
    return Math.min(score, 100);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Published":
        return <Tag icon={<CheckCircleFilled />} color="success">Đang tuyển</Tag>;
      case "Pending":
        return <Tag icon={<ClockCircleFilled />} color="warning">Chờ duyệt</Tag>;
      case "Rejected":
        return <Tag icon={<CloseCircleFilled />} color="error">Từ chối</Tag>;
      case "Closed":
        return <Tag color="default">Đã đóng</Tag>;
      default:
        return <Tag>Chưa xác định</Tag>;
    }
  };

  const jobColumns = [
    {
      title: "Vị trí tuyển dụng",
      dataIndex: "positionName",
      key: "positionName",
      render: (text: string, record: any) => (
        <div>
          <Text strong style={{ color: "#0F172A", fontSize: 14 }}>{text}</Text>
          <div style={{ marginTop: 2 }}>
            <Tag color="geekblue" style={{ fontSize: 11, borderRadius: 4 }}>
              {record.categoryName}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => getStatusBadge(status),
    },
    {
      title: "Lượt xem",
      dataIndex: "viewCount",
      key: "viewCount",
      render: (views: number) => (
        <Text style={{ color: "#475569" }}>
          <EyeOutlined style={{ marginRight: 4, color: "#94A3B8" }} />
          {views || 0} lượt
        </Text>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => (
        <Text style={{ color: "#64748B", fontSize: 13 }}>
          {date ? new Date(date).toLocaleDateString("vi-VN") : "---"}
        </Text>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_: any, record: any) => (
        <Button
          type="link"
          size="small"
          icon={<RightOutlined />}
          onClick={() => navigate(`/recruiter/applications?jobId=${record.jobId}`)}
          style={{ padding: 0, fontWeight: 500 }}
        >
          Xem đơn ứng tuyển
        </Button>
      ),
    },
  ];

  const completeness = getProfileCompleteness();

  return (
    <PageContainer
      title="Hồ sơ nhà tuyển dụng"
    >
      {loading && !profileData ? (
        <Card style={{ borderRadius: appTheme.radius.lg, border: "1px solid #E2E8F0" }}>
          <Skeleton active avatar paragraph={{ rows: 8 }} />
        </Card>
      ) : (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* Header Profile Summary Hero Banner */}
          <Card
            style={{
              borderRadius: appTheme.radius.lg,
              border: "1px solid #E2E8F0",
              background: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 60%, #EFF6FF 100%)",
              boxShadow: "0 4px 20px rgba(15, 23, 42, 0.04)",
              position: "relative",
              overflow: "hidden",
            }}
            bodyStyle={{ padding: "28px 32px" }}
          >
            <Row gutter={[24, 24]} align="middle">
              <Col xs={24} sm={6} md={4} lg={3} style={{ textAlign: "center" }}>
                <div style={{ position: "relative", display: "inline-block" }}>
                  <Avatar
                    size={96}
                    style={{
                      backgroundColor: "#2563EB",
                      fontSize: 32,
                      fontWeight: 700,
                      boxShadow: "0 10px 24px rgba(37, 99, 235, 0.25)",
                      border: "4px solid #FFFFFF",
                    }}
                  >
                    {getInitials(profileData?.fullName || currentUser?.fullName)}
                  </Avatar>
                  <span
                    style={{
                      position: "absolute",
                      bottom: 6,
                      right: 6,
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      backgroundColor: "#10B981",
                      border: "3px solid #FFFFFF",
                    }}
                  />
                </div>
              </Col>

              <Col xs={24} sm={18} md={12} lg={13}>
                <Space align="center" style={{ marginBottom: 4 }}>
                  <Title level={3} style={{ margin: 0, color: "#0F172A", fontWeight: 700 }}>
                    {profileData?.fullName || "Nhà tuyển dụng"}
                  </Title>
                  <Tag color="blue" icon={<IdcardOutlined />} style={{ fontWeight: 600, borderRadius: 6 }}>
                    HR RECRUITER
                  </Tag>
                </Space>

                <Paragraph style={{ color: "#64748B", margin: "4px 0 12px 0", fontSize: 14 }}>
                  {profileData?.department || "Bộ phận Tuyển dụng"} • {profileData?.companyBranch || "Trụ sở chính"}
                </Paragraph>

                <Space wrap size={[8, 8]}>
                  <Tag icon={<MailOutlined />} color="default" style={{ borderRadius: 6, color: "#475569" }}>
                    {profileData?.email || currentUser?.email}
                  </Tag>
                  {profileData?.phone && (
                    <Tag icon={<PhoneOutlined />} color="default" style={{ borderRadius: 6, color: "#475569" }}>
                      {profileData.phone}
                    </Tag>
                  )}
                  {profileData?.linkedInUrl && (
                    <Tag
                      icon={<LinkedinOutlined style={{ color: "#0A66C2" }} />}
                      color="default"
                      style={{ borderRadius: 6, cursor: "pointer" }}
                      onClick={() => window.open(profileData.linkedInUrl, "_blank")}
                    >
                      LinkedIn Profile
                    </Tag>
                  )}
                </Space>
              </Col>

              {/* Right Profile Completeness Card */}
              <Col xs={24} md={8} lg={8}>
                <div
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: appTheme.radius.md,
                    padding: "16px 20px",
                    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.02)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <Text strong style={{ fontSize: 13, color: "#0F172A" }}>
                      Mức độ hoàn thiện hồ sơ
                    </Text>
                    <Text strong style={{ color: completeness >= 80 ? "#10B981" : "#2563EB" }}>
                      {completeness}%
                    </Text>
                  </div>
                  <Progress
                    percent={completeness}
                    showInfo={false}
                    strokeColor={{ "0%": "#2563EB", "100%": "#10B981" }}
                    size="small"
                  />
                  <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 8 }}>
                    {completeness >= 90
                      ? "✨ Hồ sơ tuyển dụng đầy đủ & chuyên nghiệp!"
                      : "Điền thêm thông tin phòng ban & bio để tăng độ uy tín."}
                  </Text>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Premium Content Tabs */}
          <Card
            style={{
              borderRadius: appTheme.radius.lg,
              border: "1px solid #E2E8F0",
              boxShadow: appTheme.shadow.card,
            }}
            bodyStyle={{ padding: "8px 24px 28px 24px" }}
          >
            <Tabs
              defaultActiveKey="profile"
              size="large"
              tabBarStyle={{ marginBottom: 24, borderBottom: "1px solid #E2E8F0" }}
              items={[
                {
                  key: "profile",
                  label: (
                    <Space size={8}>
                      <UserOutlined style={{ fontSize: 16 }} />
                      <span style={{ fontWeight: 600 }}>Thông tin cá nhân & Tổ chức</span>
                    </Space>
                  ),
                  children: (
                    <Row gutter={[24, 24]}>
                      {/* Left Column: Editable Form */}
                      <Col xs={24} lg={15}>
                        <Card
                          type="inner"
                          title={
                            <Space align="center">
                              <UserOutlined style={{ color: "#2563EB" }} />
                              <span style={{ fontSize: 15, fontWeight: 600, color: "#0F172A" }}>
                                Cập nhật thông tin chi tiết
                              </span>
                            </Space>
                          }
                          style={{ borderRadius: appTheme.radius.md, border: "1px solid #E2E8F0" }}
                          bodyStyle={{ padding: 24 }}
                        >
                          <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleUpdateProfile}
                            requiredMark={false}
                          >
                            <Divider
                              style={{ margin: "0 0 20px 0", fontSize: 13, color: "#64748B" }}
                            >
                              Định danh cá nhân
                            </Divider>

                            <Row gutter={16}>
                              <Col xs={24} md={12}>
                                <Form.Item
                                  label={<Text strong style={{ fontSize: 13 }}>Họ và tên nhà tuyển dụng</Text>}
                                  name="fullName"
                                  rules={[{ required: true, message: "Vui lòng điền họ tên!" }]}
                                >
                                  <Input
                                    prefix={<UserOutlined style={{ color: "#94A3B8" }} />}
                                    placeholder="Nhập họ và tên đầy đủ"
                                    style={{ borderRadius: appTheme.radius.sm, height: 40 }}
                                  />
                                </Form.Item>
                              </Col>
                              <Col xs={24} md={12}>
                                <Form.Item
                                  label={<Text strong style={{ fontSize: 13 }}>Số điện thoại liên lạc</Text>}
                                  name="phone"
                                  rules={[{ required: true, message: "Vui lòng nhập số điện thoại!" }]}
                                >
                                  <Input
                                    prefix={<PhoneOutlined style={{ color: "#94A3B8" }} />}
                                    placeholder="Số điện thoại di động"
                                    style={{ borderRadius: appTheme.radius.sm, height: 40 }}
                                  />
                                </Form.Item>
                              </Col>
                            </Row>

                            <Divider
                              style={{ margin: "12px 0 20px 0", fontSize: 13, color: "#64748B" }}
                            >
                              Thông tin tổ chức & Mạng xã hội
                            </Divider>

                            <Row gutter={16}>
                              <Col xs={24} md={12}>
                                <Form.Item
                                  label={<Text strong style={{ fontSize: 13 }}>Phòng ban / Bộ phận</Text>}
                                  name="department"
                                >
                                  <Input
                                    prefix={<BankOutlined style={{ color: "#94A3B8" }} />}
                                    placeholder="Ví dụ: HR & Talent Acquisition"
                                    style={{ borderRadius: appTheme.radius.sm, height: 40 }}
                                  />
                                </Form.Item>
                              </Col>
                              <Col xs={24} md={12}>
                                <Form.Item
                                  label={<Text strong style={{ fontSize: 13 }}>Chi nhánh công ty phụ trách</Text>}
                                  name="companyBranch"
                                >
                                  <Input
                                    prefix={<BankOutlined style={{ color: "#94A3B8" }} />}
                                    placeholder="Ví dụ: Trụ sở TP.HCM / Chi nhánh Hà Nội"
                                    style={{ borderRadius: appTheme.radius.sm, height: 40 }}
                                  />
                                </Form.Item>
                              </Col>
                            </Row>

                            <Form.Item
                              label={<Text strong style={{ fontSize: 13 }}>Trang LinkedIn cá nhân</Text>}
                              name="linkedInUrl"
                            >
                              <Input
                                prefix={<LinkedinOutlined style={{ color: "#0A66C2" }} />}
                                placeholder="https://linkedin.com/in/username"
                                style={{ borderRadius: appTheme.radius.sm, height: 40 }}
                              />
                            </Form.Item>

                            <Form.Item
                              label={<Text strong style={{ fontSize: 13 }}>Giới thiệu kinh nghiệm (Bio)</Text>}
                              name="bio"
                            >
                              <Input.TextArea
                                rows={4}
                                placeholder="Mô tả ngắn gọn về chuyên môn tuyển dụng, lĩnh vực phụ trách chính..."
                                style={{ borderRadius: appTheme.radius.sm }}
                              />
                            </Form.Item>

                            <Form.Item style={{ marginBottom: 0 }}>
                              <Button
                                type="primary"
                                htmlType="submit"
                                loading={saving}
                                icon={<CheckOutlined />}
                                style={{
                                  borderRadius: appTheme.radius.sm,
                                  height: 42,
                                  paddingLeft: 28,
                                  paddingRight: 28,
                                  fontWeight: 600,
                                }}
                              >
                                Lưu thay đổi thông tin
                              </Button>
                            </Form.Item>
                          </Form>
                        </Card>
                      </Col>

                      {/* Right Column: HR Identity Badge Card */}
                      <Col xs={24} lg={9}>
                        <Space direction="vertical" size="large" style={{ width: "100%" }}>
                          <Card
                            type="inner"
                            title={
                              <Space align="center">
                                <SafetyCertificateOutlined style={{ color: "#2563EB" }} />
                                <span style={{ fontSize: 15, fontWeight: 600, color: "#0F172A" }}>
                                  Thẻ định danh HR Hệ thống
                                </span>
                              </Space>
                            }
                            style={{ borderRadius: appTheme.radius.md, border: "1px solid #E2E8F0", background: "#F8FAFC" }}
                            bodyStyle={{ padding: 20 }}
                          >
                            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <Text type="secondary" style={{ fontSize: 13 }}>Mã định danh Recruiter:</Text>
                                <Text strong style={{ fontSize: 12, fontFamily: "monospace", color: "#0F172A" }}>
                                  {profileData?.recruiterId ? profileData.recruiterId.slice(0, 13) + "..." : "REC-AUTH"}
                                </Text>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <Text type="secondary" style={{ fontSize: 13 }}>Quyền hạn truy cập:</Text>
                                <Tag color="blue">Tuyển dụng toàn quyền</Tag>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <Text type="secondary" style={{ fontSize: 13 }}>Trạng thái xác thực:</Text>
                                <Badge status="success" text={<Text strong style={{ color: "#10B981", fontSize: 13 }}>Chính thức</Text>} />
                              </div>
                            </Space>

                            <Divider style={{ margin: "16px 0" }} />

                            <Title level={5} style={{ fontSize: 14, color: "#0F172A", marginBottom: 12 }}>
                              Quyền lợi & Tính năng HR:
                            </Title>
                            <Space direction="vertical" size="small" style={{ width: "100%", fontSize: 13, color: "#475569" }}>
                              <div><CheckCircleFilled style={{ color: "#10B981", marginRight: 8 }} />Đăng & Quản lý tin tuyển dụng</div>
                              <div><CheckCircleFilled style={{ color: "#10B981", marginRight: 8 }} />Sàng lọc CV tự động bằng AI</div>
                              <div><CheckCircleFilled style={{ color: "#10B981", marginRight: 8 }} />Đánh giá & So sánh ứng viên</div>
                              <div><CheckCircleFilled style={{ color: "#10B981", marginRight: 8 }} />Lên lịch phỏng vấn & Gửi Email</div>
                            </Space>
                          </Card>
                        </Space>
                      </Col>
                    </Row>
                  ),
                },
                {
                  key: "security",
                  label: (
                    <Space size={8}>
                      <LockOutlined style={{ fontSize: 16 }} />
                      <span style={{ fontWeight: 600 }}>Bảo mật & Tài khoản</span>
                    </Space>
                  ),
                  children: (
                    <Row gutter={[24, 24]}>
                      <Col xs={24} md={12}>
                        <Card
                          type="inner"
                          title={
                            <Space align="center">
                              <LockOutlined style={{ color: "#2563EB" }} />
                              <span style={{ fontSize: 15, fontWeight: 600, color: "#0F172A" }}>
                                Trung tâm bảo mật tài khoản
                              </span>
                            </Space>
                          }
                          style={{ borderRadius: appTheme.radius.md, border: "1px solid #E2E8F0" }}
                          bodyStyle={{ padding: 24 }}
                        >
                          <Space direction="vertical" size="large" style={{ width: "100%" }}>
                            <div>
                              <Text type="secondary" style={{ fontSize: 13 }}>Địa chỉ Email đăng nhập:</Text>
                              <div style={{ fontWeight: 600, color: "#0F172A", fontSize: 15, marginTop: 4 }}>
                                {profileData?.email || currentUser?.email}
                              </div>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                Email được dùng làm định danh duy nhất và không thể thay đổi.
                              </Text>
                            </div>

                            <Divider style={{ margin: "8px 0" }} />

                            <Row gutter={16}>
                              <Col span={12}>
                                <Text type="secondary" style={{ fontSize: 13 }}>Vai trò hệ thống:</Text>
                                <div style={{ marginTop: 4 }}>
                                  <Tag color="blue" style={{ fontSize: 13, padding: "2px 10px" }}>
                                    Recruiter
                                  </Tag>
                                </div>
                              </Col>
                              <Col span={12}>
                                <Text type="secondary" style={{ fontSize: 13 }}>Trạng thái tài khoản:</Text>
                                <div style={{ marginTop: 4 }}>
                                  <Tag color="success" style={{ fontSize: 13, padding: "2px 10px" }}>
                                    Hoạt động (Active)
                                  </Tag>
                                </div>
                              </Col>
                            </Row>

                            <div>
                              <Text type="secondary" style={{ fontSize: 13 }}>Ngày khởi tạo tài khoản:</Text>
                              <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
                                <CalendarOutlined style={{ color: "#2563EB" }} />
                                <Text strong style={{ color: "#0F172A" }}>
                                  {profileData?.createdAt
                                    ? new Date(profileData.createdAt).toLocaleDateString("vi-VN")
                                    : "---"}
                                </Text>
                              </div>
                            </div>
                          </Space>
                        </Card>
                      </Col>

                      <Col xs={24} md={12}>
                        <Card
                          type="inner"
                          title={
                            <Space align="center">
                              <KeyOutlined style={{ color: "#2563EB" }} />
                              <span style={{ fontSize: 15, fontWeight: 600, color: "#0F172A" }}>
                                Thay đổi mật khẩu
                              </span>
                            </Space>
                          }
                          style={{ borderRadius: appTheme.radius.md, border: "1px solid #E2E8F0" }}
                          bodyStyle={{ padding: 24 }}
                        >
                          <Form layout="vertical">
                            <Form.Item label={<Text strong style={{ fontSize: 13 }}>Mật khẩu hiện tại</Text>} required>
                              <Input.Password
                                placeholder="Nhập mật khẩu đang sử dụng"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                style={{ borderRadius: appTheme.radius.sm, height: 40 }}
                              />
                            </Form.Item>

                            <Form.Item label={<Text strong style={{ fontSize: 13 }}>Mật khẩu mới</Text>} required>
                              <Input.Password
                                placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                style={{ borderRadius: appTheme.radius.sm, height: 40 }}
                              />
                            </Form.Item>

                            <Form.Item label={<Text strong style={{ fontSize: 13 }}>Xác nhận mật khẩu mới</Text>} required>
                              <Input.Password
                                placeholder="Nhập lại mật khẩu mới"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                style={{ borderRadius: appTheme.radius.sm, height: 40 }}
                              />
                            </Form.Item>

                            <Button
                              type="primary"
                              loading={changingPassword}
                              onClick={handleChangePassword}
                              icon={<KeyOutlined />}
                              style={{ borderRadius: appTheme.radius.sm, height: 40, width: "100%", fontWeight: 600 }}
                            >
                              Xác nhận cập nhật mật khẩu
                            </Button>
                          </Form>
                        </Card>
                      </Col>
                    </Row>
                  ),
                },
                {
                  key: "activity",
                  label: (
                    <Space size={8}>
                      <FileTextOutlined style={{ fontSize: 16 }} />
                      <span style={{ fontWeight: 600 }}>Thống kê & Tin đăng tuyển dụng</span>
                    </Space>
                  ),
                  children: (
                    <Space direction="vertical" size="large" style={{ width: "100%" }}>
                      {/* Metric Cards Row */}
                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={8}>
                          <Card
                            bodyStyle={{ padding: 24 }}
                            style={{
                              borderRadius: appTheme.radius.md,
                              border: "1px solid #E2E8F0",
                              background: "linear-gradient(135deg, #FFFFFF 0%, #EFF6FF 100%)",
                            }}
                          >
                            <Space align="center" size="middle">
                              <div
                                style={{
                                  width: 52,
                                  height: 52,
                                  borderRadius: 12,
                                  background: "#2563EB",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                                }}
                              >
                                <FileSearchOutlined style={{ fontSize: 24, color: "#FFFFFF" }} />
                              </div>
                              <div>
                                <Text type="secondary" style={{ fontSize: 13 }}>Tổng tin đăng</Text>
                                <div style={{ fontSize: 26, fontWeight: 700, color: "#0F172A", lineHeight: 1.2 }}>
                                  {profileData?.stats?.totalJobsPosted || 0}
                                </div>
                              </div>
                            </Space>
                          </Card>
                        </Col>

                        <Col xs={24} sm={8}>
                          <Card
                            bodyStyle={{ padding: 24 }}
                            style={{
                              borderRadius: appTheme.radius.md,
                              border: "1px solid #E2E8F0",
                              background: "linear-gradient(135deg, #FFFFFF 0%, #F0FDF4 100%)",
                            }}
                          >
                            <Space align="center" size="middle">
                              <div
                                style={{
                                  width: 52,
                                  height: 52,
                                  borderRadius: 12,
                                  background: "#10B981",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)",
                                }}
                              >
                                <TeamOutlined style={{ fontSize: 24, color: "#FFFFFF" }} />
                              </div>
                              <div>
                                <Text type="secondary" style={{ fontSize: 13 }}>Đơn ứng tuyển</Text>
                                <div style={{ fontSize: 26, fontWeight: 700, color: "#0F172A", lineHeight: 1.2 }}>
                                  {profileData?.stats?.totalApplications || 0}
                                </div>
                              </div>
                            </Space>
                          </Card>
                        </Col>

                        <Col xs={24} sm={8}>
                          <Card
                            bodyStyle={{ padding: 24 }}
                            style={{
                              borderRadius: appTheme.radius.md,
                              border: "1px solid #E2E8F0",
                              background: "linear-gradient(135deg, #FFFFFF 0%, #FFFBEB 100%)",
                            }}
                          >
                            <Space align="center" size="middle">
                              <div
                                style={{
                                  width: 52,
                                  height: 52,
                                  borderRadius: 12,
                                  background: "#F59E0B",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  boxShadow: "0 4px 12px rgba(245, 158, 11, 0.25)",
                                }}
                              >
                                <SolutionOutlined style={{ fontSize: 24, color: "#FFFFFF" }} />
                              </div>
                              <div>
                                <Text type="secondary" style={{ fontSize: 13 }}>Lịch phỏng vấn</Text>
                                <div style={{ fontSize: 26, fontWeight: 700, color: "#0F172A", lineHeight: 1.2 }}>
                                  {profileData?.stats?.totalInterviewsScheduled || 0}
                                </div>
                              </div>
                            </Space>
                          </Card>
                        </Col>
                      </Row>

                      {/* Recent Jobs Table */}
                      <Card
                        type="inner"
                        title={
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Space align="center">
                              <FileTextOutlined style={{ color: "#2563EB" }} />
                              <span style={{ fontSize: 15, fontWeight: 600, color: "#0F172A" }}>
                                Tin tuyển dụng mới nhất
                              </span>
                            </Space>
                            <Button type="link" onClick={() => navigate("/recruiter/jobs")} style={{ padding: 0 }}>
                              Xem tất cả tin đăng <RightOutlined />
                            </Button>
                          </div>
                        }
                        style={{ borderRadius: appTheme.radius.md, border: "1px solid #E2E8F0" }}
                        bodyStyle={{ padding: 0 }}
                      >
                        <Table
                          dataSource={profileData?.recentJobs || []}
                          columns={jobColumns}
                          rowKey="jobId"
                          pagination={false}
                          bordered={false}
                          size="middle"
                        />
                      </Card>
                    </Space>
                  ),
                },
              ]}
            />
          </Card>
        </Space>
      )}
    </PageContainer>
  );
}
