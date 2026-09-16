"use client";

import { useState } from "react";
import {
  usePayments,
  useRefundPayment,
  useSessionHistory,
  useSessions,
} from "../../hooks/use-edge-service";
import type { Payment, Session } from "../../lib/edge-service/types";
import { ConfirmAction } from "../forms/confirm-action";
import { useConsole } from "../providers/console-provider";
import { DataTable, Notice, PageHeader, SearchField, Status } from "../ui/primitives";
import { ServiceBadge, ServiceBoundary } from "./service-feedback";

function SessionHistoryPanel({ session }: { session: Session }) {
  const { t } = useConsole();
  const query = useSessionHistory(session.id);
  return (
    <section className="panel">
      <h2>{session.id}</h2>
      <dl className="detail-list">
        <div>
          <dt>{t("campaign")}</dt>
          <dd>{session.campaign_id || "—"}</dd>
        </div>
        <div>
          <dt>{t("device")}</dt>
          <dd>{session.device_code || session.device_id || "—"}</dd>
        </div>
        <div>
          <dt>{t("activation")}</dt>
          <dd>{session.activation_mode || "—"}</dd>
        </div>
        <div>
          <dt>{t("state")}</dt>
          <dd>
            <Status value={session.state.toUpperCase()} />
          </dd>
        </div>
      </dl>
      <h3>{t("deviceHistory")}</h3>
      <ServiceBoundary query={query}>
        {(response) => (
          <DataTable
            columns={[
              { key: "created", label: t("createdAt") },
              { key: "device", label: t("device") },
              { key: "reason", label: t("reason") },
            ]}
            rows={response.data.map((record) => ({
              id: record.id,
              created: record.created_at,
              device: record.device_code || record.device_id || "—",
              reason: record.reason,
            }))}
          />
        )}
      </ServiceBoundary>
    </section>
  );
}

export function SessionsServicePage() {
  const { t, localize } = useConsole();
  const query = useSessions();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Session | null>(null);
  return (
    <>
      <PageHeader
        title={localize({ en: "Sessions", id: "Sesi" })}
        copy={t("serviceReadOnly")}
        reference="§7–9, §15"
        action={<ServiceBadge />}
      />
      <ServiceBoundary query={query}>
        {(response) => {
          const rows = response.data.filter((record) =>
            Object.values(record).join(" ").toLowerCase().includes(search.toLowerCase()),
          );
          return (
            <section className="panel">
              <div className="panel-heading">
                <h2>{t("sessions")}</h2>
                <SearchField value={search} onChange={setSearch} />
              </div>
              <DataTable
                columns={[
                  { key: "id", label: t("id") },
                  { key: "device", label: t("device") },
                  { key: "activation", label: t("activation") },
                  { key: "state", label: t("state") },
                  { key: "offline", label: t("offline") },
                  { key: "actions", label: t("actions") },
                ]}
                rows={rows.map((record) => ({
                  id: record.id,
                  device: record.device_code || record.device_id || "—",
                  activation: record.activation_mode || "—",
                  state: <Status value={record.state.toUpperCase()} />,
                  offline: record.offline ? t("yes") : t("no"),
                  actions: (
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => setSelected(record)}
                    >
                      {t("open")}
                    </button>
                  ),
                }))}
              />
            </section>
          );
        }}
      </ServiceBoundary>
      {selected && <SessionHistoryPanel session={selected} />}
    </>
  );
}

function PaymentDetail({ payment }: { payment: Payment }) {
  const { t, notify } = useConsole();
  const [confirmRefund, setConfirmRefund] = useState(false);
  const refund = useRefundPayment(payment.id);
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>{payment.id}</h2>
        {payment.status.toLowerCase() === "paid" && (
          <button className="button" type="button" onClick={() => setConfirmRefund(true)}>
            {t("refund")}
          </button>
        )}
      </div>
      <dl className="detail-list">
        {Object.entries(payment).map(([key, value]) => (
          <div key={key}>
            <dt>{t(key)}</dt>
            <dd>{value === null || value === undefined ? "—" : String(value)}</dd>
          </div>
        ))}
      </dl>
      <Notice>{t("paymentServiceNote")}</Notice>
      {confirmRefund && (
        <ConfirmAction
          title={t("refund")}
          onClose={() => setConfirmRefund(false)}
          onConfirm={async () => {
            try {
              await refund.mutateAsync();
              notify("serviceUpdated");
            } catch {
              notify("serviceError");
            }
          }}
        >
          <Notice warning>{t("refundWarning")}</Notice>
        </ConfirmAction>
      )}
    </section>
  );
}

export function PaymentsServicePage() {
  const { t, localize } = useConsole();
  const query = usePayments();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<Payment | null>(null);
  return (
    <>
      <PageHeader
        title={localize({ en: "Payments", id: "Pembayaran" })}
        copy={t("serviceReadOnly")}
        reference="§8, §15"
        action={<ServiceBadge />}
      />
      <ServiceBoundary query={query}>
        {(response) => {
          const statuses = Array.from(new Set(response.data.map((record) => record.status)));
          const rows = response.data.filter(
            (record) =>
              (status === "all" || record.status === status) &&
              Object.values(record).join(" ").toLowerCase().includes(search.toLowerCase()),
          );
          return (
            <section className="panel">
              <div className="filter-row">
                <SearchField value={search} onChange={setSearch} />
                <label className="field">
                  {t("status")}
                  <select value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value="all">{t("all")}</option>
                    {statuses.map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </label>
              </div>
              <DataTable
                columns={[
                  { key: "id", label: t("id") },
                  { key: "amount", label: t("amount") },
                  { key: "method", label: t("method") },
                  { key: "status", label: t("status") },
                  { key: "created", label: t("createdAt") },
                  { key: "actions", label: t("actions") },
                ]}
                rows={rows.map((record) => ({
                  id: record.id,
                  amount: `${record.currency} ${record.amount.toLocaleString()}`,
                  method: record.method || record.provider,
                  status: <Status value={record.status.toUpperCase()} />,
                  created: record.created_at,
                  actions: (
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => setSelected(record)}
                    >
                      {t("open")}
                    </button>
                  ),
                }))}
              />
            </section>
          );
        }}
      </ServiceBoundary>
      {selected && <PaymentDetail payment={selected} />}
    </>
  );
}
