"use client";

import { useState } from "react";
import { content } from "../../lib/content";
import type { ChannelInfo, SummaryRow } from "../../lib/edge-service/types";
import {
  useBooths,
  useCampaigns,
  useReports,
  useVoucherBatches,
} from "../../hooks/use-edge-service";
import { useConsole } from "../providers/console-provider";
import { DataTable, Notice, PageHeader } from "../ui/primitives";
import { ServiceBadge, ServiceBoundary } from "../service/service-feedback";

type Filters = {
  date_from: string;
  date_to: string;
  campaign_id: string;
  booth_id: string;
  group_by: "day" | "month";
  overdue_minutes: string;
  batch_id: string;
};

const initialFilters: Filters = {
  date_from: "",
  date_to: "",
  campaign_id: "",
  booth_id: "",
  group_by: "day",
  overdue_minutes: "60",
  batch_id: "",
};

function numberText(value: number | null | undefined, locale: string) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toLocaleString(locale === "id" ? "id-ID" : "en-US");
}

function channelText(channels: Record<string, ChannelInfo> | undefined, locale: string) {
  const entries = Object.entries(channels ?? {});
  if (!entries.length) return "—";
  return entries
    .map(
      ([name, info]) =>
        `${name}: ${numberText(info.count, locale)} · ${numberText(info.amount, locale)}`,
    )
    .join(", ");
}

function SummaryMetrics({ summary }: { summary: SummaryRow }) {
  const { t, locale } = useConsole();
  const items = [
    ["transactions", summary.transactions],
    ["gross", summary.gross],
    ["refundTotal", summary.refund_total],
    ["net", summary.net],
    ["voucherUsed", summary.voucher_used],
    ["voucherValue", summary.voucher_value],
  ] as const;
  return (
    <div className="metric-grid">
      {items.map(([key, value]) => (
        <section className="metric-card" key={key}>
          <span>{t(key)}</span>
          <strong>{numberText(value, locale)}</strong>
        </section>
      ))}
    </div>
  );
}

