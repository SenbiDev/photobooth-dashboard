"use client";

import { useState } from "react";
import { content } from "../../lib/content";
import { useConsole } from "../providers/console-provider";
import { DataTable, Notice, PageHeader, SearchField, Status } from "../ui/primitives";

export function LedgerPage() {
  const { state, t, localize } = useConsole();
  const [query, setQuery] = useState("");
  const [deviceId, setDeviceId] = useState("all");
  const [status, setStatus] = useState("all");
  const records = content.seed.ledger.filter(
    (row) =>
      (deviceId === "all" || row.deviceId === deviceId) &&
      (status === "all" || row.state === status) &&
      Object.values(row).join(" ").toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeader
        title={localize(content.cards.vouchers[1].title)}
        copy={t("ledgerNote")}
        back="/vouchers"
        reference="§10.4"
      />
      <section className="panel">
        <div className="filter-row">
          <SearchField value={query} onChange={setQuery} />
          <label className="field">
            {t("device")}
            <select value={deviceId} onChange={(event) => setDeviceId(event.target.value)}>
              <option value="all">{t("all")}</option>
              {state.devices.map((device) => (
                <option key={device.id}>{device.id}</option>
              ))}
            </select>
          </label>
          <label className="field">
            {t("state")}
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">{t("all")}</option>
              {Array.from(new Set(content.seed.ledger.map((row) => String(row.state)))).map(
                (value) => (
                  <option key={value}>{value}</option>
                ),
              )}
            </select>
          </label>
        </div>
        <DataTable
          columns={[
            "voucher",
            "session",
            "deviceId",
            "state",
            "sequence",
            "checkpoint",
            "event",
          ].map((key) => ({ key, label: t(key) }))}
          rows={records.map((row) => ({
            ...row,
            id: String(row.id),
            state: <Status value={String(row.state)} />,
          }))}
        />
        <Notice>{t("readonly")}</Notice>
      </section>
    </>
  );
}
