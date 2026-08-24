import axiosClient from "../../../services/axiosClient";

export interface TalentPoolCandidateDto {
  talentPoolCandidateId: string;
  candidateId: string;
  latestCvId?: string;
  latestCvUrl?: string;
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
  domainJson?: string;
  targetPositionsJson?: string;
  jobLevel?: string;
  sourcingPriority?: string;
  sourcingStage?: string;
  tagsJson?: string;
  expectedSalary?: number;
  availableFrom?: string;
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
  matchedSkills?: string[];
  missingSkills?: string[];
  jobSkillCount?: number;
  scoreMethod?: string;
  reason: string;
  salaryRange?: string;
  deadline?: string;
}

export interface TalentPoolInviteSuggestionDto {
  isLocked: boolean;
  lockReason?: string;
  candidate: TalentPoolCandidateDto;
  suggestedJobs: TalentPoolSuggestedJobDto[];
}

export interface UpdateTalentPoolProfileRequest {
  domains: string[];
  targetPositions: string[];
  jobLevel?: string;
  sourcingPriority: string;
  sourcingStage: string;
  tags: string[];
  expectedSalary?: number;
  availableFrom?: string;
}

export interface CandidateDiscoverySearchParams {
  keyword?: string;
  skill?: string;
  minYearsOfExperience?: number;
  minAiScore?: number;
  page?: number;
  pageSize?: number;
}

export interface CandidateDiscoveryResultDto {
  candidateId: string;
  displayName: string;
  major?: string;
  address?: string;
  yearsOfExperience?: number;
  highestAiScore?: number;
  skillsJson: string;
  contactAllowed: boolean;
  cvAllowed: boolean;
  latestCvUrl?: string;
  profileDomains?: string[];
  profilePositions?: string[];
  publicCvs: CandidatePublicCvDto[];
  alreadyInTalentPool: boolean;
}

export interface CandidatePublicCvDto {
  cvId: string;
  displayName: string;
  sourceLabel: string;
  createdAt: string;
  isApplicationSnapshot: boolean;
  fileUrl?: string;
  builderContentJson?: string;
  builderSettingsJson?: string;
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

  async addTalentPoolNote(talentPoolCandidateId: string, request: AddTalentPoolNoteRequest) {
    const response = await axiosClient.post(`/TalentPool/${talentPoolCandidateId}/notes`, request);

    return response.data;
  },

  async getInviteSuggestions(talentPoolCandidateId: string) {
    const response = await axiosClient.get<TalentPoolInviteSuggestionDto>(
      `/TalentPool/${talentPoolCandidateId}/invite-suggestions`
    );

    return response.data;
  },

  async updateTalentPoolProfile(talentPoolCandidateId: string, request: UpdateTalentPoolProfileRequest) {
    const response = await axiosClient.put(`/TalentPool/${talentPoolCandidateId}/profile`, request);
    return response.data;
  },

  async removeTalentPoolCandidate(talentPoolCandidateId: string) {
    const response = await axiosClient.delete(`/TalentPool/${talentPoolCandidateId}`);
    return response.data;
  },

  async searchDiscoverableCandidates(params: CandidateDiscoverySearchParams) {
    const response = await axiosClient.get<{ total: number; page: number; pageSize: number; items: CandidateDiscoveryResultDto[] }>(
      "/TalentPool/search",
      { params }
    );
    return response.data;
  },

  async getDiscoverableCandidateDetail(candidateId: string) {
    const response = await axiosClient.get<CandidateDiscoveryResultDto>(
      `/TalentPool/discoverable/${candidateId}`
    );
    return response.data;
  },

  async saveDiscoverableCandidate(candidateId: string, request: UpdateTalentPoolProfileRequest) {
    const response = await axiosClient.post(`/TalentPool/discoverable/${candidateId}/save`, request);
    return response.data;
  },
};
