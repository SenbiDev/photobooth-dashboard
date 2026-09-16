"use client";

import { useState } from "react";
import { ArrowUpRight, Plus } from "lucide-react";
import Link from "next/link";
import { content } from "../../lib/content";
import type { EntityKind } from "../../lib/types";
import { useConsole } from "../providers/console-provider";
import { CreateRecordModal } from "../forms/create-record-modal";
import {
  ActionLink,
  DataTable,
  ExtraBadge,
  PageHeader,
  SearchField,
  Status,
} from "../ui/primitives";
import { RetryModal } from "../queue/retry-modal";
import { CompareModal } from "../history/compare-modal";
import { LocalOnlyNotice } from "../service/service-feedback";
import { ModuleRecords } from "../service/module-records";

const createSchemas: Record<string, string> = {
  devices: "register",
  events: "event",
  templates: "template",
  vouchers: "allocation",
  settings: "invite",
};
const entityKinds: Record<string, EntityKind> = {
  events: "events",
  templates: "templates",
  vouchers: "allocations",
  settings: "operators",
};

export function ModulePage({ moduleId }: { moduleId: string }) {
  const { state, localize, t } = useConsole();
  const [modal, setModal] = useState(false);
  const [query, setQuery] = useState("");
  const module = content.modules[moduleId];
  const entity = entityKinds[moduleId];
  const records = entity ? state.entities[entity] : [];
  const hasRemoteRecords = ["devices", "events", "templates", "vouchers"].includes(moduleId);
  const filtered = records.filter((record) =>
    `${record.id} ${record.name}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeader
        title={localize(module.title)}
        copy={localize(module.copy)}
        action={
          module.action && (
            <button type="button" className="button primary" onClick={() => setModal(true)}>
              <Plus size={17} />
              {localize(module.action)}
            </button>
          )
        }
      />
      <div className="feature-grid">
        {(content.cards[moduleId] ?? []).map((card) => (
          <article className="feature-card" key={card.href}>
            <div className="card-top">
              <span className="card-symbol" aria-hidden="true">
                <ArrowUpRight size={19} />
              </span>
              {card.extra && <ExtraBadge />}
            </div>
            <h2>{localize(card.title)}</h2>
            <p>{localize(card.copy)}</p>
            <ActionLink href={card.href}>{localize(card.action)}</ActionLink>
          </article>
        ))}
      </div>
      {moduleId === "templates" && (
        <section className="panel">
          <ActionLink href="/templates/sync">{t("templateSync")}</ActionLink>
        </section>
      )}
      {hasRemoteRecords && <ModuleRecords moduleId={moduleId} />}
      {!hasRemoteRecords && records.length > 0 && (
        <section className="panel">
          <div className="panel-heading">
            <h2>
              {t("counts")} <span className="muted">/{records.length}</span>
            </h2>
            <SearchField value={query} onChange={setQuery} />
          </div>
          <DataTable
            columns={[
              { key: "id", label: t("record") },
              { key: "name", label: t("name") },
              { key: "status", label: t("status") },
              { key: "actions", label: t("actions") },
            ]}
            rows={filtered.map((record) => ({
              id: record.id,
              name: record.name,
              status: <Status value={record.status} />,
              actions: (
                <Link
                  className="action-link"
                  href={`${moduleId === "settings" ? "/settings/roles" : moduleId === "vouchers" ? "/vouchers/allocations" : `/${moduleId}/editor`}?record=${record.id}`}
                >
                  {t("open")}
                </Link>
              ),
            }))}
          />
        </section>
      )}
      {["queue", "history", "settings"].includes(moduleId) && <LocalOnlyNotice />}
      {modal && createSchemas[moduleId] && (
        <CreateRecordModal schemaId={createSchemas[moduleId]} onClose={() => setModal(false)} />
      )}
      {modal && moduleId === "queue" && <RetryModal onClose={() => setModal(false)} />}
      {modal && moduleId === "history" && <CompareModal onClose={() => setModal(false)} />}
    </>
  );
}
