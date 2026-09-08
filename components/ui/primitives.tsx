"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Search } from "lucide-react";
import { useConsole } from "../providers/console-provider";
import { content } from "../../lib/content";

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function Status({ value }: { value: string }) {
  const { localize } = useConsole();
  const good = [
    "ONLINE",
    "PASS",
    "PUBLISHED",
    "PAID",
    "DELIVERED",
    "COMPLETED",
    "VALIDATED",
    "TRUSTED",
  ];
  const bad = ["FAILED", "DEAD_LETTER", "QUARANTINED", "REVOKED"];
  return (
    <Badge tone={good.includes(value) ? "good" : bad.includes(value) ? "bad" : "warn"}>
      <span title={value}>
        {content.statuses[value] ? localize(content.statuses[value]) : value}
      </span>
    </Badge>
  );
}

export function PageHeader({
  title,
  copy,
  back,
  action,
  reference,
}: {
  title: string;
  copy?: string;
  back?: string;
  action?: React.ReactNode;
  reference?: string;
}) {
  const { t } = useConsole();
  return (
    <header className="page-header">
      <div>
        {back && (
          <Link className="back-link" href={back}>
            <ArrowLeft size={15} />
            {t("back")}
          </Link>
        )}
        {reference && <p className="eyebrow">{reference}</p>}
        <h1>{title}</h1>
        {copy && <p className="page-copy">{copy}</p>}
      </div>
      {action && <div className="header-actions">{action}</div>}
    </header>
  );
}

export function Notice({
  children,
  warning = false,
}: {
  children: React.ReactNode;
  warning?: boolean;
}) {
  return <aside className={`notice${warning ? " notice-warning" : ""}`}>{children}</aside>;
}

export function ExtraBadge() {
  const { t } = useConsole();
  return <Badge tone="warn">{t("extra")}</Badge>;
}

export function SearchField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useConsole();
  return (
    <label className="search-field">
      <Search size={17} aria-hidden="true" />
      <span className="sr-only">{t("search")}</span>
      <input
        type="search"
        placeholder={t("search")}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export function ActionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link className="action-link" href={href}>
      {children}
      <ArrowUpRight size={16} />
    </Link>
  );
}

export function DataTable({
  columns,
  rows,
}: {
  columns: { key: string; label: string }[];
  rows: { id: string; [key: string]: React.ReactNode }[];
}) {
  const { t } = useConsole();
  return (
    <div className="table-scroll" role="region" aria-label={t("record")} tabIndex={0}>
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => (
                <td key={column.key}>{row[column.key] ?? "—"}</td>
              ))}
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={columns.length} className="empty-state">
                {t("empty")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
