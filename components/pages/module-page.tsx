"use client";

import { useState } from "react";
import { ArrowUpRight, Plus } from "lucide-react";
import { content } from "../../lib/content";
import { useConsole } from "../providers/console-provider";
import { CreateRecordModal } from "../forms/create-record-modal";
import { ActionLink, ExtraBadge, PageHeader } from "../ui/primitives";
import { ModuleRecords } from "../service/module-records";

const createSchemas: Record<string, string> = {
  devices: "register",
  events: "campaign",
  templates: "template",
  vouchers: "allocation",
};

export function ModulePage({ moduleId }: { moduleId: string }) {
  const { localize } = useConsole();
  const [modal, setModal] = useState(false);
  const module = content.modules[moduleId];
  const cards = content.cards[moduleId] ?? [];
  const recordsFirst =
    moduleId === "devices" || moduleId === "templates" || moduleId === "vouchers";
  const featureCards = (
    <div className={"feature-grid" + (recordsFirst ? " feature-grid--single" : "")}>
      {cards.map((card) => (
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
      {cards.length > 0 && !recordsFirst && featureCards}
      <ModuleRecords moduleId={moduleId} />
      {cards.length > 0 && recordsFirst && featureCards}
      {modal && (
        <CreateRecordModal schemaId={createSchemas[moduleId]} onClose={() => setModal(false)} />
      )}
    </>
  );
}
