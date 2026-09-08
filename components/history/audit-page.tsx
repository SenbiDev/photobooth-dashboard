"use client";

import { useState } from "react";
import { useConsole } from "../providers/console-provider";
import { DataTable, ExtraBadge, Notice, PageHeader, SearchField } from "../ui/primitives";

export function AuditPage() {
  const { state, t } = useConsole();
  const [query, setQuery] = useState("");
  const entries = state.audit.filter((entry) =>
    Object.values(entry).join(" ").toLowerCase().includes(query.toLowerCase()),
  );
  function exportAudit() {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "photobooth-masked-audit.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <PageHeader
        title={t("audit")}
        copy={t("readonly")}
        back="/history"
        reference="§5.1, §11, §14"
        action={
          <div className="export-actions">
            <ExtraBadge />
            <button type="button" className="button" onClick={exportAudit}>
              {t("export")}
            </button>
          </div>
        }
      />
      <section className="panel">
        <SearchField value={query} onChange={setQuery} />
        <DataTable
          columns={["id", "actor", "actions", "scope", "reason", "time"].map((key) => ({
            key,
            label: t(key),
          }))}
          rows={entries.map((entry) => ({ ...entry, actions: t(entry.action) }))}
        />
        <Notice>{t("privacy")}</Notice>
      </section>
    </>
  );
}
