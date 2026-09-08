"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { content } from "../../lib/content";
import { defaults, validateValues } from "../../lib/domain";
import { eventReady, inventoryReady } from "../../lib/readiness";
import { useConsole } from "../providers/console-provider";
import { ExtraBadge, Notice, PageHeader, Status } from "../ui/primitives";

type CheckResult = "PENDING" | "RUNNING" | "PASS" | "FAILED";

export function ChecksPage({
  mode = "preflight",
}: {
  mode?: "preflight" | "readiness" | "bundle";
}) {
  const { state, t, localize } = useConsole();
  const params = useSearchParams();
  const [deviceId, setDeviceId] = useState(params.get("device") ?? state.devices[0].id);
  const [scenario, setScenario] = useState("healthy");
  const [templateId, setTemplateId] = useState(state.entities.templates[0].id);
  const [run, setRun] = useState(1);
  const [results, setResults] = useState<Record<string, CheckResult>>({});
  const [busy, setBusy] = useState(true);
  const activeRun = useRef(0);
  const device = state.devices.find((item) => item.id === deviceId) ?? state.devices[0];
  const keys =
    mode === "readiness"
      ? ["camera", "printer", "storage", "clock", "template", "config", "inventory", "event"]
      : mode === "bundle"
        ? [
            "slotGeometry",
            "assetHashes",
            "fontLicense",
            "placeholders",
            "signatureCheck",
            "compatibility",
            "storage",
            "golden",
            "atomic",
          ]
        : ["camera", "printer", "network", "storage", "payment", "clock", "template", "config"];
  const checks = keys.map((key) => content.checks.find((check) => check.key === key)!);

  useEffect(() => {
    const token = ++activeRun.current;
    setBusy(true);
    setResults(Object.fromEntries(keys.map((key) => [key, "PENDING"])));
    const timers: ReturnType<typeof setTimeout>[] = [];
    const fails = (key: string) => {
      if (mode === "bundle") {
        const template = state.entities.templates.find((item) => item.id === templateId);
        const values = {
          ...defaults(content.schemas.template),
          ...template?.values,
          ...state.drafts[`template:${templateId}`]?.values,
          reason: "VALIDATOR_FIXTURE",
        };
        const errors = validateValues(content.schemas.template, values);
        if (key === "slotGeometry")
          return Boolean(
            errors.slots || errors.layers || errors.canvasWidth || errors.canvasHeight,
          );
        if (key === "placeholders") return Boolean(errors.placeholder || errors.layers);
        if (key === "fontLicense") return Boolean(errors.fontLicense);
        if (
          scenario === "failure" &&
          ["assetHashes", "signatureCheck", "golden", "atomic"].includes(key)
        )
          return true;
        if (key === "atomic") return Object.keys(errors).length > 0 || device.storageGb < 5;
      }
      if (device.status === "PENDING_ENROLLMENT") return true;
      if (scenario === "failure" && ["printer", "storage", "template"].includes(key)) return true;
      if (["network", "payment"].includes(key)) return device.status === "OFFLINE";
      if (key === "printer") return device.status === "DEGRADED";
      if (key === "storage") return device.storageGb < 5;
      if (key === "config")
        return mode === "readiness"
          ? device.active <= 0 || device.trust !== "TRUSTED"
          : device.active !== device.desired;
      if (key === "inventory") return !inventoryReady(state, device);
      if (key === "event") return !eventReady(state, device);
      return false;
    };
    keys.forEach((key, index) => {
      timers.push(
        setTimeout(() => {
          if (activeRun.current !== token) return;
          setResults((current) => ({ ...current, [key]: "RUNNING" }));
        }, index * 350),
      );
      timers.push(
        setTimeout(
          () => {
            if (activeRun.current !== token) return;
            setResults((current) => ({ ...current, [key]: fails(key) ? "FAILED" : "PASS" }));
            if (index === keys.length - 1) setBusy(false);
          },
          (index + 1) * 350,
        ),
      );
    });
    return () => {
      activeRun.current++;
      timers.forEach(clearTimeout);
    };
    // A run captures one device snapshot. Edits elsewhere do not change an in-flight check.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, deviceId, scenario, mode, templateId]);

  const card =
    mode === "readiness"
      ? content.cards.vouchers[2]
      : mode === "bundle"
        ? content.cards.templates[2]
        : content.cards.devices[1];
  const failed = Object.values(results).filter((result) => result === "FAILED").length;
  return (
    <>
      <PageHeader
        title={localize(card.title)}
        copy={t("healthHelp")}
        back={mode === "readiness" ? "/vouchers" : mode === "bundle" ? "/templates" : "/devices"}
        reference={mode === "bundle" ? "§22.6–22.7" : "§5.3, §10.4"}
        action={
          <button
            type="button"
            className="button primary"
            disabled={busy}
            onClick={() => setRun((value) => value + 1)}
          >
            {busy && <LoaderCircle size={16} className="spin" />}
            {t(busy ? "running" : "rerun")}
          </button>
        }
      />
      <section className="panel">
        <div className="form-grid">
          <label className="field">
            {t("device")}
            <select value={deviceId} onChange={(event) => setDeviceId(event.target.value)}>
              {state.devices.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.id} · {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            {t("scenario")}
            <ExtraBadge />
            <select value={scenario} onChange={(event) => setScenario(event.target.value)}>
              <option value="healthy">{t("healthy")}</option>
              <option value="failure">{t("failure")}</option>
            </select>
          </label>
        </div>
        {mode === "bundle" && (
          <label className="field scope-picker">
            {t("select")}
            <select value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
              {state.entities.templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} · v{String(template.values.version)}
                </option>
              ))}
            </select>
          </label>
        )}
        <Notice>{t("validationNote")}</Notice>
        {mode === "bundle" && <Notice>{t("binaryNote")}</Notice>}
        <div className="checks-grid" aria-busy={busy}>
          {checks.map((check) => (
            <article
              key={check.key}
              className={`check-card check-${results[check.key]?.toLowerCase()}`}
            >
              <h3>{localize(check.label)}</h3>
              {results[check.key] === "RUNNING" ? (
                <span className="check-running">
                  <LoaderCircle size={16} className="spin" />
                  {t("running")}
                </span>
              ) : (
                <Status value={results[check.key] ?? "PENDING"} />
              )}
              {results[check.key] === "FAILED" && <p>{localize(check.failure)}</p>}
            </article>
          ))}
        </div>
        <p className="result-summary" role="status" aria-live="polite">
          {t("result")}:{" "}
          {busy
            ? t("running")
            : `${t(failed ? "failed" : "pass")} · ${Object.values(results).filter((result) => result === "PASS").length}/${keys.length}`}
        </p>
        <Notice warning>{t(mode === "readiness" ? "offlineNote" : "guard")}</Notice>
      </section>
    </>
  );
}
