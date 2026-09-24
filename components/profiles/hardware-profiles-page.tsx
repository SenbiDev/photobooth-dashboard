"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import {
  useCameraProfiles,
  useCreateCameraProfile,
  useCreatePrinterProfile,
  usePrinterProfiles,
  useUpdateCameraProfile,
  useUpdatePrinterProfile,
} from "../../hooks/use-edge-service";
import {
  blankProfileDraft,
  cameraProfileFromDraft,
  cameraProfileGroups,
  printerProfileFromDraft,
  printerProfileGroups,
  profileDraft,
  type ProfileDraft,
  type ProfileField,
  type ProfileFieldGroup,
} from "../../lib/edge-service/profile-form";
import type { CameraProfile, PrinterProfile } from "../../lib/edge-service/types";
import { content } from "../../lib/content";
import { Modal } from "../ui/modal";
import { DataTable, PageHeader, Status } from "../ui/primitives";
import { useConsole } from "../providers/console-provider";
import { ServiceBadge, ServiceBoundary } from "../service/service-feedback";

type ProfileKind = "camera" | "printer";

function ProfileFieldInput({
  field,
  value,
  error,
  onChange,
}: {
  field: ProfileField;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const { t } = useConsole();
  const fieldId = `profile-${field.key}`;
  const describedBy = error ? `${fieldId}-error` : undefined;
  const shared = {
    id: fieldId,
    name: field.key,
    value,
    "aria-invalid": Boolean(error),
    "aria-describedby": describedBy,
    autoComplete: "off" as const,
    spellCheck: false,
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => onChange(event.target.value),
  };
  if (field.kind === "boolean" || field.options) {
    const options = field.options ?? [
      { value: "true", labelKey: "yes" },
      { value: "false", labelKey: "no" },
    ];
    const known = options.some((option) => option.value === value);
    return (
      <select {...shared}>
        <option value="">-</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.labelKey ? t(option.labelKey) : option.value}
          </option>
        ))}
        {value && !known ? <option value={value}>{value}</option> : null}
      </select>
    );
  }
  if (field.kind === "json") {
    return <textarea {...shared} className="config-preview" rows={4} />;
  }
  if (field.kind === "integer") {
    return <input {...shared} type="text" inputMode="numeric" />;
  }
  return <input {...shared} type="text" />;
}

