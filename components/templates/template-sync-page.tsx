"use client";

import { useState } from "react";
import { useConsole } from "../providers/console-provider";
import { ConfirmAction } from "../forms/confirm-action";
import { DataTable, Notice, PageHeader, Status } from "../ui/primitives";
import { useDevices, useSyncAnyDevice } from "../../hooks/use-edge-service";
import { ServiceBadge, ServiceBoundary } from "../service/service-feedback";

export function TemplateSyncPage() {
  const { t, notify } = useConsole();
  const devices = useDevices();
  const syncMutation = useSyncAnyDevice();
  const [selectedDevice, setSelectedDevice] = useState<{ id: string; code: string } | null>(null);

  return (
    <>
      <PageHeader
        title={t("templateSync")}
        copy={t("templateSyncApiNote")}
        reference="OpenAPI: PATCH /devices/{id}/sync"
        back="/templates"
        action={<ServiceBadge />}
      />
      <ServiceBoundary query={devices}>
        {(response) => (
          <section className="panel">
            <DataTable
              columns={[
                { key: "device", label: t("device") },
                { key: "appVersion", label: t("appVersion") },
                { key: "lastSeen", label: t("lastSeen") },
                { key: "storage", label: t("storage") },
                { key: "status", label: t("status") },
                { key: "actions", label: t("actions") },
              ]}
              rows={response.data.map((device) => ({
                id: device.id,
                device: device.device_code,
                appVersion: device.app_version || "—",
                lastSeen: device.last_heartbeat || device.last_seen_at || "—",
                storage: device.storage_state || "—",
                status: <Status value={device.status.toUpperCase()} />,
                actions: (
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => setSelectedDevice({ id: device.id, code: device.device_code })}
                  >
                    {t("sync")}
                  </button>
                ),
              }))}
            />
            <Notice warning>{t("templateSyncApiNote")}</Notice>
          </section>
        )}
      </ServiceBoundary>
      {selectedDevice && (
        <ConfirmAction
          title={t("sync")}
          requireReason={false}
          acknowledgeOnly
          onClose={() => setSelectedDevice(null)}
          onConfirm={async () => {
            try {
              await syncMutation.mutateAsync(selectedDevice.id);
              notify("serviceUpdated");
              return true;
            } catch {
              notify("serviceError");
              return false;
            }
          }}
        >
          <p>{selectedDevice.code}</p>
          <Notice>{t("templateSyncApiNote")}</Notice>
        </ConfirmAction>
      )}
    </>
  );
}
