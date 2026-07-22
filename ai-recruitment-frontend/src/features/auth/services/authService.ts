import axiosClient from "../../../services/axiosClient";

export const authService = {
  async login(payload: { email: string; password: string }) {
    const response = await axiosClient.post("/auth/login", payload);

    if (response.data?.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data));
      if (response.data?.expiresIn) {
        const expiryTime = Date.now() + response.data.expiresIn * 1000;
        localStorage.setItem("tokenExpiry", expiryTime.toString());
      }
    }

    return response.data;
  },

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("tokenExpiry");
    window.location.href = "/login";
  },

  getToken() {
    const token = localStorage.getItem("token");
    const expiry = localStorage.getItem("tokenExpiry");
    if (expiry && Date.now() > parseInt(expiry)) {
      this.logout();
      return null;
    }
    return token;
  },

  getCurrentUser() {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated() {
    return !!this.getToken() && !!this.getCurrentUser();
  },
};
