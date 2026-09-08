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
  children,
}: {
  title: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  initialReason?: string;
  children?: React.ReactNode;
}) {
  const { t } = useConsole();
  const [reason, setReason] = useState(initialReason);
  const [confirmed, setConfirmed] = useState(false);
  return (
    <Modal title={title} onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!confirmed || !reason.trim()) return;
          onConfirm(reason.trim());
          onClose();
        }}
      >
        {children}
        <label className="field">
          {t("reason")}
          <textarea
            required
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            required
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
          />
          {t("reauth")}
        </label>
        <Notice>{t("reauthNote")}</Notice>
        <div className="form-actions">
          <button type="button" className="button" onClick={onClose}>
            {t("cancel")}
          </button>
          <button type="submit" className="button primary" disabled={!confirmed || !reason.trim()}>
            {t("confirm")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
