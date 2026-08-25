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
  pending: "Đang chờ phân tích",
  processing: "Đang phân tích",
  retryscheduled: "Sẽ tự động thử lại",
  completed: "Đã phân tích",
  failed: "Chưa hoàn tất phân tích",
  cancelrequested: "Đang hủy phân tích",
  cancelled: "Đã hủy phân tích",
  notscheduled: "Chưa xếp lịch phân tích",
  ready: "Dữ liệu AI sẵn sàng",
  error: "Dữ liệu AI bị lỗi",
};

export const SOURCING_STAGE_LABELS: Record<string, string> = {
  saved: "Đã lưu",
  reviewed: "Đã xem xét",
  contactplanned: "Dự kiến liên hệ",
  contacted: "Đã liên hệ",
  responded: "Đã phản hồi",
  interested: "Quan tâm",
  screening: "Sàng lọc",
  interview: "Phỏng vấn",
  archived: "Đã lưu trữ",
  notsuitable: "Chưa phù hợp",
};

export const SOURCING_PRIORITY_LABELS: Record<string, string> = {
  low: "Thấp",
  normal: "Bình thường",
  high: "Cao",
};

const normalize = (status?: string | null) => (status ?? "").trim().toLowerCase();

export const getApplicationStatusLabel = (status?: string | null) =>
  APPLICATION_STATUS_LABELS[normalize(status)] ?? "Chưa xác định";

export const getJobStatusLabel = (status?: string | null) =>
  JOB_STATUS_LABELS[normalize(status)] ?? "Chưa xác định";

export const getAiStatusLabel = (status?: string | null) =>
  AI_STATUS_LABELS[normalize(status)] ?? "Chưa xác định";

export const getSourcingStageLabel = (stage?: string | null) =>
  SOURCING_STAGE_LABELS[normalize(stage).replace(/[\s_-]/g, "")] ?? "Chưa phân loại";

export const getSourcingPriorityLabel = (priority?: string | null) =>
  SOURCING_PRIORITY_LABELS[normalize(priority)] ?? "Bình thường";
