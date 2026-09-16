"use client";

import { useState } from "react";
import { useConsole } from "../providers/console-provider";
import { requestCommand } from "../../lib/mutations";
import { ActionLink, DataTable, Notice, PageHeader, Status } from "../ui/primitives";
import { ConfirmAction } from "../forms/confirm-action";
import { useDevice, useSyncDevice } from "../../hooks/use-edge-service";
import { deviceCapability } from "../../lib/edge-service/mappers";
import { ServiceBadge, ServiceBoundary } from "../service/service-feedback";

export function DeviceDetail({ deviceId }: { deviceId: string }) {
  const { state, t, update, notify } = useConsole();
  const [action, setAction] = useState<string | null>(null);
  const deviceQuery = useDevice(deviceId);
  const syncMutation = useSyncDevice(deviceId);
  return (
    <ServiceBoundary query={deviceQuery}>
      {(device) => (
        <>
          <PageHeader
            title={device.device_code}
            copy={device.name || device.id}
            back="/devices/registry"
            action={
              <div className="link-row">
                <ServiceBadge />
                <Status value={device.status.toUpperCase()} />
              </div>
            }
          />
          <div className="metric-grid">
            {[
              { label: t("connectivity"), value: device.connectivity || "—" },
              { label: t("storage"), value: device.storage_state || "—" },
              { label: t("camera"), value: device.camera_health || "—" },
              { label: t("printer"), value: device.printer_health || "—" },
            ].map((metric) => (
              <div className="metric-card" key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>
          <section className="panel">
            <dl className="detail-list">
              <div>
                <dt>{t("appVersion")}</dt>
                <dd>{device.app_version || "—"}</dd>
              </div>
              <div>
                <dt>{t("lastSeen")}</dt>
                <dd>{device.last_heartbeat || device.last_seen_at || "—"}</dd>
              </div>
              <div>
                <dt>{t("location")}</dt>
                <dd>{deviceCapability(device, "location")}</dd>
              </div>
              <div>
                <dt>{t("model")}</dt>
                <dd>{deviceCapability(device, "edge_model")}</dd>
              </div>
            </dl>
            <div className="link-row">
              <ActionLink href={`/devices/${device.id}/policy`}>{t("edit")}</ActionLink>
              <ActionLink href={`/devices/camera?device=${device.id}`}>{t("camera")}</ActionLink>
              <ActionLink href={`/devices/printer?device=${device.id}`}>{t("printer")}</ActionLink>
              <ActionLink href={`/devices/preflight?device=${device.id}`}>{t("checks")}</ActionLink>
            </div>
            <Notice>{t("deviceCommandAvailability")}</Notice>
            <div className="form-actions">
              {["pause", "resume", "sync", "hardware", "diagnostics"].map((command) => (
                <button
                  type="button"
                  className="button"
                  key={command}
                  disabled={command === "sync" && syncMutation.isPending}
                  onClick={() => setAction(command)}
                >
                  {command === "sync" && syncMutation.isPending ? t("serviceSaving") : t(command)}
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
              onConfirm={async (reason) => {
                if (action === "sync") {
                  try {
                    await syncMutation.mutateAsync();
                    notify("serviceUpdated");
                  } catch {
                    notify("serviceError");
                  }
                } else {
                  update((current) => requestCommand(current, deviceId, action, reason, true));
                  notify("queuedLocalOnly");
                }
              }}
            >
              <Notice>{t(action === "sync" ? "serviceSyncNote" : "notAvailableInService")}</Notice>
            </ConfirmAction>
          )}
        </>
      )}
    </ServiceBoundary>
  );
}
