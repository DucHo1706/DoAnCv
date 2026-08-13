import { useCallback, useEffect, useState } from "react";
import { message } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { recruitmentService, type ApplicationDto } from "../../../../../services/recruitmentService";
import { downloadElementAsPdf } from "../../../../../utils/exportUtils";

export function useCandidateDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [candidate, setCandidate] = useState<ApplicationDto | null>(null);
  const [loading, setLoading] = useState(true);

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

  const handleExportPDF = async () => {
    const element = document.getElementById("ai-report-printable-area");
    if (!element) {
      message.error("Không tìm thấy vùng báo cáo để xuất!");
      return;
    }
    const hideMessage = message.loading("Đang khởi tạo tệp PDF báo cáo AI...", 0);
    try {
      const safeName = (candidate?.candidateName || "UngVien").replace(/[\\/:*?"<>|]+/g, "-");
      await downloadElementAsPdf(element, `BaoCao_AI_${safeName}.pdf`, [15, 15, 15, 15]);
      message.success("Xuất báo cáo PDF thành công!");
    } catch (error) {
      console.error(error);
      message.error("Có lỗi xảy ra khi xuất PDF!");
    } finally {
      hideMessage();
    }
  };

  useEffect(() => {
    fetchDetail(true);
  }, [fetchDetail]);

  const parsed = getParsedAnalysis(candidate);

  return {
    navigate,
    id,
    candidate,
    loading,
    parsed,
    handleExportPDF,
  };
}
