import axios, { type AxiosRequestConfig } from "axios";
import Cookies from "js-cookie";
import { useAuthStore } from "../../stores/auth-store";
import { API_URL } from "../api";
import type {
  Booth,
  BoothCreate,
  BoothUpdate,
  CameraProfile,
  CameraProfileCreate,
  CameraProfileUpdate,
  Campaign,
  CampaignCreate,
  CampaignUpdate,
  BoothRevenueResponse,
  CampaignRevenueResponse,
  DailyRevenueResponse,
  Device,
  DeviceAssignment,
  DeviceAssignmentCreate,
  DeviceAssignmentUpdate,
  DeviceCreate,
  DeviceHistory,
  DeviceUpdate,
  FrameTemplate,
  FrameTemplateCreate,
  FrameTemplateUpdate,
  FunnelReport,
  ListParams,
  ListResponse,
  Payment,
  PaymentCreate,
  PaymentCreateResponse,
  PrinterProfile,
  PrinterProfileCreate,
  PrinterProfileUpdate,
  PublishState,
  ReportParams,
  Session,
  SessionCreate,
  SessionUpdate,
  Voucher,
  VoucherBatch,
  VoucherBatchCreate,
  VoucherBatchReportResponse,
  VoucherBatchUpdate,
  UploadInitiateRequest,
  UploadInitiateResponse,
} from "./types";

export const EDGE_API_URL =
  process.env.NEXT_PUBLIC_EDGE_API_URL?.replace(/\/+$/, "") ||
  "https://ourlilphotobooth.fastapicloud.dev";

export const edgeApi = axios.create({
  baseURL: EDGE_API_URL,
  headers: { "Content-Type": "application/json" },
});

