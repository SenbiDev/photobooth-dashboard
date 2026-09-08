"use client";

import { useState } from "react";
import { content } from "../../lib/content";
import { audit } from "../../lib/mutations";
import { useConsole } from "../providers/console-provider";
import { ConfirmAction } from "../forms/confirm-action";
import { DataTable, Notice, PageHeader } from "../ui/primitives";

export function TemplateSyncPage() {
  const { state, update, t, notify } = useConsole();
  const [selection, setSelection] = useState<{ deviceId: string; action: string } | null>(null);
  return (
    <>
      <PageHeader
        title={t("templateSync")}
        copy={t("immutable")}
        reference="§22.7"
        back="/templates"
      />
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
          rows={content.seed.templateSync.map((row) => ({
            ...row,
            id: row.deviceId,
            cacheSize: `${row.cacheSizeMb} MB`,
            actions: (
              <div className="link-row">
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setSelection({ deviceId: row.deviceId, action: "sync" })}
                >
                  {t("sync")}
                </button>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setSelection({ deviceId: row.deviceId, action: "rollback" })}
                >
                  {t("rollback")} → v11
                </button>
              </div>
            ),
          }))}
        />
        <Notice>{t("guard")}</Notice>
        <Notice warning>{t("binaryNote")}</Notice>
      </section>
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
            notify("syncPending");
          }}
        >
          <p>
            {selection.deviceId} · sunset-strip
            {selection.action === "rollback" ? " → v11" : " → v12"}
          </p>
          <Notice>{t("validationNote")}</Notice>
          <Notice>{t("guard")}</Notice>
        </ConfirmAction>
      )}
    </>
  );
}
