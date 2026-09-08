"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { content } from "../../lib/content";
import { diffValues, effectiveRuntime } from "../../lib/domain";
import { publishDraft, recordValues, saveDraft, validateDraft } from "../../lib/mutations";
import { publishScope, validateReferences } from "../../lib/reference-validation";
import type { Values } from "../../lib/types";
import { useConsole } from "../providers/console-provider";
import { DataTable, Notice, PageHeader, Status } from "../ui/primitives";
import { SchemaFields } from "./schema-fields";
import { ConfirmAction } from "./confirm-action";

export function WorkspaceEditor({
  schemaId,
  back,
  deviceId,
}: {
  schemaId: string;
  back: string;
  deviceId?: string;
}) {
  const { state, localize, t } = useConsole();
  const params = useSearchParams();
  const schema = content.schemas[schemaId];
  const entity = schema.entity;
  const records = entity && entity !== "devices" ? state.entities[entity] : [];
  const requestedRecord = params.get("record");
  const requestedDevice = deviceId ?? params.get("device") ?? undefined;
  const [selected, setSelected] = useState(
    records.some((record) => record.id === requestedRecord)
      ? requestedRecord!
      : (records[0]?.id ?? requestedDevice ?? "default"),
  );
  return (
    <>
      <PageHeader
        title={localize(schema.title)}
        copy={t("immutable")}
        reference={schema.reference}
        back={back}
      />
      {records.length > 0 && (
        <label className="field scope-picker">
          {t("select")}
          <select value={selected} onChange={(event) => setSelected(event.target.value)}>
            {records.map((record) => (
              <option key={record.id} value={record.id}>
                {record.name} · {record.id}
              </option>
            ))}
          </select>
        </label>
      )}
      <EditorForm
        key={`${schemaId}:${selected}`}
        schemaId={schemaId}
        selected={selected}
        deviceId={requestedDevice}
      />
    </>
  );
}

