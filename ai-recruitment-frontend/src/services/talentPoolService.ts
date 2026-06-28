import axiosClient from "./axiosClient";

export interface TalentPoolCandidateDto {
  talentPoolCandidateId: string;
  candidateId: string;
  latestCvId?: string;
  fullName: string;
  email: string;
  phone?: string;
  highlightSkillsJson?: string | string[];
  highestAiScore: number;
  highestScoreJobTitle?: string;
  currentAvailabilityStatus?: string;
  lastAppliedAt?: string;
  lastUpdatedAt: string;
  source?: string;
  isInviteLocked: boolean;
  inviteLockReason?: string;
}

export interface TalentPoolInteractionDto {
  interactionId: string;
  talentPoolCandidateId: string;
  applicationId?: string;
  jobId?: string;
  type: string;
  title: string;
  content?: string;
  aiScore?: number;
  statusSnapshot?: string;
  createdByRecruiterId?: string;
  createdAt: string;
}

export interface TalentPoolDetailDto {
  candidate: TalentPoolCandidateDto;
  timeline: TalentPoolInteractionDto[];
}

export interface AddTalentPoolNoteRequest {
  note: string;
}

export interface TalentPoolSuggestedJobDto {
  jobId: string;
  jobTitle: string;
  branchName: string;
  matchScore: number;
  reason: string;
}

export interface TalentPoolInviteSuggestionDto {
  isLocked: boolean;
  lockReason?: string;
  candidate: TalentPoolCandidateDto;
  suggestedJobs: TalentPoolSuggestedJobDto[];
}

export const talentPoolService = {
  async getTalentPoolCandidates() {
    const response = await axiosClient.get<TalentPoolCandidateDto[]>("/TalentPool");
    return response.data;
  },

  async getTalentPoolDetail(talentPoolCandidateId: string) {
    const response = await axiosClient.get<TalentPoolDetailDto>(
      `/TalentPool/${talentPoolCandidateId}`
    );

    return response.data;
  },

  async addTalentPoolNote(
    talentPoolCandidateId: string,
    request: AddTalentPoolNoteRequest
  ) {
    const response = await axiosClient.post(
      `/TalentPool/${talentPoolCandidateId}/notes`,
      request
    );

    return response.data;
  },

  async getInviteSuggestions(talentPoolCandidateId: string) {
    const response = await axiosClient.get<TalentPoolInviteSuggestionDto>(
      `/TalentPool/${talentPoolCandidateId}/invite-suggestions`
    );

    return response.data;
  },
  
};