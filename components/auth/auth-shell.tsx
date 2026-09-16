"use client";

import { Camera } from "lucide-react";
import { useAuthLocale } from "../providers/auth-locale-provider";

export function AuthShell({
  title,
  copy,
  children,
  wide = false,
}: {
  title: string;
  copy: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const { locale, setLocale, t } = useAuthLocale();
  return (
    <main className="auth-page">
      <div className={`auth-container${wide ? " auth-container-wide" : ""}`}>
        <div className="auth-language" role="group" aria-label={t("language")}>
          {(["en", "id"] as const).map((language) => (
            <button
              key={language}
              type="button"
              aria-pressed={locale === language}
              onClick={() => setLocale(language)}
            >
              {language.toUpperCase()}
            </button>
          ))}
        </div>
        <header className="auth-heading">
          <span className="auth-brand-icon" aria-hidden="true">
            <Camera size={28} />
          </span>
          <span className="auth-eyebrow">{t("brandName")}</span>
          <h1>{title}</h1>
          <p>{copy}</p>
        </header>
        <section className="auth-card">{children}</section>
      </div>
    </main>
  );
}
