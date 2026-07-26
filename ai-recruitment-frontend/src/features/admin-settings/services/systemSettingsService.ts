import axiosClient from "../../../services/axiosClient";

export interface SystemSettings {
  minFitScoreThreshold: number;
  ocrErrorNoticeThreshold: number;
  jobDefaultDurationDays: number;
  autoApproveRecruiters: boolean;
  systemMaintenanceMode: boolean;
}

export const systemSettingsService = {
  async getSettings(): Promise<SystemSettings> {
    const response = await axiosClient.get<SystemSettings>("/SystemSettings");
    return response.data;
  },

  async updateSettings(settings: SystemSettings) {
    const response = await axiosClient.put("/SystemSettings", settings);
    return response.data;
  },
};
