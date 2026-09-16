"use client";

import { useAssignments, useBooths } from "../../hooks/use-edge-service";
import { useConsole } from "../providers/console-provider";
import { DataTable, Status } from "../ui/primitives";
import { ServiceBoundary } from "../service/service-feedback";

export function DeploymentTopology() {
  const { t } = useConsole();
  const booths = useBooths();
  const assignments = useAssignments();
  return (
    <div className="two-column">
      <ServiceBoundary query={booths}>
        {(response) => (
          <section className="panel">
            <h2>{t("booths")}</h2>
            <DataTable
              columns={[
                { key: "name", label: t("name") },
                { key: "campaign", label: t("campaign") },
                { key: "location", label: t("location") },
                { key: "status", label: t("status") },
              ]}
              rows={response.data.map((booth) => ({
                id: booth.id,
                name: booth.name,
                campaign: booth.campaign?.name || "—",
                location: booth.location || "—",
                status: <Status value={booth.status.toUpperCase()} />,
              }))}
            />
          </section>
        )}
      </ServiceBoundary>
      <ServiceBoundary query={assignments}>
        {(response) => (
          <section className="panel">
            <h2>{t("deviceAssignments")}</h2>
            <DataTable
              columns={[
                { key: "booth", label: t("booth") },
                { key: "device", label: t("device") },
                { key: "window", label: t("window") },
                { key: "status", label: t("status") },
              ]}
              rows={response.data.map((assignment) => ({
                id: assignment.id,
                booth: assignment.booth.name,
                device: assignment.device.name || assignment.device.id,
                window:
                  [assignment.assigned_from, assignment.assigned_until]
                    .filter(Boolean)
                    .join(" → ") || "—",
                status: <Status value={assignment.status.toUpperCase()} />,
              }))}
            />
          </section>
        )}
      </ServiceBoundary>
    </div>
  );
}
