"use client";

import { useState } from "react";
import { useConsole } from "../providers/console-provider";
import { content } from "../../lib/content";
import { CreateRecordModal } from "../forms/create-record-modal";
import { DataTable, ExtraBadge, Notice, PageHeader } from "../ui/primitives";

export function RolesPage() {
  const { state, t, localize } = useConsole();
  const [modal, setModal] = useState(false);
  const roles = ["ADMINISTRATOR", "OPERATOR", "SUPPORT", "ENGINEER"];
  const permissions: Record<string, string[]> = {
    open: roles,
    retry: roles,
    diagnostics: roles,
    pause: ["ADMINISTRATOR", "OPERATOR"],
    publish: ["ADMINISTRATOR", "ENGINEER"],
    rollback: ["ADMINISTRATOR", "ENGINEER"],
    revoke: ["ADMINISTRATOR"],
    invite: ["ADMINISTRATOR"],
  };
  return (
    <>
      <PageHeader
        title={localize(content.cards.settings[0].title)}
        copy={localize(content.cards.settings[0].copy)}
        back="/settings"
        reference="§14"
        action={
          <button type="button" className="button primary" onClick={() => setModal(true)}>
            {localize(content.schemas.invite.title)}
          </button>
        }
      />
      <section className="panel">
        <h2>{t("permission")}</h2>
        <ExtraBadge />
        <Notice>{t("roleNote")}</Notice>
        <DataTable
          columns={[
            { key: "permission", label: t("permission") },
            ...roles.map((role) => ({ key: role, label: role })),
          ]}
          rows={Object.entries(permissions).map(([permission, allowed]) => ({
            id: permission,
            permission:
              permission === "invite" ? localize(content.schemas.invite.title) : t(permission),
            ...Object.fromEntries(roles.map((role) => [role, allowed.includes(role) ? "✓" : "—"])),
          }))}
        />
        <Notice>{t("reauthNote")}</Notice>
      </section>
      <section className="panel">
        <h2>{t("members")}</h2>
        <DataTable
          columns={["name", "role", "email", "scope", "status"].map((key) => ({
            key,
            label: t(key),
          }))}
          rows={state.entities.operators.map((operator) => ({
            id: operator.id,
            name: operator.name,
            role: String(operator.values.role),
            email: String(operator.values.email),
            scope: Array.isArray(operator.values.eligibleDevices)
              ? operator.values.eligibleDevices.join(", ")
              : "—",
            status: operator.status,
          }))}
        />
      </section>
      {modal && <CreateRecordModal schemaId="invite" onClose={() => setModal(false)} />}
    </>
  );
}
