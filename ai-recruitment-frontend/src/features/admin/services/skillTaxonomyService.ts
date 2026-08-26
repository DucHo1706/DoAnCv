import axiosClient from "../../../services/axiosClient";

export type SkillAlias = {
  id: number;
  alias: string;
};

export type TaxonomySkill = {
  id: number;
  name: string;
  isApproved: boolean;
  aliases: SkillAlias[];
};

export type SkillObservationStatus =
  | "Quarantine"
  | "CandidateForReview"
  | "Mapped"
  | "Approved"
  | "Rejected";

export type SkillObservation = {
  normalizedCandidate: string;
  displayText: string;
  status: SkillObservationStatus;
  independentSources: number;
  cvSources: number;
  jobSources: number;
  averageConfidence: number;
  firstObservedAtUtc: string;
  lastObservedAtUtc: string;
  sampleObservationId: number;
  sampleEvidence?: string | null;
  resolvedSkillId?: number | null;
};

export type SkillObservationPage = {
  status: SkillObservationStatus;
  totalCandidates: number;
  page: number;
  pageSize: number;
  items: SkillObservation[];
};

type ApiMessage = {
  message: string;
};

function unwrapArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object" && "$values" in value) {
    const values = (value as { $values?: unknown }).$values;
    return Array.isArray(values) ? (values as T[]) : [];
  }
  return [];
}

export const skillTaxonomyService = {
  async getSkills(): Promise<TaxonomySkill[]> {
    const response = await axiosClient.get("/Skills");
    return unwrapArray<TaxonomySkill>(response.data).map((skill) => ({
      ...skill,
      aliases: unwrapArray<SkillAlias>(skill.aliases),
    }));
  },

  async addAlias(skillId: number, alias: string): Promise<SkillAlias> {
    const response = await axiosClient.post(`/Skills/${skillId}/aliases`, { alias });
    return response.data;
  },

  async deleteAlias(skillId: number, aliasId: number): Promise<void> {
    await axiosClient.delete(`/Skills/${skillId}/aliases/${aliasId}`);
  },

  async getObservations(
    status: SkillObservationStatus,
    page: number,
    pageSize: number
  ): Promise<SkillObservationPage> {
    const response = await axiosClient.get("/Skills/observations", {
      params: { status, page, pageSize },
    });
    const data = response.data || {};
    return {
      status: data.status || status,
      totalCandidates: Number(data.totalCandidates || 0),
      page: Number(data.page || page),
      pageSize: Number(data.pageSize || pageSize),
      items: unwrapArray<SkillObservation>(data.items),
    };
  },

  async mapObservation(observationId: number, skillId: number): Promise<ApiMessage> {
    const response = await axiosClient.post(`/Skills/observations/${observationId}/map`, {
      skillId,
    });
    return response.data;
  },

  async approveNewObservation(observationId: number, canonicalName: string): Promise<ApiMessage> {
    const response = await axiosClient.post(`/Skills/observations/${observationId}/approve-new`, {
      canonicalName,
    });
    return response.data;
  },

  async rejectObservation(observationId: number, reason: string): Promise<ApiMessage> {
    const response = await axiosClient.post(`/Skills/observations/${observationId}/reject`, {
      reason,
    });
    return response.data;
  },
};
