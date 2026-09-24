"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { serviceFormSchema, validateServiceForm } from "../../lib/edge-service/form-contract";
import type { Values } from "../../lib/types";
import {
  useGenerateVouchers,
  usePublishServiceRecord,
  useServiceEditorRecords,
  useServiceReferences,
} from "../../hooks/use-edge-service";
import { useConsole } from "../providers/console-provider";
import { Notice, PageHeader, Status } from "../ui/primitives";
import { ServiceBadge, ServiceError, ServiceLoading } from "../service/service-feedback";
import { SchemaFields } from "./schema-fields";

export function WorkspaceEditor({
  schemaId,
  back,
  picker = true,
}: {
  schemaId: string;
  back: string;
  /** When false, only the record chosen from the list is shown. */
  picker?: boolean;
}) {
  const { localize, t } = useConsole();
  const schema = serviceFormSchema(schemaId);
  const records = useServiceEditorRecords(schemaId);
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const search = params.toString();
  const requested = params.get("record");
  const matched = records.data?.find((record) => record.id === requested);
  const selectedRecord = picker ? (matched ?? records.data?.[0]) : matched;

  useEffect(() => {
    if (!picker || !selectedRecord || requested === selectedRecord.id) return;
    const next = new URLSearchParams(search);
    next.set("record", selectedRecord.id);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }, [pathname, picker, requested, router, search, selectedRecord]);

  if (records.isPending) return <ServiceLoading />;
  if (records.isError) return <ServiceError retry={() => void records.refetch()} />;
  if (!selectedRecord) {
    const hasRecords = (records.data?.length ?? 0) > 0;
    return (
      <>
        <PageHeader title={localize(schema.title)} back={back} action={<ServiceBadge />} />
        <Notice>
          {hasRecords && !picker ? t("chooseRecordFromList") : t("emptyServiceRecords")}
        </Notice>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={picker ? localize(schema.title) : selectedRecord.name}
        copy={picker ? t("apiContractCopy") : selectedRecord.id}
        reference={schema.reference}
        back={back}
        action={<ServiceBadge />}
      />
      {picker && (
        <label className="field scope-picker">
          {t("select")}
          <select
            value={selectedRecord.id}
            onChange={(event) => {
              const next = new URLSearchParams(search);
              next.set("record", event.target.value);
              router.replace(`${pathname}?${next.toString()}`, { scroll: false });
            }}
          >
            {records.data?.map((record) => (
              <option key={record.id} value={record.id}>
                {record.name} · {record.id}
              </option>
            ))}
          </select>
        </label>
      )}
      <EditorForm
        key={`${schemaId}:${selectedRecord.id}`}
        schemaId={schemaId}
        record={selectedRecord}
      />
    </>
  );
}

function EditorForm({
  schemaId,
  record,
}: {
  schemaId: string;
  record: { id: string; name: string; status: string; values: Values };
}) {
  const { t, notify } = useConsole();
  const schema = serviceFormSchema(schemaId);
  const references = useServiceReferences();
  const updateRecord = usePublishServiceRecord(schemaId, record.id);
  const generateVouchers = useGenerateVouchers();
  const [values, setValues] = useState<Values>({ ...record.values });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generateCount, setGenerateCount] = useState(1);
  const changed = JSON.stringify(values) !== JSON.stringify(record.values);

  async function save() {
    const nextErrors = validateServiceForm(schemaId, values, references);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    try {
      await updateRecord.mutateAsync({ values, baseline: record.values });
      notify("serviceUpdated");
    } catch {
      setErrors({ _service: "serviceError" });
      notify("serviceError");
    }
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>{record.name}</h2>
          <small>{record.id}</small>
        </div>
        {record.status && <Status value={record.status.toUpperCase()} />}
      </div>
      <Notice>{t("apiContractCopy")}</Notice>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <SchemaFields
          schema={schema}
          values={values}
          errors={errors}
          serviceMode
          lockedFields={schemaId === "allocation" ? ["voucherCount"] : []}
          onChange={(key, value) => setValues((current) => ({ ...current, [key]: value }))}
        />
        {errors._service && <p className="field-error">{t(errors._service)}</p>}
        <div className="form-actions">
          <button
            className="button"
            type="button"
            disabled={!changed || updateRecord.isPending}
            onClick={() => {
              setValues({ ...record.values });
              setErrors({});
            }}
          >
            {t("reset")}
          </button>
          <button
            className="button primary"
            type="submit"
            disabled={!changed || updateRecord.isPending}
          >
            {updateRecord.isPending ? t("serviceSaving") : t("saveChanges")}
          </button>
        </div>
      </form>
      {schemaId === "allocation" && (
        <div className="form-actions">
          <label className="field">
            {t("generateVouchers")}
            <input
              type="number"
              min={1}
              max={5000}
              value={generateCount}
              onChange={(event) => setGenerateCount(Number(event.target.value))}
            />
          </label>
          <button
            type="button"
            className="button"
            disabled={
              generateVouchers.isPending ||
              !Number.isInteger(generateCount) ||
              generateCount < 1 ||
              generateCount > 5000
            }
            onClick={async () => {
              try {
                await generateVouchers.mutateAsync({ id: record.id, count: generateCount });
                notify("serviceUpdated");
              } catch {
                notify("serviceError");
              }
            }}
          >
            {generateVouchers.isPending ? t("serviceSaving") : t("generateVouchers")}
          </button>
        </div>
      )}
    </section>
  );
}
