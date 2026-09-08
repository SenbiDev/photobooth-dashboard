"use client";

import { content } from "../../lib/content";
import { eligibleJob } from "../../lib/domain";
import { useConsole } from "../providers/console-provider";
import { DeviceDirectory } from "../devices/device-directory";
import { ActionLink, Notice, PageHeader } from "../ui/primitives";

export function OverviewPage() {
  const { state, t } = useConsole();
  const metrics = [
    {
      label: t("device"),
      value: `${state.devices.filter((device) => device.status === "ONLINE").length}/${state.devices.length}`,
      href: "/devices",
    },
    { label: t("sessions"), value: content.seed.records.sessions.length, href: "/sessions" },
    {
      label: t("voucher"),
      value: state.entities.allocations
        .filter((allocation) => allocation.status === "SIGNED_FIXTURE")
        .reduce((sum, allocation) => sum + Number(allocation.values.available ?? 0), 0),
      href: "/vouchers",
    },
    {
      label: t("eligible"),
      value: state.jobs.filter((job) => eligibleJob(job, state)).length,
      href: "/queue",
    },
  ];
  return (
    <>
      <PageHeader
        title={t("home")}
        copy={t("guideCopy")}
        action={<ActionLink href="/history/configuration">{t("edit")}</ActionLink>}
      />
      <div className="overview-intro">
        <div className="overview-message">
          <span className="eyebrow">{t("workspaceName")}</span>
          <h2>{t("workspace")}</h2>
          <p>{t("guard")}</p>
          <ActionLink href="/devices/preflight">{t("checks")}</ActionLink>
        </div>
        <div className="mini-contact-sheet" aria-hidden="true">
          <div />
          <div />
          <span>{t("signature")}</span>
        </div>
      </div>
      <div className="metric-grid">
        {metrics.map((metric) => (
          <article className="metric-card" key={metric.href}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <ActionLink href={metric.href}>{t("open")}</ActionLink>
          </article>
        ))}
      </div>
      <DeviceDirectory compact />
      <div className="two-column">
        <section className="panel">
          <h2>{t("versions")}</h2>
          <p className="large-number">#{state.revisions.at(-1)?.id}</p>
          <Notice>{t("guard")}</Notice>
          <ActionLink href="/history/diff">{t("diff")}</ActionLink>
        </section>
        <section className="panel">
          <h2>{t("audit")}</h2>
          {state.audit.slice(0, 3).map((entry) => (
            <div className="audit-item" key={entry.id}>
              <strong>{t(entry.action)}</strong>
              <small>{entry.scope}</small>
            </div>
          ))}
          {!state.audit.length && <p className="muted">{t("empty")}</p>}
          <ActionLink href="/history/audit">{t("open")}</ActionLink>
        </section>
      </div>
    </>
  );
}
