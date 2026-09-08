import type { ConsoleState, FormSchema, Job, Value, Values } from "./types";
import { content } from "./content";

export function defaults(schema: FormSchema): Values {
  return Object.fromEntries(
    schema.groups.flatMap((group) => group.fields.map((field) => [field.key, field.default])),
  );
}

export function initialState(): ConsoleState {
  const state = structuredClone({
    version: 2 as const,
    devices: content.seed.devices,
    entities: content.seed.entities,
    jobs: content.seed.jobs,
    revisions: content.seed.revisions,
    drafts: {},
    audit: [],
    commands: [],
  });
  for (const schema of Object.values(content.schemas)) {
    if (!schema.entity || schema.entity === "devices") continue;
    state.entities[schema.entity] = state.entities[schema.entity].map((record) => ({
      ...record,
      values: { ...defaults(schema), ...record.values, name: record.name },
    }));
  }
  return state;
}

export function isConsoleState(value: unknown): value is ConsoleState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<ConsoleState>;
  return (
    state.version === 2 &&
    Array.isArray(state.devices) &&
    state.devices.length > 0 &&
    state.devices.every(
      (device) =>
        typeof device.id === "string" &&
        typeof device.active === "number" &&
        typeof device.desired === "number",
    ) &&
    Array.isArray(state.jobs) &&
    Array.isArray(state.revisions) &&
    state.revisions.length > 0 &&
    Array.isArray(state.audit) &&
    Array.isArray(state.commands) &&
    Boolean(state.drafts) &&
    Boolean(state.entities) &&
    ["events", "campaigns", "templates", "allocations", "operators"].every((key) =>
      Array.isArray(state.entities?.[key as keyof ConsoleState["entities"]]),
    )
  );
}

export function validateValues(schema: FormSchema, values: Values): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of schema.groups.flatMap((group) => group.fields)) {
    const value = values[field.key];
    if (
      field.required &&
      (value === null ||
        value === undefined ||
        value === "" ||
        (typeof value === "string" && !value.trim()) ||
        (Array.isArray(value) && !value.length))
    )
      errors[field.key] = "required";
    if (
      field.type === "number" &&
      (typeof value !== "number" ||
        !Number.isFinite(value) ||
        (field.min !== undefined && value < field.min) ||
        (field.max !== undefined && value > field.max))
    )
      errors[field.key] = "range";
    if (field.options && !field.options.some((option) => option.value === value)) {
      errors[field.key] = "guardrailError";
    }
    if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
      errors[field.key] = "guardrailError";
    }
  }
  if (
    values.validFrom &&
    values.validUntil &&
    !(Date.parse(String(values.validUntil)) > Date.parse(String(values.validFrom)))
  ) {
    errors.validUntil = "dates";
  }
  if (values.timezone) {
    try {
      new Intl.DateTimeFormat("en", { timeZone: String(values.timezone) });
    } catch {
      errors.timezone = "guardrailError";
    }
  }
  if (Number(values.maxDelay) < Number(values.baseDelay)) errors.maxDelay = "range";
  if (Number(values.blockPercent) <= Number(values.warningPercent)) errors.blockPercent = "range";
  if (Number(values.offlineLimit) > Number(values.requestedCount)) errors.offlineLimit = "range";
  if (values.activation === "PAYG_QRIS" && values.paymentRequired !== true) {
    errors.paymentRequired = "guardrailError";
  }
  if (values.protectUnacked === false) errors.protectUnacked = "guardrailError";
  if (values.private === false) errors.private = "guardrailError";
  if (values.quotaMode === "LIMITED" && Number(values.totalQuota) < 1) errors.totalQuota = "range";
  if (values.adapter === "DSLR_TETHER" && values.motionSource === "UVC_STREAM") {
    errors.motionSource = "guardrailError";
  }
  if (values.motionSource === "WEBCAM_COMPANION" && values.calibrated !== true) {
    errors.calibrated = "guardrailError";
  }
  if (
    values.placeholder &&
    !["event.name", "event.date", "guest.code", "session.sequence", "capturedAt"].includes(
      String(values.placeholder),
    )
  )
    errors.placeholder = "guardrailError";
  if (values.slots !== undefined) {
    try {
      const slots: unknown = JSON.parse(String(values.slots));
      if (!Array.isArray(slots) || !slots.length || slots.length > 16) throw new Error();
      const ids = new Set<string>();
      for (const slot of slots) {
        if (
          !slot ||
          typeof slot !== "object" ||
          typeof slot.id !== "string" ||
          !slot.id ||
          ids.has(slot.id) ||
          !Number.isInteger(slot.sourceIndex) ||
          slot.sourceIndex < 0 ||
          ![slot.x, slot.y, slot.width, slot.height, slot.zIndex].every(Number.isFinite) ||
          slot.x < 0 ||
          slot.y < 0 ||
          slot.width <= 0 ||
          slot.height <= 0 ||
          slot.x + slot.width > Number(values.canvasWidth) ||
          slot.y + slot.height > Number(values.canvasHeight) ||
          !["cover", "contain"].includes(slot.fit)
        )
          throw new Error();
        ids.add(slot.id);
      }
    } catch {
      errors.slots = "guardrailError";
    }
  }
  if (values.platform !== undefined) {
    for (const key of ["platform", "deviceProfile", "eventLayer", "campaignLayer", "onsite"]) {
      try {
        const layer: unknown = JSON.parse(String(values[key]));
        if (!layer || typeof layer !== "object" || Array.isArray(layer)) throw new Error();
        for (const [field, value] of Object.entries(layer)) {
          if (
            !["sessionDuration", "retakes", "activation", "autoPrint", "allowOffline"].includes(
              field,
            )
          )
            throw new Error();
          if (value === null) continue;
          if (
            field === "sessionDuration" &&
            (typeof value !== "number" || value < 30 || value > 1800)
          )
            throw new Error();
          if (
            field === "retakes" &&
            (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 10)
          )
            throw new Error();
          if (["autoPrint", "allowOffline"].includes(field) && typeof value !== "boolean")
            throw new Error();
          if (
            field === "activation" &&
            !["PAYG_QRIS", "VOUCHER", "EVENT_ENTITLEMENT"].includes(String(value))
          )
            throw new Error();
        }
        if (
          key === "onsite" &&
          Object.keys(layer).length &&
          !(Date.parse(String(values.overrideExpires)) > Date.now())
        )
          errors.overrideExpires = "dates";
      } catch {
        errors[key] = "guardrailError";
      }
    }
  }
  if (values.layers !== undefined) {
    try {
      const layers: unknown = JSON.parse(String(values.layers));
      if (!Array.isArray(layers)) throw new Error();
      const ids = new Set<string>();
      for (const layer of layers) {
        if (
          !layer ||
          typeof layer !== "object" ||
          typeof layer.id !== "string" ||
          ids.has(layer.id) ||
          !["asset", "text", "QR", "shape", "sticker"].includes(layer.type) ||
          !Number.isFinite(layer.zIndex)
        )
          throw new Error();
        ids.add(layer.id);
        if (layer.type === "text") {
          const placeholders = String(layer.value).matchAll(/\{\{(.*?)\}\}/g);
          for (const match of placeholders) {
            if (
              ![
                "event.name",
                "event.date",
                "guest.code",
                "session.sequence",
                "capturedAt",
              ].includes(match[1])
            )
              throw new Error();
          }
        }
      }
    } catch {
      errors.layers = "guardrailError";
    }
  }
  return errors;
}

