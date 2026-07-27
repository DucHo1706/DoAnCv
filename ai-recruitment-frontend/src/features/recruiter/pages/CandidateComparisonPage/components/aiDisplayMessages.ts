import type { CandidateAiDataStatus } from "../../../../../services/candidateComparisonService";

export type CandidateAiArrayField =
  | "strengths"
  | "weaknesses"
  | "matchedSkills"
  | "missingSkills";

export function getAiArrayEmptyMessage(
  aiDataStatus: CandidateAiDataStatus,
  field: CandidateAiArrayField
): string {
  if (aiDataStatus === "ready") {
    return getReadyEmptyMessage(field);
  }

  if (aiDataStatus === "partial") {
    return getPartialEmptyMessage(field);
  }

  if (aiDataStatus === "missing") {
    return "Hồ sơ chưa được AI phân tích.";
  }

  if (aiDataStatus === "error") {
    return "Không thể lấy kết quả phân tích AI. Vui lòng thử đánh giá lại.";
  }

  if (aiDataStatus === "invalid") {
    return "Dữ liệu phân tích AI không hợp lệ.";
  }

  return "Dữ liệu AI chưa đầy đủ để đưa ra kết luận.";
}

function getReadyEmptyMessage(field: CandidateAiArrayField): string {
  if (field === "matchedSkills") {
    return "Không tìm thấy kỹ năng nào trong CV phù hợp với yêu cầu JD.";
  }

  if (field === "missingSkills") {
    return "Ứng viên đã đáp ứng đầy đủ các kỹ năng được đối chiếu trong JD.";
  }

  if (field === "weaknesses") {
    return "Không phát hiện điểm cần cải thiện rõ ràng từ dữ liệu CV hiện có.";
  }

  return "Không phát hiện điểm mạnh nổi bật từ dữ liệu CV hiện có.";
}

function getPartialEmptyMessage(field: CandidateAiArrayField): string {
  if (field === "matchedSkills") {
    return "Dữ liệu AI chưa đầy đủ để xác định kỹ năng phù hợp.";
  }

  if (field === "missingSkills") {
    return "Dữ liệu AI chưa đầy đủ để xác định kỹ năng còn thiếu.";
  }

  if (field === "weaknesses") {
    return "Dữ liệu AI chưa đầy đủ để xác định điểm cần cải thiện.";
  }

  return "Dữ liệu AI chưa đầy đủ để xác định điểm mạnh.";
}
