"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { content } from "../../lib/content";
import type { Locale, Localized } from "../../lib/types";

interface ConsoleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  localize: (value: Localized | undefined) => string;
  notify: (key: string) => void;
  ready: boolean;
}

const ConsoleContext = createContext<ConsoleContextValue | null>(null);

export function ConsoleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [storageError, setStorageError] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    try {
      const language = localStorage.getItem("olp-locale");
      if (language === "en" || language === "id") setLocale(language);
    } catch {
      setStorageError(true);
    }
    setReady(true);
    return () => clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    if (!ready) return;
    try {
      localStorage.setItem("olp-locale", locale);
    } catch {
      setStorageError(true);
    }
  }, [locale, ready]);

  const notify = useCallback((key: string) => {
    clearTimeout(timer.current);
    setToast(key);
    timer.current = setTimeout(() => setToast(null), 5000);
  }, []);

  const t = (key: string) => content.ui[key]?.[locale] ?? key;
  return (
    <ConsoleContext.Provider
      value={{
        locale,
        setLocale,
        t,
        localize: (value) => value?.[locale] ?? value?.en ?? "",
        notify,
        ready,
      }}
    >
      {children}
      {storageError && (
        <p className="storage-warning" role="status">
          {t("localError")}
        </p>
      )}
      <div className="toast-region" role="status" aria-live="polite" aria-atomic="true">
        {toast && <div className="toast">{t(toast)}</div>}
      </div>
    </ConsoleContext.Provider>
  );
}

export function useConsole() {
  const context = useContext(ConsoleContext);
  if (!context) throw new Error("ConsoleProvider is required");
  return context;
}
