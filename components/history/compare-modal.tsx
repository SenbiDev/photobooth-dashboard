"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useConsole } from "../providers/console-provider";
import { Modal } from "../ui/modal";
import { Notice } from "../ui/primitives";

export function CompareModal({ onClose }: { onClose: () => void }) {
  const { state, t } = useConsole();
  const router = useRouter();
  const [before, setBefore] = useState(String(state.revisions.at(-2)?.id ?? 141));
  const [after, setAfter] = useState(String(state.revisions.at(-1)?.id ?? 142));
  const [scope, setScope] = useState("all");
  return (
    <Modal title={t("diff")} onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (before === after) return;
          router.push(`/history/diff?before=${before}&after=${after}&device=${scope}`);
          onClose();
        }}
      >
        <div className="form-grid">
          {[
            { label: "before", value: before, set: setBefore },
            { label: "after", value: after, set: setAfter },
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
            <select value={scope} onChange={(event) => setScope(event.target.value)}>
              <option value="all">{t("all")}</option>
              {state.devices.map((device) => (
                <option key={device.id}>{device.id}</option>
              ))}
            </select>
          </label>
        </div>
        <Notice>{t("guard")}</Notice>
        <div className="form-actions">
          <button type="button" className="button" onClick={onClose}>
            {t("cancel")}
          </button>
          <button type="submit" className="button primary" disabled={before === after}>
            {t("preview")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
