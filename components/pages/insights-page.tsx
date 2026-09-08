"use client";

import { content } from "../../lib/content";
import { useConsole } from "../providers/console-provider";
import { ActionLink, Notice, PageHeader } from "../ui/primitives";

export function InsightsPage() {
  const { t, localize, state } = useConsole();
  const metrics = [
    {
      key: "sessions",
      total: content.seed.records.sessions.length,
      done: content.seed.records.sessions.filter((row) => row.state === "COMPLETED").length,
    },
    {
      key: "payments",
      total: content.seed.records.payments.length,
      done: content.seed.records.payments.filter((row) => row.state === "PAID").length,
    },
    {
      key: "media",
      total: content.seed.records.media.length,
      done: content.seed.records.media.filter((row) => row.state === "UPLOAD_VERIFIED").length,
    },
    {
      key: "delivery",
      total: content.seed.records.delivery.length,
      done: content.seed.records.delivery.filter((row) => row.state === "DELIVERED").length,
    },
  ];
  return (
    <>
      <PageHeader
        title={localize(content.modules.insights.title)}
        copy={localize(content.modules.insights.copy)}
        reference="§15"
      />
      <div className="metric-grid">
        {metrics.map((metric) => (
          <section className="metric-card" key={metric.key}>
            <span>{t(metric.key)}</span>
            <strong>
              {metric.done}/{metric.total}
            </strong>
            <progress value={metric.done} max={metric.total} aria-label={t(metric.key)} />
            <ActionLink href={`/${metric.key}`}>{t("open")}</ActionLink>
          </section>
        ))}
      </div>
      <section className="panel">
        <h2>{t("ack")}</h2>
        {state.devices.map((device) => (
          <div className="health-row" key={device.id}>
            <strong>{device.id}</strong>
            <span>
              #{device.active} → #{device.desired}
            </span>
            <progress
              value={device.active === device.desired ? 1 : 0}
              max={1}
              aria-label={device.id}
            />
          </div>
        ))}
        <Notice>{t("metricsNote")}</Notice>
      </section>
    </>
  );
}
