"use client";

import { content } from "../../lib/content";
import { useConsole } from "../providers/console-provider";
import { ActionLink, Notice, PageHeader } from "../ui/primitives";
import { useDevices, useReports } from "../../hooks/use-edge-service";
import { ServiceBadge, ServiceBoundary } from "../service/service-feedback";

export function InsightsPage() {
  const { t, localize } = useConsole();
  const reports = useReports();
  const devices = useDevices();
  return (
    <>
      <PageHeader
        title={localize(content.modules.insights.title)}
        copy={localize(content.modules.insights.copy)}
        reference="§15"
        action={<ServiceBadge />}
      />
      <ServiceBoundary query={reports}>
        {(data) => {
          const metrics = [
            { key: "sessions", value: data.funnel.created, href: "/sessions" },
            { key: "payments", value: data.daily.summary.transactions, href: "/payments" },
            { key: "gross", value: data.daily.summary.gross, href: "/payments" },
            { key: "voucherUsed", value: data.daily.summary.voucher_used, href: "/vouchers" },
          ];
          return (
            <>
              <div className="metric-grid">
                {metrics.map((metric) => (
                  <section className="metric-card" key={metric.key}>
                    <span>{t(metric.key)}</span>
                    <strong>{metric.value.toLocaleString()}</strong>
                    <ActionLink href={metric.href}>{t("open")}</ActionLink>
                  </section>
                ))}
              </div>
              <section className="panel">
                <h2>{t("sessionFunnel")}</h2>
                {[
                  ["sessionsCreated", data.funnel.created],
                  ["paid", data.funnel.paid],
                  ["refunded", data.funnel.refunded],
                  ["offline", data.funnel.offline],
                  ["online", data.funnel.online],
                ].map(([key, value]) => (
                  <div className="health-row" key={key}>
                    <strong>{t(String(key))}</strong>
                    <span>{value}</span>
                    <progress
                      value={Number(value)}
                      max={Math.max(data.funnel.created, 1)}
                      aria-label={t(String(key))}
                    />
                  </div>
                ))}
                <Notice>{t("metricsServiceNote")}</Notice>
              </section>
            </>
          );
        }}
      </ServiceBoundary>
      <ServiceBoundary query={devices}>
        {(response) => (
          <section className="panel">
            <h2>{t("deviceHealth")}</h2>
            {response.data.map((device) => (
              <div className="health-row" key={device.id}>
                <strong>{device.device_code}</strong>
                <span>{device.connectivity || device.status}</span>
                <progress
                  value={device.status.toLowerCase() === "active" ? 1 : 0}
                  max={1}
                  aria-label={device.device_code}
                />
              </div>
            ))}
          </section>
        )}
      </ServiceBoundary>
    </>
  );
}
