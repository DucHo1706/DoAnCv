import axiosClient from "./axiosClient";

export const authService = {
  async login(payload: { email: string; password: string }) {
    const response = await axiosClient.post("/auth/login", payload);
    
    // Nếu Backend trả về token thành công, lưu lại vào bộ nhớ trình duyệt
    if (response.data?.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data));
    }
    
    return response.data;
  },

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  },

  getToken() {
    return localStorage.getItem("token");
  },

  getCurrentUser() {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }
};