import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "sonner";
import { api, siteApi } from "../lib/api";
import { authText } from "../lib/auth-text";
import type { Organization } from "./use-organization";
import type { SsoTenant } from "./use-tenant-sso";

export interface LoginPayload {
  email: string;
  password: string;
}
export interface LoginResponse {
  access?: string;
  refresh?: string;
  mfa_required?: boolean;
  token?: string;
}
export interface MfaVerifyPayload {
  token: string;
  mfa_token: string;
}
export interface MfaVerifyResponse {
  access: string;
  refresh: string;
}
export type GoogleLoginResponse = LoginResponse;
export interface RegisterPayload {
  email: string;
  password: string;
}
export interface RegisterResponse {
  access: string;
  refresh: string;
}
export interface VerifyEmailPayload {
  email: string;
  otp: string;
}
export interface ResendEmailOtpPayload {
  email: string;
}

type ApiError = AxiosError<{ detail?: string; email?: string[] }>;
const detail = (error: ApiError, fallback: string) =>
  error.response?.data?.detail || error.response?.data?.email?.[0] || fallback;

export const useLoginMutation = () =>
  useMutation<LoginResponse, ApiError, LoginPayload>({
    mutationFn: async (credentials) =>
      (await api.post<LoginResponse>("/auth/login/", credentials)).data,
    onError: (error) => toast.error(detail(error, authText("authInvalidLogin"))),
  });

export const useMfaVerifyMutation = () =>
  useMutation<MfaVerifyResponse, ApiError, MfaVerifyPayload>({
    mutationFn: async (payload) =>
      (await api.post<MfaVerifyResponse>("/auth/mfa/verify/", payload)).data,
    onError: (error) => toast.error(detail(error, authText("authInvalidMfa"))),
  });

export const useGoogleLoginMutation = () =>
  useMutation<GoogleLoginResponse, ApiError, string>({
    mutationFn: async (credential) =>
      (await api.post<GoogleLoginResponse>("/auth/google-login/", { token: credential })).data,
    onError: (error) => toast.error(detail(error, authText("authGoogleFailed"))),
  });

export const useRegisterMutation = () =>
  useMutation<RegisterResponse, ApiError, RegisterPayload>({
    mutationFn: async (credentials) =>
      (await api.post<RegisterResponse>("/auth/register/", credentials)).data,
    onError: (error) => toast.error(detail(error, authText("authRegistrationFailed"))),
  });

export const useVerifyEmailMutation = () =>
  useMutation<unknown, ApiError, VerifyEmailPayload>({
    mutationFn: async (payload) => (await api.post("/auth/verify-email/", payload)).data,
    onError: (error) => toast.error(detail(error, authText("authInvalidOtp"))),
  });

export const useResendEmailOtpMutation = () =>
  useMutation<unknown, ApiError, ResendEmailOtpPayload>({
    mutationFn: async (payload) => (await api.post("/auth/resend-email-otp/", payload)).data,
    onError: (error) => toast.error(detail(error, authText("authResendFailed"))),
  });

export const useCheckTenantsMutation = () =>
  useMutation<SsoTenant[], ApiError, void>({
    mutationFn: async () => {
      const { data } = await siteApi.get<SsoTenant[] | { results?: SsoTenant[] }>("/tenants/");
      return Array.isArray(data) ? data : (data.results ?? []);
    },
  });

export const useCheckOrganizationsMutation = () =>
  useMutation<Organization[], ApiError, void>({
    mutationFn: async () => {
      const { data } = await api.get<Organization[] | { results?: Organization[] }>(
        "/organizations/",
      );
      return Array.isArray(data) ? data : (data.results ?? []);
    },
  });
