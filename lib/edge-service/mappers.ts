import type { Values } from "../types";
import { formatDateTimeLocal } from "../reference-validation";
import type {
  Campaign,
  CampaignCreate,
  CampaignUpdate,
  Device,
  DeviceCreate,
  FrameTemplate,
  FrameTemplateCreate,
  FrameTemplateUpdate,
  VoucherBatch,
  VoucherBatchCreate,
  VoucherBatchUpdate,
} from "./types";

const text = (value: Values[string]) => String(value ?? "").trim();
const nullableText = (value: Values[string]) => text(value) || null;
const nullableNumber = (value: Values[string]) =>
  value === "" || value === null || value === undefined ? null : Number(value);
const nullableDate = (value: Values[string]) => {
  const source = text(value);
  return source ? new Date(source).toISOString() : null;
};
const stringArray = (value: Values[string]) => (Array.isArray(value) ? value : []);

function objectOrNull(value: Values[string]): Record<string, unknown> | null {
  if (value === "" || value === null || value === undefined) return null;
  if (typeof value !== "string") return null;
  const parsed: unknown = JSON.parse(value);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : null;
}

const jsonValue = (value: Record<string, unknown> | null | undefined) =>
  value ? JSON.stringify(value, null, 2) : "";

export function campaignFormToCreate(values: Values): CampaignCreate {
  return {
    name: text(values.name),
    status: text(values.status) || "draft",
    price: nullableNumber(values.price),
    session_limit: nullableNumber(values.sessionLimit),
    active_from: nullableDate(values.activeFrom),
    active_until: nullableDate(values.activeUntil),
    activation_rules: objectOrNull(values.activationRules),
    frame_set: objectOrNull(values.frameSet),
    print_policy: objectOrNull(values.printPolicy),
    delivery_policy: objectOrNull(values.deliveryPolicy),
    frame_template_ids: stringArray(values.frameTemplateIds),
  };
}

export function campaignFormToPatch(values: Values, baseline: Values): CampaignUpdate {
  const source = campaignFormToCreate(values);
  const mapping: Record<string, keyof CampaignCreate> = {
    name: "name",
    status: "status",
    price: "price",
    sessionLimit: "session_limit",
    activeFrom: "active_from",
    activeUntil: "active_until",
    activationRules: "activation_rules",
    frameSet: "frame_set",
    printPolicy: "print_policy",
    deliveryPolicy: "delivery_policy",
    frameTemplateIds: "frame_template_ids",
  };
  const patch: CampaignUpdate = {};
  for (const [formField, apiField] of Object.entries(mapping)) {
    if (JSON.stringify(values[formField]) !== JSON.stringify(baseline[formField])) {
      (patch as Record<string, unknown>)[apiField] = source[apiField];
    }
  }
  return patch;
}

export function campaignToValues(campaign: Campaign): Values {
  return {
    name: campaign.name,
    status: campaign.status,
    price: campaign.price ?? "",
    sessionLimit: campaign.session_limit ?? "",
    activeFrom: formatDateTimeLocal(campaign.active_from),
    activeUntil: formatDateTimeLocal(campaign.active_until),
    activationRules: jsonValue(campaign.activation_rules),
    frameSet: jsonValue(campaign.frame_set),
    printPolicy: jsonValue(campaign.print_policy),
    deliveryPolicy: jsonValue(campaign.delivery_policy),
    frameTemplateIds: campaign.frame_templates?.map((template) => template.id) ?? [],
  };
}

export function deviceFormToCreate(values: Values): DeviceCreate {
  return {
    device_code: text(values.deviceCode),
    name: nullableText(values.name),
    serial_number: nullableText(values.serialNumber),
    status: text(values.status) || "active",
    capabilities: objectOrNull(values.capabilities),
    camera_profile_id: nullableText(values.cameraProfileId),
    printer_profile_id: nullableText(values.printerProfileId),
    app_version: nullableText(values.appVersion),
    last_seen_at: nullableDate(values.lastSeenAt),
  };
}

