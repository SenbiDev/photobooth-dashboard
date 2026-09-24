import { content } from "../content";
import type { FieldDefinition, FormSchema, Localized, Values } from "../types";
import type { CameraProfile, FrameTemplate, PrinterProfile } from "./types";

const label = (key: string): Localized => content.ui[key];
const blankOption = { value: "", label: { en: "-", id: "-" } };
const sameLabel = (value: string): Localized => ({ en: value, id: value });
const wordLabel = (en: string, id: string): Localized => ({ en, id });
const choice = (
  key: string,
  defaultValue: FieldDefinition["default"],
  options: { value: string; label: Localized }[],
  required = false,
): FieldDefinition => ({
  ...field(key, "select", defaultValue, required),
  options: [blankOption, ...options],
});
const field = (
  key: string,
  type: string,
  defaultValue: FieldDefinition["default"],
  required = false,
): FieldDefinition => ({ key, type, default: defaultValue, required, label: label(key) });

const serviceSchemas: Record<string, FormSchema> = {
  register: {
    title: content.modules.devices.action!,
    reference: "OpenAPI: DeviceCreate / DeviceUpdate",
    groups: [
      {
        title: label("deviceFields"),
        fields: [
          field("deviceCode", "text", "", true),
          field("name", "text", ""),
          field("serialNumber", "text", ""),
          field("status", "text", "active"),
          field("capabilities", "textarea", ""),
          field("cameraProfileId", "cameraProfile", ""),
          field("printerProfileId", "printerProfile", ""),
          field("appVersion", "text", ""),
          field("lastSeenAt", "datetime-local", ""),
        ],
      },
    ],
  },
  campaign: {
    title: content.modules.events.title,
    reference: "OpenAPI: CampaignCreate / CampaignUpdate",
    groups: [
      {
        title: label("campaignFields"),
        fields: [
          field("name", "text", "", true),
          field("status", "text", "draft"),
          field("price", "number", ""),
          field("sessionLimit", "number", ""),
          field("activeFrom", "datetime-local", ""),
          field("activeUntil", "datetime-local", ""),
          field("activationRules", "textarea", ""),
          field("frameSet", "textarea", ""),
          field("printPolicy", "textarea", ""),
          field("deliveryPolicy", "textarea", ""),
          field("frameTemplateIds", "templates", []),
        ],
      },
    ],
  },
  template: {
    title: content.modules.templates.title,
    reference: "OpenAPI: FrameTemplateCreate / FrameTemplateUpdate",
    groups: [
      {
        title: label("templateFields"),
        fields: [
          field("name", "text", "", true),
          field("version", "text", "1", true),
          field("assets", "textarea", ""),
          choice(
            "aspect",
            "",
            ["2:3", "3:2", "1:1", "4:3", "3:4", "9:16", "16:9"].map((value) => ({
              value,
              label: sameLabel(value),
            })),
            true,
          ),
          choice(
            "dimensions",
            "",
            [
              "2x6",
              "4x6",
              "6x4",
              "5x7",
              "6x8",
              "8x10",
              "1200x1800",
              "1800x1200",
              "1080x1920",
              "1920x1080",
            ].map((value) => ({ value, label: sameLabel(value) })),
          ),
          choice("safeArea", "", [
            { value: "0", label: content.ui.optNone },
            { value: "2%", label: sameLabel("2%") },
            { value: "5%", label: sameLabel("5%") },
            { value: "8%", label: sameLabel("8%") },
            { value: "10%", label: sameLabel("10%") },
          ]),
          field("transforms", "textarea", ""),
          choice("previewVariant", "", [
            { value: "fit", label: wordLabel("Fit", "Pas") },
            { value: "fill", label: wordLabel("Fill", "Penuh") },
            { value: "original", label: wordLabel("Original", "Asli") },
            { value: "thumbnail", label: wordLabel("Thumbnail", "Miniatur") },
          ]),
          choice("printVariant", "", [
            { value: "fit", label: wordLabel("Fit", "Pas") },
            { value: "fill", label: wordLabel("Fill", "Penuh") },
            { value: "bleed", label: wordLabel("Bleed", "Bleed") },
            { value: "strip", label: wordLabel("Strip", "Strip") },
          ]),
          choice("digitalVariant", "", [
            { value: "original", label: wordLabel("Original", "Asli") },
            { value: "social", label: wordLabel("Social", "Sosial") },
            { value: "web", label: wordLabel("Web", "Web") },
            { value: "fit", label: wordLabel("Fit", "Pas") },
          ]),
          field("checksum", "text", "", true),
          choice("compatibility", "", [
            { value: "all", label: wordLabel("All", "Semua") },
            { value: "kiosk", label: wordLabel("Kiosk", "Kiosk") },
            { value: "dslr", label: wordLabel("DSLR", "DSLR") },
            { value: "webcam", label: wordLabel("Webcam", "Webcam") },
            { value: "mobile", label: wordLabel("Mobile", "Ponsel") },
          ]),
          choice("publishState", "draft", [
            { value: "draft", label: content.statuses.DRAFT },
            { value: "public", label: label("public") },
            { value: "archive", label: label("archive") },
          ]),
        ],
      },
    ],
  },
  allocation: {
    title: content.modules.vouchers.action!,
    reference: "OpenAPI: VoucherBatchCreate / VoucherBatchUpdate",
    groups: [
      {
        title: label("resourceFields"),
        fields: [
          field("campaignId", "event", ""),
          field("name", "text", "", true),
          field("voucherCount", "number", 0),
          field("entitlementRules", "textarea", ""),
          field("offlineEligible", "checkbox", false),
        ],
      },
    ],
  },
};