function ProfileModal({
  kind,
  initial,
  onClose,
}: {
  kind: ProfileKind;
  initial?: CameraProfile | PrinterProfile;
  onClose: () => void;
}) {
  const { t, notify } = useConsole();
  const cameraMutation = useCreateCameraProfile();
  const printerMutation = useCreatePrinterProfile();
  const updateCamera = useUpdateCameraProfile();
  const updatePrinter = useUpdatePrinterProfile();
  const groups = kind === "camera" ? cameraProfileGroups : printerProfileGroups;
  const [name, setName] = useState(initial?.name ?? "");
  const [draft, setDraft] = useState<ProfileDraft>(() =>
    initial ? profileDraft(initial, groups) : blankProfileDraft(groups),
  );
  const [enabled, setEnabled] = useState(initial?.status ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const pending =
    cameraMutation.isPending ||
    printerMutation.isPending ||
    updateCamera.isPending ||
    updatePrinter.isPending;

  function updateDraft(key: string, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function submit() {
    if (kind === "camera") {
      const result = cameraProfileFromDraft(name, enabled, draft);
      if (!result.ok) {
        setErrors(result.errors);
        return;
      }
      setErrors({});
      try {
        if (initial) await updateCamera.mutateAsync({ id: initial.id, values: result.values });
        else await cameraMutation.mutateAsync(result.values);
        notify(initial ? "serviceUpdated" : "serviceCreated");
        onClose();
      } catch {
        notify("serviceError");
      }
      return;
    }
    const result = printerProfileFromDraft(name, enabled, draft);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    try {
      if (initial) await updatePrinter.mutateAsync({ id: initial.id, values: result.values });
      else await printerMutation.mutateAsync(result.values);
      notify(initial ? "serviceUpdated" : "serviceCreated");
      onClose();
    } catch {
      notify("serviceError");
    }
  }

  return (
    <Modal
      title={t(
        initial ? "edit" : kind === "camera" ? "createCameraProfile" : "createPrinterProfile",
      )}
      onClose={onClose}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <p className="muted">{t("profileContractNote")}</p>
        {groups.map((group, index) => (
          <ProfileGroup
            key={group.titleKey}
            group={group}
            draft={draft}
            errors={errors}
            onChange={updateDraft}
            leading={
              index === 0 ? (
                <div className="field field-wide">
                  <label htmlFor="profile-name">
                    {t("name")}
                    <span aria-hidden="true"> *</span>
                  </label>
                  <input
                    id="profile-name"
                    name="name"
                    required
                    value={name}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? "profile-name-error" : undefined}
                    autoComplete="off"
                    onChange={(event) => setName(event.target.value)}
                  />
                  {errors.name ? (
                    <span className="field-error" id="profile-name-error">
                      {t(errors.name)}
                    </span>
                  ) : null}
                </div>
              ) : null
            }
            trailing={
              index === 0 ? (
                <label className="check-label field-wide">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(event) => setEnabled(event.target.checked)}
                  />
                  {t("profileEnabled")}
                </label>
              ) : null
            }
          />
        ))}
        <div className="form-actions">
          <button className="button" type="button" onClick={onClose}>
            {t("cancel")}
          </button>
          <button className="button primary" type="submit" disabled={pending || !name.trim()}>
            {pending ? t("serviceSaving") : t("save")}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ProfileGroup({
  group,
  draft,
  errors,
  onChange,
  leading,
  trailing,
}: {
  group: ProfileFieldGroup;
  draft: ProfileDraft;
  errors: Record<string, string>;
  onChange: (key: string, value: string) => void;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  const { t } = useConsole();
  return (
    <fieldset className="form-section">
      <legend>{t(group.titleKey)}</legend>
      <div className="form-grid">
        {leading}
        {group.fields.map((field) => (
          <div
            className={`field${field.wide || field.kind === "json" ? " field-wide" : ""}`}
            key={field.key}
          >
            <label htmlFor={`profile-${field.key}`}>
              {t(field.labelKey)}
              <span className="optional-flag">{t("optional")}</span>
            </label>
            <ProfileFieldInput
              field={field}
              value={draft[field.key] ?? ""}
              error={errors[field.key]}
              onChange={(value) => onChange(field.key, value)}
            />
            {errors[field.key] ? (
              <span className="field-error" id={`profile-${field.key}-error`}>
                {t(errors[field.key])}
              </span>
            ) : null}
          </div>
        ))}
        {trailing}
      </div>
    </fieldset>
  );
}

function CameraProfiles({ onEdit }: { onEdit: (profile: CameraProfile) => void }) {
  const { t } = useConsole();
  const query = useCameraProfiles();
  return (
    <ServiceBoundary query={query}>
      {(response) => (
        <section className="panel">
          <h2>{t("cameraProfiles")}</h2>
          <DataTable
            columns={[
              { key: "name", label: t("name") },
              { key: "resolution", label: t("resolution") },
              { key: "orientation", label: t("orientation") },
              { key: "device", label: t("device") },
              { key: "status", label: t("status") },
              { key: "actions", label: t("actions") },
            ]}
            rows={response.data.map((profile) => ({
              id: profile.id,
              name: profile.name,
              resolution: profile.resolution || "—",
              orientation: profile.orientation || "—",
              device: profile.device_pluged?.name || profile.device_pluged?.id || "—",
              status: <Status value={profile.status ? "ACTIVE" : "INACTIVE"} />,
              actions: (
                <button className="button small" type="button" onClick={() => onEdit(profile)}>
                  {t("edit")}
                </button>
              ),
            }))}
          />
        </section>
      )}
    </ServiceBoundary>
  );
}

function PrinterProfiles({ onEdit }: { onEdit: (profile: PrinterProfile) => void }) {
  const { t } = useConsole();
  const query = usePrinterProfiles();
  return (
    <ServiceBoundary query={query}>
      {(response) => (
        <section className="panel">
          <h2>{t("printerProfiles")}</h2>
          <DataTable
            columns={[
              { key: "name", label: t("name") },
              { key: "model", label: t("model") },
              { key: "transport", label: t("transport") },
              { key: "dpi", label: t("dpi") },
              { key: "status", label: t("status") },
              { key: "actions", label: t("actions") },
            ]}
            rows={response.data.map((profile) => ({
              id: profile.id,
              name: profile.name,
              model: profile.model || "—",
              transport: profile.transport || profile.connection || "—",
              dpi: profile.dpi ?? "—",
              status: <Status value={profile.status ? "ACTIVE" : "INACTIVE"} />,
              actions: (
                <button className="button small" type="button" onClick={() => onEdit(profile)}>
                  {t("edit")}
                </button>
              ),
            }))}
          />
        </section>
      )}
    </ServiceBoundary>
  );
}

export function HardwareProfilesPage({ focus }: { focus?: ProfileKind }) {
  const { t, localize } = useConsole();
  const [modal, setModal] = useState<{
    kind: ProfileKind;
    initial?: CameraProfile | PrinterProfile;
  } | null>(null);
  const hardwareCard = content.cards.devices.find((card) => card.href === "/templates/profiles");
  return (
    <>
      <PageHeader
        title={
          focus
            ? t(focus === "camera" ? "cameraProfiles" : "printerProfiles")
            : localize(hardwareCard?.title ?? content.modules.devices.title)
        }
        copy={t("hardwareProfilesCopy")}
        back="/devices"
        reference="§6, §12"
        action={<ServiceBadge />}
      />
      <div className="form-actions profile-actions">
        {(!focus || focus === "camera") && (
          <button
            className="button primary"
            type="button"
            onClick={() => setModal({ kind: "camera" })}
          >
            <Plus size={17} />
            {t("createCameraProfile")}
          </button>
        )}
        {(!focus || focus === "printer") && (
          <button
            className="button primary"
            type="button"
            onClick={() => setModal({ kind: "printer" })}
          >
            <Plus size={17} />
            {t("createPrinterProfile")}
          </button>
        )}
      </div>
      {(!focus || focus === "camera") && (
        <CameraProfiles onEdit={(initial) => setModal({ kind: "camera", initial })} />
      )}
      {(!focus || focus === "printer") && (
        <PrinterProfiles onEdit={(initial) => setModal({ kind: "printer", initial })} />
      )}
      {modal && (
        <ProfileModal kind={modal.kind} initial={modal.initial} onClose={() => setModal(null)} />
      )}
    </>
  );
}
