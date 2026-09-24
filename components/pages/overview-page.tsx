"use client";

import {
  useDevices,
  usePayments,
  useSessions,
  useVoucherBatches,
} from "../../hooks/use-edge-service";
import { useConsole } from "../providers/console-provider";
import { DeviceDirectory } from "../devices/device-directory";
import { ActionLink, Notice, PageHeader } from "../ui/primitives";
import { ServiceBadge } from "../service/service-feedback";

export function OverviewPage() {
  const { t } = useConsole();
  const devices = useDevices();
  const sessions = useSessions();
  const batches = useVoucherBatches();
  const payments = usePayments();
  const loading = t("serviceLoadingShort");
  const metrics = [
    {
      label: t("device"),
      value: devices.data?.data.length ?? loading,
      href: "/devices",
    },
    {
      label: t("sessions"),
      value: sessions.data?.data.length ?? loading,
      href: "/sessions",
    },
    {
      label: t("voucherBatches"),
      value: batches.data?.data.length ?? loading,
      href: "/vouchers",
    },
    {
      label: t("payments"),
      value: payments.data?.data.length ?? loading,
      href: "/payments",
    },
  ];
  return (
    <>
      <PageHeader title={t("home")} copy={t("apiContractCopy")} action={<ServiceBadge />} />
      <div className="overview-intro">
        <div className="overview-message">
          <span className="eyebrow">{t("sourceTruth")}</span>
          <h2>{t("workspace")}</h2>
          <p>{t("apiContractCopy")}</p>
          <ActionLink href="/campaigns">{t("campaign")}</ActionLink>
        </div>
        <div className="mini-contact-sheet" aria-hidden="true">
          <div />
          <div />
          <span>{t("brandName")}</span>
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
      <Notice>{t("apiContractCopy")}</Notice>
    </>
  );
}
