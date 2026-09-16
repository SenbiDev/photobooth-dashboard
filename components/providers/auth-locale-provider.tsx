"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { content } from "../../lib/content";
import type { Locale } from "../../lib/types";

interface AuthLocaleValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const AuthLocaleContext = createContext<AuthLocaleValue | null>(null);

export function AuthLocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = localStorage.getItem("olp-locale");
    if (stored === "en" || stored === "id") {
      document.documentElement.lang = stored;
      setLocaleState(stored);
    }
  }, []);

  const setLocale = (next: Locale) => {
    localStorage.setItem("olp-locale", next);
    document.documentElement.lang = next;
    setLocaleState(next);
  };

  return (
    <AuthLocaleContext.Provider
      value={{ locale, setLocale, t: (key) => content.ui[key]?.[locale] ?? key }}
    >
      {children}
    </AuthLocaleContext.Provider>
  );
}

export function useAuthLocale() {
  const value = useContext(AuthLocaleContext);
  if (!value) throw new Error("AuthLocaleProvider is required");
  return value;
}
