"use client";

import { useState } from "react";
import { content } from "../../lib/content";
import { useConsole } from "../providers/console-provider";
import { ActionLink, DataTable, Notice, PageHeader, SearchField, Status } from "../ui/primitives";
import { LocalOnlyNotice } from "../service/service-feedback";
import { PaymentsServicePage, SessionsServicePage } from "../service/operational-records";

export function RecordsPage({ kind }: { kind: string }) {
  if (kind === "sessions") return <SessionsServicePage />;
  if (kind === "payments") return <PaymentsServicePage />;
  return <LocalRecordsPage kind={kind} />;
}

function LocalRecordsPage({ kind }: { kind: string }) {
  const { t } = useConsole();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState("");
  const source = content.seed.records[kind];
  const rows = source.filter(
    (row) =>
      (status === "all" || row.state === status) &&
      Object.values(row).join(" ").toLowerCase().includes(query.toLowerCase()),
  );
  const record = source.find((row) => row.id === selected);
  return (
    <>
      <PageHeader
        title={t(kind)}
        copy={t("readonly")}
        reference="§11–13, §22.8"
        action={kind === "delivery" && <ActionLink href="/delivery/policy">{t("edit")}</ActionLink>}
      />
      <LocalOnlyNotice />
      <section className="panel">
        <div className="filter-row">
          <SearchField value={query} onChange={setQuery} />
          <label className="field">
            {t("status")}
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">{t("all")}</option>
              {Array.from(new Set(source.map((row) => row.state))).map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
        </div>
        <DataTable
          columns={[
            ...Object.keys(source[0]).map((key) => ({ key, label: t(key) })),
            { key: "actions", label: t("actions") },
          ]}
          rows={rows.map((row) => ({
            ...row,
            id: row.id,
            state: <Status value={row.state} />,
            actions: (
              <button type="button" className="text-button" onClick={() => setSelected(row.id)}>
                {t("open")}
              </button>
            ),
          }))}
        />
        <Notice>
          {t(
            kind === "print"
              ? "printerNote"
              : kind === "media"
                ? "retentionNote"
                : kind === "payments"
                  ? "offlineNote"
                  : "privacy",
          )}
        </Notice>
      </section>
      {record && (
        <section className="panel">
          <h2>{record.id}</h2>
          <dl className="detail-list">
            {Object.entries(record).map(([key, value]) => (
              <div key={key}>
                <dt>{t(key)}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <Notice>{t("readonly")}</Notice>
        </section>
      )}
    </>
  );
}
