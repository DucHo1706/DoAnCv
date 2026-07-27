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
  Skeleton,
  Alert,
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
import { CandidateProfileSidebar } from "./components/CandidateProfileSidebar";
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

  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchMyApplications = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const res = await axiosClient.get("/Recruitment/my-applications");
      const data = res.data;
      setApplications(Array.isArray(data) ? data : data?.$values || []);
    } catch (error) {
      setFetchError("Không thể tải lịch sử ứng tuyển. Vui lòng thử lại.");
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
        const apiBase = import.meta.env.VITE_API_URL || "https://recruitinsightai.com/api";
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

  const [activeNavKey, setActiveNavKey] = useState("1");

  const navItems = [
    {
      key: "1",
      label: "Năng lực & Kỹ năng",
      icon: <DatabaseOutlined style={{ color: "#2563EB" }} />,
    },
    {
      key: "2",
      label: "Lịch sử ứng tuyển",
      icon: <CheckCircleOutlined style={{ color: "#10B981" }} />,
    },
    {
      key: "3",
      label: "CV Mẫu Mặc Định",
      icon: <SolutionOutlined style={{ color: "#3B82F6" }} />,
    },
    {
      key: "4",
      label: "Thông tin cá nhân",
      icon: <UserOutlined style={{ color: "#6366F1" }} />,
    },
    {
      key: "5",
      label: "Bảo mật tài khoản",
      icon: <LockOutlined style={{ color: "#64748B" }} />,
    },
  ];

  const profileStyles = `
    .saas-sidebar-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 500;
      font-size: 14px;
      color: #475569;
      background: transparent;
      border-left: 3px solid transparent;
      transition: all 0.2s ease-in-out;
    }
    .saas-sidebar-item:hover {
      background: #F8FAFC;
      color: #0F172A;
    }
    .saas-sidebar-item.active {
      background: rgba(37, 99, 235, 0.08);
      color: #2563EB;
      font-weight: 600;
      border-left: 3px solid #2563EB;
    }

    @media (max-width: 768px) {
      .desktop-sidebar-card {
        display: none !important;
      }
      .mobile-segmented-bar {
        display: block !important;
        margin-bottom: 16px !important;
      }
      .ant-card-head-wrapper {
        flex-wrap: wrap !important;
        gap: 8px !important;
      }
      .ant-card-extra {
        margin-left: 0 !important;
        padding: 0 !important;
        width: 100% !important;
      }
      .ant-card-body {
        padding: 16px !important;
      }
    }
    @media (min-width: 769px) {
      .desktop-sidebar-card {
        display: block !important;
      }
      .mobile-segmented-bar {
        display: none !important;
      }
    }
  `;

  return (
    <PageContainer title="Hồ sơ của tôi" subtitle="Quản lý thông tin cá nhân và lịch sử ứng tuyển">
      <style dangerouslySetInnerHTML={{ __html: profileStyles }} />
      {fetchError && (
        <Alert
          type="error"
          showIcon
          message="Lỗi tải dữ liệu"
          description={fetchError}
          action={
            <Button size="small" type="primary" onClick={fetchMyApplications}>
              Thử lại
            </Button>
          }
          style={{ marginBottom: 20 }}
        />
      )}
      <Row gutter={[24, 24]}>
        <Col xs={24} md={8} lg={6}>
          <CandidateProfileSidebar
            profile={profile}
            user={user}
            applicationsCount={applications.length}
            profileCompletion={profileCompletion}
            activeNavKey={activeNavKey}
            navItems={navItems}
            onSelectNav={(key) => {
              setSelectedAppForReport(null);
              setActiveNavKey(key);
            }}
            onAvatarUpload={handleAvatarUpload}
          />
        </Col>

        {/* Cột phải: Khung hiển thị nội dung chi tiết */}
        <Col xs={24} md={16} lg={17}>
          {/* Thanh chọn phân đoạn trên Mobile (Mobile Only) */}
          <div className="mobile-segmented-bar" style={{ overflowX: "auto", whiteSpace: "nowrap", paddingBottom: 4 }}>
            <div style={{ display: "flex", gap: 8 }}>
              {navItems.map(item => (
                <Button
                  key={item.key}
                  type={activeNavKey === item.key ? "primary" : "default"}
                  icon={item.icon}
                  onClick={() => {
                    setSelectedAppForReport(null);
                    setActiveNavKey(item.key);
                  }}
                  style={{
                    borderRadius: 8,
                    fontWeight: activeNavKey === item.key ? 600 : 500,
                    whiteSpace: "nowrap",
                    background: activeNavKey === item.key ? "#2563EB" : "#FFFFFF"
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          {selectedAppForReport ? (
            <Card 
              style={{ borderRadius: 16, border: "1px solid #E2E8F0", boxShadow: "0 4px 20px rgba(15, 23, 42, 0.03)" }}
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
                  <Skeleton active paragraph={{ rows: 8 }} />
                );
              })()}
            </Card>
          ) : (
            <Card
              style={{
                borderRadius: 16,
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                boxShadow: "0 4px 20px rgba(15, 23, 42, 0.03)",
              }}
              bodyStyle={{ padding: "28px" }}
            >
              {activeNavKey === "1" && (
                <CapabilitiesTab profile={profile} onRefreshProfile={fetchProfile} />
              )}

              {activeNavKey === "2" && (
                <ApplicationHistoryTab 
                  loading={loading} 
                  applications={applications} 
                  onViewReport={setSelectedAppForReport} 
                  onReEvaluate={handleReEvaluate}
                />
              )}

              {activeNavKey === "3" && (
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
              )}

              {activeNavKey === "4" && (
                profileLoading ? (
                  <Skeleton active paragraph={{ rows: 6 }} />
                ) : (
                  <PersonalInfoTab
                    form={form}
                    submittingProfile={submittingProfile}
                    onFinish={handleUpdateProfile}
                    profile={profile}
                  />
                )
              )}

              {activeNavKey === "5" && (
                <AccountSecurityTab />
              )}
            </Card>
          )}
        </Col>
      </Row>
    </PageContainer>
  );
}

export default CandidateProfilePage;
