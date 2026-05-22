import axiosClient from "./axiosClient";

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
  matchedSkills: string;
  missingSkills: string;
}

export const recruitmentService = {
  async getHrApplications() {
    const response = await axiosClient.get<ApplicationDto[]>("/Recruitment/hr/applications");
    return response.data;
  },

  async getMyApplications() {
    const response = await axiosClient.get("/Recruitment/my-applications");
    return response.data;
  }
};