function EditorForm({
  schemaId,
  selected,
  deviceId,
}: {
  schemaId: string;
  selected: string;
  deviceId?: string;
}) {
  const { state, update, notify, t, localize } = useConsole();
  const schema = content.schemas[schemaId];
  const key = `${schemaId}:${selected}`;
  const baseline = recordValues(state, schemaId, selected);
  const [values, setValues] = useState<Values>(() => {
    const initial: Values = {
      ...(state.drafts[key]?.values ?? baseline),
      ...(deviceId ? { deviceId } : {}),
    };
    const record =
      schema.entity && schema.entity !== "devices"
        ? state.entities[schema.entity].find((item) => item.id === selected)
        : undefined;
    if (
      ["template", "allocation"].includes(schemaId) &&
      !state.drafts[key] &&
      record?.status !== "DRAFT"
    )
      initial.version = Number(initial.version) + 1;
    return initial;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState(false);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (schemaId !== "runtime") return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [schemaId]);
  const draft = state.drafts[key];
  const isExact = draft && JSON.stringify(draft.values) === JSON.stringify(values);
  const canPublish = isExact && draft.status === "VALIDATED";
  const effective = schemaId === "runtime" ? effectiveRuntime(values, now) : values;
  const changes = diffValues(
    schemaId === "runtime" ? effectiveRuntime(baseline, now) : baseline,
    effective,
  );
  const labels = Object.fromEntries(
    schema.groups.flatMap((group) =>
      group.fields.map((field) => [field.key, localize(field.label)]),
    ),
  );

  function save(validate: boolean) {
    const next = validateReferences(state, schemaId, values);
    setErrors(next);
    if (Object.keys(next).length) {
      notify("invalid");
      return;
    }
    update((current) => {
      const saved = saveDraft(current, key, values);
      return validate ? validateDraft(saved, key, schemaId) : saved;
    });
    notify(validate ? "validated" : "saved");
  }

  return (
    <div className="editor-layout">
      <form
        className="panel"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          save(false);
        }}
      >
        <div className="panel-heading">
          <Status value={isExact ? draft.status : "DRAFT"} />
          <span className="muted">{t("sample")}</span>
        </div>
        {["rules", "allocation"].includes(schemaId) && <Notice>{t("offlineNote")}</Notice>}
        {schemaId === "allocation" && <Notice>{t("allocationNote")}</Notice>}
        {schemaId === "allocation" && (
          <>
            <h2>{t("inventory")}</h2>
            <DataTable
              columns={["available", "reserved", "consumed", "reconciled", "quarantined"].map(
                (column) => ({ key: column, label: t(column) }),
              )}
              rows={[
                {
                  id: selected,
                  ...Object.fromEntries(
                    ["available", "reserved", "consumed", "reconciled", "quarantined"].map(
                      (column) => [column, String(baseline[column] ?? 0)],
                    ),
                  ),
                },
              ]}
            />
          </>
        )}
        {["storage", "retention"].includes(schemaId) && <Notice>{t("retentionNote")}</Notice>}
        {schemaId === "printer" && <Notice>{t("printerNote")}</Notice>}
        <SchemaFields
          schema={schema}
          values={values}
          errors={errors}
          lockedFields={deviceId ? ["deviceId"] : []}
          onChange={(field, value) => setValues((current) => ({ ...current, [field]: value }))}
        />
        {Object.keys(errors).length > 0 && (
          <p role="alert" className="field-error">
            {t("invalid")}
          </p>
        )}
        <div className="form-actions">
          <button
            type="button"
            className="button"
            onClick={() => {
              setValues(baseline);
              setErrors({});
            }}
          >
            {t("reset")}
          </button>
          <button type="submit" className="button">
            {t("save")}
          </button>
          <button type="button" className="button" onClick={() => save(true)}>
            {t("validate")}
          </button>
          <button
            type="button"
            className="button primary"
            disabled={!canPublish}
            onClick={() => setConfirm(true)}
          >
            {t("publish")}
          </button>
        </div>
      </form>
      <aside className="preview-panel panel">
        <h2>{t(schemaId === "runtime" ? "preview" : "draftPreview")}</h2>
        <Notice>{t(schemaId === "runtime" ? "effectiveNote" : "draftPreviewNote")}</Notice>
        <p className="muted">{t("guard")}</p>
        {schemaId === "runtime" && (
          <>
            <pre className="config-preview">{JSON.stringify(effective, null, 2)}</pre>
            <p className="muted">{t("expiresNote")}</p>
          </>
        )}
        {schemaId === "template" && (
          <div className="contact-sheet" aria-hidden="true">
            <div />
            <div />
            <span>{String(values.name ?? "")}</span>
          </div>
        )}
        {schemaId === "template" && <p className="muted">{t("templatePreview")}</p>}
        <DataTable
          columns={[
            { key: "name", label: t("field") },
            { key: "before", label: t("before") },
            { key: "after", label: t("after") },
          ]}
          rows={changes.map((change) => ({
            id: change.key,
            name: labels[change.key] ?? change.key,
            before: change.before,
            after: change.after,
          }))}
        />
        {!changes.length && <p className="muted">{t("noChanges")}</p>}
        <Notice warning>{t("validationNote")}</Notice>
        {!canPublish && <p className="muted">{t("publishNeeds")}</p>}
      </aside>
      {confirm && (
        <ConfirmAction
          title={t("publish")}
          initialReason={String(values.reason ?? "")}
          onClose={() => setConfirm(false)}
          onConfirm={(reason) => {
            const nextErrors = validateReferences(state, schemaId, { ...values, reason });
            if (Object.keys(nextErrors).length || !publishScope(state, values).length) {
              setErrors(nextErrors);
              notify("invalid");
              return;
            }
            // Revalidate if the confirmation changes the audited reason.
            update((current) => {
              const saved = saveDraft(current, key, { ...values, reason });
              return publishDraft(validateDraft(saved, key, schemaId), key, schemaId, true);
            });
            setValues((current) => ({ ...current, reason }));
            notify(["template", "allocation"].includes(schemaId) ? "pendingPublish" : "published");
          }}
        >
          <Notice>{t("guard")}</Notice>
          <p>
            {t("scope")}: {publishScope(state, values).join(", ")}
          </p>
        </ConfirmAction>
      )}
    </div>
  );
}
