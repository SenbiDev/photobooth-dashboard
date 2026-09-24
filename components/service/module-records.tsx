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
import { content } from "../../lib/content";

interface CommonRecord {
  id: string;
  name: string;
  status: string;
  subtitle: string;
}

function Records({ moduleId, rows }: { moduleId: string; rows: CommonRecord[] }) {
  const { t, localize } = useConsole();
  const [query, setQuery] = useState("");
  const filtered = rows.filter((record) =>
    `${record.id} ${record.name} ${record.subtitle}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>
          {moduleId === "events"
            ? localize(content.modules.events.title)
            : moduleId === "templates"
              ? localize(content.modules.templates.title)
              : t("counts")}{" "}
          <span className="muted">/{rows.length}</span>
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
                  : moduleId === "vouchers"
                    ? `/vouchers/allocations?record=${record.id}`
                    : moduleId === "events"
                      ? `/campaigns/editor?record=${record.id}`
                      : `/${moduleId}/editor?record=${record.id}`
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
  const { t, localize } = useConsole();
  const [search, setSearch] = useState("");
  return (
    <ServiceBoundary query={query}>
      {(response) => (
        <section className="panel">
          <div className="panel-heading">
            <h2>
              {localize(content.modules.devices.title)}{" "}
              <span className="muted">/{response.data.length}</span>
            </h2>
            <div className="panel-heading-actions">
              <ServiceBadge />
              <SearchField value={search} onChange={setSearch} />
            </div>
          </div>
          <DataTable
            columns={[
              { key: "name", label: t("name") },
              { key: "deviceCode", label: t("deviceCode") },
              { key: "connectivity", label: t("connectivity") },
              { key: "status", label: t("status") },
              { key: "actions", label: t("actions") },
            ]}
            rows={response.data
              .filter((item) =>
                `${item.id} ${item.device_code} ${item.name ?? ""}`
                  .toLowerCase()
                  .includes(search.toLowerCase()),
              )
              .map((item) => ({
                id: item.id,
                name: (
                  <>
                    <strong>{item.name || "—"}</strong>
                    <small>{item.id}</small>
                  </>
                ),
                deviceCode: item.device_code || "—",
                connectivity: item.connectivity || "—",
                status: <Status value={item.status.toUpperCase()} />,
                actions: (
                  <Link className="action-link" href={`/devices/${item.id}`}>
                    {t("open")}
                  </Link>
                ),
              }))}
          />
        </section>
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
  const { t } = useConsole();
  const [search, setSearch] = useState("");
  return (
    <ServiceBoundary query={query}>
      {(response) => (
        <section className="panel">
          <div className="panel-heading">
            <h2>
              {t("voucherBatches")} <span className="muted">/{response.data.length}</span>
            </h2>
            <div className="panel-heading-actions">
              <ServiceBadge />
              <SearchField value={search} onChange={setSearch} />
            </div>
          </div>
          <DataTable
            columns={[
              { key: "name", label: t("name") },
              { key: "campaign", label: t("campaign") },
              { key: "count", label: t("voucherCount") },
              { key: "eligibility", label: t("offlineEligible") },
              { key: "actions", label: t("actions") },
            ]}
            rows={response.data
              .filter((item) =>
                `${item.id} ${item.name} ${item.campaign_id ?? ""}`
                  .toLowerCase()
                  .includes(search.toLowerCase()),
              )
              .map((item) => ({
                id: item.id,
                name: (
                  <>
                    <strong>{item.name}</strong>
                    <small>{item.id}</small>
                  </>
                ),
                campaign: item.campaign_id || "—",
                count: item.voucher_count,
                eligibility: item.offline_eligible ? t("yes") : t("no"),
                actions: (
                  <Link className="action-link" href={`/vouchers/allocations?record=${item.id}`}>
                    {t("open")}
                  </Link>
                ),
              }))}
          />
        </section>
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
