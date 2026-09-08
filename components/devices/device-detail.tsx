"use client";

import { useState } from "react";
import { useConsole } from "../providers/console-provider";
import { requestCommand } from "../../lib/mutations";
import { ActionLink, DataTable, Notice, PageHeader, Status } from "../ui/primitives";
import { ConfirmAction } from "../forms/confirm-action";

export function DeviceDetail({ deviceId }: { deviceId: string }) {
  const { state, t, update, notify } = useConsole();
  const [action, setAction] = useState<string | null>(null);
  const device = state.devices.find((item) => item.id === deviceId);
  if (!device) return <PageHeader title={t("notFound")} back="/devices/registry" />;
  return (
    <>
      <PageHeader
        title={device.id}
        copy={device.name}
        back="/devices/registry"
        action={<Status value={device.status} />}
      />
      <div className="metric-grid">
        {[
          { label: t("active"), value: `#${device.active}` },
          { label: t("desired"), value: `#${device.desired}` },
          { label: t("storage"), value: `${device.storageGb} GB` },
          { label: t("ack"), value: device.active === device.desired ? "ACK" : "PENDING" },
        ].map((metric) => (
          <div className="metric-card" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>
      <section className="panel">
        <div className="link-row">
          <ActionLink href={`/devices/${device.id}/policy`}>{t("edit")}</ActionLink>
          <ActionLink href={`/devices/camera?device=${device.id}`}>{device.camera}</ActionLink>
          <ActionLink href={`/devices/printer?device=${device.id}`}>{device.printer}</ActionLink>
          <ActionLink href={`/devices/preflight?device=${device.id}`}>{t("checks")}</ActionLink>
        </div>
        <Notice>{t("pendingCommands")}</Notice>
        <div className="form-actions">
          {["pause", "resume", "sync", "hardware", "diagnostics"].map((command) => (
            <button
              type="button"
              className="button"
              key={command}
              onClick={() => setAction(command)}
            >
              {t(command)}
            </button>
          ))}
        </div>
      </section>
      <section className="panel">
        <h2>{t("commands")}</h2>
        <DataTable
          columns={[
            { key: "id", label: t("id") },
            { key: "action", label: t("actions") },
            { key: "status", label: t("status") },
          ]}
          rows={state.commands
            .filter((command) => command.deviceId === deviceId)
            .map((command) => ({ ...command, action: t(command.action) }))}
        />
      </section>
      {action && (
        <ConfirmAction
          title={t(action)}
          onClose={() => setAction(null)}
          onConfirm={(reason) => {
            update((current) => requestCommand(current, deviceId, action, reason, true));
            notify("queued");
          }}
        >
          <Notice>{t(action === "hardware" ? "applyNote" : "guard")}</Notice>
        </ConfirmAction>
      )}
    </>
  );
}
