"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { content } from "../../lib/content";
import { initialState, isConsoleState } from "../../lib/domain";
import type { ConsoleState, Locale, Localized } from "../../lib/types";

const STORAGE_KEY = "olp-console:v2";

interface ConsoleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  localize: (value: Localized) => string;
  state: ConsoleState;
  update: (change: (state: ConsoleState) => ConsoleState) => void;
  notify: (key: string) => void;
  ready: boolean;
}

const ConsoleContext = createContext<ConsoleContextValue | null>(null);

export function ConsoleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  const [state, setState] = useState(initialState);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [storageError, setStorageError] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (isConsoleState(parsed)) setState(parsed);
      }
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      localStorage.setItem("olp-locale", locale);
    } catch {
      setStorageError(true);
    }
  }, [state, locale, ready]);

  const update = useCallback((change: (current: ConsoleState) => ConsoleState) => {
    setState((current) => change(current));
  }, []);

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
        localize: (value) => value[locale],
        state,
        update,
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
