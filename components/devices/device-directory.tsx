"use client";

import { useState } from "react";
import Link from "next/link";
import { useConsole } from "../providers/console-provider";
import { DataTable, PageHeader, SearchField, Status } from "../ui/primitives";
import { CreateRecordModal } from "../forms/create-record-modal";
import { content } from "../../lib/content";
import { useDevices } from "../../hooks/use-edge-service";
import { ServiceBadge, ServiceBoundary } from "../service/service-feedback";

export function DeviceDirectory({ compact = false }: { compact?: boolean }) {
  const { t, localize } = useConsole();
  const devicesQuery = useDevices();
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(false);
  return (
    <>
      {!compact && (
        <PageHeader
          title={localize(content.modules.devices.title)}
          copy={localize(content.modules.devices.copy)}
          back="/"
          action={
            <button className="button primary" onClick={() => setModal(true)}>
              {localize(content.modules.devices.action!)}
            </button>
          }
        />
      )}
      <ServiceBoundary query={devicesQuery}>
        {(response) => {
          const rows = response.data.filter((device) =>
            `${device.id} ${device.device_code} ${device.name ?? ""}`
              .toLowerCase()
              .includes(query.toLowerCase()),
          );
          return (
            <section className="panel">
              <div className="panel-heading">
                <h2>
                  {t("device")} <span className="muted">/{response.data.length}</span>
                </h2>
                <div className="panel-heading-actions">
                  <ServiceBadge />
                  <SearchField value={query} onChange={setQuery} />
                </div>
              </div>
              <DataTable
                columns={[
                  { key: "name", label: t("name") },
                  { key: "deviceCode", label: t("deviceCode") },
                  { key: "serial", label: t("serialNumber") },
                  { key: "status", label: t("status") },
                  { key: "version", label: t("appVersion") },
                  { key: "lastSeen", label: t("lastSeen") },
                  { key: "actions", label: t("actions") },
                ]}
                rows={rows.map((device) => ({
                  id: device.id,
                  name: device.name || "—",
                  deviceCode: device.device_code || "—",
                  serial: device.serial_number || "—",
                  status: <Status value={device.status.toUpperCase()} />,
                  version: device.app_version || "—",
                  lastSeen: device.last_heartbeat || device.last_seen_at || "—",
                  actions: (
                    <Link className="action-link" href={`/devices/${device.id}`}>
                      {t("open")}
                    </Link>
                  ),
                }))}
              />
            </section>
          );
        }}
      </ServiceBoundary>
      {modal && <CreateRecordModal schemaId="register" onClose={() => setModal(false)} />}
    </>
  );
}
