import axiosClient from "../../../services/axiosClient";

export interface RoleDto {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

export const roleService = {
  async getRoles(): Promise<RoleDto[]> {
    const response = await axiosClient.get<RoleDto[]>("/roles");
    return Array.isArray(response.data) ? response.data : (response.data as any)?.$values || [];
  },

  async createRole(payload: Partial<RoleDto>): Promise<{ message: string; role: RoleDto }> {
    const response = await axiosClient.post("/roles", payload);
    return response.data;
  },

  async updateRole(id: string, payload: Partial<RoleDto>): Promise<{ message: string; role: RoleDto }> {
    const response = await axiosClient.put(`/roles/${id}`, payload);
    return response.data;
  },

  async deleteRole(id: string): Promise<{ message: string }> {
    const response = await axiosClient.delete(`/roles/${id}`);
    return response.data;
  },
};
