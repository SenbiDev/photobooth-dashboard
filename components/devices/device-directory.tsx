"use client";

import { useState } from "react";
import Link from "next/link";
import { useConsole } from "../providers/console-provider";
import { DataTable, PageHeader, SearchField, Status } from "../ui/primitives";
import { CreateRecordModal } from "../forms/create-record-modal";
import { content } from "../../lib/content";
import { useDevices } from "../../hooks/use-edge-service";
import { deviceCapability } from "../../lib/edge-service/mappers";
import { ServiceBadge, ServiceBoundary } from "../service/service-feedback";

export function DeviceDirectory({
  policy = false,
  compact = false,
}: {
  policy?: boolean;
  compact?: boolean;
}) {
  const { t, localize } = useConsole();
  const devicesQuery = useDevices();
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(false);
  return (
    <>
      {!compact && (
        <PageHeader
          title={localize(content.cards.devices[policy ? 2 : 0].title)}
          copy={localize(content.cards.devices[policy ? 2 : 0].copy)}
          back="/devices"
          action={
            !policy && (
              <button className="button primary" onClick={() => setModal(true)}>
                {localize(content.schemas.register.title)}
              </button>
            )
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
                  { key: "name", label: t("device") },
                  { key: "status", label: t("status") },
                  { key: "camera", label: t("camera") },
                  { key: "printer", label: t("printer") },
                  { key: "lastSeen", label: t("lastSeen") },
                  { key: "actions", label: t("actions") },
                ]}
                rows={rows.map((device) => ({
                  id: device.id,
                  name: (
                    <>
                      <strong>{device.device_code}</strong>
                      <small>{device.name || device.id}</small>
                    </>
                  ),
                  status: <Status value={device.status.toUpperCase()} />,
                  camera: device.camera_health || deviceCapability(device, "camera_adapter"),
                  printer: device.printer_health || deviceCapability(device, "printer_transport"),
                  lastSeen: device.last_heartbeat || device.last_seen_at || "—",
                  actions: (
                    <Link
                      className="action-link"
                      href={`/devices/${device.id}${policy ? "/policy" : ""}`}
                    >
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
