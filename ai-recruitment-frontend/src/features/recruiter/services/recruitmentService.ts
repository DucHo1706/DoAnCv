import axiosClient from "../../../services/axiosClient";

export interface SendCandidateEmailRequest {
  applicationId?: string;
  toEmail: string;
  ccEmail?: string;
  subject: string;
  body: string;
  isHtml: boolean;
  attachments?: File[];
}

export interface GenerateCandidateEmailRequest {
  emailType: "invite" | "reject";
  candidateName: string;
  jobTitle: string;
  companyName: string;
  fitScore: number;
  classification?: string;
  summary?: string;
  matchedSkills?: string[];
  missingSkills?: string[];
  rejectReason?: string | null;
  emailContext?: string;
}

export interface GenerateCandidateEmailResponse {
  message: string;
  subject: string;
  body: string;
  source?: "ai" | "template";
}

export interface CriteriaResultDto {
  criterion_name?: string;
  criterionName?: string;
  weight: number;
  score: number | null;
  max_score?: number;
  maxScore?: number;
  comment: string;
  hasData?: boolean;
  match_level?: "FULL" | "PARTIAL" | "NOT_FOUND" | "INSUFFICIENT_DATA";
  matchLevel?: "FULL" | "PARTIAL" | "NOT_FOUND" | "INSUFFICIENT_DATA";
  confidence?: number | null;
  evidence_text?: string;
  evidenceText?: string;
  evidence_section?: string;
  evidenceSection?: string;
  extracted_value?: string;
  extractedValue?: string;
  needs_verification?: boolean;
  needsVerification?: boolean;
}

export interface ApplicationDto {
  id: string;
  jobId: string;
  jobTitle: string;
  candidateName: string;
  email: string;
  phone: string;
  cvUrl: string;
  aiScore: number;
  aiReason: string;
  matchedSkills: string[] | string;
  missingSkills: string[] | string;
  classification?: string;
  criteriaResults?: CriteriaResultDto[];
  status?: string;
  appliedAt?: string;
  candidateId?: string;
  overallRank?: number | null;
  selectedCriterionRank?: number | null;
  aiDataStatus?: "ready" | "partial" | "missing" | "error" | "invalid";
  aiDataMessage?: string;
  degree?: string;
  major?: string;
  university?: string;
  yearsOfExperience?: number | null;
}

export interface RejectApplicationRequest {
  reasonType: string;
  note?: string;
}

export const recruitmentService = {
  async getHrApplications(includeAiDetails = true) {
    const response = await axiosClient.get<ApplicationDto[]>("/Recruitment/hr/applications", {
      params: { includeAiDetails },
    });
    return response.data;
  },

  async getHrApplicationDetail(applicationId: string) {
    const response = await axiosClient.get<ApplicationDto[]>(
      `/Recruitment/hr/applications/${applicationId}`
    );
    const items = Array.isArray(response.data)
      ? response.data
      : (response.data as any)?.$values || [];
    return items[0] || null;
  },

  async updateApplicationStatus(applicationId: string, status: string) {
    const response = await axiosClient.put(`/Recruitment/hr/applications/${applicationId}/status`, {
      status: status,
    });

    return response.data;
  },

  async rejectApplication(applicationId: string, request: RejectApplicationRequest) {
    const response = await axiosClient.post(
      `/Recruitment/hr/applications/${applicationId}/reject`,
      request
    );

    return response.data;
  },

  sendCandidateEmail: async (request: SendCandidateEmailRequest) => {
    const formData = new FormData();

    if (request.applicationId) {
      formData.append("ApplicationId", request.applicationId);
    }

    formData.append("ToEmail", request.toEmail);
    formData.append("Subject", request.subject);
    formData.append("Body", request.body);
    formData.append("IsHtml", String(request.isHtml));

    if (request.ccEmail) {
      formData.append("CcEmail", request.ccEmail);
    }

    if (request.attachments && request.attachments.length > 0) {
      request.attachments.forEach((file) => {
        formData.append("Attachments", file);
      });
    }

    const response = await axiosClient.post("/CandidateEmails/send", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  generateCandidateEmail: async (
    request: GenerateCandidateEmailRequest
  ): Promise<GenerateCandidateEmailResponse> => {
    const response = await axiosClient.post("/CandidateEmails/generate", request);
    return response.data;
  },

  async getHrEmailLogs() {
    const response = await axiosClient.get("/CandidateEmails/hr/logs");
    return response.data;
  },

  async getMyApplications() {
    const response = await axiosClient.get("/Recruitment/my-applications");
    return response.data;
  },

  async retryMyApplicationAi(applicationId: string) {
    const response = await axiosClient.post(`/Recruitment/applications/${applicationId}/retry-ai`);
    return response.data;
  },

  async withdrawMyApplication(applicationId: string) {
    const response = await axiosClient.delete(`/Recruitment/applications/${applicationId}/withdraw`);
    return response.data;
  },

  async scheduleInterview(applicationId: string, request: any) {
    const response = await axiosClient.post(
      `/Recruitment/hr/applications/${applicationId}/schedule`,
      request
    );
    return response.data;
  },

  async getInterviewSchedule(applicationId: string) {
    const response = await axiosClient.get<InterviewScheduleDto>(
      `/Recruitment/applications/${applicationId}/schedule`
    );
    return response.data;
  },

  async getHrInterviewSchedules() {
    const response = await axiosClient.get<InterviewScheduleDto[]>(
      "/Recruitment/hr/schedules"
    );
    return response.data;
  },

  async cancelInterview(applicationId: string) {
    const response = await axiosClient.delete(
      `/Recruitment/hr/applications/${applicationId}/schedule`
    );
    return response.data;
  },
};

export interface InterviewScheduleDto {
  scheduleId?: string;
  applicationId: string;
  interviewDate: string;
  format: string; // "Online" | "Offline"
  locationOrLink: string;
  meetingId?: string;
  passcode?: string;
  notes?: string;
  createdAt?: string;
}
