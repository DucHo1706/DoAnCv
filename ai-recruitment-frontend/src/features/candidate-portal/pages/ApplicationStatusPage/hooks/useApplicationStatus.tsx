import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { message, Modal, Spin } from "antd";
import { recruitmentService } from "../../../services/recruitmentService";

export function useApplicationStatus() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const hasHandledDeepLinkRef = useRef(false);
  const pollingTimerRef = useRef<number | null>(null);
  const processingModalRef = useRef<any>(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const normalizeApplicationsData = (data: any) => {
    if (Array.isArray(data)) {
      return data;
    }
    return data?.$values || [];
  };

  const fetchMyApps = async (showLoading = true) => {
    try {
      if (showLoading === true) {
        setLoading(true);
      }
      const data: any = await recruitmentService.getMyApplications();
      const normalizedApplications = normalizeApplicationsData(data);
      setApplications(normalizedApplications);
      return normalizedApplications;
    } catch (error) {
      message.error("Không tải được lịch sử ứng tuyển.");
      return [];
    } finally {
      if (showLoading === true) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchMyApps();
  }, []);

  // Real-time status tracker for candidates using SignalR
  useEffect(() => {
    if (applications.length === 0) return;

    let connection: any = null;
    let isSubscribed = true;

    const startSignalR = async () => {
      try {
        const signalR = await import("@microsoft/signalr");
        const apiBase = import.meta.env.VITE_API_URL || "/api";
        const hubUrl = apiBase.replace(/\/api\/?$/, "") + "/hubs/ai-evaluation";
        connection = new signalR.HubConnectionBuilder()
          .withUrl(hubUrl)
          .withAutomaticReconnect()
          .build();

        // Lắng nghe cập nhật trạng thái hồ sơ thời gian thực (Ví dụ: HR duyệt phỏng vấn/nhận việc)
        connection.on("ReceiveStatusUpdate", (data: { applicationId: string; status: string }) => {
          if (!isSubscribed) return;
          
          setApplications((prev) =>
            prev.map((app) => {
              const appId = getApplicationId(app);
              if (appId === data.applicationId) {
                return { ...app, status: data.status };
              }
              return app;
            })
          );
          
          message.info({
            content: `Hồ sơ của bạn vừa được Nhà tuyển dụng cập nhật tiến trình mới! 🔔`,
            duration: 5,
          });
        });

        // Lắng nghe khi AI hoàn tất chấm điểm ngầm
        connection.on("ReceiveResult", () => {
          if (!isSubscribed) return;
          
          fetchMyApps(false).then(() => {
            if (!isSubscribed) return;
            // Tự động đóng modal loading đang quay tròn nếu có
            closeProcessingModal();
            clearPollingTimer();
          }).catch((err: any) => console.error("Lỗi cập nhật danh sách ứng tuyển ứng viên:", err));
        });

        await connection.start();

        // Tham gia nhóm Realtime cho từng bộ hồ sơ ứng tuyển
        for (const app of applications) {
          const appId = getApplicationId(app);
          if (appId) {
            await connection.invoke("JoinApplicationGroup", appId);
          }
        }
        
        console.log("[SignalR] Candidate joined application groups for real-time tracking!");
      } catch (err: any) {
        console.warn("[SignalR] Kết nối SignalR ứng viên thất bại, sử dụng fallback.", err);
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

  const getApplicationId = (application: any) => {
    return application?.id || application?.applicationId || application?.applicationID || "";
  };

  const isAiError = (application: any) => {
    if (!application) return false;
    return application.classification === "AI_ERROR";
  };

  const isAiReady = (application: any) => {
    if (!application) return false;
    if (isAiError(application) === true) return false;
    if (application.hasAiEvaluation === true) return true;

    const classification = application.classification || "";
    if (classification && classification !== "Chưa phân loại" && classification !== "AI_ERROR") {
      return true;
    }
    if (Array.isArray(application.criteriaResults) && application.criteriaResults.length > 0) {
      return true;
    }
    const reason = application.aiReason || "";
    if (
      reason &&
      reason !== "Đang chờ phân tích" &&
      reason !== "AI đang phân tích" &&
      reason.trim().length > 0
    ) {
      return true;
    }
    return false;
  };

  const openAiDrawer = (application: any) => {
    setSelectedApp(application);
    setIsDetailModalOpen(true);
  };

  const showAiErrorModal = () => {
    Modal.error({
      title: "AI chưa thể phân tích hồ sơ",
      centered: true,
      okText: "Đóng",
      content: (
        <div style={{ marginTop: 12 }}>
          <div style={{ color: "#64748b", marginBottom: 8, fontSize: "14px" }}>
            Hệ thống AI tạm thời chưa phân tích được hồ sơ này. Có thể dịch vụ AI đang bận hoặc gặp
            lỗi kết nối.
          </div>
          <div style={{ color: "#94a3b8", fontSize: "13px" }}>
            Hồ sơ của bạn vẫn đã được gửi đến nhà tuyển dụng thành công. Bạn có thể quay lại kiểm
            tra sau.
          </div>
        </div>
      ),
    });
  };

  const clearPollingTimer = () => {
    if (pollingTimerRef.current !== null) {
      window.clearTimeout(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  };

  const closeProcessingModal = () => {
    if (processingModalRef.current) {
      processingModalRef.current.destroy();
      processingModalRef.current = null;
    }
  };

  const startPollingAiResult = (applicationId: string) => {
    clearPollingTimer();
    let retryCount = 0;
    const maxRetryCount = 30;

    const poll = async () => {
      try {
        retryCount = retryCount + 1;
        const latestApplications = await fetchMyApps(false);
        const targetApplication = latestApplications.find((application: any) => {
          return getApplicationId(application) === applicationId;
        });

        if (!targetApplication) {
          if (retryCount < maxRetryCount) {
            pollingTimerRef.current = window.setTimeout(poll, 3000);
          }
          return;
        }

        if (isAiReady(targetApplication) === true) {
          clearPollingTimer();
          closeProcessingModal();
          message.success("Quá trình AI phân tích hồ sơ đã hoàn tất.");
          setTimeout(() => {
            openAiDrawer(targetApplication);
          }, 300);
          return;
        }

        if (isAiError(targetApplication) === true) {
          clearPollingTimer();
          closeProcessingModal();
          setTimeout(() => {
            showAiErrorModal();
          }, 300);
          return;
        }

        if (retryCount >= maxRetryCount) {
          clearPollingTimer();
          closeProcessingModal();
          message.info("AI vẫn đang phân tích hồ sơ. Bạn có thể quay lại kiểm tra sau.");
          return;
        }

        pollingTimerRef.current = window.setTimeout(poll, 3000);
      } catch (error) {
        console.error("Lỗi khi polling kết quả AI:", error);
        if (retryCount < maxRetryCount) {
          pollingTimerRef.current = window.setTimeout(poll, 3000);
        }
      }
    };

    pollingTimerRef.current = window.setTimeout(poll, 3000);
  };

  const showAiProcessingModal = (application: any) => {
    const applicationId = getApplicationId(application);
    if (!applicationId) {
      message.error("Không tìm thấy mã hồ sơ ứng tuyển.");
      return;
    }
    closeProcessingModal();

    processingModalRef.current = Modal.info({
      title: "AI đang phân tích hồ sơ",
      centered: true,
      width: 560,
      okText: "Đóng",
      onOk: () => {
        clearPollingTimer();
      },
      onCancel: () => {
        clearPollingTimer();
      },
      afterClose: () => {
        processingModalRef.current = null;
      },
      content: (
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <div
            style={{
              width: 86,
              height: 86,
              borderRadius: "50%",
              background: "#f0f7ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 18px",
            }}
          >
            <Spin size="large" />
          </div>

          <div style={{ fontSize: 16, marginBottom: 8, color: "#1e293b", fontWeight: 600 }}>
            Hệ thống AI đang đọc kỹ CV của bạn, vui lòng chờ trong giây lát...
          </div>

          <div style={{ color: "#64748b", marginBottom: 16 }}>
            Hồ sơ ứng tuyển vị trí <strong>{application?.jobTitle || "này"}</strong> đã được ghi
            nhận. AI đang đối chiếu CV với tiêu chí tuyển dụng của nhà tuyển dụng.
          </div>

          <div
            style={{
              background: "#fafafa",
              border: "1px dashed #d9d9d9",
              borderRadius: 12,
              padding: 14,
              marginTop: 16,
              textAlign: "left",
            }}
          >
            <div style={{ color: "#64748b", display: "flex", flexDirection: "column", gap: 6 }}>
              <div>• Đang bóc tách thông tin CV...</div>
              <div>• Đang so khớp kỹ năng với tin tuyển dụng...</div>
              <div>• Đang chuẩn bị nhận xét và điểm phù hợp...</div>
            </div>
          </div>
        </div>
      ),
    });

    startPollingAiResult(applicationId);
  };

  const handleViewDetail = (record: any) => {
    if (isAiError(record) === true) {
      showAiErrorModal();
      return;
    }
    if (isAiReady(record) === false) {
      showAiProcessingModal(record);
      return;
    }
    openAiDrawer(record);
  };

  useEffect(() => {
    const applicationIdFromUrl = searchParams.get("showAiDetail");
    if (!applicationIdFromUrl) return;
    if (applications.length === 0) return;
    if (hasHandledDeepLinkRef.current === true) return;

    const targetApplication = applications.find((application) => {
      return getApplicationId(application) === applicationIdFromUrl;
    });
    if (!targetApplication) return;

    hasHandledDeepLinkRef.current = true;
    if (isAiError(targetApplication) === true) {
      showAiErrorModal();
    } else if (isAiReady(targetApplication) === true) {
      openAiDrawer(targetApplication);
    } else {
      showAiProcessingModal(targetApplication);
    }
    setSearchParams({}, { replace: true });
  }, [applications, searchParams]);

  useEffect(() => {
    return () => {
      clearPollingTimer();
      closeProcessingModal();
    };
  }, []);

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

  const parsed = getParsedAnalysis(selectedApp);

  return {
    applications,
    loading,
    isDetailModalOpen,
    setIsDetailModalOpen,
    selectedApp,
    setSelectedApp,
    searchText,
    setSearchText,
    statusFilter,
    setStatusFilter,
    isAiReady,
    isAiError,
    handleViewDetail,
    parsed,
  };
}
