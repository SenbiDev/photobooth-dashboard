import type { Values } from "../types";
import type {
  Campaign,
  CampaignCreate,
  Device,
  DeviceCreate,
  FrameTemplate,
  FrameTemplateCreate,
  VoucherBatch,
  VoucherBatchCreate,
} from "./types";

const text = (value: Values[string]) => String(value ?? "").trim();
const numberOrNull = (value: Values[string]) =>
  value === "" || value === null ? null : Number(value);
const stringArray = (value: Values[string]) => (Array.isArray(value) ? value : []);

function jsonText(value: Values[string], fallback: unknown = []) {
  if (typeof value !== "string") return value ?? fallback;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return fallback;
  }
}

export function eventToCampaign(values: Values): CampaignCreate {
  const templateId = text(values.templateId);
  return {
    name: text(values.name),
    status: "draft",
    price: numberOrNull(values.amount),
    session_limit: numberOrNull(values.sessionDuration),
    active_from: text(values.validFrom) || null,
    active_until: text(values.validUntil) || null,
    activation_rules: {
      slug: text(values.slug),
      timezone: text(values.timezone),
      eligible_devices: stringArray(values.eligibleDevices),
      activation: text(values.activation),
      qr_expiry_seconds: numberOrNull(values.qrExpiry),
      callback_grace_seconds: numberOrNull(values.callbackGrace),
      payment_required: values.paymentRequired === true,
      idle_timeout_seconds: numberOrNull(values.idleTimeout),
      countdown_seconds: numberOrNull(values.countdown),
      shots: numberOrNull(values.shots),
      retakes: numberOrNull(values.retakes),
      inter_shot_seconds: numberOrNull(values.interShot),
      consent_required: values.consent === true,
    },
    frame_set: {
      template_id: templateId,
      branding: text(values.branding),
      primary_color: text(values.primaryColor),
      locale: text(values.locale),
    },
    print_policy: {
      sku: text(values.sku),
      currency: text(values.currency),
      tax_percent: numberOrNull(values.taxPercent),
    },
    delivery_policy: { provider_ref: text(values.providerRef) },
    frame_template_ids: templateId ? [templateId] : [],
  };
}

export function campaignOverrideToCampaign(values: Values): CampaignCreate {
  const templateId = text(values.templateId);
  return {
    name: text(values.name),
    status: "draft",
    price: null,
    session_limit: numberOrNull(values.quota),
    active_from: text(values.validFrom) || null,
    active_until: text(values.validUntil) || null,
    activation_rules: {
      code: text(values.code),
      event_id: text(values.eventId),
      timezone: text(values.timezone),
      eligible_devices: stringArray(values.eligibleDevices),
      session_duration_seconds: numberOrNull(values.sessionDuration),
      priority: text(values.priority),
      consent_required: values.consent === true,
    },
    frame_set: { template_id: templateId, message: text(values.message) },
    print_policy: null,
    delivery_policy: null,
    frame_template_ids: templateId ? [templateId] : [],
  };
}

export function rulesToCampaignPatch(values: Values): Pick<CampaignCreate, "activation_rules"> {
  return {
    activation_rules: {
      event_id: text(values.eventId),
      quota_mode: text(values.quotaMode),
      total_quota: numberOrNull(values.totalQuota),
      per_guest: numberOrNull(values.perGuest),
      per_device: numberOrNull(values.perDevice),
      per_window: numberOrNull(values.perWindow),
      window_minutes: numberOrNull(values.windowMinutes),
      reserve_ttl_seconds: numberOrNull(values.reserveTtl),
      consume_milestone: text(values.consumeMilestone),
      duplicate_strategy: text(values.duplicate),
      release_before_capture: values.releaseBeforeCapture === true,
      max_redemptions: numberOrNull(values.maxRedemptions),
      sessions_per_redemption: numberOrNull(values.sessionsPerRedemption),
      print_entitlement: numberOrNull(values.printEntitlement),
      transferable: values.transferable === true,
      allow_offline: values.allowOffline === true,
      cache_max_age_hours: numberOrNull(values.cacheMaxAge),
      clock_tolerance_minutes: numberOrNull(values.clockTolerance),
      offline_payment: text(values.offlinePayment),
      conflict_strategy: text(values.conflict),
    },
  };
}

export function deviceFormToCreate(values: Values): DeviceCreate {
  return {
    device_code: text(values.id),
    name: text(values.name) || null,
    serial_number: null,
    status: "active",
    capabilities: {
      location: text(values.location),
      edge_model: text(values.model),
      event_id: text(values.eventId),
      camera_adapter: text(values.camera),
      camera_identifier: text(values.cameraId),
      printer_transport: text(values.printer),
      printer_identifier: text(values.printerId),
      storage_free_gb: numberOrNull(values.storageGb),
      public_key_fingerprint: text(values.fingerprint),
      rollout_group: text(values.group),
    },
    camera_profile_id: null,
    printer_profile_id: null,
    app_version: null,
    last_seen_at: null,
  };
}

export function templateFormToCreate(values: Values): FrameTemplateCreate {
  const width = Number(values.canvasWidth ?? 0);
  const height = Number(values.canvasHeight ?? 0);
  return {
    name: text(values.name),
    version: text(values.version),
    assets: JSON.stringify({
      asset_ref: text(values.assetRef),
      background: text(values.background),
      background_color: text(values.backgroundColor),
      font_license: text(values.fontLicense),
    }),
    aspect: width && height ? `${width}:${height}` : "",
    dimensions: `${width}x${height}`,
    safe_area: text(values.safeArea),
    transforms: JSON.stringify({
      schema_version: text(values.schemaVersion),
      slots: jsonText(values.slots),
      layers: jsonText(values.layers),
      placeholder: text(values.placeholder),
    }),
    preview_variant: "preview",
    print_variant: "print",
    digital_variant: "digital",
    checksum: `pending:${text(values.templateId)}:${text(values.version)}`,
    compatibility: JSON.stringify({
      device_id: text(values.deviceId),
      rollout: text(values.rollout),
      reason: text(values.reason),
    }),
    publish_state: "draft",
  };
}

