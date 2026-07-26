import axios from "axios";

const getBaseApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    return "http://localhost:5000/api";
  }
  return "https://recruitinsightai.com/api";
};

const axiosClient = axios.create({
  baseURL: getBaseApiUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ IMPROVED: Proper error handling
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized - Token expired or invalid
    if (error?.response?.status === 401) {
      console.warn("Token expired or invalid. Logging out...");

      // Clear stored authentication data
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Redirect to login page with original redirect path
      const currentPath = window.location.pathname;
      if (currentPath !== "/login" && currentPath !== "/register" && currentPath !== "/forgot-password") {
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath + window.location.search)}`;
      } else {
        window.location.href = "/login";
      }

      return Promise.reject(new Error("Authentication expired. Please login again."));
    }

    // Handle 403 Forbidden - User doesn't have permission
    if (error?.response?.status === 403) {
      console.warn("Access forbidden. You don't have permission for this action.");
      return Promise.reject(
        new Error("Access forbidden. You don't have permission for this action.")
      );
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
