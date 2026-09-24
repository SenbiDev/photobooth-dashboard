"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Camera, LogOut, Menu, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { content } from "../../lib/content";
import { useConsole } from "../providers/console-provider";
import { Modal } from "../ui/modal";
import { SearchField } from "../ui/primitives";
import { useAuthStore } from "../../stores/auth-store";

export function ConsoleShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const pathname = usePathname();
  const { t, localize, locale, setLocale, ready } = useConsole();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState("");
  const visibleNav = content.navigation.filter((item) => !item.hidden);
  const current =
    visibleNav.find((item) => item.href !== "/" && pathname.startsWith(item.href)) ?? visibleNav[0];
  useEffect(() => {
    const blocked = content.navigation.some(
      (item) =>
        item.hidden &&
        item.href !== "/" &&
        (pathname === item.href || pathname.startsWith(`${item.href}/`)),
    );
    if (blocked) router.replace("/");
  }, [pathname, router]);
  const nav = (
    <nav className="navigation" aria-label={t("workspace")}>
      {visibleNav.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          onClick={() => setMenu(false)}
          aria-current={current.key === item.key ? "page" : undefined}
        >
          <span className="nav-marker" aria-hidden="true" />
          {localize(item.label)}
        </Link>
      ))}
    </nav>
  );
  const results = [
    ...visibleNav.map((item) => ({
      id: item.key,
      label: localize(item.label),
      href: item.href,
    })),
    ...Object.values(content.cards)
      .flat()
      .map((card) => ({ id: card.href, label: localize(card.title), href: card.href })),
  ].filter((item) => {
    const hidden = content.navigation.some(
      (nav) => nav.hidden && (item.href === nav.href || item.href.startsWith(`${nav.href}/`)),
    );
    return !hidden && item.label.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div className="console-shell">
      <a className="skip-link" href="#main-content">
        {t("skip")}
      </a>
      <aside className="sidebar">
        <Link className="brand" href="/">
          <span className="brand-icon">
            <Camera size={22} />
          </span>
          <span>
            {t("brandName")}
            <small>{t("workspaceName")}</small>
          </span>
        </Link>
        {nav}
        <div className="sidebar-footer">
          <strong>{t("workspaceName")}</strong>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <div className="topbar-location">
            <button
              type="button"
              className="icon-button mobile-menu"
              aria-label={t("menu")}
              onClick={() => setMenu(true)}
            >
              <Menu size={21} />
            </button>
            <Link href="/">{t("workspace")}</Link>
            <span aria-hidden="true">/</span>
            <strong>{localize(current.label)}</strong>
          </div>
          <div className="top-actions">
            <button
              className="icon-button"
              type="button"
              aria-label={t("search")}
              onClick={() => setSearch(true)}
            >
              <Search size={19} />
            </button>
            <div className="language-switch" role="group" aria-label={t("language")}>
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
            <button
              type="button"
              className="icon-button"
              aria-label={t("authLogout")}
              title={t("authLogout")}
              onClick={() => {
                logout();
                router.push("/login");
                router.refresh();
              }}
            >
              <LogOut size={19} />
            </button>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>
          {ready ? children : <p role="status">{t("loading")}</p>}
        </main>
      </div>
      {menu && (
        <Modal title={t("workspace")} onClose={() => setMenu(false)}>
          {nav}
        </Modal>
      )}
      {search && (
        <Modal title={t("search")} onClose={() => setSearch(false)}>
          <SearchField value={query} onChange={setQuery} />
          <div className="search-results">
            {results.map((result) => (
              <Link key={result.id} href={result.href} onClick={() => setSearch(false)}>
                {result.label}
              </Link>
            ))}
            {!results.length && <p>{t("empty")}</p>}
          </div>
        </Modal>
      )}
    </div>
  );
}