export function allocationFormToCreate(values: Values): VoucherBatchCreate {
  return {
    campaign_id: text(values.eventId) || null,
    name: text(values.name),
    voucher_count: Number(values.requestedCount ?? 0),
    offline_eligible: true,
    entitlement_rules: {
      device_id: text(values.deviceId),
      pool_id: text(values.poolId),
      version: numberOrNull(values.version),
      active_from: text(values.validFrom),
      active_until: text(values.validUntil),
      timezone: text(values.timezone),
      authority: text(values.authority),
      offline_limit: numberOrNull(values.offlineLimit),
      sessions_per_redemption: numberOrNull(values.sessionsPerRedemption),
      print_entitlement: numberOrNull(values.printEntitlement),
      reserve_ttl_seconds: numberOrNull(values.reserveTtl),
      consume_milestone: text(values.consumeMilestone),
      audit_reason: text(values.reason),
      rollout: text(values.rollout),
    },
  };
}

const objectValue = (source: Record<string, unknown> | null | undefined, key: string) =>
  source?.[key] as Values[string] | undefined;

export function campaignToValues(campaign: Campaign, schemaId: string): Values {
  const rules = campaign.activation_rules;
  const frame = campaign.frame_set;
  const eligible = objectValue(rules, "eligible_devices");
  const deviceId = Array.isArray(eligible) ? String(eligible[0] ?? "") : "";
  if (schemaId === "rules") {
    return {
      eventId: objectValue(rules, "event_id") ?? campaign.id,
      quotaMode: objectValue(rules, "quota_mode") ?? "UNLIMITED",
      totalQuota: objectValue(rules, "total_quota") ?? campaign.session_limit ?? 1000,
      perGuest: objectValue(rules, "per_guest") ?? 1,
      perDevice: objectValue(rules, "per_device") ?? 120,
      perWindow: objectValue(rules, "per_window") ?? 200,
      windowMinutes: objectValue(rules, "window_minutes") ?? 60,
      reserveTtl: objectValue(rules, "reserve_ttl_seconds") ?? 300,
      consumeMilestone: objectValue(rules, "consume_milestone") ?? "FIRST_SUCCESSFUL_STILL",
      duplicate: objectValue(rules, "duplicate_strategy") ?? "RESUME_SAME_SESSION",
      releaseBeforeCapture: objectValue(rules, "release_before_capture") ?? true,
      maxRedemptions: objectValue(rules, "max_redemptions") ?? 1,
      sessionsPerRedemption: objectValue(rules, "sessions_per_redemption") ?? 1,
      printEntitlement: objectValue(rules, "print_entitlement") ?? 1,
      transferable: objectValue(rules, "transferable") ?? false,
      allowOffline: objectValue(rules, "allow_offline") ?? true,
      cacheMaxAge: objectValue(rules, "cache_max_age_hours") ?? 24,
      clockTolerance: objectValue(rules, "clock_tolerance_minutes") ?? 2,
      offlinePayment: objectValue(rules, "offline_payment") ?? "DENY",
      conflict: objectValue(rules, "conflict_strategy") ?? "QUARANTINE_AND_ESCALATE",
      deviceId,
      reason: "",
      rollout: "pilot",
    };
  }
  return {
    name: campaign.name,
    validFrom: campaign.active_from ?? "",
    validUntil: campaign.active_until ?? "",
    amount: campaign.price ?? 0,
    quota: campaign.session_limit ?? 0,
    templateId: campaign.frame_templates?.[0]?.id ?? objectValue(frame, "template_id") ?? "",
    eligibleDevices: eligible ?? [],
    slug: objectValue(rules, "slug") ?? "",
    timezone: objectValue(rules, "timezone") ?? "Asia/Jakarta",
    activation: objectValue(rules, "activation") ?? "EVENT_ENTITLEMENT",
    message: objectValue(frame, "message") ?? "",
    deviceId,
    reason: "",
    rollout: "pilot",
  };
}

export function templateToValues(template: FrameTemplate): Values {
  const [width, height] = template.dimensions.split("x").map(Number);
  return {
    name: template.name,
    templateId: template.id,
    version: Number(template.version) || 1,
    canvasWidth: width || 1000,
    canvasHeight: height || 1500,
    safeArea: Number(template.safe_area) || 0,
    assetRef: template.assets,
    slots: template.transforms,
  };
}

export function batchToValues(batch: VoucherBatch): Values {
  const rules = batch.entitlement_rules;
  return {
    name: batch.name,
    eventId: batch.campaign_id ?? "",
    requestedCount: batch.voucher_count,
    deviceId: objectValue(rules, "device_id") ?? "",
    poolId: objectValue(rules, "pool_id") ?? batch.id,
    version: objectValue(rules, "version") ?? 1,
    validFrom: objectValue(rules, "active_from") ?? "",
    validUntil: objectValue(rules, "active_until") ?? "",
    timezone: objectValue(rules, "timezone") ?? "Asia/Jakarta",
    authority: objectValue(rules, "authority") ?? "DEVICE_BOUND",
    offlineLimit: objectValue(rules, "offline_limit") ?? batch.voucher_count,
    available: batch.voucher_count,
  };
}

export function deviceCapability(device: Device, key: string, fallback = "—") {
  const value = device.capabilities?.[key];
  return value === undefined || value === null || value === "" ? fallback : String(value);
}
