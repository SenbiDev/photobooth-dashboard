"use client";

import { LoaderCircle } from "lucide-react";
import { useAuthLocale } from "../providers/auth-locale-provider";

export function TenantCheckOverlay({ visible }: { visible: boolean }) {
  const { t } = useAuthLocale();
  if (!visible) return null;
  return (
    <div className="auth-overlay" role="status" aria-live="polite">
      <LoaderCircle size={38} className="spin" />
      <strong>{t("authCheckingWorkspace")}</strong>
    </div>
  );
}
