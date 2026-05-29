import axiosClient from "./axiosClient";

export interface JobDto {
  id: string;
  description: string;
  requirements: string;
  position: JobPositionDto;
  branch: BranchDto;
  salaryRange: string;
  isActive: boolean;
  status: string;
  isApproved: boolean;
  createdAt: string;
  startDate?: string | null;
  deadline?: string | null;
  maxCandidates?: number | null;
}

export interface CategoryDto {
  id: string;
  name: string;
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
  criteria: JobCriterionPayload[];
}

export interface JobReviewResponse {
  jobInfo: JobDto;
  wordsToHighlight: string[];
}

export const jobService = {
  async getJobs() {
    const response = await axiosClient.get<JobDto[]>("/jobs");
    return response.data;
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

  async deleteBranch(id: string) {
    const response = await axiosClient.delete(`/branches/${id}`);
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

  async deleteJobPosition(id: string) {
    const response = await axiosClient.delete(`/jobpositions/${id}`);
    return response.data;
  },

  async toggleJobPositionStatus(id: string) {
    const response = await axiosClient.put(`/jobpositions/${id}/toggle-status`);
    return response.data;
  },
};