import type {
  CameraProfile,
  CameraProfileCreate,
  PrinterProfile,
  PrinterProfileCreate,
} from "./types";

export type ProfileFieldKind = "text" | "integer" | "boolean" | "json" | "choice";

export type ProfileOption = {
  value: string;
  /** Omitted when the stored value is already the label, such as 16:9 or f/2.8. */
  labelKey?: string;
};

export type ProfileField = {
  key: string;
  labelKey: string;
  kind: ProfileFieldKind;
  wide?: boolean;
  options?: ProfileOption[];
};

export type ProfileFieldGroup = {
  titleKey: string;
  fields: ProfileField[];
};

export type ProfileDraft = Record<string, string>;

export type ProfileFormResult<T> =
  { ok: true; values: T } | { ok: false; errors: Record<string, string> };

const text = (key: string, labelKey: string, wide = false): ProfileField => ({
  key,
  labelKey,
  kind: "text",
  wide,
});
const integer = (key: string, labelKey: string): ProfileField => ({
  key,
  labelKey,
  kind: "integer",
});
const flag = (key: string, labelKey: string): ProfileField => ({
  key,
  labelKey,
  kind: "boolean",
});
const json = (key: string, labelKey: string): ProfileField => ({
  key,
  labelKey,
  kind: "json",
  wide: true,
});
const choice = (
  key: string,
  labelKey: string,
  options: ProfileOption[],
  kind: "choice" | "integer" = "choice",
): ProfileField => ({
  key,
  labelKey,
  kind,
  options,
});
const literal = (values: string[]): ProfileOption[] => values.map((value) => ({ value }));

const ASPECT_RATIOS = literal(["1:1", "3:2", "2:3", "4:3", "3:4", "16:9", "9:16"]);
const RESOLUTIONS = literal([
  "1280x720",
  "1920x1080",
  "2048x1536",
  "3840x2160",
  "4000x3000",
  "6000x4000",
]);
const SHUTTER_SPEEDS = literal([
  "1/30",
  "1/60",
  "1/125",
  "1/160",
  "1/200",
  "1/250",
  "1/500",
  "1/1000",
]);
const APERTURES = literal(["f/1.4", "f/1.8", "f/2.8", "f/4", "f/5.6", "f/8", "f/11"]);
const ISO_VALUES = literal(["100", "200", "400", "800", "1600", "3200", "6400"]);
const DPI_VALUES = literal(["203", "300", "600"]);

/** Optional CameraProfileCreate properties. `name` and `status` are edited separately. */
export const cameraProfileGroups: ProfileFieldGroup[] = [
  {
    titleKey: "profileIdentity",
    fields: [text("image", "profileImage", true)],
  },
  {
    titleKey: "profileCapture",
    fields: [
      choice("resolution", "resolution", RESOLUTIONS),
      choice("aspect_ratio", "aspectRatio", ASPECT_RATIOS),
      choice("orientation", "orientation", [
        { value: "auto", labelKey: "optAuto" },
        { value: "landscape", labelKey: "optLandscape" },
        { value: "portrait", labelKey: "optPortrait" },
      ]),
      flag("mirror_preview", "mirrorPreview"),
      choice("exposure", "exposure", [
        { value: "auto", labelKey: "optAuto" },
        { value: "manual", labelKey: "optManual" },
        { value: "aperture-priority", labelKey: "optAperturePriority" },
        { value: "shutter-priority", labelKey: "optShutterPriority" },
      ]),
      choice("iso", "iso", ISO_VALUES, "integer"),
      choice("shutter", "shutter", SHUTTER_SPEEDS),
      choice("aperture", "aperture", APERTURES),
      choice("white_balance", "whiteBalance", [
        { value: "auto", labelKey: "optAuto" },
        { value: "daylight", labelKey: "optDaylight" },
        { value: "cloudy", labelKey: "optCloudy" },
        { value: "shade", labelKey: "optShade" },
        { value: "tungsten", labelKey: "optTungsten" },
        { value: "fluorescent", labelKey: "optFluorescent" },
        { value: "flash", labelKey: "optWbFlash" },
      ]),
      choice("focus_mode", "focusMode", [
        { value: "auto", labelKey: "optAuto" },
        { value: "single", labelKey: "optSingle" },
        { value: "continuous", labelKey: "optContinuous" },
        { value: "manual", labelKey: "optManual" },
      ]),
      flag("flash", "flash"),
      choice("trigger", "trigger", [
        { value: "touch", labelKey: "optTouch" },
        { value: "countdown", labelKey: "optCountdown" },
        { value: "keyboard", labelKey: "optKeyboard" },
        { value: "remote", labelKey: "optRemote" },
        { value: "gpio", labelKey: "optGpio" },
        { value: "software", labelKey: "optSoftware" },
      ]),
      integer("warm_up", "warmUp"),
      integer("capture_timeout", "captureTimeout"),
    ],
  },
];

