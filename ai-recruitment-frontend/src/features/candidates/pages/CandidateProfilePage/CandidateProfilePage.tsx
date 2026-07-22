import { useEffect, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  Col,
  Row,
  Spin,
  Tabs,
  Tag,
  Typography,
  message,
  Form,
  Upload,
  Progress,
} from "antd";
import {
  CheckCircleOutlined,
  UserOutlined,
  SolutionOutlined,
  SettingOutlined,
  LockOutlined,
  DatabaseOutlined,
  CameraOutlined,
} from "@ant-design/icons";
import PageContainer from "../../../../components/common/PageContainer";
import axiosClient from "../../../../services/axiosClient";
import { authService } from "../../../../services/authService";
import dayjs from "dayjs";
import { ApplicationHistoryTab } from "./components/ApplicationHistoryTab";
import { PersonalInfoTab } from "./components/PersonalInfoTab";
import { DefaultCvTab } from "./components/DefaultCvTab";
import { CapabilitiesTab } from "./components/CapabilitiesTab";
import { AccountSecurityTab } from "./components/AccountSecurityTab";
import AiDetailedTabs from "../../../../components/ai-report/AiDetailedTabs";

const { Title, Text } = Typography;

function CandidateProfilePage() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [selectedAppForReport, setSelectedAppForReport] = useState<any>(null);
  const [form] = Form.useForm();
  
  const user = authService.getCurrentUser();

  const getParsedAnalysis = (app: any) => {
    if (!app || !app.aiReason) return null;
    if (typeof app.aiReason === "object" && !Array.isArray(app.aiReason)) return app.aiReason;
    try {
      let reasonStr = String(app.aiReason).trim();
      const firstBrace = reasonStr.indexOf("{");
      if (firstBrace > 0) reasonStr = reasonStr.substring(firstBrace);
      if (reasonStr.startsWith("{")) {
        return JSON.parse(reasonStr);
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  const fetchMyApplications = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/Recruitment/my-applications");
      const data = res.data;
      setApplications(Array.isArray(data) ? data : data?.$values || []);
    } catch (error) {
      message.error("Lỗi khi tải lịch sử ứng tuyển.");
    } finally {
      setLoading(false);
    }
  };

  const handleReEvaluate = async (applicationId: string) => {
    try {
      message.loading({ content: "Đang gửi yêu cầu phân tích lại cho AI...", key: "reevaluate", duration: 0 });
      await axiosClient.post(`/Recruitment/hr/applications/${applicationId}/re-evaluate`);
      message.success({ content: "Đã gửi yêu cầu thành công! AI đang phân tích lại CV của bạn.", key: "reevaluate", duration: 3 });
      
      // Reload applications list after a small delay to allow background processing
      setTimeout(() => {
        fetchMyApplications();
      }, 3000);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Lỗi khi yêu cầu AI chấm điểm lại.";
      message.error({ content: errMsg, key: "reevaluate", duration: 3 });
    }
  };

  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
      const res = await axiosClient.get("/profile");
      setProfile(res.data);
      form.setFieldsValue({
        fullName: res.data.fullName,
        phone: res.data.phone,
        dob: res.data.dob ? dayjs(res.data.dob) : null,
        gender: res.data.gender || "Nam",
        address: res.data.address || "",
      });
    } catch (error) {
      message.error("Không tải được thông tin cá nhân.");
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchMyApplications();
    fetchProfile();
  }, []);

  // Real-time updates using SignalR
  useEffect(() => {
    if (!applications || applications.length === 0) return;

    let connection: any = null;
    let isSubscribed = true;

    const startSignalR = async () => {
      try {
        const signalR = await import("@microsoft/signalr");
        const apiBase = import.meta.env.VITE_API_URL || "https://localhost:7006/api";
        const hubUrl = apiBase.replace(/\/api\/?$/, "") + "/hubs/ai-evaluation";
        connection = new signalR.HubConnectionBuilder()
          .withUrl(hubUrl)
          .withAutomaticReconnect()
          .build();

        connection.on("ReceiveStatusUpdate", (data: { applicationId: string; status: string }) => {
          if (!isSubscribed) return;
          message.info("Trạng thái đơn ứng tuyển của bạn vừa được cập nhật! 🔔");
          fetchMyApplications();
        });

        connection.on("ReceiveResult", () => {
          if (!isSubscribed) return;
          message.success("AI đã hoàn tất đánh giá hồ sơ của bạn! 🎉");
          fetchMyApplications();
          fetchProfile(); // reload profile to update capabilities sidebar
        });

        await connection.start();

        for (const app of applications) {
          const appId = app.id || app.applicationId;
          if (appId) {
            await connection.invoke("JoinApplicationGroup", appId);
          }
        }
        console.log("[SignalR] Profile Page joined application groups.");
      } catch (err) {
        console.warn("[SignalR] Connection failed in Profile Page", err);
      }
    };

    startSignalR();

    return () => {
      isSubscribed = false;
      if (connection) {
        connection.stop().catch((err: any) => console.error("[SignalR] Stop error", err));
      }
    };
  }, [applications.length]);

  const handleUpdateProfile = async (values: any) => {
    try {
      setSubmittingProfile(true);
      await axiosClient.put("/profile", {
        fullName: values.fullName,
        phone: values.phone,
        dob: values.dob ? values.dob.format("YYYY-MM-DD") : null,
        gender: values.gender,
        address: values.address,
      });
      message.success("Cập nhật thông tin cá nhân thành công!");
      
      setProfile((prev: any) => ({
        ...prev,
        fullName: values.fullName,
        phone: values.phone,
        dob: values.dob ? values.dob.toISOString() : null,
        gender: values.gender,
        address: values.address,
      }));

      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        currentUser.fullName = values.fullName;
        localStorage.setItem("user", JSON.stringify(currentUser));
      }
    } catch (error) {
      message.error("Lỗi khi cập nhật thông tin cá nhân.");
    } finally {
      setSubmittingProfile(false);
    }
  };

  const handleAvatarUpload = async (info: any) => {
    const file = info.file;
    const formData = new FormData();
    formData.append("file", file);

    try {
      message.loading({ content: "Đang tải ảnh đại diện lên...", key: "avatar_upload" });
      const res = await axiosClient.post("/profile/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setProfile((prev: any) => ({ ...prev, avatarUrl: res.data.avatarUrl }));
      
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        currentUser.avatarUrl = res.data.avatarUrl;
        localStorage.setItem("user", JSON.stringify(currentUser));
      }
      message.success({ content: "Cập nhật ảnh đại diện thành công!", key: "avatar_upload" });
    } catch (err) {
      message.error({ content: "Lỗi khi cập nhật ảnh đại diện.", key: "avatar_upload" });
    }
  };

  const handleCvUpload = async (info: any) => {
    const file = info.file;
    const formData = new FormData();
    formData.append("file", file);

    try {
      message.loading({ content: "Đang tải CV mặc định lên...", key: "cv_upload" });
      const res = await axiosClient.post("/profile/cv", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      message.success({ content: "Tải lên CV mặc định thành công! Đang đồng bộ hóa hồ sơ...", key: "cv_upload" });
      fetchProfile();
    } catch (err) {
      message.error({ content: "Lỗi khi tải lên CV mặc định.", key: "cv_upload" });
    }
  };

  // Calculate profile completion percentage
  const profileCompletion = (() => {
    let score = 20; // Default base registered score
    if (profile?.defaultCvUrl) score += 40;
    if (profile?.phone && profile?.address) score += 20;
    
    let skillsList: string[] = [];
    if (profile?.cvExtractedSkills) {
      try {
        skillsList = JSON.parse(profile.cvExtractedSkills);
      } catch {
        skillsList = [];
      }
    }
    if (skillsList.length > 0) score += 20;
    return score;
  })();

  return (
    <PageContainer title="Hồ sơ của tôi" subtitle="Quản lý thông tin cá nhân và lịch sử ứng tuyển">
      <Row gutter={[24, 24]}>
        {/* Cột trái: Thông tin cá nhân cơ bản */}
        <Col xs={24} md={8} lg={6}>
          <Card
            style={{
              textAlign: "center",
              borderRadius: 16,
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            }}
          >
            {/* Visual Hover-to-Upload Avatar container */}
            <div 
              style={{ 
                position: "relative", 
                width: 100, 
                height: 100, 
                margin: "0 auto 16px", 
                cursor: "pointer",
                borderRadius: "50%",
                overflow: "hidden",
                border: "2px solid #2563EB"
              }}
              className="avatar-hover-container"
            >
              <Upload
                showUploadList={false}
                beforeUpload={() => false}
                onChange={handleAvatarUpload}
                accept="image/*"
              >
                <div style={{ position: "relative", width: 100, height: 100 }}>
                  {profile?.avatarUrl ? (
                    <Avatar
                      size={100}
                      src={profile.avatarUrl}
                      style={{ border: "none" }}
                    />
                  ) : (
                    <Avatar
                      size={100}
                      icon={<UserOutlined />}
                      style={{ backgroundColor: "#2563EB", border: "none" }}
                    />
                  )}
                  {/* Dark hover overlay */}
                  <div 
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      background: "rgba(15, 23, 42, 0.65)",
                      color: "#FFFFFF",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      opacity: 0,
                      transition: "opacity 0.25s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "1";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "0";
                    }}
                  >
                    <CameraOutlined style={{ fontSize: 18, marginBottom: 4 }} />
                    <span style={{ fontSize: 11, fontWeight: 500 }}>Thay ảnh</span>
                  </div>
                </div>
              </Upload>
            </div>

            <Title level={4} style={{ margin: "12px 0 4px" }}>
              {profile?.fullName || user?.fullName || "Ứng viên"}
            </Title>
            <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>{user?.email || "Chưa cập nhật email"}</Text>

            {/* AI Profile Completion tracker */}
            <div style={{ margin: "16px 0 24px", padding: "0 8px", textAlign: "left" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>Hoàn thiện hồ sơ AI</Text>
                <Text strong style={{ fontSize: 12, color: "#2563EB" }}>{profileCompletion}%</Text>
              </div>
              <Progress 
                percent={profileCompletion} 
                showInfo={false} 
                strokeColor="#2563EB" 
                trailColor="#E2E8F0" 
                size="small" 
                style={{ margin: 0 }}
              />
            </div>

            <div
              style={{
                marginTop: 16,
                textAlign: "left",
                background: "#f8fafc",
                padding: 16,
                borderRadius: 8,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <Text type="secondary">Loại tài khoản</Text>
                <Tag color="blue" style={{ margin: 0 }}>
                  Candidate
                </Tag>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text type="secondary">Đã ứng tuyển</Text>
                <Text strong>{applications.length} công việc</Text>
              </div>
            </div>
          </Card>
        </Col>

        {/* Cột phải: Tabs quản lý thông tin hoặc Báo cáo AI */}
        <Col xs={24} md={16} lg={18}>
          {selectedAppForReport ? (
            <Card 
              style={{ borderRadius: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
              bodyStyle={{ padding: "24px" }}
            >
              <div style={{ marginBottom: 24 }}>
                <Button
                  type="primary"
                  ghost
                  onClick={() => setSelectedAppForReport(null)}
                  style={{ borderRadius: 8 }}
                >
                  ← Quay lại lịch sử ứng tuyển
                </Button>
              </div>
              {(() => {
                const parsed = getParsedAnalysis(selectedAppForReport);
                return parsed ? (
                  <AiDetailedTabs parsedAnalysis={parsed} />
                ) : (
                  <div style={{ textAlign: "center", padding: "60px 0" }}>
                    <Spin tip="Đang đọc kết quả đánh giá hồ sơ..." />
                  </div>
                );
              })()}
            </Card>
          ) : (
            <Card style={{ borderRadius: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
              <Tabs defaultActiveKey="1" size="large">
                <Tabs.TabPane
                  tab={
                    <span>
                      <DatabaseOutlined />
                      Năng lực & Kỹ năng
                    </span>
                  }
                  key="1"
                >
                  <CapabilitiesTab profile={profile} onRefreshProfile={fetchProfile} />
                </Tabs.TabPane>

                <Tabs.TabPane
                  tab={
                    <span>
                      <CheckCircleOutlined />
                      Lịch sử ứng tuyển
                    </span>
                  }
                  key="2"
                >
                  <div style={{ marginTop: 12 }}>
                    <ApplicationHistoryTab 
                      loading={loading} 
                      applications={applications} 
                      onViewReport={setSelectedAppForReport} 
                      onReEvaluate={handleReEvaluate}
                    />
                  </div>
                </Tabs.TabPane>

                <Tabs.TabPane
                  tab={
                    <span>
                      <SolutionOutlined />
                      Thông tin cá nhân
                    </span>
                  }
                  key="3"
                >
                  {profileLoading ? (
                    <div style={{ textAlign: "center", padding: 40 }}>
                      <Spin />
                    </div>
                  ) : (
                    <PersonalInfoTab
                      form={form}
                      submittingProfile={submittingProfile}
                      onFinish={handleUpdateProfile}
                      profile={profile}
                    />
                  )}
                </Tabs.TabPane>

                <Tabs.TabPane
                  tab={
                    <span>
                      <SettingOutlined />
                      Quản lý CV mẫu
                    </span>
                  }
                  key="4"
                >
                  <DefaultCvTab
                    defaultCvUrl={profile?.defaultCvUrl}
                    defaultCvName={profile?.defaultCvName}
                    onRemove={() => {
                      setProfile((prev: any) => ({
                        ...prev,
                        defaultCvUrl: null,
                        defaultCvName: null,
                      }));
                      message.success("Đã gỡ CV mẫu khỏi hồ sơ.");
                    }}
                    onUpload={handleCvUpload}
                  />
                </Tabs.TabPane>

                <Tabs.TabPane
                  tab={
                    <span>
                      <LockOutlined />
                      Bảo mật tài khoản
                    </span>
                  }
                  key="5"
                >
                  <AccountSecurityTab />
                </Tabs.TabPane>
              </Tabs>
            </Card>
          )}
        </Col>
      </Row>
    </PageContainer>
  );
}

export default CandidateProfilePage;
