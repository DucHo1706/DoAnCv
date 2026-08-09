import axios from "axios";
import axiosClient from "../../../services/axiosClient";

export type CandidateAiDataStatus = "ready" | "partial" | "missing" | "error" | "invalid";
export type CandidateRankingSortType = "overall" | "criterion";

export interface CandidateCriterionDefinition {
  criterionName: string;
  weight: number;
  maxScore: number;
}

export interface CandidateCriterionResult {
  criterionName: string;
  weight: number;
  maxScore: number;
  score: number | null;
  comment: string;
  hasData: boolean;
}

export interface CandidateRankingItem {
  applicationId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  jobId: string;
  jobTitle: string;
  applicationStatus: string;
  appliedAt: string;
  cvUrl: string;
  aiScore: number | null;
  overallRank: number | null;
  selectedCriterionRank: number | null;
  classification: string;
  summary: string;
  aiDataStatus: CandidateAiDataStatus;
  aiDataMessage: string;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  degree: string;
  major: string;
  university: string;
  yearsOfExperience: number | null;
  certificates: string[];
  criteriaResults: CandidateCriterionResult[];
}

export interface CandidateRankingResponse {
  jobId: string;
  jobTitle: string;
  availableCriteria: CandidateCriterionDefinition[];
  candidates: CandidateRankingItem[];
  sortBy: CandidateRankingSortType;
  criterionName: string | null;
  search: string;
}

export interface CandidateRankingQuery {
  sortBy: CandidateRankingSortType;
  criterionName?: string;
  search?: string;
  skill?: string;
  minScore?: number;
  minYearsOfExperience?: number;
}

export interface CompareCandidatesRequest {
  jobId: string;
  applicationIds: string[];
}

export interface CandidateComparisonResponse {
  jobId: string;
  jobTitle: string;
  availableCriteria: CandidateCriterionDefinition[];
  candidates: CandidateRankingItem[];
}

export const candidateComparisonService = {
  async getCandidateRankings(
    jobId: string,
    query: CandidateRankingQuery
  ): Promise<CandidateRankingResponse> {
    const response = await axiosClient.get<CandidateRankingResponse>(
      `/recruiter/jobs/${jobId}/candidate-rankings`,
      {
        params: query,
      }
    );

    return normalizeRankingResponse(response.data);
  },

  async compareCandidates(
    request: CompareCandidatesRequest
  ): Promise<CandidateComparisonResponse> {
    const response = await axiosClient.post<CandidateComparisonResponse>(
      "/recruiter/candidates/compare",
      request
    );

    return normalizeComparisonResponse(response.data);
  },
};

export function isCandidateEligibleForComparison(candidate: CandidateRankingItem): boolean {
  if (candidate.aiDataStatus === "ready") {
    return true;
  }

  if (candidate.aiDataStatus !== "partial") {
    return false;
  }

  if (candidate.aiScore != null) {
    return true;
  }

  return candidate.criteriaResults.some(
    (criterion) =>
      criterion.hasData === true &&
      criterion.score != null &&
      criterion.maxScore > 0
  );
}

export function getCandidateComparisonErrorMessage(
  error: unknown,
  fallbackMessage: string
): string {
  if (axios.isAxiosError(error)) {
    const responseMessage = getResponseMessage(error.response?.data);
    if (responseMessage.length > 0) {
      return responseMessage;
    }

    const status = error.response?.status;
    if (status === 400) {
      return "Dữ liệu yêu cầu không hợp lệ. Vui lòng kiểm tra lại lựa chọn.";
    }

    if (status === 401) {
      return "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.";
    }

    if (status === 403) {
      return "Bạn không có quyền truy cập dữ liệu tuyển dụng này.";
    }

    if (status === 404) {
      return "Không tìm thấy công việc hoặc hồ sơ trong phạm vi được phép truy cập.";
    }

    if (status != null && status >= 500) {
      return "Hệ thống đang gặp lỗi khi tải dữ liệu ứng viên. Vui lòng thử lại sau.";
    }

    if (error.request != null && error.response == null) {
      return "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.";
    }
  }

  if (error instanceof Error && error.message.includes("Access forbidden")) {
    return "Bạn không có quyền truy cập dữ liệu tuyển dụng này.";
  }

  if (error instanceof Error && error.message.includes("Authentication expired")) {
    return "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.";
  }

  return fallbackMessage;
}

function normalizeRankingResponse(response: CandidateRankingResponse): CandidateRankingResponse {
  const comparisonResponse = normalizeComparisonResponse(response);
  let sortBy: CandidateRankingSortType = "overall";
  if (response?.sortBy === "criterion") {
    sortBy = "criterion";
  }

  return {
    ...comparisonResponse,
    sortBy,
    criterionName: typeof response?.criterionName === "string" ? response.criterionName : null,
    search: typeof response?.search === "string" ? response.search : "",
  };
}

