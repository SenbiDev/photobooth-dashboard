"use client";

import Link from "next/link";
import { useConsole } from "../providers/console-provider";

export function FallbackPage({ error = false, reset }: { error?: boolean; reset?: () => void }) {
  const { t } = useConsole();
  return (
    <section className="panel empty-state">
      <h1>{t(error ? "error" : "notFound")}</h1>
      {reset && (
        <button className="button" onClick={reset}>
          {t("again")}
        </button>
      )}
      <Link className="action-link" href="/">
        {t("home")}
      </Link>
    </section>
  );
}
