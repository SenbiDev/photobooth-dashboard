import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";
import { useAuthStore } from "../stores/auth-store";

export const API_URL = process.env.NEXT_PUBLIC_API_URL;
export const SITE_API_URL = process.env.NEXT_PUBLIC_SITE_API_URL;

const resolveBaseUrl = (value: string | undefined, fallback: string) => value?.trim() || fallback;

export const api = axios.create({
  baseURL: resolveBaseUrl(API_URL, "https://sso.arnatech.id/api"),
  headers: { "Content-Type": "application/json" },
});

export const siteApi = axios.create({
  baseURL: resolveBaseUrl(SITE_API_URL, "https://site.arnatech.id"),
  headers: { "Content-Type": "application/json" },
});

function firstError(payload: unknown): string | undefined {
  if (typeof payload === "string") return payload;
  if (Array.isArray(payload)) {
    for (const item of payload) if (typeof item === "string") return item;
    return undefined;
  }
  if (!payload || typeof payload !== "object") return undefined;

  const record = payload as Record<string, unknown>;
  for (const key of ["detail", "error"]) {
    if (typeof record[key] === "string" && record[key]) return record[key];
  }
  const nested = record.errors;
  if (nested && typeof nested === "object") {
    const message = firstError(nested);
    if (message) return message;
  }
  for (const value of Object.values(record)) {
    const message = firstError(value);
    if (message) return message;
  }
  return undefined;
}

function normalizeError(error: AxiosError) {
  const data = error.response?.data;
  const message = firstError(data);
  if (message && data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (!record.detail) record.detail = message;
    if (!record.error) record.error = message;
  }
  return error;
}

function attachToken(config: InternalAxiosRequestConfig) {
  const token = Cookies.get("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}

api.interceptors.request.use(attachToken, (error) => Promise.reject(error));
siteApi.interceptors.request.use(attachToken, (error) => Promise.reject(error));

function installRefreshInterceptor(client: typeof api) {
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const request = error.config as
        (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
      if (error.response?.status !== 401 || !request || request._retry) {
        return Promise.reject(normalizeError(error));
      }

      request._retry = true;
      try {
        const refresh = Cookies.get("refresh_token");
        if (!refresh) {
          useAuthStore.getState().logout();
          return Promise.reject(error);
        }

        const { data } = await axios.post<{ access: string }>(
          `${resolveBaseUrl(API_URL, "https://sso.arnatech.id/api")}/auth/token/refresh/`,
          { refresh },
        );
        useAuthStore.getState().setAuth(data.access, refresh);
        request.headers.Authorization = `Bearer ${data.access}`;
        return axios(request);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        if (typeof window !== "undefined") window.location.replace("/login");
        return Promise.reject(refreshError);
      }
    },
  );
}

installRefreshInterceptor(api);
installRefreshInterceptor(siteApi);
