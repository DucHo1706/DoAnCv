import axiosClient from "./axiosClient";

export interface JobDto {
  id: string;
  title: string;
  description: string;
  requirements: string;
  location: string;
  salaryRange: string;
  isActive: boolean;
  isApproved: boolean;
  createdAt: string;
  startDate?: string | null;
  deadline?: string | null;
  maxCandidates?: number | null;
}

export interface CategoryDto {
  id: string;
  name: string;
}

export interface CreateJobPayload {
  title: string;
  description: string;
  requirements: string;
  location: string;
  salaryRange: string;
  startDate?: string | null;
  deadline?: string | null;
  maxCandidates?: number | null;
  categoryIds: string[];
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

  async getCategories() {
    const response = await axiosClient.get<CategoryDto[]>("/categories");
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
};