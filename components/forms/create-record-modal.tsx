"use client";

import { useState } from "react";
import { content } from "../../lib/content";
import { defaults } from "../../lib/domain";
import { createRecord } from "../../lib/mutations";
import { validateReferences } from "../../lib/reference-validation";
import { useConsole } from "../providers/console-provider";
import { Modal } from "../ui/modal";
import { ExtraBadge, Notice } from "../ui/primitives";
import { SchemaFields } from "./schema-fields";

export function CreateRecordModal({
  schemaId,
  onClose,
}: {
  schemaId: string;
  onClose: () => void;
}) {
  const schema = content.schemas[schemaId];
  const { state, update, localize, t, notify } = useConsole();
  const [values, setValues] = useState(() => {
    const initial = defaults(schema);
    if (schemaId === "event" || schemaId === "template" || schemaId === "allocation")
      initial.name = "";
    if (schemaId === "event") initial.slug = "";
    if (schemaId === "template") {
      initial.templateId = "";
      initial.version = 1;
    }
    return initial;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState(false);
  const submit = () => {
    const next = validateReferences(state, schemaId, values);
    if (schemaId === "register" && state.devices.some((device) => device.id === values.id))
      next.id = "duplicate";
    if (
      schemaId === "event" &&
      state.entities.events.some((record) => record.values.slug === values.slug)
    )
      next.slug = "duplicate";
    if (
      schemaId === "template" &&
      state.entities.templates.some(
        (record) =>
          record.values.templateId === values.templateId &&
          record.values.version === values.version,
      )
    )
      next.version = "duplicate";
    setErrors(next);
    if (Object.keys(next).length || (schemaId === "invite" && !confirm)) return;
    update((current) => createRecord(current, schemaId, values));
    notify("created");
    onClose();
  };
  return (
    <Modal
      title={
        schemaId === "register" || schemaId === "invite"
          ? localize(schema.title)
          : localize(
              content.modules[
                schemaId === "event" ? "events" : schemaId === "template" ? "templates" : "vouchers"
              ].action!,
            )
      }
      onClose={onClose}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        noValidate
      >
        {schema.extra && <ExtraBadge />}
        <Notice>{t(schemaId === "invite" ? "inviteNote" : "sample")}</Notice>
        <SchemaFields
          schema={schema}
          values={values}
          errors={errors}
          onChange={(key, value) => setValues((current) => ({ ...current, [key]: value }))}
        />
        {schemaId === "invite" && (
          <>
            <label className="check-label">
              <input
                type="checkbox"
                checked={confirm}
                onChange={(event) => setConfirm(event.target.checked)}
              />
              {t("reauth")}
            </label>
            <Notice>{t("reauthNote")}</Notice>
          </>
        )}
        {Object.keys(errors).length > 0 && (
          <p role="alert" className="field-error">
            {t("invalid")}
          </p>
        )}
        <div className="form-actions">
          <button type="button" className="button" onClick={onClose}>
            {t("cancel")}
          </button>
          <button
            type="submit"
            className="button primary"
            disabled={schemaId === "invite" && !confirm}
          >
            {t("save")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