export function serviceFormSchema(schemaId: string): FormSchema {
  const schema = serviceSchemas[schemaId];
  if (!schema) throw new Error(`No API form contract for ${schemaId}`);
  return schema;
}

function validateJsonField(values: Values, key: string, errors: Record<string, string>) {
  const value = values[key];
  if (value === "" || value === null || value === undefined) return;
  try {
    const parsed: unknown = JSON.parse(String(value));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
  } catch {
    errors[key] = "invalidJson";
  }
}

export function validateServiceForm(
  schemaId: string,
  values: Values,
  references: {
    campaigns?: { id: string }[];
    templates?: FrameTemplate[];
    cameraProfiles?: CameraProfile[];
    printerProfiles?: PrinterProfile[];
  } = {},
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const definition of serviceFormSchema(schemaId).groups.flatMap((group) => group.fields)) {
    const value = values[definition.key];
    const empty =
      value === null ||
      value === undefined ||
      value === "" ||
      (typeof value === "string" && !value.trim()) ||
      (Array.isArray(value) && value.length === 0);
    if (empty) {
      if (definition.required) errors[definition.key] = "required";
      continue;
    }
    if (definition.type === "number" && (typeof value !== "number" || !Number.isFinite(value))) {
      errors[definition.key] = "range";
    }
    if (definition.type === "datetime-local" && Number.isNaN(Date.parse(String(value)))) {
      errors[definition.key] = "dates";
    }
  }

  if (
    values.activeFrom &&
    values.activeUntil &&
    Date.parse(String(values.activeUntil)) <= Date.parse(String(values.activeFrom))
  ) {
    errors.activeUntil = "dates";
  }
  for (const key of [
    "capabilities",
    "activationRules",
    "frameSet",
    "printPolicy",
    "deliveryPolicy",
    "entitlementRules",
  ]) {
    validateJsonField(values, key, errors);
  }
  if (
    Array.isArray(values.frameTemplateIds) &&
    references.templates?.length &&
    values.frameTemplateIds.some(
      (id) => !references.templates?.some((template) => template.id === id),
    )
  ) {
    errors.frameTemplateIds = "guardrailError";
  }
  if (
    values.campaignId &&
    references.campaigns?.length &&
    !references.campaigns.some((campaign) => campaign.id === values.campaignId)
  ) {
    errors.campaignId = "guardrailError";
  }
  for (const [key, profiles] of [
    ["cameraProfileId", references.cameraProfiles],
    ["printerProfileId", references.printerProfiles],
  ] as const) {
    const selected = values[key];
    if (selected && profiles?.length && !profiles.some((profile) => profile.id === selected)) {
      errors[key] = "guardrailError";
    }
  }
  if (
    schemaId === "campaign" &&
    values.sessionLimit !== undefined &&
    values.sessionLimit !== null &&
    values.sessionLimit !== "" &&
    !Number.isInteger(values.sessionLimit)
  ) {
    errors.sessionLimit = "range";
  }
  if (
    schemaId === "allocation" &&
    values.voucherCount !== undefined &&
    values.voucherCount !== null &&
    values.voucherCount !== "" &&
    (!Number.isInteger(values.voucherCount) || Number(values.voucherCount) < 0)
  ) {
    errors.voucherCount = "range";
  }
  if (schemaId === "template") {
    for (const [key, max] of [
      ["name", 200],
      ["version", 80],
      ["aspect", 40],
      ["checksum", 128],
    ] as const) {
      if (String(values[key] ?? "").length > max) errors[key] = "range";
    }
  }
  return errors;
}