edgeApi.interceptors.request.use((config) => {
  const token = Cookies.get("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

edgeApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (error.response?.status !== 401 || !request || request._retry) throw error;

    request._retry = true;
    const refresh = Cookies.get("refresh_token");
    if (!refresh) {
      useAuthStore.getState().logout();
      if (typeof window !== "undefined") window.location.replace("/login");
      throw error;
    }

    try {
      const ssoBase = API_URL?.trim() || "https://sso.arnatech.id/api";
      const { data } = await axios.post<{ access: string }>(`${ssoBase}/auth/token/refresh/`, {
        refresh,
      });
      useAuthStore.getState().setAuth(data.access, refresh);
      request.headers = { ...request.headers, Authorization: `Bearer ${data.access}` };
      return edgeApi.request(request);
    } catch (refreshError) {
      useAuthStore.getState().logout();
      if (typeof window !== "undefined") window.location.replace("/login");
      throw refreshError;
    }
  },
);

const get = async <T>(path: string, params?: object) =>
  (await edgeApi.get<T>(path, { params })).data;
const post = async <T>(path: string, body?: unknown) => (await edgeApi.post<T>(path, body)).data;
const patch = async <T>(path: string, body?: unknown) => (await edgeApi.patch<T>(path, body)).data;
const remove = async (path: string) => void (await edgeApi.delete(path));

export const edgeService = {
  health: () => get<Record<string, unknown>>("/"),

  campaigns: {
    list: (params: ListParams = {}) => get<ListResponse<Campaign>>("/campaigns", params),
    get: (id: string) => get<Campaign>(`/campaigns/${id}`),
    create: (body: CampaignCreate) => post<Campaign>("/campaigns", body),
    update: (id: string, body: CampaignUpdate) => patch<Campaign>(`/campaigns/${id}`, body),
    delete: (id: string) => remove(`/campaigns/${id}`),
  },
  booths: {
    list: (params: ListParams = {}) => get<ListResponse<Booth>>("/booths", params),
    get: (id: string) => get<Booth>(`/booths/${id}`),
    create: (body: BoothCreate) => post<Booth>("/booths", body),
    update: (id: string, body: BoothUpdate) => patch<Booth>(`/booths/${id}`, body),
    delete: (id: string) => remove(`/booths/${id}`),
  },
  devices: {
    list: (params: ListParams = {}) => get<ListResponse<Device>>("/devices", params),
    get: (id: string) => get<Device>(`/devices/${id}`),
    create: (body: DeviceCreate) => post<Device>("/devices", body),
    update: (id: string, body: DeviceUpdate) => patch<Device>(`/devices/${id}`, body),
    delete: (id: string) => remove(`/devices/${id}`),
    sync: (id: string) => patch<Device>(`/devices/${id}/sync`),
  },
  assignments: {
    list: (params: ListParams & { campaign_id?: string } = {}) =>
      get<ListResponse<DeviceAssignment>>("/device_assignments", params),
    get: (id: string) => get<DeviceAssignment>(`/device_assignments/${id}`),
    create: (body: DeviceAssignmentCreate) => post<DeviceAssignment>("/device_assignments", body),
    update: (id: string, body: DeviceAssignmentUpdate) =>
      patch<DeviceAssignment>(`/device_assignments/${id}`, body),
    delete: (id: string) => remove(`/device_assignments/${id}`),
  },
  sessions: {
    list: (params: ListParams = {}) => get<ListResponse<Session>>("/sessions", params),
    get: (id: string) => get<Session>(`/sessions/${id}`),
    create: (body: SessionCreate) => post<Session>("/sessions", body),
    update: (id: string, body: SessionUpdate) => patch<Session>(`/sessions/${id}`, body),
    delete: (id: string) => remove(`/sessions/${id}`),
    history: (id: string, params: ListParams = {}) =>
      get<ListResponse<DeviceHistory>>(`/sessions/${id}/device-history`, params),
  },
  cameraProfiles: {
    list: (params: ListParams = {}) => get<ListResponse<CameraProfile>>("/camera-profiles", params),
    get: (id: string) => get<CameraProfile>(`/camera-profiles/${id}`),
    create: (body: CameraProfileCreate) => post<CameraProfile>("/camera-profiles", body),
    update: (id: string, body: CameraProfileUpdate) =>
      patch<CameraProfile>(`/camera-profiles/${id}`, body),
    delete: (id: string) => remove(`/camera-profiles/${id}`),
  },
  printerProfiles: {
    list: (params: ListParams = {}) =>
      get<ListResponse<PrinterProfile>>("/printer-profiles", params),
    get: (id: string) => get<PrinterProfile>(`/printer-profiles/${id}`),
    create: (body: PrinterProfileCreate) => post<PrinterProfile>("/printer-profiles", body),
    update: (id: string, body: PrinterProfileUpdate) =>
      patch<PrinterProfile>(`/printer-profiles/${id}`, body),
    delete: (id: string) => remove(`/printer-profiles/${id}`),
  },
  frameTemplates: {
    list: (params: ListParams & { publish_state?: PublishState; version?: string } = {}) =>
      get<ListResponse<FrameTemplate>>("/frame-templates", params),
    get: (id: string) => get<FrameTemplate>(`/frame-templates/${id}`),
    create: (body: FrameTemplateCreate) => post<FrameTemplate>("/frame-templates", body),
    update: (id: string, body: FrameTemplateUpdate) =>
      patch<FrameTemplate>(`/frame-templates/${id}`, body),
    delete: (id: string) => remove(`/frame-templates/${id}`),
    setStatus: (id: string, publish_state: PublishState) =>
      patch<FrameTemplate>(`/frame-templates/${id}/status`, { publish_state }),
  },
  voucherBatches: {
    list: (params: ListParams = {}) => get<ListResponse<VoucherBatch>>("/voucher_batches", params),
    get: (id: string) => get<VoucherBatch>(`/voucher_batches/${id}`),
    create: (body: VoucherBatchCreate) => post<VoucherBatch>("/voucher_batches", body),
    update: (id: string, body: VoucherBatchUpdate) =>
      patch<VoucherBatch>(`/voucher_batches/${id}`, body),
    delete: (id: string) => remove(`/voucher_batches/${id}`),
    generate: (id: string, count = 1) =>
      post<VoucherBatch>(`/voucher_batches/${id}/vouchers/generate`, { count }),
  },
  vouchers: {
    list: (params: ListParams & { batch_id?: string; status?: string; code?: string } = {}) =>
      get<ListResponse<Voucher>>("/vouchers", params),
    get: (code: string) => get<Voucher>(`/vouchers/${code}`),
    generate: (batch_id: string, count = 1) =>
      post<VoucherBatch>("/vouchers/generate", { batch_id, count }),
    redeem: (code: string, session_id: string, device_id?: string) =>
      post<Voucher>(`/vouchers/${code}/redeem`, { session_id, device_id }),
    setStatus: (id: string, status: string) => patch<Voucher>(`/vouchers/${id}/status`, { status }),
    delete: (id: string) => remove(`/vouchers/${id}`),
  },
  payments: {
    list: (
      params: ListParams & ReportParams & { status_filter?: string; device_id?: string } = {},
    ) => get<ListResponse<Payment>>("/payments", params),
    get: (id: string) => get<Payment>(`/payments/${id}`),
    create: (body: PaymentCreate) => post<PaymentCreateResponse>("/payments", body),
    refund: (id: string) => patch<Payment>(`/payments/${id}/refund`),
  },
  deviceHistory: (params: ListParams & { session_id?: string; device_id?: string } = {}) =>
    get<ListResponse<DeviceHistory>>("/device-history", params),
  reports: {
    dailyRevenue: (params: ReportParams & { group_by?: "day" | "month" } = {}) =>
      get<DailyRevenueResponse>("/reports/revenue/daily", params),
    boothRevenue: (params: ReportParams = {}) =>
      get<BoothRevenueResponse>("/reports/revenue/booths", params),
    campaignRevenue: (params: Omit<ReportParams, "booth_id"> = {}) =>
      get<CampaignRevenueResponse>("/reports/revenue/campaigns", params),
    voucherBatches: (batch_id?: string) =>
      get<VoucherBatchReportResponse>("/reports/vouchers/batches", batch_id ? { batch_id } : {}),
    sessionFunnel: (params: ReportParams & { overdue_minutes?: number } = {}) =>
      get<FunnelReport>("/reports/sessions/funnel", params),
  },
  files: {
    initiate: (body: UploadInitiateRequest) =>
      post<UploadInitiateResponse>("/api/files/upload", body),
  },
};
