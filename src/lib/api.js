import axios from "axios";

const BASE_URL = "https://student-management-system-backend.up.railway.app/api";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem("accessToken");

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

export const getApiErrorMessage = (error, fallbackMessage) =>
  error?.response?.data?.message ??
  error?.response?.data?.error ??
  error?.message ??
  fallbackMessage;