export function deviceToValues(device: Device): Values {
  return {
    deviceCode: device.device_code,
    name: device.name ?? "",
    serialNumber: device.serial_number ?? "",
    status: device.status,
    capabilities: jsonValue(device.capabilities),
    cameraProfileId: device.camera_profile_id ?? "",
    printerProfileId: device.printer_profile_id ?? "",
    appVersion: device.app_version ?? "",
    lastSeenAt: formatDateTimeLocal(device.last_seen_at),
  };
}

export function templateFormToCreate(values: Values): FrameTemplateCreate {
  return {
    name: text(values.name),
    version: text(values.version),
    assets: text(values.assets),
    aspect: text(values.aspect),
    dimensions: text(values.dimensions),
    safe_area: text(values.safeArea),
    transforms: text(values.transforms),
    preview_variant: text(values.previewVariant),
    print_variant: text(values.printVariant),
    digital_variant: text(values.digitalVariant),
    checksum: text(values.checksum),
    compatibility: text(values.compatibility),
    publish_state:
      values.publishState === "public" || values.publishState === "archive"
        ? values.publishState
        : "draft",
  };
}

export function templateFormToPatch(values: Values, baseline: Values): FrameTemplateUpdate {
  const source = templateFormToCreate(values);
  const mapping: Record<string, keyof FrameTemplateCreate> = {
    name: "name",
    version: "version",
    assets: "assets",
    aspect: "aspect",
    dimensions: "dimensions",
    safeArea: "safe_area",
    transforms: "transforms",
    previewVariant: "preview_variant",
    printVariant: "print_variant",
    digitalVariant: "digital_variant",
    checksum: "checksum",
    compatibility: "compatibility",
    publishState: "publish_state",
  };
  return Object.fromEntries(
    Object.entries(mapping)
      .filter(
        ([formField]) => JSON.stringify(values[formField]) !== JSON.stringify(baseline[formField]),
      )
      .map(([, apiField]) => [apiField, source[apiField]]),
  );
}

export function templateToValues(template: FrameTemplate): Values {
  return {
    name: template.name,
    version: template.version,
    assets: template.assets,
    aspect: template.aspect,
    dimensions: template.dimensions,
    safeArea: template.safe_area,
    transforms: template.transforms,
    previewVariant: template.preview_variant,
    printVariant: template.print_variant,
    digitalVariant: template.digital_variant,
    checksum: template.checksum,
    compatibility: template.compatibility,
    publishState: template.publish_state,
  };
}

export function allocationFormToCreate(values: Values): VoucherBatchCreate {
  return {
    campaign_id: nullableText(values.campaignId),
    name: text(values.name),
    voucher_count: Number(values.voucherCount ?? 0),
    entitlement_rules: objectOrNull(values.entitlementRules),
    offline_eligible: values.offlineEligible === true,
  };
}

export function allocationFormToPatch(values: Values, baseline: Values): VoucherBatchUpdate {
  const source = allocationFormToCreate(values);
  const mapping: Record<string, keyof VoucherBatchUpdate> = {
    campaignId: "campaign_id",
    name: "name",
    entitlementRules: "entitlement_rules",
    offlineEligible: "offline_eligible",
  };
  return Object.fromEntries(
    Object.entries(mapping)
      .filter(
        ([formField]) => JSON.stringify(values[formField]) !== JSON.stringify(baseline[formField]),
      )
      .map(([, apiField]) => [apiField, source[apiField]]),
  );
}

export function batchToValues(batch: VoucherBatch): Values {
  return {
    campaignId: batch.campaign_id ?? "",
    name: batch.name,
    voucherCount: batch.voucher_count,
    entitlementRules: jsonValue(batch.entitlement_rules),
    offlineEligible: batch.offline_eligible,
  };
}
