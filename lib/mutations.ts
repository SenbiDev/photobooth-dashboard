import { content } from "./content";
import { defaults } from "./domain";
import { publishScope, validateReferences } from "./reference-validation";
import type { ConsoleState, EntityKind, Values } from "./types";

export function audit(
  state: ConsoleState,
  action: string,
  scope: string,
  reason: string,
): ConsoleState {
  return {
    ...state,
    audit: [
      {
        id: `AUD-${crypto.randomUUID().slice(0, 8)}`,
        action,
        actor: content.seed.entities.operators[0].name,
        scope,
        reason,
        time: new Date().toISOString(),
      },
      ...state.audit,
    ],
  };
}

export function saveDraft(state: ConsoleState, key: string, values: Values): ConsoleState {
  return audit(
    {
      ...state,
      drafts: { ...state.drafts, [key]: { values: structuredClone(values), status: "DRAFT" } },
    },
    "save",
    key,
    String(values.reason ?? ""),
  );
}

export function validateDraft(state: ConsoleState, key: string, schemaId: string): ConsoleState {
  const draft = state.drafts[key];
  if (!draft || Object.keys(validateReferences(state, schemaId, draft.values)).length) return state;
  return {
    ...state,
    drafts: {
      ...state.drafts,
      [key]: { ...draft, status: "VALIDATED", validatedHash: JSON.stringify(draft.values) },
    },
  };
}

export function publishDraft(
  state: ConsoleState,
  key: string,
  schemaId: string,
  reauthenticated: boolean,
): ConsoleState {
  const draft = state.drafts[key];
  if (
    !reauthenticated ||
    !draft ||
    draft.status !== "VALIDATED" ||
    draft.validatedHash !== JSON.stringify(draft.values) ||
    !String(draft.values.reason ?? "").trim() ||
    Object.keys(validateReferences(state, schemaId, draft.values)).length
  )
    return state;
  const scope = publishScope(state, draft.values);
  if (!scope.length) return state;
  if (schemaId === "allocation" || schemaId === "template") {
    const entity = schemaId === "allocation" ? "allocations" : "templates";
    // Only editable contract fields belong to a request. Never clone signed
    // inventory counters or other read-only evidence from the source record.
    const requestValues = Object.fromEntries(
      content.schemas[schemaId].groups.flatMap((group) =>
        group.fields.map((field) => [field.key, structuredClone(draft.values[field.key])]),
      ),
    );
    return audit(
      {
        ...state,
        entities: {
          ...state.entities,
          [entity]: [
            ...state.entities[entity],
            {
              id: `${schemaId.toUpperCase()}-${crypto.randomUUID().slice(0, 8)}`,
              name: String(draft.values.name),
              status: "UNSIGNED_REQUEST",
              values: requestValues,
            },
          ],
        },
        drafts: { ...state.drafts, [key]: { ...draft, status: "PUBLISHED" } },
      },
      "pendingPublish",
      scope.join(", "),
      String(draft.values.reason),
    );
  }
  const id = Math.max(...state.revisions.map((revision) => revision.id)) + 1;
  return audit(
    {
      ...state,
      revisions: [
        ...state.revisions,
        {
          id,
          schema: schemaId,
          values: structuredClone(draft.values),
          scope,
          reason: String(draft.values.reason),
          createdAt: new Date().toISOString(),
        },
      ],
      drafts: { ...state.drafts, [key]: { ...draft, status: "PUBLISHED" } },
      devices: state.devices.map((device) =>
        scope.includes(device.id) ? { ...device, desired: id } : device,
      ),
    },
    "publish",
    scope.join(", "),
    String(draft.values.reason),
  );
}

export function createRecord(state: ConsoleState, schemaId: string, values: Values): ConsoleState {
  const schema = content.schemas[schemaId];
  if (!schema.entity || Object.keys(validateReferences(state, schemaId, values)).length)
    return state;
  if (
    schema.entity === "events" &&
    state.entities.events.some((record) => record.values.slug === values.slug)
  )
    return state;
  if (
    schema.entity === "templates" &&
    state.entities.templates.some(
      (record) =>
        record.values.templateId === values.templateId && record.values.version === values.version,
    )
  )
    return state;
  if (schema.entity === "devices") {
    if (state.devices.some((device) => device.id === values.id)) return state;
    return audit(
      {
        ...state,
        devices: [
          ...state.devices,
          {
            id: String(values.id),
            name: String(values.name),
            status: "PENDING_ENROLLMENT",
            camera: String(values.camera),
            printer: String(values.printer),
            storageGb: Number(values.storageGb),
            lastSeen: "",
            active: 0,
            desired: 0,
            eventId: String(values.eventId),
            paused: true,
            fingerprint: String(values.fingerprint),
            trust: "PENDING_ENROLLMENT",
          },
        ],
      },
      "created",
      String(values.id),
      String(values.reason ?? ""),
    );
  }
  const entity: EntityKind = schema.entity;
  const id = `${entity.slice(0, 3).toUpperCase()}-${crypto.randomUUID().slice(0, 8)}`;
  const safeValues = { ...values };
  // Invitations demonstrate assignment only. Never persist an unmasked address.
  if (typeof safeValues.email === "string") {
    const [name, domain] = safeValues.email.split("@");
    safeValues.email = `${name.slice(0, 1)}***@${domain}`;
  }
  return audit(
    {
      ...state,
      entities: {
        ...state.entities,
        [entity]: [
          ...state.entities[entity],
          {
            id,
            name: String(values.name),
            status: entity === "allocations" ? "UNSIGNED_REQUEST" : "DRAFT",
            values: safeValues,
          },
        ],
      },
    },
    "created",
    id,
    String(values.reason ?? ""),
  );
}

export function requestCommand(
  state: ConsoleState,
  deviceId: string,
  action: string,
  reason: string,
  reauthenticated: boolean,
): ConsoleState {
  const allowed = ["pause", "resume", "sync", "diagnostics", "hardware", "rotate", "revoke"];
  if (
    !reauthenticated ||
    !reason.trim() ||
    !allowed.includes(action) ||
    !state.devices.some((device) => device.id === deviceId)
  )
    return state;
  return audit(
    {
      ...state,
      commands: [
        ...state.commands,
        {
          id: `CMD-${crypto.randomUUID().slice(0, 8)}`,
          deviceId,
          action,
          reason,
          status: "PENDING",
        },
      ],
    },
    action,
    deviceId,
    reason,
  );
}

export function recordValues(state: ConsoleState, schemaId: string, recordId?: string): Values {
  const schema = content.schemas[schemaId];
  const entity = schema.entity;
  const record =
    entity && entity !== "devices"
      ? state.entities[entity].find((item) => item.id === recordId)
      : undefined;
  return { ...defaults(schema), ...record?.values, ...(record ? { name: record.name } : {}) };
}
