export interface PaginationInfo {
  total_data: number;
  page: number;
  limit: number;
}

export interface ListResponse<T> {
  message: string;
  data: T[];
  pagination?: PaginationInfo | null;
}

export interface CampaignBrief {
  id: string;
  name: string;
}

export interface FrameTemplateBrief {
  id: string;
  name: string;
}

export interface Campaign {
  id: string;
  name: string;
  status: string;
  price?: number | null;
  session_limit?: number | null;
  active_from?: string | null;
  active_until?: string | null;
  activation_rules?: Record<string, unknown> | null;
  frame_set?: Record<string, unknown> | null;
  print_policy?: Record<string, unknown> | null;
  delivery_policy?: Record<string, unknown> | null;
  frame_templates?: FrameTemplateBrief[] | null;
}

export type CampaignCreate = Omit<Campaign, "id" | "frame_templates"> & {
  frame_template_ids?: string[] | null;
};
export type CampaignUpdate = Partial<CampaignCreate>;

export interface Booth {
  id: string;
  campaign?: CampaignBrief | null;
  name: string;
  location?: string | null;
  status: string;
  config_override?: Record<string, unknown> | null;
}

export type BoothCreate = Omit<Booth, "id" | "campaign"> & { campaign_id?: string | null };
export type BoothUpdate = Partial<BoothCreate>;

export interface Device {
  id: string;
  device_code: string;
  name?: string | null;
  serial_number?: string | null;
  status: string;
  capabilities?: Record<string, unknown> | null;
  camera_profile_id?: string | null;
  printer_profile_id?: string | null;
  app_version?: string | null;
  last_seen_at?: string | null;
  last_heartbeat?: string | null;
  connectivity?: string | null;
  storage_state?: string | null;
  camera_health?: string | null;
  printer_health?: string | null;
}

export type DeviceCreate = Omit<
  Device,
  "id" | "last_heartbeat" | "connectivity" | "storage_state" | "camera_health" | "printer_health"
>;
export type DeviceUpdate = Partial<DeviceCreate>;

export interface DeviceAssignment {
  id: string;
  booth: { id: string; name: string; campaign?: CampaignBrief | null };
  device: {
    id: string;
    name?: string | null;
    camera_profile?: ProfileBrief | null;
    printer_profile?: ProfileBrief | null;
  };
  assigned_from?: string | null;
  assigned_until?: string | null;
  status: string;
}

export interface DeviceAssignmentCreate {
  booth_id: string;
  device_id: string;
  assigned_from?: string | null;
  assigned_until?: string | null;
  status?: string;
}
export type DeviceAssignmentUpdate = Partial<DeviceAssignmentCreate>;

export interface ProfileBrief {
  id: string;
  name: string;
}

export interface CameraProfile {
  id: string;
  name: string;
  image?: string | null;
  status: boolean;
  resolution?: string | null;
  aspect_ratio?: string | null;
  orientation?: string | null;
  mirror_preview?: boolean | null;
  exposure?: string | null;
  iso?: number | null;
  shutter?: string | null;
  aperture?: string | null;
  white_balance?: string | null;
  focus_mode?: string | null;
  flash?: boolean | null;
  trigger?: string | null;
  warm_up?: number | null;
  capture_timeout?: number | null;
  device_pluged?: { id: string; name?: string | null } | null;
}

export type CameraProfileCreate = Omit<CameraProfile, "id" | "device_pluged">;
export type CameraProfileUpdate = Partial<CameraProfileCreate>;

export interface PrinterProfile {
  id: string;
  name: string;
  image?: string | null;
  status: boolean;
  connection?: string | null;
  driver_type?: string | null;
  transport?: string | null;
  model?: string | null;
  device_identifier?: string | null;
  dpi?: number | null;
  width_dots?: number | null;
  max_height_dots?: number | null;
  media_type?: string | null;
  label_width?: number | null;
  label_height?: number | null;
  darkness?: number | null;
  speed?: number | null;
  cut?: boolean | null;
  feed?: number | null;
  margins?: Record<string, unknown> | null;
  dither?: string | null;
  qr_size?: number | null;
  template?: string | null;
  retry_policy?: string | null;
  calibration_offsets?: Record<string, unknown> | null;
  device_pluged?: { id: string; name?: string | null } | null;
}

