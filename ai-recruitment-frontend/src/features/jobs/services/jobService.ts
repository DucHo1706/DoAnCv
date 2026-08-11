import axiosClient from "../../../services/axiosClient";

export interface JobDto {
  id: string;
  description: string;
  requirements: string;
  position: JobPositionDto;
  branch: BranchDto;
  category?: { id: string; name: string } | null;
  recruiter?: { id: string; name: string; email: string } | null;
  salaryRange: string;
  isActive: boolean;
  status: string;
  isApproved: boolean;
  createdAt: string;
  startDate?: string | null;
  deadline?: string | null;
  maxCandidates?: number | null;
  jobLevel?: { name: string } | null;
  rejectReason?: string | null;
}

export interface CategoryDto {
  id: string;
  name: string;
  parentId?: string | null;
  isActive: boolean;
}

export interface JobPositionDto {
  id: string;
  name: string;
  isActive: boolean;
}

export interface BranchDto {
  id: string;
  name: string;
  isActive: boolean;
}

export interface JobCriterionPayload {
  name: string;
  weight: number;
}

export interface CreateJobPayload {
  positionId: string;
  description: string;
  requirements: string;
  branchId: string;
  salaryRange: string;
  startDate?: string | null;
  deadline?: string | null;
  maxCandidates?: number | null;
  categoryId?: string | null;
  jobLevelId?: string | null;
  criteria: JobCriterionPayload[];
}

export interface JobReviewResponse {
  jobInfo: JobDto;
  wordsToHighlight: string[];
  stats?: {
    applicationsCount: number;
    viewsCount: number;
    interestedCount: number;
    applyRate: number;
  };
}

export const jobService = {
  async getJobs() {
    const response = await axiosClient.get<{ items?: JobDto[]; $values?: JobDto[] }>(
      "/jobs/published",
      { params: { pageIndex: 1, pageSize: 24 } },
    );
    return response.data.items ?? response.data.$values ?? [];
  },

  async getPublishedJobCount() {
    const response = await axiosClient.get<{
      totalCount?: number;
      items?: JobDto[];
      $values?: JobDto[];
    }>("/jobs/published", { params: { pageIndex: 1, pageSize: 1 } });

    return response.data.totalCount
      ?? response.data.items?.length
      ?? response.data.$values?.length
      ?? 0;
  },

  async getMyJobs() {
    const response = await axiosClient.get<JobDto[]>("/jobs/my-jobs");
    return response.data;
  },

  async getCategories() {
    const response = await axiosClient.get<CategoryDto[]>("/categories");
    return response.data;
  },

  async getJobPositions() {
    const response = await axiosClient.get<JobPositionDto[]>("/jobpositions");
    return response.data;
  },

  async getBranches() {
    const response = await axiosClient.get<BranchDto[]>("/branches");
    return response.data;
  },

  async createJob(payload: CreateJobPayload) {
    const response = await axiosClient.post("/jobs", payload);
    return response.data;
  },

  async getJobReview(id: string) {
    const response = await axiosClient.get<JobReviewResponse>(`/jobs/${id}/review`);
    return response.data;
  },

  async approveJob(id: string) {
    const response = await axiosClient.post(`/jobs/${id}/approve`);
    return response.data;
  },

  async rejectJob(id: string, reason: string) {
    const response = await axiosClient.post(`/jobs/${id}/reject`, { reason });
    return response.data;
  },

  async bulkApproveJobs(jobIds: string[]) {
    const response = await axiosClient.post("/jobs/bulk-approve", { jobIds });
    return response.data;
  },

  async flagJob(id: string, reason: string) {
    const response = await axiosClient.post(`/jobs/${id}/flag`, { reason });
    return response.data;
  },

  async unflagJob(id: string) {
    const response = await axiosClient.post(`/jobs/${id}/unflag`);
    return response.data;
  },

  async getPendingJobs() {
    const response = await axiosClient.get<JobDto[]>("/jobs/pending");
    return response.data;
  },

  async getAdminJobs() {
    const response = await axiosClient.get<JobDto[]>("/jobs/admin/all");
    return response.data;
  },

  async toggleJobStatus(id: string) {
    const response = await axiosClient.put(`/jobs/${id}/toggle-status`);
    return response.data;
  },

  async toggleRecruiterJobStatus(id: string) {
    const response = await axiosClient.put(`/jobs/${id}/toggle-status-recruiter`);
    return response.data;
  },
};

export interface BranchPayload {
  name: string;
}

export const branchService = {
  async getBranches() {
    const response = await axiosClient.get<BranchDto[]>("/branches");
    return response.data;
  },

  async createBranch(payload: BranchPayload) {
    const response = await axiosClient.post<BranchDto>("/branches", payload);
    return response.data;
  },

  async updateBranch(id: string, payload: BranchPayload) {
    const response = await axiosClient.put<BranchDto>(`/branches/${id}`, payload);
    return response.data;
  },

  async toggleBranchStatus(id: string) {
    const response = await axiosClient.put(`/branches/${id}/toggle-status`);
    return response.data;
  },
};

export interface CategoryPayload {
  name: string;
}

export const categoryService = {
  async getCategories() {
    const response = await axiosClient.get<CategoryDto[]>("/categories");
    return response.data;
  },

  async createCategory(payload: CategoryPayload) {
    const response = await axiosClient.post<CategoryDto>("/categories", payload);
    return response.data;
  },

  async updateCategory(id: string, payload: CategoryPayload) {
    const response = await axiosClient.put<CategoryDto>(`/categories/${id}`, payload);
    return response.data;
  },

  async deleteCategory(id: string) {
    const response = await axiosClient.delete(`/categories/${id}`);
    return response.data;
  },

  async toggleCategoryStatus(id: string) {
    const response = await axiosClient.put(`/categories/${id}/toggle-status`);
    return response.data;
  },
};

export interface JobPositionPayload {
  name: string;
}

export const jobPositionService = {
  async getJobPositions() {
    const response = await axiosClient.get<JobPositionDto[]>("/jobpositions");
    return response.data;
  },

  async createJobPosition(payload: JobPositionPayload) {
    const response = await axiosClient.post<JobPositionDto>("/jobpositions", payload);
    return response.data;
  },

  async updateJobPosition(id: string, payload: JobPositionPayload) {
    const response = await axiosClient.put<JobPositionDto>(`/jobpositions/${id}`, payload);
    return response.data;
  },

  async toggleJobPositionStatus(id: string) {
    const response = await axiosClient.put(`/jobpositions/${id}/toggle-status`);
    return response.data;
  },
};
