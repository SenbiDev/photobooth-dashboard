"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { edgeService } from "../lib/edge-service/client";
import { fetchAllPages } from "../lib/edge-service/pagination";
import {
  allocationFormToCreate,
  allocationFormToPatch,
  campaignFormToPatch,
  campaignFormToCreate,
  deviceFormToCreate,
  templateFormToCreate,
  templateFormToPatch,
  batchToValues,
  campaignToValues,
  templateToValues,
} from "../lib/edge-service/mappers";
import type { Values } from "../lib/types";
import type {
  BoothCreate,
  BoothUpdate,
  CameraProfileCreate,
  CameraProfileUpdate,
  DeviceAssignmentCreate,
  DeviceAssignmentUpdate,
  PrinterProfileCreate,
  PrinterProfileUpdate,
  DeviceUpdate,
  UploadInitiateRequest,
} from "../lib/edge-service/types";
import { useAuthStore } from "../stores/auth-store";

function useAuthorizedQuery<T>(key: readonly unknown[], queryFn: () => Promise<T>) {
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({ queryKey: key, queryFn, enabled: authenticated });
}

export const edgeKeys = {
  all: ["edge-service"] as const,
  campaigns: ["edge-service", "campaigns"] as const,
  booths: ["edge-service", "booths"] as const,
  devices: ["edge-service", "devices"] as const,
  assignments: ["edge-service", "assignments"] as const,
  sessions: ["edge-service", "sessions"] as const,
  cameraProfiles: ["edge-service", "camera-profiles"] as const,
  printerProfiles: ["edge-service", "printer-profiles"] as const,
  templates: ["edge-service", "frame-templates"] as const,
  batches: ["edge-service", "voucher-batches"] as const,
  vouchers: ["edge-service", "vouchers"] as const,
  payments: ["edge-service", "payments"] as const,
  history: ["edge-service", "device-history"] as const,
  reports: ["edge-service", "reports"] as const,
};

export const useCampaigns = () =>
  useAuthorizedQuery(edgeKeys.campaigns, () => fetchAllPages(edgeService.campaigns.list));
export const useBooths = () =>
  useAuthorizedQuery(edgeKeys.booths, () => fetchAllPages(edgeService.booths.list));
export const useDevices = () =>
  useAuthorizedQuery(edgeKeys.devices, () => fetchAllPages(edgeService.devices.list));
export const useAssignments = (campaignId?: string) =>
  useAuthorizedQuery([...edgeKeys.assignments, campaignId ?? "all"], () =>
    fetchAllPages((params) => edgeService.assignments.list({ ...params, campaign_id: campaignId })),
  );
export const useSessions = () =>
  useAuthorizedQuery(edgeKeys.sessions, () => fetchAllPages(edgeService.sessions.list));
export const useCameraProfiles = () =>
  useAuthorizedQuery(edgeKeys.cameraProfiles, () => fetchAllPages(edgeService.cameraProfiles.list));
export const usePrinterProfiles = () =>
  useAuthorizedQuery(edgeKeys.printerProfiles, () =>
    fetchAllPages(edgeService.printerProfiles.list),
  );
export const useFrameTemplates = () =>
  useAuthorizedQuery(edgeKeys.templates, () => fetchAllPages(edgeService.frameTemplates.list));
export const useVoucherBatches = () =>
  useAuthorizedQuery(edgeKeys.batches, () => fetchAllPages(edgeService.voucherBatches.list));
export const useVouchers = () =>
  useAuthorizedQuery(edgeKeys.vouchers, () => fetchAllPages(edgeService.vouchers.list));
export const useAvailableVouchers = (batchIds: string[]) => {
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const ids = [...batchIds].sort();
  return useQuery({
    queryKey: [...edgeKeys.vouchers, "available", ids.join("|")],
    enabled: authenticated && ids.length > 0,
    queryFn: async () =>
      (
        await Promise.all(
          ids.map((batchId) =>
            fetchAllPages((params) =>
              edgeService.vouchers.list({ ...params, batch_id: batchId, status: "available" }),
            ),
          ),
        )
      ).flatMap((response) => response.data),
  });
};
export const usePayments = () =>
  useAuthorizedQuery(edgeKeys.payments, () => fetchAllPages(edgeService.payments.list));
export const useDeviceHistory = () =>
  useAuthorizedQuery(edgeKeys.history, () => fetchAllPages(edgeService.deviceHistory));

export function useServiceReferences() {
  const devices = useDevices();
  const campaigns = useCampaigns();
  const templates = useFrameTemplates();
  const booths = useBooths();
  const assignments = useAssignments();
  const cameraProfiles = useCameraProfiles();
  const printerProfiles = usePrinterProfiles();
  return {
    deviceIds: devices.data?.data.map((device) => device.id) ?? [],
    eventIds: campaigns.data?.data.map((campaign) => campaign.id) ?? [],
    devices: devices.data?.data ?? [],
    campaigns: campaigns.data?.data ?? [],
    templates: templates.data?.data ?? [],
    booths: booths.data?.data ?? [],
    assignments: assignments.data?.data ?? [],
    cameraProfiles: cameraProfiles.data?.data ?? [],
    printerProfiles: printerProfiles.data?.data ?? [],
  };
}

export function useDevice(id: string) {
  return useAuthorizedQuery([...edgeKeys.devices, id], () => edgeService.devices.get(id));
}

export function useSessionHistory(id: string) {
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: [...edgeKeys.sessions, id, "history"],
    queryFn: () => fetchAllPages((params) => edgeService.sessions.history(id, params)),
    enabled: authenticated && Boolean(id),
  });
}

export function useRefundPayment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => edgeService.payments.refund(id),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: edgeKeys.payments }),
  });
}