function normalizeComparisonResponse(
  response: CandidateComparisonResponse
): CandidateComparisonResponse {
  const candidateValues: unknown = response?.candidates;
  const criteriaValues: unknown = response?.availableCriteria;
  const candidates = Array.isArray(candidateValues)
    ? candidateValues.filter(isRecord).map(normalizeCandidate)
    : [];
  const availableCriteria = Array.isArray(criteriaValues)
    ? criteriaValues
        .map((criterion) => normalizeCriterionDefinition(criterion))
        .filter((criterion) => criterion.criterionName.length > 0)
    : [];

  return {
    jobId: getString(response?.jobId),
    jobTitle: getString(response?.jobTitle),
    availableCriteria,
    candidates,
  };
}

function normalizeCandidate(candidateValue: unknown): CandidateRankingItem {
  const candidate = isRecord(candidateValue) ? candidateValue : {};
  const matchedSkills = normalizeStringArray(candidate.matchedSkills);
  const missingSkills = normalizeStringArray(candidate.missingSkills);
  const strengths = normalizeStringArray(candidate.strengths);
  const weaknesses = normalizeStringArray(candidate.weaknesses);
  const certificates = normalizeStringArray(candidate.certificates);
  const criteriaResultValues: unknown = candidate.criteriaResults;
  const criteriaResultsAreValid = Array.isArray(criteriaResultValues);
  const criteriaResultItemsAreValid =
    criteriaResultsAreValid && criteriaResultValues.every(isRecord);
  const criteriaResults = criteriaResultsAreValid
    ? criteriaResultValues
        .map((criterion) => normalizeCriterionResult(criterion))
        .filter((criterion) => criterion.criterionName.length > 0)
    : [];

  let aiDataStatus = normalizeAiDataStatus(candidate.aiDataStatus);
  const requiredArraysAreValid =
    matchedSkills.isValid &&
    missingSkills.isValid &&
    strengths.isValid &&
    weaknesses.isValid &&
    criteriaResultsAreValid &&
    criteriaResultItemsAreValid;

  let aiDataMessage = getString(candidate.aiDataMessage);
  if (
    requiredArraysAreValid === false &&
    aiDataStatus !== "missing" &&
    aiDataStatus !== "error"
  ) {
    aiDataStatus = "invalid";
    aiDataMessage = "Response dữ liệu AI không đúng cấu trúc mong đợi.";
  }

  return {
    applicationId: getString(candidate.applicationId),
    candidateId: getString(candidate.candidateId),
    candidateName: getString(candidate.candidateName),
    candidateEmail: getString(candidate.candidateEmail),
    candidatePhone: getString(candidate.candidatePhone),
    jobId: getString(candidate.jobId),
    jobTitle: getString(candidate.jobTitle),
    applicationStatus: getString(candidate.applicationStatus),
    appliedAt: getString(candidate.appliedAt),
    cvUrl: getString(candidate.cvUrl),
    aiScore: getNullableNumber(candidate.aiScore),
    overallRank: getNullableNumber(candidate.overallRank),
    selectedCriterionRank: getNullableNumber(candidate.selectedCriterionRank),
    classification: getString(candidate.classification),
    summary: getString(candidate.summary),
    aiDataStatus,
    aiDataMessage,
    matchedSkills: matchedSkills.values,
    missingSkills: missingSkills.values,
    strengths: strengths.values,
    weaknesses: weaknesses.values,
    degree: getString(candidate.degree),
    major: getString(candidate.major),
    university: getString(candidate.university),
    yearsOfExperience: getNullableNumber(candidate.yearsOfExperience),
    certificates: certificates.values,
    criteriaResults,
  };
}

function normalizeCriterionDefinition(
  criterionValue: unknown
): CandidateCriterionDefinition {
  const criterion = isRecord(criterionValue) ? criterionValue : {};

  return {
    criterionName: getString(criterion.criterionName),
    weight: getNumberOrZero(criterion.weight),
    maxScore: getNumberOrZero(criterion.maxScore),
  };
}

function normalizeCriterionResult(
  criterionValue: unknown
): CandidateCriterionResult {
  const criterion = isRecord(criterionValue) ? criterionValue : {};
  const score = getNullableNumber(criterion.score);
  let hasData = score != null;
  if (typeof criterion.hasData === "boolean") {
    hasData = criterion.hasData;
  }

  return {
    criterionName: getString(criterion.criterionName),
    weight: getNumberOrZero(criterion.weight),
    maxScore: getNumberOrZero(criterion.maxScore),
    score,
    comment: getString(criterion.comment),
    hasData,
  };
}

function normalizeStringArray(value: unknown): { values: string[]; isValid: boolean } {
  if (Array.isArray(value) === false) {
    return { values: [], isValid: false };
  }

  const values = value.filter((item): item is string => typeof item === "string");
  return {
    values,
    isValid: values.length === value.length,
  };
}

function normalizeAiDataStatus(value: unknown): CandidateAiDataStatus {
  if (
    value === "ready" ||
    value === "partial" ||
    value === "missing" ||
    value === "error" ||
    value === "invalid"
  ) {
    return value;
  }

  return "invalid";
}

function getResponseMessage(value: unknown): string {
  if (isRecord(value) && typeof value.message === "string") {
    return value.message;
  }

  return "";
}

function getString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function getNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return null;
}

function getNumberOrZero(value: unknown): number {
  return getNullableNumber(value) ?? 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value != null && Array.isArray(value) === false;
}
