"use client";

import { useState } from "react";
import { content } from "../../lib/content";
import { audit } from "../../lib/mutations";
import { useConsole } from "../providers/console-provider";
import { DataTable, Notice, PageHeader, SearchField, Status } from "../ui/primitives";
import { RetryModal } from "./retry-modal";
import { LocalOnlyNotice } from "../service/service-feedback";

export function QueuePage({ review = false }: { review?: boolean }) {
  const { state, t, localize, update, notify } = useConsole();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  const [note, setNote] = useState("");
  const [modal, setModal] = useState(false);
  const jobs = state.jobs
    .filter(
      (job) =>
        (!review || job.status === "DEAD_LETTER") &&
        `${job.id} ${job.kind} ${job.deviceId} ${job.status}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) => a.priority - b.priority);
  const job = jobs.find((item) => item.id === selected) ?? jobs[0];
  const card = content.cards.queue[review ? 1 : 0];
  return (
    <>
      <PageHeader
        title={localize(card.title)}
        copy={localize(card.copy)}
        back="/queue"
        reference="§10.2–10.4"
        action={
          !review && (
            <button type="button" className="button primary" onClick={() => setModal(true)}>
              {t("retry")}
            </button>
          )
        }
      />
      <LocalOnlyNotice />
      <section className="panel">
        <SearchField value={query} onChange={setQuery} />
        <DataTable
          columns={[
            { key: "id", label: t("id") },
            { key: "kind", label: t("type") },
            { key: "deviceId", label: t("device") },
            { key: "status", label: t("status") },
            { key: "attempts", label: t("attempts") },
            { key: "priority", label: t("priority") },
            { key: "action", label: t("actions") },
          ]}
          rows={jobs.map((item) => ({
            ...item,
            status: <Status value={item.status} />,
            attempts: `${item.attempts}/${item.maxAttempts}`,
            action: (
              <button type="button" className="text-button" onClick={() => setSelected(item.id)}>
                {t("open")}
              </button>
            ),
          }))}
        />
      </section>
      {job && (
        <section className="panel">
          <h2>{job.id}</h2>
          <dl className="detail-list">
            <div>
              <dt>{t("idempotency")}</dt>
              <dd>{job.idempotency}</dd>
            </div>
            <div>
              <dt>{t("result")}</dt>
              <dd>{job.error}</dd>
            </div>
            <div>
              <dt>{t("status")}</dt>
              <dd>{job.status}</dd>
            </div>
          </dl>
          <Notice warning={review}>{t("retryNote")}</Notice>
          {review && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!note.trim()) return;
                update((current) => audit(current, "note", job.id, note));
                notify("saved");
                setNote("");
              }}
            >
              <label className="field">
                {t("note")}
                <textarea required value={note} onChange={(event) => setNote(event.target.value)} />
              </label>
              <button type="submit" className="button">
                {t("save")}
              </button>
            </form>
          )}
        </section>
      )}
      {modal && <RetryModal onClose={() => setModal(false)} />}
    </>
  );
}
