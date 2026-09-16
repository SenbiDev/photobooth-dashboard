"use client";

import { useState } from "react";
import { audit } from "../../lib/mutations";
import { useConsole } from "../providers/console-provider";
import { ConfirmAction } from "../forms/confirm-action";
import { DataTable, Notice, PageHeader } from "../ui/primitives";
import { useDevices, useFrameTemplates, useSyncAnyDevice } from "../../hooks/use-edge-service";
import { LocalOnlyNotice, ServiceBadge, ServiceBoundary } from "../service/service-feedback";

export function TemplateSyncPage() {
  const { state, update, t, notify } = useConsole();
  const devices = useDevices();
  const templates = useFrameTemplates();
  const syncMutation = useSyncAnyDevice();
  const [selection, setSelection] = useState<{ deviceId: string; action: string } | null>(null);
  return (
    <>
      <PageHeader
        title={t("templateSync")}
        copy={t("immutable")}
        reference="§22.7"
        back="/templates"
        action={<ServiceBadge />}
      />
      <ServiceBoundary query={devices}>
        {(response) => (
          <section className="panel">
            <DataTable
              columns={[
                { key: "deviceId", label: t("device") },
                { key: "desiredVersion", label: t("desired") },
                { key: "activeVersion", label: t("active") },
                { key: "lastSyncAt", label: t("lastSync") },
                { key: "lastError", label: t("lastError") },
                { key: "cacheSize", label: t("cacheSize") },
                { key: "actions", label: t("actions") },
              ]}
              rows={response.data.map((device) => ({
                id: device.id,
                deviceId: device.device_code,
                desiredVersion: templates.data?.data[0]?.version || "—",
                activeVersion: device.app_version || "—",
                lastSyncAt: device.last_heartbeat || device.last_seen_at || "—",
                lastError: device.status.toLowerCase() === "active" ? "—" : device.status,
                cacheSize: String(device.storage_state || "—"),
                actions: (
                  <div className="link-row">
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => setSelection({ deviceId: device.id, action: "sync" })}
                    >
                      {t("sync")}
                    </button>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => setSelection({ deviceId: device.id, action: "rollback" })}
                    >
                      {t("rollback")}
                    </button>
                  </div>
                ),
              }))}
            />
            <Notice>{t("guard")}</Notice>
            <Notice warning>{t("binaryNote")}</Notice>
          </section>
        )}
      </ServiceBoundary>
      <section className="panel">
        <h2>{t("commands")}</h2>
        <DataTable
          columns={["deviceId", "actions", "status"].map((key) => ({ key, label: t(key) }))}
          rows={state.commands
            .filter((command) => command.action.startsWith("template:"))
            .map((command) => ({
              ...command,
              actions: `${t(command.action.split(":")[1])} · sunset-strip`,
            }))}
        />
      </section>
      {selection && (
        <ConfirmAction
          title={t(selection.action)}
          onClose={() => setSelection(null)}
          onConfirm={(reason) => {
            if (selection.action === "sync") {
              void syncMutation
                .mutateAsync(selection.deviceId)
                .then(() => notify("serviceUpdated"))
                .catch(() => notify("serviceError"));
              return;
            }
            update((current) =>
              audit(
                {
                  ...current,
                  commands: [
                    ...current.commands,
                    {
                      id: `CMD-${crypto.randomUUID().slice(0, 8)}`,
                      deviceId: selection.deviceId,
                      action: `template:${selection.action}`,
                      status: "PENDING",
                      reason,
                    },
                  ],
                },
                selection.action,
                selection.deviceId,
                reason,
              ),
            );
            notify("queuedLocalOnly");
          }}
        >
          <p>
            {selection.deviceId} · sunset-strip
            {selection.action === "rollback" ? " → v11" : " → v12"}
          </p>
          {selection.action === "rollback" && <LocalOnlyNotice />}
          <Notice>{t("validationNote")}</Notice>
          <Notice>{t("guard")}</Notice>
        </ConfirmAction>
      )}
    </>
  );
}
