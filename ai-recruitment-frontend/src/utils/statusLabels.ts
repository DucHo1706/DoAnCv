export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  applied: "Đã nộp hồ sơ",
  reviewing: "Đang xem xét",
  reviewed: "Đang xem xét",
  shortlisted: "Hồ sơ đạt yêu cầu",
  interview: "Phỏng vấn",
  interviewing: "Phỏng vấn",
  offer: "Đã gửi đề nghị nhận việc",
  accepted: "Đã nhận việc",
  hired: "Đã tuyển dụng",
  rejected: "Đã từ chối",
  expired: "Đã hết hạn",
  withdrawn: "Đã rút hồ sơ",
};

export const JOB_STATUS_LABELS: Record<string, string> = {
  pending: "Chờ duyệt", published: "Đang tuyển", approved: "Đang tuyển",
  rejected: "Đã từ chối", closed: "Đã đóng", locked: "Đã khóa",
  expired: "Đã hết hạn", draft: "Bản nháp", archived: "Đã lưu trữ", flagged: "Đang kiểm duyệt",
};

export const AI_STATUS_LABELS: Record<string, string> = {
  processing: "Đang phân tích", completed: "Đã phân tích",
  failed: "Phân tích thất bại", pending: "Đang chờ phân tích",
  ready: "Dữ liệu AI sẵn sàng", error: "Dữ liệu AI bị lỗi",
};

const normalize = (status?: string | null) => (status ?? "").trim().toLowerCase();

export const getApplicationStatusLabel = (status?: string | null) =>
  APPLICATION_STATUS_LABELS[normalize(status)] ?? "Chưa xác định";

export const getJobStatusLabel = (status?: string | null) =>
  JOB_STATUS_LABELS[normalize(status)] ?? "Chưa xác định";

export const getAiStatusLabel = (status?: string | null) =>
  AI_STATUS_LABELS[normalize(status)] ?? "Chưa xác định";
