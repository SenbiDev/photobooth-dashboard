"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { content } from "../../lib/content";
import { diffValues } from "../../lib/domain";
import { audit } from "../../lib/mutations";
import { useConsole } from "../providers/console-provider";
import { ConfirmAction } from "../forms/confirm-action";
import { DataTable, Notice, PageHeader, Status } from "../ui/primitives";
import { LocalOnlyNotice } from "../service/service-feedback";

export function HistoryPage({ rollback = false }: { rollback?: boolean }) {
  const { state, update, t, localize, notify } = useConsole();
  const params = useSearchParams();
  const [beforeId, setBeforeId] = useState(
    params.get("before") ?? String(state.revisions.at(-2)?.id ?? 141),
  );
  const [afterId, setAfterId] = useState(
    params.get("after") ?? String(state.revisions.at(-1)?.id ?? 142),
  );
  const [deviceId, setDeviceId] = useState(params.get("device") ?? "all");
  const [confirm, setConfirm] = useState(false);
  const before =
    state.revisions.find((revision) => revision.id === Number(beforeId)) ?? state.revisions[0];
  const after =
    state.revisions.find((revision) => revision.id === Number(afterId)) ?? state.revisions.at(-1)!;
  const differences = diffValues(before.values, after.values);
  const devices = state.devices.filter((device) => deviceId === "all" || device.id === deviceId);
  const card = content.cards.history[rollback ? 1 : 0];
  return (
    <>
      <PageHeader
        title={localize(card.title)}
        copy={localize(card.copy)}
        back="/history"
        reference="§5.1, §22.7–22.8"
      />
      <LocalOnlyNotice />
      <section className="panel">
        <div className="form-grid">
          {[
            { label: "before", value: beforeId, set: setBeforeId },
            { label: "after", value: afterId, set: setAfterId },
          ].map((field) => (
            <label className="field" key={field.label}>
              {t(field.label)}
              <select value={field.value} onChange={(event) => field.set(event.target.value)}>
                {state.revisions.map((revision) => (
                  <option key={revision.id} value={revision.id}>
                    #{revision.id} · {revision.schema}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <label className="field">
            {t("scope")}
            <select value={deviceId} onChange={(event) => setDeviceId(event.target.value)}>
              <option value="all">{t("all")}</option>
              {state.devices.map((device) => (
                <option key={device.id}>{device.id}</option>
              ))}
            </select>
          </label>
        </div>
        <DataTable
          columns={[
            { key: "name", label: t("field") },
            { key: "before", label: t("before") },
            { key: "after", label: t("after") },
          ]}
          rows={differences.map((change) => ({ ...change, id: change.key, name: change.key }))}
        />
        {!differences.length && <p className="muted">{t("noChanges")}</p>}
        <Notice>{t("guard")}</Notice>
        {rollback && (
          <button
            type="button"
            className="button primary"
            disabled={before.id === after.id || !devices.length || before.schema !== after.schema}
            onClick={() => setConfirm(true)}
          >
            {t("rollback")} → #{before.id}
          </button>
        )}
      </section>
      <section className="panel">
        <h2>{t("ack")}</h2>
        <DataTable
          columns={[
            { key: "id", label: t("device") },
            { key: "active", label: t("active") },
            { key: "desired", label: t("desired") },
            { key: "ack", label: t("ack") },
          ]}
          rows={devices.map((device) => ({
            id: device.id,
            active: `#${device.active}`,
            desired: `#${device.desired}`,
            ack: <Status value={device.active === device.desired ? "ACKNOWLEDGED" : "PENDING"} />,
          }))}
        />
        <Notice>{t("readonly")}</Notice>
      </section>
      {confirm && (
        <ConfirmAction
          title={`${t("rollback")} → #${before.id}`}
          onClose={() => setConfirm(false)}
          onConfirm={(reason) => {
            update((current) => {
              const id = Math.max(...current.revisions.map((revision) => revision.id)) + 1;
              const scope = devices.map((device) => device.id);
              return audit(
                {
                  ...current,
                  revisions: [
                    ...current.revisions,
                    {
                      ...structuredClone(before),
                      id,
                      scope,
                      reason,
                      createdAt: new Date().toISOString(),
                    },
                  ],
                  devices: current.devices.map((device) =>
                    scope.includes(device.id) ? { ...device, desired: id } : device,
                  ),
                },
                "rollback",
                scope.join(", "),
                reason,
              );
            });
            notify("published");
          }}
        >
          <p>
            {t("scope")}: {devices.map((device) => device.id).join(", ")}
          </p>
          <Notice>{t("guard")}</Notice>
          <Notice warning>{t("validationNote")}</Notice>
        </ConfirmAction>
      )}
    </>
  );
}
