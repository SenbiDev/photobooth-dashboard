import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export interface Organization {
  id: string;
  name: string;
  slug?: string;
  package_type?: "free" | "premium_monthly" | "premium_annual" | "enterprise";
  status?: string;
}

export interface CreateOrganizationPayload {
  name: string;
  slug?: string;
  package_type?: "free" | "premium_monthly" | "premium_annual" | "enterprise";
}

export const useCreateOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation<Organization, unknown, CreateOrganizationPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<Organization>("/organizations/", payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["GET_ORGANIZATIONS"] }),
  });
};
