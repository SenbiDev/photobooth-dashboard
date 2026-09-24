"use client";

import { useState } from "react";
import { serviceFormSchema, validateServiceForm } from "../../lib/edge-service/form-contract";
import type { Values } from "../../lib/types";
import { useCreateServiceRecord, useServiceReferences } from "../../hooks/use-edge-service";
import { useConsole } from "../providers/console-provider";
import { Modal } from "../ui/modal";
import { Notice } from "../ui/primitives";
import { SchemaFields } from "./schema-fields";

const initialValues = (schemaId: string): Values =>
  Object.fromEntries(
    serviceFormSchema(schemaId).groups.flatMap((group) =>
      group.fields.map((field) => [field.key, field.default]),
    ),
  );

export function CreateRecordModal({
  schemaId,
  onClose,
}: {
  schemaId: string;
  onClose: () => void;
}) {
  const schema = serviceFormSchema(schemaId);
  const { localize, t, notify } = useConsole();
  const references = useServiceReferences();
  const mutation = useCreateServiceRecord(schemaId);
  const [values, setValues] = useState<Values>(() => initialValues(schemaId));
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit() {
    const nextErrors = validateServiceForm(schemaId, values, references);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    try {
      await mutation.mutateAsync(values);
      notify("serviceCreated");
      onClose();
    } catch {
      setErrors({ _service: "serviceError" });
      notify("serviceError");
    }
  }

  return (
    <Modal title={localize(schema.title)} onClose={onClose}>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <Notice>{t("apiContractCopy")}</Notice>
        <SchemaFields
          schema={schema}
          values={values}
          errors={errors}
          serviceMode
          lockedFields={schemaId === "template" ? ["publishState"] : []}
          onChange={(key, value) => setValues((current) => ({ ...current, [key]: value }))}
        />
        {errors._service && <p className="field-error">{t(errors._service)}</p>}
        <div className="form-actions">
          <button className="button" type="button" onClick={onClose}>
            {t("cancel")}
          </button>
          <button className="button primary" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? t("serviceSaving") : t("save")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
