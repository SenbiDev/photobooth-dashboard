"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import {
  useCameraProfiles,
  useCreateCameraProfile,
  useCreatePrinterProfile,
  usePrinterProfiles,
} from "../../hooks/use-edge-service";
import { content } from "../../lib/content";
import { Modal } from "../ui/modal";
import { DataTable, PageHeader, Status } from "../ui/primitives";
import { useConsole } from "../providers/console-provider";
import { ServiceBadge, ServiceBoundary } from "../service/service-feedback";

type ProfileKind = "camera" | "printer";

function CreateProfileModal({ kind, onClose }: { kind: ProfileKind; onClose: () => void }) {
  const { t, notify } = useConsole();
  const cameraMutation = useCreateCameraProfile();
  const printerMutation = useCreatePrinterProfile();
  const [name, setName] = useState("");
  const [model, setModel] = useState("");
  const [resolution, setResolution] = useState("1920x1080");
  const [transport, setTransport] = useState("CUPS_IPP");
  const [dpi, setDpi] = useState(203);
  const pending = cameraMutation.isPending || printerMutation.isPending;

  async function submit() {
    try {
      if (kind === "camera") {
        await cameraMutation.mutateAsync({
          name,
          image: null,
          status: true,
          resolution,
          aspect_ratio: "3:2",
          orientation: "landscape",
          mirror_preview: true,
          exposure: "auto",
          iso: null,
          shutter: "auto",
          aperture: "auto",
          white_balance: "auto",
          focus_mode: "auto",
          flash: null,
          trigger: "UVC",
          warm_up: 3,
          capture_timeout: 20,
        });
      } else {
        await printerMutation.mutateAsync({
          name,
          image: null,
          status: true,
          connection: transport,
          driver_type: transport,
          transport,
          model: model || null,
          device_identifier: null,
          dpi,
          width_dots: 576,
          max_height_dots: 2400,
          media_type: "thermal-label",
          label_width: null,
          label_height: null,
          darkness: 8,
          speed: 3,
          cut: true,
          feed: 3,
          margins: { x: 0, y: 0 },
          dither: "FLOYD_STEINBERG",
          qr_size: null,
          template: null,
          retry_policy: "bounded",
          calibration_offsets: { x: 0, y: 0 },
        });
      }
      notify("serviceCreated");
      onClose();
    } catch {
      notify("serviceError");
    }
  }

  return (
    <Modal
      title={t(kind === "camera" ? "createCameraProfile" : "createPrinterProfile")}
      onClose={onClose}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div className="form-grid">
          <label className="field">
            {t("name")}
            <input required value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          {kind === "camera" ? (
            <label className="field">
              {t("resolution")}
              <input
                required
                value={resolution}
                onChange={(event) => setResolution(event.target.value)}
              />
            </label>
          ) : (
            <>
              <label className="field">
                {t("model")}
                <input value={model} onChange={(event) => setModel(event.target.value)} />
              </label>
              <label className="field">
                {t("transport")}
                <select value={transport} onChange={(event) => setTransport(event.target.value)}>
                  <option>CUPS_IPP</option>
                  <option>TSPL</option>
                  <option>ZPL</option>
                  <option>ESC_POS</option>
                </select>
              </label>
              <label className="field">
                DPI
                <input
                  type="number"
                  min={72}
                  value={dpi}
                  onChange={(event) => setDpi(Number(event.target.value))}
                />
              </label>
            </>
          )}
        </div>
        <div className="form-actions">
          <button className="button" type="button" onClick={onClose}>
            {t("cancel")}
          </button>
          <button className="button primary" type="submit" disabled={pending || !name.trim()}>
            {pending ? t("serviceSaving") : t("save")}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function CameraProfiles() {
  const { t } = useConsole();
  const query = useCameraProfiles();
  return (
    <ServiceBoundary query={query}>
      {(response) => (
        <section className="panel">
          <h2>{t("cameraProfiles")}</h2>
          <DataTable
            columns={[
              { key: "name", label: t("name") },
              { key: "resolution", label: t("resolution") },
              { key: "orientation", label: t("orientation") },
              { key: "device", label: t("device") },
              { key: "status", label: t("status") },
            ]}
            rows={response.data.map((profile) => ({
              id: profile.id,
              name: profile.name,
              resolution: profile.resolution || "—",
              orientation: profile.orientation || "—",
              device: profile.device_pluged?.name || profile.device_pluged?.id || "—",
              status: <Status value={profile.status ? "ONLINE" : "OFFLINE"} />,
            }))}
          />
        </section>
      )}
    </ServiceBoundary>
  );
}

function PrinterProfiles() {
  const { t } = useConsole();
  const query = usePrinterProfiles();
  return (
    <ServiceBoundary query={query}>
      {(response) => (
        <section className="panel">
          <h2>{t("printerProfiles")}</h2>
          <DataTable
            columns={[
              { key: "name", label: t("name") },
              { key: "model", label: t("model") },
              { key: "transport", label: t("transport") },
              { key: "dpi", label: t("dpi") },
              { key: "status", label: t("status") },
            ]}
            rows={response.data.map((profile) => ({
              id: profile.id,
              name: profile.name,
              model: profile.model || "—",
              transport: profile.transport || profile.connection || "—",
              dpi: profile.dpi || "—",
              status: <Status value={profile.status ? "ONLINE" : "OFFLINE"} />,
            }))}
          />
        </section>
      )}
    </ServiceBoundary>
  );
}

export function HardwareProfilesPage({ focus }: { focus?: ProfileKind }) {
  const { t, localize } = useConsole();
  const [modal, setModal] = useState<ProfileKind | null>(null);
  return (
    <>
      <PageHeader
        title={
          focus
            ? t(focus === "camera" ? "cameraProfiles" : "printerProfiles")
            : localize(content.cards.templates[1].title)
        }
        copy={t("hardwareProfilesCopy")}
        back={focus ? "/devices" : "/templates"}
        reference="§6, §12"
        action={<ServiceBadge />}
      />
      <div className="form-actions profile-actions">
        {(!focus || focus === "camera") && (
          <button className="button primary" type="button" onClick={() => setModal("camera")}>
            <Plus size={17} />
            {t("createCameraProfile")}
          </button>
        )}
        {(!focus || focus === "printer") && (
          <button className="button primary" type="button" onClick={() => setModal("printer")}>
            <Plus size={17} />
            {t("createPrinterProfile")}
          </button>
        )}
      </div>
      {(!focus || focus === "camera") && <CameraProfiles />}
      {(!focus || focus === "printer") && <PrinterProfiles />}
      {modal && <CreateProfileModal kind={modal} onClose={() => setModal(null)} />}
    </>
  );
}
