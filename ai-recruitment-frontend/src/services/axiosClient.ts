import axios from "axios";

const axiosClient = axios.create({
  baseURL: "https://localhost:7006/api",
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

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Xử lý lỗi 401 khi token hết hạn
    return Promise.reject(error);
  }
);

export default axiosClient;