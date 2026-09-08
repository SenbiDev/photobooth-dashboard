"use client";

import { useState } from "react";
import Link from "next/link";
import { useConsole } from "../providers/console-provider";
import { DataTable, PageHeader, SearchField, Status } from "../ui/primitives";
import { CreateRecordModal } from "../forms/create-record-modal";
import { content } from "../../lib/content";

export function DeviceDirectory({
  policy = false,
  compact = false,
}: {
  policy?: boolean;
  compact?: boolean;
}) {
  const { state, t, localize } = useConsole();
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(false);
  const rows = state.devices.filter((device) =>
    `${device.id} ${device.name}`.toLowerCase().includes(query.toLowerCase()),
  );
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
      <section className="panel">
        <div className="panel-heading">
          <h2>
            {t("device")} <span className="muted">/{state.devices.length}</span>
          </h2>
          <SearchField value={query} onChange={setQuery} />
        </div>
        <DataTable
          columns={[
            { key: "name", label: t("device") },
            { key: "status", label: t("status") },
            { key: "active", label: t("active") },
            { key: "desired", label: t("desired") },
            { key: "lastSeen", label: t("lastSeen") },
            { key: "actions", label: t("actions") },
          ]}
          rows={rows.map((device) => ({
            id: device.id,
            name: (
              <>
                <strong>{device.id}</strong>
                <small>{device.name}</small>
              </>
            ),
            status: <Status value={device.status} />,
            active: `#${device.active}`,
            desired: `#${device.desired}`,
            lastSeen: device.lastSeen || "—",
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
      {modal && <CreateRecordModal schemaId="register" onClose={() => setModal(false)} />}
    </>
  );
}
