"use client";

import { useState } from "react";
import { eligibleJob, retryJobs } from "../../lib/domain";
import { audit } from "../../lib/mutations";
import { useConsole } from "../providers/console-provider";
import { Modal } from "../ui/modal";
import { Notice, Status } from "../ui/primitives";

export function RetryModal({ onClose }: { onClose: () => void }) {
  const { state, update, t, notify } = useConsole();
  const eligible = state.jobs.filter((job) => eligibleJob(job, state));
  const [selected, setSelected] = useState(eligible.map((job) => job.id));
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const count = eligible.filter((job) => selected.includes(job.id)).length;
  return (
    <Modal title={t("retry")} onClose={onClose}>
      <Notice>{t("retryNote")}</Notice>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!count || !reason.trim() || busy) return;
          setBusy(true);
          update((current) =>
            audit(retryJobs(current, selected), "retry", selected.join(", "), reason),
          );
          notify("retryDone");
          onClose();
        }}
      >
        <fieldset className="form-section">
          <legend>
            {t("selectJobs")} · {count}
          </legend>
          {state.jobs.map((job) => (
            <label className="job-option" key={job.id}>
              <input
                type="checkbox"
                disabled={!eligibleJob(job, state)}
                checked={selected.includes(job.id)}
                onChange={(event) =>
                  setSelected((current) =>
                    event.target.checked
                      ? [...current, job.id]
                      : current.filter((id) => id !== job.id),
                  )
                }
              />
              <span>
                <strong>{job.id}</strong>
                <small>
                  {job.kind} · {job.deviceId} · {job.attempts}/{job.maxAttempts}
                </small>
              </span>
              <Status value={job.status} />
            </label>
          ))}
        </fieldset>
        <label className="field">
          {t("reason")}
          <textarea required value={reason} onChange={(event) => setReason(event.target.value)} />
        </label>
        <div className="form-actions">
          <button type="button" className="button" onClick={onClose}>
            {t("cancel")}
          </button>
          <button
            type="submit"
            className="button primary"
            disabled={!count || !reason.trim() || busy}
          >
            {t("retry")} ({count})
          </button>
        </div>
      </form>
    </Modal>
  );
}
