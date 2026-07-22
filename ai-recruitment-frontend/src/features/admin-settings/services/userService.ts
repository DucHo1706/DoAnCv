import axiosClient from "../../../services/axiosClient";

export const userService = {
  async getUsers() {
    const response = await axiosClient.get("/users");
    return response.data;
  },

  async toggleUserStatus(id: string) {
    const response = await axiosClient.put(`/users/${id}/toggle-status`);
    return response.data;
  },

  async createUser(payload: any) {
    const response = await axiosClient.post("/users", payload);
    return response.data;
  },

  async updateUser(id: string, payload: any) {
    const response = await axiosClient.put(`/users/${id}`, payload);
    return response.data;
  },

  async registerCandidate(payload: any) {
    const response = await axiosClient.post("/users/register", payload);
    return response.data;
  },

  async getAuditLogs() {
    const response = await axiosClient.get("/AuditLogs");
    return response.data;
  },
};
