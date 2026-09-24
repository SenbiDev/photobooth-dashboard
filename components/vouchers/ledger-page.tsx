"use client";

import { useState } from "react";
import { useConsole } from "../providers/console-provider";
import { DataTable, Notice, PageHeader, SearchField, Status } from "../ui/primitives";
import { useDevices, useVoucherBatches, useVouchers } from "../../hooks/use-edge-service";
import { ServiceBadge, ServiceBoundary } from "../service/service-feedback";
import { content } from "../../lib/content";

export function LedgerPage() {
  const { t, localize } = useConsole();
  const vouchersQuery = useVouchers();
  const batchesQuery = useVoucherBatches();
  const devicesQuery = useDevices();
  const [query, setQuery] = useState("");
  const [batchId, setBatchId] = useState("all");
  const [deviceId, setDeviceId] = useState("all");
  const [status, setStatus] = useState("all");
  return (
    <>
      <PageHeader
        title={localize(
          content.cards.vouchers.find((card) => card.href === "/vouchers/ledger")?.title ??
            content.modules.vouchers.title,
        )}
        copy={t("voucherStateNote")}
        back="/vouchers"
        reference="§10.4"
        action={<ServiceBadge />}
      />
      <ServiceBoundary query={vouchersQuery}>
        {(response) => {
          const devices = devicesQuery.data?.data ?? [];
          const batches = batchesQuery.data?.data ?? [];
          const records = response.data.filter(
            (row) =>
              (batchId === "all" || row.batch_id === batchId) &&
              (deviceId === "all" || row.device_id === deviceId) &&
              (status === "all" || row.status === status) &&
              Object.values(row).join(" ").toLowerCase().includes(query.toLowerCase()),
          );
          return (
            <section className="panel">
              <div className="filter-row">
                <SearchField value={query} onChange={setQuery} />
                <label className="field">
                  {t("batch")}
                  <select value={batchId} onChange={(event) => setBatchId(event.target.value)}>
                    <option value="all">{t("all")}</option>
                    {batches.map((batch) => (
                      <option key={batch.id} value={batch.id}>
                        {batch.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  {t("device")}
                  <select value={deviceId} onChange={(event) => setDeviceId(event.target.value)}>
                    <option value="all">{t("all")}</option>
                    {devices.map((device) => (
                      <option key={device.id} value={device.id}>
                        {device.device_code}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  {t("state")}
                  <select value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value="all">{t("all")}</option>
                    {Array.from(new Set(response.data.map((row) => row.status))).map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </label>
              </div>
              <DataTable
                columns={[
                  { key: "voucher", label: t("voucher") },
                  { key: "batch", label: t("batch") },
                  { key: "session", label: t("session") },
                  { key: "device", label: t("device") },
                  { key: "state", label: t("state") },
                  { key: "issued", label: t("issuedAt") },
                  { key: "used", label: t("usedAt") },
                  { key: "expires", label: t("expiresAt") },
                ]}
                rows={records.map((row) => ({
                  id: row.id,
                  voucher: row.code,
                  batch: batches.find((batch) => batch.id === row.batch_id)?.name || row.batch_id,
                  session: row.session_id || "—",
                  device:
                    devices.find((device) => device.id === row.device_id)?.device_code ||
                    row.device_id ||
                    "—",
                  state: <Status value={row.status.toUpperCase()} />,
                  issued: row.issued_at || row.created_at,
                  used: row.used_at || "—",
                  expires: row.expires_at || "—",
                }))}
              />
              <Notice>{t("voucherStateNote")}</Notice>
            </section>
          );
        }}
      </ServiceBoundary>
    </>
  );
}