export type PrinterProfileCreate = Omit<PrinterProfile, "id" | "device_pluged">;
export type PrinterProfileUpdate = Partial<PrinterProfileCreate>;

export type PublishState = "draft" | "public" | "archive";

export interface FrameTemplate {
  id: string;
  name: string;
  version: string;
  assets: string;
  aspect: string;
  dimensions: string;
  safe_area: string;
  transforms: string;
  preview_variant: string;
  print_variant: string;
  digital_variant: string;
  checksum: string;
  compatibility: string;
  publish_state: PublishState;
}

export type FrameTemplateCreate = Omit<FrameTemplate, "id">;
export type FrameTemplateUpdate = Partial<FrameTemplateCreate>;

export interface VoucherBatch {
  id: string;
  campaign_id?: string | null;
  name: string;
  voucher_count: number;
  entitlement_rules?: Record<string, unknown> | null;
  offline_eligible: boolean;
}

export type VoucherBatchCreate = Omit<VoucherBatch, "id">;
export type VoucherBatchUpdate = Partial<Omit<VoucherBatchCreate, "voucher_count">>;

export interface Voucher {
  id: string;
  batch_id: string;
  code: string;
  status: string;
  session_id?: string | null;
  device_id?: string | null;
  expires_at?: string | null;
  issued_at?: string | null;
  used_at?: string | null;
  created_at: string;
}

export interface Session {
  id: string;
  campaign_id?: string | null;
  booth_id?: string | null;
  device_id?: string | null;
  activation_mode?: string | null;
  state: string;
  config_snapshot_id?: string | null;
  offline: boolean;
  device_code?: string | null;
  camera_profile_id?: string | null;
  camera_profile_name?: string | null;
  printer_profile_id?: string | null;
  printer_profile_name?: string | null;
  device_logged_at?: string | null;
}

export type SessionCreate = Omit<
  Session,
  | "id"
  | "device_code"
  | "camera_profile_id"
  | "camera_profile_name"
  | "printer_profile_id"
  | "printer_profile_name"
  | "device_logged_at"
>;
export type SessionUpdate = Partial<SessionCreate>;

export interface Payment {
  id: string;
  booth_id?: string | null;
  campaign_id?: string | null;
  device_id?: string | null;
  voucher_id?: string | null;
  session_id?: string | null;
  amount: number;
  currency: string;
  method?: string | null;
  status: string;
  provider: string;
  provider_ref?: string | null;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentCreate {
  booth_id?: string | null;
  campaign_id?: string | null;
  device_id?: string | null;
  amount?: number | null;
  method?: string | null;
}

export interface PaymentCreateResponse {
  payment: Payment;
  charge_url?: string | null;
}

export interface DeviceHistory {
  id: string;
  session_id: string;
  device_id?: string | null;
  camera_profile_id?: string | null;
  printer_profile_id?: string | null;
  device_code?: string | null;
  camera_profile_name?: string | null;
  printer_profile_name?: string | null;
  reason: string;
  created_at: string;
}

export interface Summary {
  transactions: number;
  gross: number;
  refund_total: number;
  net: number;
  voucher_used: number;
  voucher_value: number;
}

export interface DailyRevenueRow extends Summary {
  date: string;
  channels: Record<string, unknown>;
}

export interface ReportResponse<T> {
  message: string;
  data: T[];
  summary: Summary;
}

export interface VoucherBatchReportRow {
  batch_id: string;
  name: string;
  campaign_id?: string | null;
  issued: number;
  available: number;
  used: number;
  expired: number;
  voided: number;
  voucher_value: number;
}

export interface FunnelReport {
  message: string;
  created: number;
  paid: number;
  refunded: number;
  offline: number;
  online: number;
  overdue_minutes: number;
  overdue_pending: Array<{
    payment_id: string;
    amount: number;
    booth_name?: string | null;
    created_at: string;
  }>;
}

export interface ListParams {
  skip?: number;
  limit?: number;
}

export interface ReportParams {
  date_from?: string;
  date_to?: string;
  booth_id?: string;
  campaign_id?: string;
}
