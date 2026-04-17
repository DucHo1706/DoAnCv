import axiosClient from "./axiosClient";

export const testApi = {
  ping: async () => {
    const response = await axiosClient.get("/");
    return response.data;
  },
};