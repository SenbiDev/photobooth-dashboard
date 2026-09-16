"use client";

import { useState } from "react";
import { useConsole } from "../providers/console-provider";
import { DataTable, Notice, PageHeader, SearchField, Status } from "../ui/primitives";
import { useDevices, useVouchers } from "../../hooks/use-edge-service";
import { ServiceBadge, ServiceBoundary } from "../service/service-feedback";
import { content } from "../../lib/content";

export function LedgerPage() {
  const { t, localize } = useConsole();
  const vouchersQuery = useVouchers();
  const devicesQuery = useDevices();
  const [query, setQuery] = useState("");
  const [deviceId, setDeviceId] = useState("all");
  const [status, setStatus] = useState("all");
  return (
    <>
      <PageHeader
        title={localize(content.cards.vouchers[1].title)}
        copy={t("ledgerNote")}
        back="/vouchers"
        reference="§10.4"
        action={<ServiceBadge />}
      />
      <ServiceBoundary query={vouchersQuery}>
        {(response) => {
          const records = response.data.filter(
            (row) =>
              (deviceId === "all" || row.device_id === deviceId) &&
              (status === "all" || row.status === status) &&
              Object.values(row).join(" ").toLowerCase().includes(query.toLowerCase()),
          );
          return (
            <section className="panel">
              <div className="filter-row">
                <SearchField value={query} onChange={setQuery} />
                <label className="field">
                  {t("device")}
                  <select value={deviceId} onChange={(event) => setDeviceId(event.target.value)}>
                    <option value="all">{t("all")}</option>
                    {(devicesQuery.data?.data ?? []).map((device) => (
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
                  session: row.session_id || "—",
                  device: row.device_id || "—",
                  state: <Status value={row.status.toUpperCase()} />,
                  issued: row.issued_at || row.created_at,
                  used: row.used_at || "—",
                  expires: row.expires_at || "—",
                }))}
              />
              <Notice>{t("serviceReadOnly")}</Notice>
            </section>
          );
        }}
      </ServiceBoundary>
    </>
  );
}
