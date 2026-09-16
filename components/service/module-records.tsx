"use client";

import Link from "next/link";
import { useState } from "react";
import {
  useCampaigns,
  useDevices,
  useFrameTemplates,
  useVoucherBatches,
} from "../../hooks/use-edge-service";
import { useConsole } from "../providers/console-provider";
import { DataTable, SearchField, Status } from "../ui/primitives";
import { ServiceBadge, ServiceBoundary } from "./service-feedback";

interface CommonRecord {
  id: string;
  name: string;
  status: string;
  subtitle: string;
}

function Records({ moduleId, rows }: { moduleId: string; rows: CommonRecord[] }) {
  const { t } = useConsole();
  const [query, setQuery] = useState("");
  const filtered = rows.filter((record) =>
    `${record.id} ${record.name} ${record.subtitle}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>
          {t("counts")} <span className="muted">/{rows.length}</span>
        </h2>
        <div className="panel-heading-actions">
          <ServiceBadge />
          <SearchField value={query} onChange={setQuery} />
        </div>
      </div>
      <DataTable
        columns={[
          { key: "name", label: t("name") },
          { key: "subtitle", label: t("details") },
          { key: "status", label: t("status") },
          { key: "actions", label: t("actions") },
        ]}
        rows={filtered.map((record) => ({
          ...record,
          name: (
            <>
              <strong>{record.name}</strong>
              <small>{record.id}</small>
            </>
          ),
          status: <Status value={record.status.toUpperCase()} />,
          actions: (
            <Link
              className="action-link"
              href={
                moduleId === "devices"
                  ? `/devices/${record.id}`
                  : `${moduleId === "vouchers" ? "/vouchers/allocations" : `/${moduleId}/editor`}?record=${record.id}`
              }
            >
              {t("open")}
            </Link>
          ),
        }))}
      />
    </section>
  );
}

function DeviceRecords() {
  const query = useDevices();
  return (
    <ServiceBoundary query={query}>
      {(response) => (
        <Records
          moduleId="devices"
          rows={response.data.map((item) => ({
            id: item.id,
            name: item.name || item.device_code,
            status: item.status,
            subtitle: `${item.device_code} · ${item.connectivity || "—"}`,
          }))}
        />
      )}
    </ServiceBoundary>
  );
}

function CampaignRecords() {
  const query = useCampaigns();
  return (
    <ServiceBoundary query={query}>
      {(response) => (
        <Records
          moduleId="events"
          rows={response.data.map((item) => ({
            id: item.id,
            name: item.name,
            status: item.status,
            subtitle: [item.active_from, item.active_until].filter(Boolean).join(" → ") || "—",
          }))}
        />
      )}
    </ServiceBoundary>
  );
}

function TemplateRecords() {
  const query = useFrameTemplates();
  return (
    <ServiceBoundary query={query}>
      {(response) => (
        <Records
          moduleId="templates"
          rows={response.data.map((item) => ({
            id: item.id,
            name: item.name,
            status: item.publish_state,
            subtitle: `v${item.version} · ${item.dimensions || item.aspect}`,
          }))}
        />
      )}
    </ServiceBoundary>
  );
}

function VoucherBatchRecords() {
  const query = useVoucherBatches();
  return (
    <ServiceBoundary query={query}>
      {(response) => (
        <Records
          moduleId="vouchers"
          rows={response.data.map((item) => ({
            id: item.id,
            name: item.name,
            status: item.offline_eligible ? "ONLINE" : "DRAFT",
            subtitle: `${item.voucher_count} vouchers`,
          }))}
        />
      )}
    </ServiceBoundary>
  );
}

export function ModuleRecords({ moduleId }: { moduleId: string }) {
  if (moduleId === "devices") return <DeviceRecords />;
  if (moduleId === "events") return <CampaignRecords />;
  if (moduleId === "templates") return <TemplateRecords />;
  if (moduleId === "vouchers") return <VoucherBatchRecords />;
  return null;
}