/** Optional PrinterProfileCreate properties. `name` and `status` are edited separately. */
export const printerProfileGroups: ProfileFieldGroup[] = [
  {
    titleKey: "profileIdentity",
    fields: [text("image", "profileImage", true)],
  },
  {
    titleKey: "profileConnection",
    fields: [
      choice("connection", "connection", [
        { value: "usb", labelKey: "optUsb" },
        { value: "ethernet", labelKey: "optEthernet" },
        { value: "wifi", labelKey: "optWifi" },
        { value: "serial", labelKey: "optSerial" },
        { value: "bluetooth", labelKey: "optBluetooth" },
      ]),
      choice("driver_type", "driverType", [
        { value: "cups", labelKey: "optCups" },
        { value: "windows", labelKey: "optWindows" },
        { value: "dnp", labelKey: "optDnp" },
        { value: "mitsubishi", labelKey: "optMitsubishi" },
        { value: "hiti", labelKey: "optHiti" },
        { value: "citizen", labelKey: "optCitizen" },
        { value: "epson", labelKey: "optEpson" },
        { value: "escpos", labelKey: "optEscpos" },
        { value: "zpl", labelKey: "optZpl" },
        { value: "generic", labelKey: "optGeneric" },
      ]),
      choice("transport", "transport", [
        { value: "cups", labelKey: "optCups" },
        { value: "ipp", labelKey: "optIpp" },
        { value: "tcp", labelKey: "optTcp" },
        { value: "usb", labelKey: "optUsb" },
        { value: "serial", labelKey: "optSerial" },
        { value: "bluetooth", labelKey: "optBluetooth" },
      ]),
      text("model", "model"),
      text("device_identifier", "deviceIdentifier", true),
    ],
  },
  {
    titleKey: "profileMedia",
    fields: [
      choice("dpi", "dpi", DPI_VALUES, "integer"),
      integer("width_dots", "widthDots"),
      integer("max_height_dots", "maxHeightDots"),
      choice("media_type", "mediaType", [
        { value: "dye-sub", labelKey: "optDyeSub" },
        { value: "photo-paper", labelKey: "optPhotoPaper" },
        { value: "sticker", labelKey: "optSticker" },
        { value: "label", labelKey: "optLabelMedia" },
        { value: "receipt", labelKey: "optReceipt" },
        { value: "plain", labelKey: "optPlain" },
      ]),
      integer("label_width", "labelWidth"),
      integer("label_height", "labelHeight"),
    ],
  },
  {
    titleKey: "profilePrint",
    fields: [
      integer("darkness", "darkness"),
      integer("speed", "speed"),
      flag("cut", "cut"),
      integer("feed", "feed"),
      choice("dither", "dither", [
        { value: "none", labelKey: "optNone" },
        { value: "floyd-steinberg", labelKey: "optFloyd" },
        { value: "bayer", labelKey: "optBayer" },
        { value: "threshold", labelKey: "optThreshold" },
      ]),
      integer("qr_size", "qrSize"),
      text("template", "profileTemplate"),
      choice("retry_policy", "retryPolicy", [
        { value: "none", labelKey: "optNone" },
        { value: "once", labelKey: "optOnce" },
        { value: "twice", labelKey: "optTwice" },
        { value: "three", labelKey: "optThree" },
        { value: "exponential", labelKey: "optExponential" },
      ]),
    ],
  },
  {
    titleKey: "profileCalibration",
    fields: [json("margins", "marginsJson"), json("calibration_offsets", "calibrationOffsets")],
  },
];

function fieldsOf(groups: ProfileFieldGroup[]) {
  return groups.flatMap((group) => group.fields);
}

export function blankProfileDraft(groups: ProfileFieldGroup[]): ProfileDraft {
  return Object.fromEntries(fieldsOf(groups).map((field) => [field.key, ""]));
}

export function profileDraft(
  profile: CameraProfile | PrinterProfile,
  groups: ProfileFieldGroup[],
): ProfileDraft {
  const source = profile as unknown as Record<string, unknown>;
  const draft: ProfileDraft = {};
  for (const field of fieldsOf(groups)) {
    const value = source[field.key];
    if (value === null || value === undefined || value === "") {
      draft[field.key] = "";
    } else if (field.kind === "boolean") {
      draft[field.key] = value === true ? "true" : value === false ? "false" : "";
    } else if (field.kind === "json") {
      draft[field.key] = JSON.stringify(value, null, 2);
    } else {
      draft[field.key] = String(value);
    }
  }
  return draft;
}

function optionalValues(
  groups: ProfileFieldGroup[],
  draft: ProfileDraft,
  errors: Record<string, string>,
) {
  const values: Record<string, unknown> = {};
  for (const field of fieldsOf(groups)) {
    const raw = draft[field.key] ?? "";
    const trimmed = raw.trim();
    if (!trimmed) {
      values[field.key] = null;
      continue;
    }
    if (field.kind === "integer") {
      if (!/^-?\d+$/.test(trimmed)) {
        errors[field.key] = "invalidNumber";
        continue;
      }
      values[field.key] = Number(trimmed);
    } else if (field.kind === "boolean") {
      if (trimmed !== "true" && trimmed !== "false") {
        errors[field.key] = "invalid";
        continue;
      }
      values[field.key] = trimmed === "true";
    } else if (field.kind === "json") {
      try {
        const parsed: unknown = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
        values[field.key] = parsed;
      } catch {
        errors[field.key] = "invalidJson";
      }
    } else {
      values[field.key] = trimmed;
    }
  }
  return values;
}

export function cameraProfileFromDraft(
  name: string,
  status: boolean,
  draft: ProfileDraft,
): ProfileFormResult<CameraProfileCreate> {
  const errors: Record<string, string> = {};
  const trimmed = name.trim();
  if (!trimmed) errors.name = "required";
  const optional = optionalValues(cameraProfileGroups, draft, errors);
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    values: { name: trimmed, status, ...optional } as CameraProfileCreate,
  };
}

export function printerProfileFromDraft(
  name: string,
  status: boolean,
  draft: ProfileDraft,
): ProfileFormResult<PrinterProfileCreate> {
  const errors: Record<string, string> = {};
  const trimmed = name.trim();
  if (!trimmed) errors.name = "required";
  const optional = optionalValues(printerProfileGroups, draft, errors);
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    values: { name: trimmed, status, ...optional } as PrinterProfileCreate,
  };
}
