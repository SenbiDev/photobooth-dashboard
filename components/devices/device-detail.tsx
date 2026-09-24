"use client";

import { useState } from "react";
import {
  useAssignments,
  useDevice,
  useServiceReferences,
  useSyncDevice,
  useUpdateDevice,
} from "../../hooks/use-edge-service";
import { deviceFormToCreate, deviceToValues } from "../../lib/edge-service/mappers";
import { serviceFormSchema, validateServiceForm } from "../../lib/edge-service/form-contract";
import type { Device } from "../../lib/edge-service/types";
import type { Values } from "../../lib/types";
import { useConsole } from "../providers/console-provider";
import { SchemaFields } from "../forms/schema-fields";
import { Modal } from "../ui/modal";
import { DataTable, Notice, PageHeader, Status } from "../ui/primitives";
import { ServiceBadge, ServiceBoundary } from "../service/service-feedback";

function DeviceEditModal({ device, onClose }: { device: Device; onClose: () => void }) {
  const { t, notify } = useConsole();
  const references = useServiceReferences();
  const mutation = useUpdateDevice();
  const [values, setValues] = useState<Values>(() => deviceToValues(device));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const schema = serviceFormSchema("register");

  async function save() {
    const nextErrors = validateServiceForm("register", values, references);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    try {
      await mutation.mutateAsync({ id: device.id, values: deviceFormToCreate(values) });
      notify("serviceUpdated");
      onClose();
    } catch {
      setErrors({ _service: "serviceError" });
      notify("serviceError");
    }
  }

  return (
    <Modal title={t("edit")} onClose={onClose}>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <Notice>{t("apiContractCopy")}</Notice>
        <SchemaFields
          schema={schema}
          values={values}
          errors={errors}
          serviceMode
          onChange={(key, value) => setValues((current) => ({ ...current, [key]: value }))}
        />
        {errors._service && <p className="field-error">{t(errors._service)}</p>}
        <div className="form-actions">
          <button className="button" type="button" onClick={onClose}>
            {t("cancel")}
          </button>
          <button className="button primary" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? t("serviceSaving") : t("saveChanges")}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function DeviceDetail({ deviceId }: { deviceId: string }) {
  const { t, notify } = useConsole();
  const [editing, setEditing] = useState(false);
  const deviceQuery = useDevice(deviceId);
  const assignmentsQuery = useAssignments();
  const syncMutation = useSyncDevice(deviceId);
  return (
    <ServiceBoundary query={deviceQuery}>
      {(device) => (
        <>
          <PageHeader
            title={device.device_code}
            copy={device.name || device.id}
            back="/devices"
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
            <div className="panel-heading">
              <h2>{t("details")}</h2>
              <div className="form-actions">
                <button className="button" type="button" onClick={() => setEditing(true)}>
                  {t("edit")}
                </button>
                <button
                  className="button primary"
                  type="button"
                  disabled={syncMutation.isPending}
                  onClick={async () => {
                    try {
                      await syncMutation.mutateAsync();
                      notify("serviceUpdated");
                    } catch {
                      notify("serviceError");
                    }
                  }}
                >
                  {syncMutation.isPending ? t("serviceSaving") : t("sync")}
                </button>
              </div>
            </div>
            <dl className="detail-list">
              {[
                ["deviceCode", device.device_code],
                ["serialNumber", device.serial_number],
                ["appVersion", device.app_version],
                ["lastSeen", device.last_seen_at],
                ["lastHeartbeat", device.last_heartbeat],
                ["cameraProfile", device.camera_profile_id],
                ["printerProfile", device.printer_profile_id],
              ].map(([key, value]) => (
                <div key={key}>
                  <dt>{t(String(key))}</dt>
                  <dd>{value || "—"}</dd>
                </div>
              ))}
              <div>
                <dt>{t("capabilities")}</dt>
                <dd>
                  <pre className="config-preview">
                    {JSON.stringify(device.capabilities ?? null, null, 2)}
                  </pre>
                </dd>
              </div>
            </dl>
          </section>
          <ServiceBoundary query={assignmentsQuery}>
            {(response) => (
              <section className="panel">
                <h2>{t("deviceAssignments")}</h2>
                <DataTable
                  columns={[
                    { key: "campaign", label: t("campaign") },
                    { key: "booth", label: t("booth") },
                    { key: "window", label: t("window") },
                    { key: "status", label: t("status") },
                  ]}
                  rows={response.data
                    .filter((assignment) => assignment.device.id === device.id)
                    .map((assignment) => ({
                      id: assignment.id,
                      campaign: assignment.booth.campaign?.name || "—",
                      booth: assignment.booth.name,
                      window:
                        [assignment.assigned_from, assignment.assigned_until]
                          .filter(Boolean)
                          .join(" → ") || "—",
                      status: <Status value={assignment.status.toUpperCase()} />,
                    }))}
                />
              </section>
            )}
          </ServiceBoundary>
          {editing && <DeviceEditModal device={device} onClose={() => setEditing(false)} />}
        </>
      )}
    </ServiceBoundary>
  );
}
