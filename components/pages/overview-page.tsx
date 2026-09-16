"use client";

import { eligibleJob } from "../../lib/domain";
import { useConsole } from "../providers/console-provider";
import { DeviceDirectory } from "../devices/device-directory";
import { ActionLink, Notice, PageHeader } from "../ui/primitives";
import { useDevices, useSessions, useVoucherBatches } from "../../hooks/use-edge-service";
import { LocalOnlyNotice, ServiceBadge } from "../service/service-feedback";

export function OverviewPage() {
  const { state, t } = useConsole();
  const devices = useDevices();
  const sessions = useSessions();
  const batches = useVoucherBatches();
  const loadingValue = t("serviceLoadingShort");
  const metrics = [
    {
      label: t("device"),
      value: devices.data
        ? `${devices.data.data.filter((device) => device.status.toLowerCase() === "active").length}/${devices.data.data.length}`
        : loadingValue,
      href: "/devices",
    },
    {
      label: t("sessions"),
      value: sessions.data?.pagination?.total_data ?? sessions.data?.data.length ?? loadingValue,
      href: "/sessions",
    },
    {
      label: t("voucher"),
      value:
        batches.data?.data.reduce((sum, batch) => sum + batch.voucher_count, 0) ?? loadingValue,
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
        action={
          <div className="link-row">
            <ServiceBadge />
            <ActionLink href="/history/configuration">{t("edit")}</ActionLink>
          </div>
        }
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
      <LocalOnlyNotice />
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
