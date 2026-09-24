"use client";

import { useState } from "react";
import { useConsole } from "../providers/console-provider";
import { Modal } from "../ui/modal";
import { Notice } from "../ui/primitives";

export function ConfirmAction({
  title,
  onClose,
  onConfirm,
  initialReason = "",
  requireReason = true,
  acknowledgeOnly = false,
  children,
}: {
  title: string;
  onClose: () => void;
  onConfirm: (reason: string) => void | boolean | Promise<void | boolean>;
  initialReason?: string;
  requireReason?: boolean;
  acknowledgeOnly?: boolean;
  children?: React.ReactNode;
}) {
  const { t } = useConsole();
  const [reason, setReason] = useState(initialReason);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  return (
    <Modal title={title} onClose={onClose}>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (!confirmed || (requireReason && !reason.trim()) || submitting) return;
          setSubmitting(true);
          try {
            const success = await onConfirm(reason.trim());
            if (success !== false) onClose();
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {children}
        {requireReason && (
          <label className="field">
            {t("reason")}
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
        )}
        <label className="check-label">
          <input
            type="checkbox"
            required
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
          />
          {t(acknowledgeOnly ? "confirmServiceWrite" : "reauth")}
        </label>
        {!acknowledgeOnly && <Notice>{t("reauthNote")}</Notice>}
        <div className="form-actions">
          <button type="button" className="button" onClick={onClose}>
            {t("cancel")}
          </button>
          <button
            type="submit"
            className="button primary"
            disabled={!confirmed || (requireReason && !reason.trim()) || submitting}
          >
            {submitting ? t("serviceSaving") : t("confirm")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
