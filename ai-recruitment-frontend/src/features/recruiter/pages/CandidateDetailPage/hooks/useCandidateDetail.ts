import { useCallback, useEffect, useState } from "react";
import { message } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { recruitmentService, type ApplicationDto } from "../../../../../services/recruitmentService";

export function useCandidateDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [candidate, setCandidate] = useState<ApplicationDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [reEvaluating, setReEvaluating] = useState(false);
  const [evalProgress, setEvalProgress] = useState<number | null>(null);
  const [evalStatusText, setEvalStatusText] = useState<string>("");

  const getParsedAnalysis = (app: ApplicationDto | null) => {
    if (!app || !app.aiReason) return null;
    if (typeof app.aiReason === "object" && !Array.isArray(app.aiReason)) return app.aiReason;
    try {
      let reasonStr = String(app.aiReason).trim();
      const firstBrace = reasonStr.indexOf("{");
      if (firstBrace > 0) reasonStr = reasonStr.substring(firstBrace);
      if (reasonStr.startsWith("{")) {
        return JSON.parse(reasonStr);
      }
    } catch {
      return null;
    }
    return null;
  };

  const fetchDetail = useCallback(
    async (showLoading = false) => {
      try {
        if (showLoading) setLoading(true);
        if (!id) {
          setCandidate(null);
          return null;
        }

        const found = await recruitmentService.getHrApplicationDetail(id);
        setCandidate(found || null);
        return found;
      } catch (error: unknown) {
        const err = error as { response?: { status?: number } };
        const errMsg =
          err?.response?.status === 403
            ? "Bạn không có quyền truy cập hồ sơ này (403). Vui lòng đăng nhập lại."
            : err?.response?.status === 401
              ? "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại."
              : "Lỗi khi tải chi tiết hồ sơ";
        message.error(errMsg);
        return null;
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [id]
  );

  const handleExportPDF = () => {
    const element = document.getElementById("ai-report-printable-area");
    if (!element) {
      message.error("Không tìm thấy vùng báo cáo để xuất!");
      return;
    }
    const hideMessage = message.loading("Đang khởi tạo tệp PDF báo cáo AI...", 0);
    element.style.display = "block";
    import("html2pdf.js")
      .then((html2pdfModule) => {
        const html2pdf = html2pdfModule.default || html2pdfModule;
        const opt = {
          margin: [15, 15, 15, 15] as [number, number, number, number],
          filename: `BaoCao_AI_${candidate?.candidateName || "UngVien"}.pdf`,
          image: { type: "jpeg" as const, quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
        };

        html2pdf()
          .set(opt)
          .from(element)
          .save()
          .then(() => {
            element.style.display = "none";
            hideMessage();
            message.success("Xuất báo cáo PDF thành công!");
          })
          .catch((err: unknown) => {
            console.error(err);
            element.style.display = "none";
            hideMessage();
            message.error("Có lỗi xảy ra khi xuất PDF!");
          });
      })
      .catch(() => {
        element.style.display = "none";
        hideMessage();
        message.error("Không thể tải thư viện xuất PDF!");
      });
  };

  const handleReEvaluate = async () => {
    if (!id) return;
    setReEvaluating(true);
    setEvalProgress(10);
    setEvalStatusText("Khởi chạy quy trình phân tích AI...");

    message.loading({
      content: "Đang gửi yêu cầu phân tích lại cho AI...",
      key: "reeval",
    });
    try {
      await recruitmentService.reEvaluateApplication(id);
      message.success({
        content: "Đã kích hoạt AI chạy lại thành công! Hệ thống đang phân tích...",
        key: "reeval",
        duration: 3,
      });

      let attempts = 0;
      const maxAttempts = 20;
      const intervalId = setInterval(async () => {
        attempts++;
        const updatedCandidate = await fetchDetail(false);
        const parsedReport = getParsedAnalysis(updatedCandidate || null);

        if (parsedReport || attempts >= maxAttempts) {
          clearInterval(intervalId);
          setReEvaluating(false);
          setEvalProgress(null);
          if (parsedReport) {
            message.success("Đã hoàn tất phân tích và cập nhật báo cáo AI chi tiết mới! 🎉");
          } else {
            message.warning("Yêu cầu AI phân tích lại đang chạy ngầm hoặc gặp gián đoạn. Hãy tải lại trang sau.");
          }
        }
      }, 3000);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const errMsg = err?.response?.data?.message || "Không thể yêu cầu AI phân tích lại.";
      message.error({ content: errMsg, key: "reeval" });
      setReEvaluating(false);
      setEvalProgress(null);
    }
  };

  useEffect(() => {
    fetchDetail(true);
  }, [fetchDetail]);

  useEffect(() => {
    if (!id || !reEvaluating) return;

    let connection: {
      stop: () => Promise<void>;
      on: (event: string, cb: (...args: unknown[]) => void) => void;
      start: () => Promise<void>;
      invoke: (method: string, ...args: unknown[]) => Promise<void>;
    } | null = null;
    let isSubscribed = true;

    const startSignalR = async () => {
      try {
        const signalR = await import("@microsoft/signalr");
        const apiBase = import.meta.env.VITE_API_URL || "/api";
        const hubUrl = apiBase.replace(/\/api\/?$/, "") + "/hubs/ai-evaluation";
        const hubConn = new signalR.HubConnectionBuilder()
          .withUrl(hubUrl)
          .withAutomaticReconnect()
          .build();
        connection = hubConn;

        hubConn.on("ReceiveProgress", (data: { progress: number; stage: string; message: string }) => {
          if (!isSubscribed) return;
          setEvalProgress(data.progress);
          setEvalStatusText(data.message || data.stage);
        });

        hubConn.on("ReceiveResult", (data: { aiStatus: string; message?: string }) => {
          if (!isSubscribed) return;
          if (data.aiStatus === "Success") {
            setEvalProgress(100);
            setEvalStatusText("Đã hoàn tất phân tích AI! ");
            fetchDetail(false);
            setTimeout(() => {
              if (isSubscribed) {
                setReEvaluating(false);
                setEvalProgress(null);
              }
            }, 800);
          } else {
            message.error(data.message || "Phân tích AI thất bại.");
            setReEvaluating(false);
            setEvalProgress(null);
          }
        });

        await hubConn.start();
        await hubConn.invoke("JoinApplicationGroup", id);
      } catch (err: unknown) {
        console.warn("[SignalR] Connection failed, falling back to polling.", err);
      }
    };

    startSignalR();

    return () => {
      isSubscribed = false;
      if (connection) {
        connection.stop().catch((err: unknown) => console.error("[SignalR] Stop error", err));
      }
    };
  }, [fetchDetail, id, reEvaluating]);

  const parsed = getParsedAnalysis(candidate);

  return {
    navigate,
    id,
    candidate,
    loading,
    reEvaluating,
    evalProgress,
    evalStatusText,
    parsed,
    handleExportPDF,
    handleReEvaluate,
  };
}
