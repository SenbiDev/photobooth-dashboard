"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { edgeService } from "../lib/edge-service/client";
import {
  allocationFormToCreate,
  campaignOverrideToCampaign,
  deviceFormToCreate,
  eventToCampaign,
  rulesToCampaignPatch,
  templateFormToCreate,
  batchToValues,
  campaignToValues,
  templateToValues,
} from "../lib/edge-service/mappers";
import type { Values } from "../lib/types";
import type { CameraProfileCreate, PrinterProfileCreate } from "../lib/edge-service/types";
import { useAuthStore } from "../stores/auth-store";

const LIST_LIMIT = 100;

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
  useAuthorizedQuery(edgeKeys.campaigns, () => edgeService.campaigns.list({ limit: LIST_LIMIT }));
export const useBooths = () =>
  useAuthorizedQuery(edgeKeys.booths, () => edgeService.booths.list({ limit: LIST_LIMIT }));
export const useDevices = () =>
  useAuthorizedQuery(edgeKeys.devices, () => edgeService.devices.list({ limit: LIST_LIMIT }));
export const useAssignments = () =>
  useAuthorizedQuery(edgeKeys.assignments, () =>
    edgeService.assignments.list({ limit: LIST_LIMIT }),
  );
export const useSessions = () =>
  useAuthorizedQuery(edgeKeys.sessions, () => edgeService.sessions.list({ limit: LIST_LIMIT }));
export const useCameraProfiles = () =>
  useAuthorizedQuery(edgeKeys.cameraProfiles, () =>
    edgeService.cameraProfiles.list({ limit: LIST_LIMIT }),
  );
export const usePrinterProfiles = () =>
  useAuthorizedQuery(edgeKeys.printerProfiles, () =>
    edgeService.printerProfiles.list({ limit: LIST_LIMIT }),
  );
export const useFrameTemplates = () =>
  useAuthorizedQuery(edgeKeys.templates, () =>
    edgeService.frameTemplates.list({ limit: LIST_LIMIT }),
  );
export const useVoucherBatches = () =>
  useAuthorizedQuery(edgeKeys.batches, () =>
    edgeService.voucherBatches.list({ limit: LIST_LIMIT }),
  );
export const useVouchers = () =>
  useAuthorizedQuery(edgeKeys.vouchers, () => edgeService.vouchers.list({ limit: LIST_LIMIT }));
export const usePayments = () =>
  useAuthorizedQuery(edgeKeys.payments, () => edgeService.payments.list({ limit: LIST_LIMIT }));
export const useDeviceHistory = () =>
  useAuthorizedQuery(edgeKeys.history, () => edgeService.deviceHistory({ limit: LIST_LIMIT }));

export function useServiceReferences() {
  const devices = useDevices();
  const campaigns = useCampaigns();
  const templates = useFrameTemplates();
  return {
    deviceIds: devices.data?.data.map((device) => device.id) ?? [],
    eventIds: campaigns.data?.data.map((campaign) => campaign.id) ?? [],
    devices: devices.data?.data ?? [],
    campaigns: campaigns.data?.data ?? [],
    templates: templates.data?.data ?? [],
  };
}

export function useDevice(id: string) {
  return useAuthorizedQuery([...edgeKeys.devices, id], () => edgeService.devices.get(id));
}

export function useSessionHistory(id: string) {
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: [...edgeKeys.sessions, id, "history"],
    queryFn: () => edgeService.sessions.history(id, { limit: LIST_LIMIT }),
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
    if (["event", "campaign", "rules"].includes(schemaId)) {
      const response = await edgeService.campaigns.list({ limit: LIST_LIMIT });
      return response.data.map((record) => ({
        id: record.id,
        name: record.name,
        status: record.status,
        values: campaignToValues(record, schemaId),
      }));
    }
    if (schemaId === "template") {
      const response = await edgeService.frameTemplates.list({ limit: LIST_LIMIT });
      return response.data.map((record) => ({
        id: record.id,
        name: record.name,
        status: record.publish_state,
        values: templateToValues(record),
      }));
    }
    if (schemaId === "allocation") {
      const response = await edgeService.voucherBatches.list({ limit: LIST_LIMIT });
      return response.data.map((record) => ({
        id: record.id,
        name: record.name,
        status: record.offline_eligible ? "active" : "draft",
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
        case "event":
          return edgeService.campaigns.create(eventToCampaign(values));
        case "template":
          return edgeService.frameTemplates.create(templateFormToCreate(values));
        case "allocation": {
          const batch = await edgeService.voucherBatches.create(allocationFormToCreate(values));
          const count = Number(values.requestedCount ?? 0);
          if (count > 0 && batch.voucher_count === 0) {
            return edgeService.voucherBatches.generate(batch.id, count);
          }
          return batch;
        }
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
    mutationFn: async (values: Values) => {
      switch (schemaId) {
        case "event":
          return edgeService.campaigns.update(id, eventToCampaign(values));
        case "campaign":
          return edgeService.campaigns.update(id, campaignOverrideToCampaign(values));
        case "rules":
          return edgeService.campaigns.update(id, rulesToCampaignPatch(values));
        case "template":
          return edgeService.frameTemplates.update(id, templateFormToCreate(values));
        case "allocation":
          return edgeService.voucherBatches.update(id, allocationFormToCreate(values));
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

export function useCreatePrinterProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: PrinterProfileCreate) => edgeService.printerProfiles.create(values),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: edgeKeys.printerProfiles }),
  });
}

export function useReports() {
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: edgeKeys.reports,
    enabled: authenticated,
    queryFn: async () => {
      const [daily, campaigns, booths, vouchers, funnel] = await Promise.all([
        edgeService.reports.dailyRevenue(),
        edgeService.reports.campaignRevenue(),
        edgeService.reports.boothRevenue(),
        edgeService.reports.voucherBatches(),
        edgeService.reports.sessionFunnel(),
      ]);
      return { daily, campaigns, booths, vouchers, funnel };
    },
  });
}
