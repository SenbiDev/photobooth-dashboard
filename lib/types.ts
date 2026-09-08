export type Locale = "en" | "id";
export type Localized = Record<Locale, string>;
export type Value = string | number | boolean | string[] | null;
export type Values = Record<string, Value>;
export type EntityKind = "events" | "campaigns" | "templates" | "allocations" | "operators";

export interface FieldDefinition {
  key: string;
  label: Localized;
  type: string;
  default: Value;
  required?: boolean;
  min?: number;
  max?: number;
  options?: { value: string; label: Localized }[];
}

export interface FormSchema {
  title: Localized;
  reference: string;
  groups: { title: Localized; fields: FieldDefinition[] }[];
  entity?: EntityKind | "devices";
  creation?: boolean;
  extra?: boolean;
}

export interface Device {
  id: string;
  name: string;
  status: "ONLINE" | "DEGRADED" | "OFFLINE" | "PENDING_ENROLLMENT";
  camera: string;
  printer: string;
  storageGb: number;
  lastSeen: string;
  active: number;
  desired: number;
  eventId: string;
  paused: boolean;
  fingerprint: string;
  trust: string;
  certificateId?: string;
  certificateExpires?: string;
}

export interface EntityRecord {
  id: string;
  name: string;
  status: string;
  values: Values;
}

export interface Job {
  id: string;
  kind: string;
  deviceId: string;
  status: string;
  attempts: number;
  maxAttempts: number;
  priority: number;
  idempotency: string;
  error: string;
  retryable: boolean;
  leaseActive: boolean;
}

export interface Revision {
  id: number;
  schema: string;
  scope: string[];
  values: Values;
  reason: string;
  createdAt: string;
}

export interface Draft {
  values: Values;
  status: "DRAFT" | "VALIDATED" | "PUBLISHED";
  validatedHash?: string;
}

export interface AuditEntry {
  id: string;
  action: string;
  actor: string;
  scope: string;
  reason: string;
  time: string;
}

export interface Command {
  id: string;
  deviceId: string;
  action: string;
  status: "PENDING";
  reason: string;
}

export interface ConsoleState {
  version: 2;
  devices: Device[];
  entities: Record<EntityKind, EntityRecord[]>;
  jobs: Job[];
  revisions: Revision[];
  drafts: Record<string, Draft>;
  audit: AuditEntry[];
  commands: Command[];
}

export interface CardDefinition {
  title: Localized;
  copy: Localized;
  href: string;
  action: Localized;
  extra: boolean;
}

export interface Content {
  ui: Record<string, Localized>;
  navigation: { key: string; href: string; label: Localized }[];
  modules: Record<string, { title: Localized; copy: Localized; action?: Localized }>;
  cards: Record<string, CardDefinition[]>;
  schemas: Record<string, FormSchema>;
  checks: { key: string; label: Localized; failure: Localized }[];
  statuses: Record<string, Localized>;
  seed: {
    devices: Device[];
    entities: Record<EntityKind, EntityRecord[]>;
    jobs: Job[];
    revisions: Revision[];
    ledger: Record<string, string | number>[];
    records: Record<string, Record<string, string>[]>;
    templateSync: {
      deviceId: string;
      templateId: string;
      desiredVersion: number;
      activeVersion: number;
      lastSyncAt: string;
      lastError: string;
      cacheSizeMb: number;
    }[];
  };
}
