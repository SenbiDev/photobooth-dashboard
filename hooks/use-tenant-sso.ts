import { useMutation, useQuery } from "@tanstack/react-query";
import { siteApi } from "../lib/api";

export interface SsoTenantDomain {
  id: number;
  domain: string;
  is_primary: boolean;
  role?: string;
  is_primary_frontend?: boolean;
}

export interface SsoTenant {
  id: number;
  name: string;
  slug: string;
  schema_name?: string;
  sso_organization_id?: string;
  plan?: "free" | "premium_monthly" | "premium_annual" | "enterprise";
  tenancy_mode?: string;
  shared_pool_key?: string;
  is_active?: boolean;
  created_on?: string;
  domains: SsoTenantDomain[];
}

interface SsoTenantsListResponse {
  results?: SsoTenant[];
}

export interface TenantRegisterPayload {
  name: string;
  slug: string;
  plan?: "free" | "premium_monthly" | "premium_annual";
}

export interface TenantRegisterResponse {
  tenant: {
    id: number;
    frontend_default_domain: string;
    name: string;
    slug: string;
    domain: string;
  };
  commerce_bootstrap?: { success: boolean; detail?: string };
}

export const useGetSsoTenants = (enabled = true) =>
  useQuery<SsoTenant[]>({
    queryKey: ["SSO_TENANTS"],
    enabled,
    queryFn: async () => {
      const { data } = await siteApi.get<SsoTenant[] | SsoTenantsListResponse>("/tenants/");
      return Array.isArray(data) ? data : (data.results ?? []);
    },
  });

export const useRegisterTenant = () =>
  useMutation<TenantRegisterResponse, unknown, TenantRegisterPayload>({
    mutationFn: async (payload) => {
      const { data } = await siteApi.post<TenantRegisterResponse>("/tenants/register/", payload);
      return data;
    },
  });