export function InsightsPage() {
  const { t, localize, locale } = useConsole();
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const overdue = Number(filters.overdue_minutes);
  const reports = useReports({
    date_from: filters.date_from,
    date_to: filters.date_to,
    campaign_id: filters.campaign_id,
    booth_id: filters.booth_id,
    group_by: filters.group_by,
    overdue_minutes: Number.isInteger(overdue) && overdue >= 0 ? overdue : undefined,
    batch_id: filters.batch_id,
  });
  const campaigns = useCampaigns();
  const booths = useBooths();
  const batches = useVoucherBatches();
  const update = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((current) => ({ ...current, [key]: value }));

  return (
    <>
      <PageHeader
        title={localize(content.modules.insights.title)}
        copy={localize(content.modules.insights.copy)}
        reference="OpenAPI: /reports"
        action={<ServiceBadge />}
      />
      <section className="panel">
        <h2>{t("reportFilters")}</h2>
        <p className="muted">{t("reportFilterNote")}</p>
        <div className="filter-row">
          <label className="field">
            {t("dateFrom")}
            <input
              type="date"
              value={filters.date_from}
              onChange={(event) => update("date_from", event.target.value)}
            />
          </label>
          <label className="field">
            {t("dateTo")}
            <input
              type="date"
              value={filters.date_to}
              onChange={(event) => update("date_to", event.target.value)}
            />
          </label>
          <label className="field">
            {t("campaign")}
            <select
              value={filters.campaign_id}
              onChange={(event) => update("campaign_id", event.target.value)}
            >
              <option value="">-</option>
              {(campaigns.data?.data ?? []).map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            {t("booth")}
            <select
              value={filters.booth_id}
              onChange={(event) => update("booth_id", event.target.value)}
            >
              <option value="">-</option>
              {(booths.data?.data ?? []).map((booth) => (
                <option key={booth.id} value={booth.id}>
                  {booth.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            {t("groupBy")}
            <select
              value={filters.group_by}
              onChange={(event) =>
                update("group_by", event.target.value === "month" ? "month" : "day")
              }
            >
              <option value="day">{t("groupDay")}</option>
              <option value="month">{t("groupMonth")}</option>
            </select>
          </label>
          <label className="field">
            {t("overdueMinutes")}
            <input
              type="text"
              inputMode="numeric"
              value={filters.overdue_minutes}
              onChange={(event) => update("overdue_minutes", event.target.value)}
            />
          </label>
          <label className="field">
            {t("batch")}
            <select
              value={filters.batch_id}
              onChange={(event) => update("batch_id", event.target.value)}
            >
              <option value="">-</option>
              {(batches.data?.data ?? []).map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>
      <ServiceBoundary query={reports}>
        {(data) => (
          <>
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>{t("reportDaily")}</h2>
                  <p className="muted">/reports/revenue/daily · {data.daily.group_by}</p>
                </div>
              </div>
              <SummaryMetrics summary={data.daily.summary} />
              <DataTable
                columns={[
                  { key: "date", label: t("reportDate") },
                  { key: "transactions", label: t("transactions") },
                  { key: "gross", label: t("gross") },
                  { key: "refund", label: t("refundTotal") },
                  { key: "net", label: t("net") },
                  { key: "channels", label: t("channels") },
                  { key: "voucherUsed", label: t("voucherUsed") },
                  { key: "voucherValue", label: t("voucherValue") },
                ]}
                rows={(data.daily.data ?? []).map((row) => ({
                  id: row.date,
                  date: row.date,
                  transactions: numberText(row.transactions, locale),
                  gross: numberText(row.gross, locale),
                  refund: numberText(row.refund_total, locale),
                  net: numberText(row.net, locale),
                  channels: channelText(row.channels, locale),
                  voucherUsed: numberText(row.voucher_used, locale),
                  voucherValue: numberText(row.voucher_value, locale),
                }))}
              />
            </section>

            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>{t("reportBooths")}</h2>
                  <p className="muted">/reports/revenue/booths</p>
                </div>
              </div>
              <SummaryMetrics summary={data.booths.summary} />
              <DataTable
                columns={[
                  { key: "booth", label: t("booth") },
                  { key: "campaign", label: t("campaign") },
                  { key: "paidSessions", label: t("paidSessions") },
                  { key: "gross", label: t("gross") },
                  { key: "refund", label: t("refundTotal") },
                  { key: "net", label: t("net") },
                  { key: "channels", label: t("channels") },
                  { key: "voucherUsed", label: t("voucherUsed") },
                  { key: "voucherValue", label: t("voucherValue") },
                ]}
                rows={(data.booths.data ?? []).map((row) => ({
                  id: row.booth_id,
                  booth: row.booth_name || row.booth_id,
                  campaign: row.campaign_name || row.campaign_id || "—",
                  paidSessions: numberText(row.paid_sessions, locale),
                  gross: numberText(row.gross, locale),
                  refund: numberText(row.refund_total, locale),
                  net: numberText(row.net, locale),
                  channels: channelText(row.channels, locale),
                  voucherUsed: numberText(row.voucher_used, locale),
                  voucherValue: numberText(row.voucher_value, locale),
                }))}
              />
            </section>

            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>{t("reportCampaigns")}</h2>
                  <p className="muted">/reports/revenue/campaigns</p>
                </div>
              </div>
              <SummaryMetrics summary={data.campaigns.summary} />
              <DataTable
                columns={[
                  { key: "name", label: t("name") },
                  { key: "price", label: t("price") },
                  { key: "paidSessions", label: t("paidSessions") },
                  { key: "quota", label: t("quota") },
                  { key: "quotaUsed", label: t("quotaUsed") },
                  { key: "gross", label: t("gross") },
                  { key: "net", label: t("net") },
                  { key: "voucherUsed", label: t("voucherUsed") },
                  { key: "voucherValue", label: t("voucherValue") },
                  { key: "ratio", label: t("paidVsVoucher") },
                ]}
                rows={(data.campaigns.data ?? []).map((row) => ({
                  id: row.campaign_id,
                  name: row.name,
                  price: numberText(row.price, locale),
                  paidSessions: numberText(row.paid_sessions, locale),
                  quota: numberText(row.quota, locale),
                  quotaUsed: numberText(row.quota_used, locale),
                  gross: numberText(row.gross, locale),
                  net: numberText(row.net, locale),
                  voucherUsed: numberText(row.voucher_used, locale),
                  voucherValue: numberText(row.voucher_value, locale),
                  ratio: numberText(row.paid_vs_voucher_ratio, locale),
                }))}
              />
            </section>

            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>{t("reportVoucherBatches")}</h2>
                  <p className="muted">/reports/vouchers/batches</p>
                </div>
              </div>
              <DataTable
                columns={[
                  { key: "name", label: t("name") },
                  { key: "campaign", label: t("campaign") },
                  { key: "issued", label: t("issued") },
                  { key: "available", label: t("available") },
                  { key: "used", label: t("used") },
                  { key: "expired", label: t("expired") },
                  { key: "voided", label: t("voided") },
                  { key: "voucherValue", label: t("voucherValue") },
                ]}
                rows={(data.vouchers.data ?? []).map((row) => ({
                  id: row.batch_id,
                  name: row.name,
                  campaign: row.campaign_id || "—",
                  issued: numberText(row.issued, locale),
                  available: numberText(row.available, locale),
                  used: numberText(row.used, locale),
                  expired: numberText(row.expired, locale),
                  voided: numberText(row.voided, locale),
                  voucherValue: numberText(row.voucher_value, locale),
                }))}
              />
            </section>

            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>{t("sessionFunnel")}</h2>
                  <p className="muted">
                    /reports/sessions/funnel · {t("overdueMinutes")} {data.funnel.overdue_minutes}
                  </p>
                </div>
              </div>
              <div className="metric-grid">
                {(
                  [
                    ["sessionsCreated", data.funnel.created],
                    ["paid", data.funnel.paid],
                    ["refunded", data.funnel.refunded],
                    ["offline", data.funnel.offline],
                    ["online", data.funnel.online],
                  ] as const
                ).map(([key, value]) => (
                  <section className="metric-card" key={key}>
                    <span>{t(key)}</span>
                    <strong>{numberText(value, locale)}</strong>
                  </section>
                ))}
              </div>
              <h3>{t("overduePending")}</h3>
              <DataTable
                columns={[
                  { key: "payment", label: t("paymentId") },
                  { key: "amount", label: t("amount") },
                  { key: "booth", label: t("booth") },
                  { key: "created", label: t("createdAt") },
                ]}
                rows={(data.funnel.overdue_pending ?? []).map((row) => ({
                  id: row.payment_id,
                  payment: row.payment_id,
                  amount: numberText(row.amount, locale),
                  booth: row.booth_name || "—",
                  created: row.created_at,
                }))}
              />
              <Notice>{t("metricsServiceNote")}</Notice>
            </section>
          </>
        )}
      </ServiceBoundary>
    </>
  );
}
