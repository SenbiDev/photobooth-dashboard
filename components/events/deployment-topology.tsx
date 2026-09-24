"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Pencil, Plus, Unplug } from "lucide-react";
import {
  useAssignments,
  useBooths,
  useCampaigns,
  useCreateAssignment,
  useCreateBooth,
  useDevices,
  useUpdateAssignment,
  useUpdateBooth,
} from "../../hooks/use-edge-service";
import type { Booth, DeviceAssignment } from "../../lib/edge-service/types";
import {
  assignmentWindowsOverlap,
  assignmentWithinCampaignWindow,
  formatDateTimeLocal,
} from "../../lib/reference-validation";
import { ConfirmAction } from "../forms/confirm-action";
import { useConsole } from "../providers/console-provider";
import { ServiceBadge, ServiceError, ServiceLoading } from "../service/service-feedback";
import { Modal } from "../ui/modal";
import { DataTable, Notice, Status } from "../ui/primitives";

interface BoothDraft {
  campaignId: string;
  name: string;
  location: string;
  status: string;
  configOverride: string;
}

interface AssignmentDraft {
  boothId: string;
  deviceId: string;
  assignedFrom: string;
  assignedUntil: string;
  status: string;
}

const emptyBooth = (campaignId: string): BoothDraft => ({
  campaignId,
  name: "",
  location: "",
  status: "active",
  configOverride: "{}",
});

const emptyAssignment = (boothId = "", deviceId = ""): AssignmentDraft => ({
  boothId,
  deviceId,
  assignedFrom: "",
  assignedUntil: "",
  status: "active",
});