export function useServiceEditorRecords(schemaId: string) {
  return useAuthorizedQuery([...edgeKeys.all, "editor", schemaId], async () => {
    if (schemaId === "campaign") {
      const response = await fetchAllPages(edgeService.campaigns.list);
      return response.data.map((record) => ({
        id: record.id,
        name: record.name,
        status: record.status,
        values: campaignToValues(record),
      }));
    }
    if (schemaId === "template") {
      const response = await fetchAllPages(edgeService.frameTemplates.list);
      return response.data.map((record) => ({
        id: record.id,
        name: record.name,
        status: record.publish_state,
        values: templateToValues(record),
      }));
    }
    if (schemaId === "allocation") {
      const response = await fetchAllPages(edgeService.voucherBatches.list);
      return response.data.map((record) => ({
        id: record.id,
        name: record.name,
        status: "",
        values: batchToValues(record),
      }));
    }
    return [];
  });
}

export function useCreateServiceRecord(schemaId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Values) => {
      switch (schemaId) {
        case "register":
          return edgeService.devices.create(deviceFormToCreate(values));
        case "campaign":
          return edgeService.campaigns.create(campaignFormToCreate(values));
        case "template":
          return edgeService.frameTemplates.create({
            ...templateFormToCreate(values),
            publish_state: "draft",
          });
        case "allocation":
          return edgeService.voucherBatches.create(allocationFormToCreate(values));
        default:
          throw new Error(`No service mutation for ${schemaId}`);
      }
    },
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: edgeKeys.all }),
  });
}

export function usePublishServiceRecord(schemaId: string, id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ values, baseline }: { values: Values; baseline: Values }) => {
      switch (schemaId) {
        case "campaign": {
          const patch = campaignFormToPatch(values, baseline);
          return Object.keys(patch).length
            ? edgeService.campaigns.update(id, patch)
            : edgeService.campaigns.get(id);
        }
        case "template": {
          const patch = templateFormToPatch(values, baseline);
          return Object.keys(patch).length
            ? edgeService.frameTemplates.update(id, patch)
            : edgeService.frameTemplates.get(id);
        }
        case "allocation": {
          const patch = allocationFormToPatch(values, baseline);
          return Object.keys(patch).length
            ? edgeService.voucherBatches.update(id, patch)
            : edgeService.voucherBatches.get(id);
        }
        default:
          throw new Error(`No service mutation for ${schemaId}`);
      }
    },
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: edgeKeys.all }),
  });
}

export function useSyncDevice(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => edgeService.devices.sync(id),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: edgeKeys.devices }),
  });
}

export function useUpdateDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: DeviceUpdate }) =>
      edgeService.devices.update(id, values),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: edgeKeys.devices }),
  });
}

export function useSyncAnyDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => edgeService.devices.sync(id),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: edgeKeys.devices }),
  });
}

export function useCreateCameraProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CameraProfileCreate) => edgeService.cameraProfiles.create(values),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: edgeKeys.cameraProfiles }),
  });
}

export function useUpdateCameraProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: CameraProfileUpdate }) =>
      edgeService.cameraProfiles.update(id, values),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: edgeKeys.cameraProfiles }),
  });
}

export function useCreatePrinterProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: PrinterProfileCreate) => edgeService.printerProfiles.create(values),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: edgeKeys.printerProfiles }),
  });
}

export function useUpdatePrinterProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: PrinterProfileUpdate }) =>
      edgeService.printerProfiles.update(id, values),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: edgeKeys.printerProfiles }),
  });
}

export function useGenerateVouchers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, count }: { id: string; count: number }) =>
      edgeService.voucherBatches.generate(id, count),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: edgeKeys.all }),
  });
}

export function useCreateBooth() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: BoothCreate) => edgeService.booths.create(values),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: edgeKeys.all }),
  });
}

export function useUpdateBooth() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: BoothUpdate }) =>
      edgeService.booths.update(id, values),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: edgeKeys.all }),
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: DeviceAssignmentCreate) => edgeService.assignments.create(values),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: edgeKeys.all }),
  });
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: DeviceAssignmentUpdate }) =>
      edgeService.assignments.update(id, values),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: edgeKeys.all }),
  });
}

export interface ReportFilters {
  date_from?: string;
  date_to?: string;
  booth_id?: string;
  campaign_id?: string;
  group_by?: "day" | "month";
  overdue_minutes?: number;
  batch_id?: string;
}

export function useReports(filters: ReportFilters = {}) {
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const range = {
    date_from: filters.date_from || undefined,
    date_to: filters.date_to || undefined,
  };
  return useQuery({
    queryKey: [...edgeKeys.reports, filters],
    enabled: authenticated,
    queryFn: async () => {
      const [daily, campaigns, booths, vouchers, funnel] = await Promise.all([
        edgeService.reports.dailyRevenue({
          ...range,
          booth_id: filters.booth_id || undefined,
          campaign_id: filters.campaign_id || undefined,
          group_by: filters.group_by,
        }),
        edgeService.reports.campaignRevenue({
          ...range,
          campaign_id: filters.campaign_id || undefined,
        }),
        edgeService.reports.boothRevenue({
          ...range,
          booth_id: filters.booth_id || undefined,
          campaign_id: filters.campaign_id || undefined,
        }),
        edgeService.reports.voucherBatches(filters.batch_id || undefined),
        edgeService.reports.sessionFunnel({
          ...range,
          booth_id: filters.booth_id || undefined,
          campaign_id: filters.campaign_id || undefined,
          overdue_minutes: filters.overdue_minutes,
        }),
      ]);
      return { daily, campaigns, booths, vouchers, funnel };
    },
  });
}

export function useInitiateUpload() {
  return useMutation({
    mutationFn: (values: UploadInitiateRequest) => edgeService.files.initiate(values),
  });
}