export function effectiveRuntime(values: Values, now = Date.now()): Values {
  const layers = ["platform", "deviceProfile", "eventLayer", "campaignLayer"];
  if (Date.parse(String(values.overrideExpires)) > now) layers.push("onsite");
  return effectiveValues(
    ...layers.map((key) => {
      try {
        const parsed: unknown = JSON.parse(String(values[key]));
        return parsed && typeof parsed === "object" && !Array.isArray(parsed)
          ? (parsed as Values)
          : {};
      } catch {
        return {};
      }
    }),
  );
}

export function eligibleJob(job: Job, state: ConsoleState): boolean {
  return (
    job.retryable &&
    !job.leaseActive &&
    job.attempts < job.maxAttempts &&
    ["FAILED_RETRYABLE", "PENDING_OFFLINE"].includes(job.status) &&
    state.devices.some(
      (device) =>
        device.id === job.deviceId &&
        ["ONLINE", "DEGRADED"].includes(device.status) &&
        device.trust === "TRUSTED",
    )
  );
}

export function retryJobs(state: ConsoleState, ids: string[]): ConsoleState {
  return {
    ...state,
    jobs: state.jobs.map((job) =>
      ids.includes(job.id) && eligibleJob(job, state)
        ? { ...job, status: "QUEUED", error: "NONE" }
        : job,
    ),
  };
}

/** Null is inheritance; false and zero are intentional overrides. */
export function effectiveValues(...layers: Values[]): Values {
  const result: Values = {};
  for (const layer of layers) {
    for (const [key, value] of Object.entries(layer)) {
      if (value !== null && value !== undefined) result[key] = value;
    }
  }
  return result;
}

export function valueText(value: Value | undefined): string {
  if (value === undefined || value === null) return "—";
  return Array.isArray(value) ? value.join(", ") : String(value);
}

export function diffValues(before: Values, after: Values) {
  return Array.from(new Set([...Object.keys(before), ...Object.keys(after)]))
    .filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]))
    .map((key) => ({ key, before: valueText(before[key]), after: valueText(after[key]) }));
}

export function retryDelay(attempt: number, base: number, cap: number, random: number): number {
  return Math.floor(Math.max(0, Math.min(1, random)) * Math.min(cap, base * 2 ** attempt));
}