export function DeploymentTopology() {
  const { t, notify } = useConsole();
  const params = useSearchParams();
  const campaignsQuery = useCampaigns();
  const boothsQuery = useBooths();
  const assignmentsQuery = useAssignments();
  const devicesQuery = useDevices();
  const createBooth = useCreateBooth();
  const updateBooth = useUpdateBooth();
  const createAssignment = useCreateAssignment();
  const updateAssignment = useUpdateAssignment();
  const campaigns = campaignsQuery.data?.data ?? [];
  const booths = boothsQuery.data?.data ?? [];
  const assignments = assignmentsQuery.data?.data ?? [];
  const devices = devicesQuery.data?.data ?? [];
  const requested = params.get("record") ?? "";
  const campaign = campaigns.find((item) => item.id === requested);
  const campaignId = campaign?.id ?? "";
  const [boothDraft, setBoothDraft] = useState<BoothDraft | null>(null);
  const [editingBoothId, setEditingBoothId] = useState<string | null>(null);
  const [assignmentDraft, setAssignmentDraft] = useState<AssignmentDraft | null>(null);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [endingAssignment, setEndingAssignment] = useState<DeviceAssignment | null>(null);
  const [formError, setFormError] = useState("");

  const campaignBooths = booths.filter((booth) => booth.campaign?.id === campaignId);
  const campaignBoothIds = new Set(campaignBooths.map((booth) => booth.id));
  const campaignAssignments = assignments.filter((assignment) =>
    campaignBoothIds.has(assignment.booth.id),
  );

  if (
    campaignsQuery.isPending ||
    boothsQuery.isPending ||
    assignmentsQuery.isPending ||
    devicesQuery.isPending
  )
    return <ServiceLoading />;

  if (
    campaignsQuery.isError ||
    boothsQuery.isError ||
    assignmentsQuery.isError ||
    devicesQuery.isError
  ) {
    return (
      <ServiceError
        retry={() => {
          void campaignsQuery.refetch();
          void boothsQuery.refetch();
          void assignmentsQuery.refetch();
          void devicesQuery.refetch();
        }}
      />
    );
  }

  if (!campaign) return null;

  const openBooth = (booth?: Booth) => {
    setFormError("");
    setEditingBoothId(booth?.id ?? null);
    setBoothDraft(
      booth
        ? {
            campaignId: booth.campaign?.id ?? campaignId,
            name: booth.name,
            location: booth.location ?? "",
            status: booth.status,
            configOverride: JSON.stringify(booth.config_override ?? {}, null, 2),
          }
        : emptyBooth(campaignId),
    );
  };

  const openAssignment = (assignment?: DeviceAssignment) => {
    setFormError("");
    setEditingAssignmentId(assignment?.id ?? null);
    setAssignmentDraft(
      assignment
        ? {
            boothId: assignment.booth.id,
            deviceId: assignment.device.id,
            assignedFrom: formatDateTimeLocal(assignment.assigned_from),
            assignedUntil: formatDateTimeLocal(assignment.assigned_until),
            status: assignment.status,
          }
        : emptyAssignment(campaignBooths[0]?.id, devices[0]?.id),
    );
  };

  const saveBooth = async () => {
    if (!boothDraft?.campaignId || !boothDraft.name.trim()) {
      setFormError(t("invalid"));
      return;
    }
    let configOverride: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(boothDraft.configOverride || "{}");
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
      configOverride = parsed as Record<string, unknown>;
    } catch {
      setFormError(t("invalidJson"));
      return;
    }
    const values = {
      campaign_id: boothDraft.campaignId,
      name: boothDraft.name.trim(),
      location: boothDraft.location.trim() || null,
      status: boothDraft.status,
      config_override: configOverride,
    };
    try {
      if (editingBoothId) await updateBooth.mutateAsync({ id: editingBoothId, values });
      else await createBooth.mutateAsync(values);
      notify(editingBoothId ? "serviceUpdated" : "serviceCreated");
      setBoothDraft(null);
    } catch {
      setFormError(t("serviceError"));
    }
  };

  const saveAssignment = async () => {
    if (!assignmentDraft?.boothId || !assignmentDraft.deviceId) {
      setFormError(t("invalid"));
      return;
    }
    if (
      assignmentDraft.assignedFrom &&
      assignmentDraft.assignedUntil &&
      Date.parse(assignmentDraft.assignedUntil) <= Date.parse(assignmentDraft.assignedFrom)
    ) {
      setFormError(t("dates"));
      return;
    }
    const targetBooth = campaignBooths.find((booth) => booth.id === assignmentDraft.boothId);
    if (!targetBooth) {
      setFormError(t("invalid"));
      return;
    }
    const values = {
      booth_id: assignmentDraft.boothId,
      device_id: assignmentDraft.deviceId,
      assigned_from: assignmentDraft.assignedFrom
        ? new Date(assignmentDraft.assignedFrom).toISOString()
        : null,
      assigned_until: assignmentDraft.assignedUntil
        ? new Date(assignmentDraft.assignedUntil).toISOString()
        : null,
      status: assignmentDraft.status,
    };
    try {
      if (editingAssignmentId)
        await updateAssignment.mutateAsync({ id: editingAssignmentId, values });
      else await createAssignment.mutateAsync(values);
      notify(editingAssignmentId ? "serviceUpdated" : "serviceCreated");
      setAssignmentDraft(null);
    } catch {
      setFormError(t("serviceError"));
    }
  };

  const assignmentBooth = campaignBooths.find((booth) => booth.id === assignmentDraft?.boothId);
  const assignmentCampaign = campaigns.find(
    (campaign) => campaign.id === assignmentBooth?.campaign?.id,
  );
  const assignmentOutsideWindow = Boolean(
    assignmentDraft?.status.toLowerCase() === "active" &&
    assignmentCampaign &&
    (assignmentBooth?.status.toLowerCase() !== "active" ||
      !assignmentWithinCampaignWindow(
        assignmentDraft.assignedFrom,
        assignmentDraft.assignedUntil,
        assignmentCampaign.active_from,
        assignmentCampaign.active_until,
      )),
  );
  const assignmentOverlaps = Boolean(
    assignmentDraft?.status.toLowerCase() === "active" &&
    assignments.some(
      (assignment) =>
        assignment.id !== editingAssignmentId &&
        assignment.device.id === assignmentDraft.deviceId &&
        assignment.status.toLowerCase() === "active" &&
        assignmentWindowsOverlap(
          assignmentDraft.assignedFrom,
          assignmentDraft.assignedUntil,
          assignment.assigned_from,
          assignment.assigned_until,
        ),
    ),
  );

  return (
    <>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>{t("deployment")}</h2>
            <p className="muted">
              {campaign.name} · {t("deploymentSource")}
            </p>
          </div>
          <ServiceBadge />
        </div>
        <Notice>{t("campaignDeploymentNote")}</Notice>
      </section>

      <div className="two-column">
        <section className="panel">
          <div className="panel-heading">
            <h2>{t("booths")}</h2>
            <button className="button" type="button" onClick={() => openBooth()}>
              <Plus size={16} />
              {t("createBooth")}
            </button>
          </div>
          <DataTable
            columns={[
              { key: "name", label: t("name") },
              { key: "location", label: t("location") },
              { key: "status", label: t("status") },
              { key: "actions", label: t("actions") },
            ]}
            rows={campaignBooths.map((booth) => ({
              id: booth.id,
              name: booth.name,
              location: booth.location || "—",
              status: <Status value={booth.status.toUpperCase()} />,
              actions: (
                <button className="text-button" type="button" onClick={() => openBooth(booth)}>
                  <Pencil size={14} />
                  {t("edit")}
                </button>
              ),
            }))}
          />
        </section>

        <section className="panel">
          <div className="panel-heading">
            <h2>{t("deviceAssignments")}</h2>
            <button
              className="button"
              type="button"
              disabled={!campaignBooths.length || !devices.length}
              onClick={() => openAssignment()}
            >
              <Plus size={16} />
              {t("createAssignment")}
            </button>
          </div>
          <DataTable
            columns={[
              { key: "booth", label: t("booth") },
              { key: "device", label: t("device") },
              { key: "window", label: t("window") },
              { key: "status", label: t("status") },
              { key: "actions", label: t("actions") },
            ]}
            rows={campaignAssignments.map((assignment) => ({
              id: assignment.id,
              booth: assignment.booth.name,
              device: assignment.device.name || assignment.device.id,
              window:
                [assignment.assigned_from, assignment.assigned_until].filter(Boolean).join(" → ") ||
                "—",
              status: <Status value={assignment.status.toUpperCase()} />,
              actions: (
                <div className="link-row">
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => openAssignment(assignment)}
                  >
                    <Pencil size={14} />
                    {t("edit")}
                  </button>
                  {assignment.status.toLowerCase() === "active" && (
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => setEndingAssignment(assignment)}
                    >
                      <Unplug size={14} />
                      {t("endAssignment")}
                    </button>
                  )}
                </div>
              ),
            }))}
          />
        </section>
      </div>

      {boothDraft && (
        <Modal
          title={t(editingBoothId ? "editBooth" : "createBooth")}
          onClose={() => setBoothDraft(null)}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void saveBooth();
            }}
          >
            <label className="field">
              {t("campaign")}
              <select
                value={boothDraft.campaignId}
                onChange={(event) =>
                  setBoothDraft({ ...boothDraft, campaignId: event.target.value })
                }
              >
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
            </label>
            {editingBoothId &&
              booths.find((booth) => booth.id === editingBoothId)?.campaign?.id !==
                boothDraft.campaignId &&
              assignments.some((assignment) => assignment.booth.id === editingBoothId) && (
                <Notice warning>{t("boothCampaignLocked")}</Notice>
              )}
            <label className="field">
              {t("name")}
              <input
                required
                value={boothDraft.name}
                onChange={(event) => setBoothDraft({ ...boothDraft, name: event.target.value })}
              />
            </label>
            <label className="field">
              {t("location")}
              <input
                value={boothDraft.location}
                onChange={(event) => setBoothDraft({ ...boothDraft, location: event.target.value })}
              />
            </label>
            <label className="field">
              {t("status")}
              <select
                value={boothDraft.status}
                onChange={(event) => setBoothDraft({ ...boothDraft, status: event.target.value })}
              >
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </label>
            <label className="field">
              {t("configOverride")}
              <textarea
                rows={6}
                value={boothDraft.configOverride}
                onChange={(event) =>
                  setBoothDraft({ ...boothDraft, configOverride: event.target.value })
                }
              />
            </label>
            {formError && <p className="field-error">{formError}</p>}
            <div className="form-actions">
              <button className="button" type="button" onClick={() => setBoothDraft(null)}>
                {t("cancel")}
              </button>
              <button
                className="button primary"
                type="submit"
                disabled={createBooth.isPending || updateBooth.isPending}
              >
                {t("save")}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {assignmentDraft && (
        <Modal
          title={t(editingAssignmentId ? "editAssignment" : "createAssignment")}
          onClose={() => setAssignmentDraft(null)}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void saveAssignment();
            }}
          >
            <label className="field">
              {t("booth")}
              <select
                value={assignmentDraft.boothId}
                onChange={(event) =>
                  setAssignmentDraft({ ...assignmentDraft, boothId: event.target.value })
                }
              >
                {campaignBooths.map((booth) => (
                  <option key={booth.id} value={booth.id}>
                    {booth.name} · {booth.location || "—"}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              {t("device")}
              <select
                value={assignmentDraft.deviceId}
                onChange={(event) =>
                  setAssignmentDraft({ ...assignmentDraft, deviceId: event.target.value })
                }
              >
                {devices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.device_code} · {device.name || device.id}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-grid">
              <label className="field">
                {t("assignedFrom")}
                <input
                  type="datetime-local"
                  value={assignmentDraft.assignedFrom}
                  onChange={(event) =>
                    setAssignmentDraft({ ...assignmentDraft, assignedFrom: event.target.value })
                  }
                />
              </label>
              <label className="field">
                {t("assignedUntil")}
                <input
                  type="datetime-local"
                  value={assignmentDraft.assignedUntil}
                  onChange={(event) =>
                    setAssignmentDraft({ ...assignmentDraft, assignedUntil: event.target.value })
                  }
                />
              </label>
            </div>
            <label className="field">
              {t("status")}
              <select
                value={assignmentDraft.status}
                onChange={(event) =>
                  setAssignmentDraft({ ...assignmentDraft, status: event.target.value })
                }
              >
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </label>
            {assignmentOutsideWindow && <Notice warning>{t("assignmentCampaignWindow")}</Notice>}
            {assignmentOverlaps && <Notice warning>{t("assignmentOverlap")}</Notice>}
            {formError && <p className="field-error">{formError}</p>}
            <div className="form-actions">
              <button className="button" type="button" onClick={() => setAssignmentDraft(null)}>
                {t("cancel")}
              </button>
              <button
                className="button primary"
                type="submit"
                disabled={createAssignment.isPending || updateAssignment.isPending}
              >
                {t("save")}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {endingAssignment && (
        <ConfirmAction
          title={t("endAssignment")}
          requireReason={false}
          acknowledgeOnly
          onClose={() => setEndingAssignment(null)}
          onConfirm={async () => {
            try {
              await updateAssignment.mutateAsync({
                id: endingAssignment.id,
                values: { status: "inactive", assigned_until: new Date().toISOString() },
              });
              notify("serviceUpdated");
              return true;
            } catch {
              notify("serviceError");
              return false;
            }
          }}
        >
          <Notice>{t("endAssignmentNote")}</Notice>
          <dl className="detail-list">
            <div>
              <dt>{t("device")}</dt>
              <dd>{endingAssignment.device.name || endingAssignment.device.id}</dd>
            </div>
            <div>
              <dt>{t("booth")}</dt>
              <dd>{endingAssignment.booth.name}</dd>
            </div>
            <div>
              <dt>{t("assignedUntil")}</dt>
              <dd>{new Date().toISOString()}</dd>
            </div>
          </dl>
        </ConfirmAction>
      )}
    </>
  );
}
