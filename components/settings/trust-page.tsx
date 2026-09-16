"use client";

import { useState } from "react";
import { requestCommand } from "../../lib/mutations";
import { content } from "../../lib/content";
import { useConsole } from "../providers/console-provider";
import { ConfirmAction } from "../forms/confirm-action";
import { DataTable, Notice, PageHeader, Status } from "../ui/primitives";
import { LocalOnlyNotice } from "../service/service-feedback";

export function TrustPage() {
  const { state, t, localize, update, notify } = useConsole();
  const [selected, setSelected] = useState(state.devices[0].id);
  const [action, setAction] = useState<string | null>(null);
  const device = state.devices.find((item) => item.id === selected)!;
  return (
    <>
      <PageHeader
        title={localize(content.cards.settings[1].title)}
        copy={localize(content.cards.settings[1].copy)}
        back="/settings"
        reference="§14, §22.10"
      />
      <LocalOnlyNotice />
      <section className="panel">
        <DataTable
          columns={[
            { key: "id", label: t("device") },
            { key: "trust", label: t("status") },
            { key: "fingerprint", label: t("checksum") },
            { key: "action", label: t("actions") },
          ]}
          rows={state.devices.map((item) => ({
            ...item,
            trust: <Status value={item.trust} />,
            action: (
              <button type="button" className="text-button" onClick={() => setSelected(item.id)}>
                {t("open")}
              </button>
            ),
          }))}
        />
      </section>
      <section className="panel">
        <h2>
          {device.id} · {device.name}
        </h2>
        <p className="mono">{device.fingerprint}</p>
        <dl className="detail-list">
          <div>
            <dt>{t("certificate")}</dt>
            <dd>{device.certificateId ?? t("unknown")}</dd>
          </div>
          <div>
            <dt>{t("certificateExpiry")}</dt>
            <dd>{device.certificateExpires ?? t("unknown")}</dd>
          </div>
        </dl>
        <Notice>{t("pendingCommands")}</Notice>
        <div className="form-actions">
          {["rotate", "revoke"].map((command) => (
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
        <DataTable
          columns={[
            { key: "id", label: t("id") },
            { key: "action", label: t("actions") },
            { key: "status", label: t("status") },
          ]}
          rows={state.commands
            .filter(
              (command) =>
                command.deviceId === selected && ["rotate", "revoke"].includes(command.action),
            )
            .map((command) => ({ ...command, action: t(command.action) }))}
        />
      </section>
      {action && (
        <ConfirmAction
          title={t(action)}
          onClose={() => setAction(null)}
          onConfirm={(reason) => {
            update((current) => requestCommand(current, selected, action, reason, true));
            notify("queued");
          }}
        >
          <Notice>{t("demoNote")}</Notice>
        </ConfirmAction>
      )}
    </>
  );
}
