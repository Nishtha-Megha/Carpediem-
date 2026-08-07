import axios from "axios";

// ─── Axios Instance ──────────────────────────────────────────────────────────

export const api = axios.create({
  // In local mobile testing, use the same machine hostname that served Vite.
  // VITE_API_URL still takes precedence for deployed environments.
  baseURL: import.meta.env.VITE_API_URL ?? `${window.location.protocol}//${window.location.hostname}:8000/api`,
  timeout: 15000,
});

// ─── Request Interceptor — attach Bearer token ────────────────────────────────

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response Interceptor — auto refresh on 401 ───────────────────────────────

let isRefreshing = false;
let pendingQueue = [];

function processQueue(error, token) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  pendingQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401, and not on the refresh endpoint itself
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh") &&
      !originalRequest.url?.includes("/auth/login")
    ) {
      if (isRefreshing) {
        // Queue additional requests while refresh is in progress
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refresh");
      if (!refreshToken) {
        // No refresh token — force logout
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          { refresh: refreshToken }
        );
        const newAccess = res.data.data.access;
        localStorage.setItem("access", newAccess);
        api.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
        processQueue(null, newAccess);
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── Error message helper ─────────────────────────────────────────────────────

import { isAxiosError } from "axios";

export function getApiErrorMessage(error) {
  if (!isAxiosError(error)) return "Something went wrong. Please try again.";
  const data = error.response?.data;
  const firstError = data?.errors ? Object.values(data.errors)[0] : undefined;
  if (Array.isArray(firstError)) return firstError[0];
  if (typeof firstError === "string") return firstError;
  return data?.message ?? "Please check your details and try again.";
}
