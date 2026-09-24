"use client";

import { useState } from "react";
import { useInitiateUpload } from "../../hooks/use-edge-service";
import { content } from "../../lib/content";
import { useConsole } from "../providers/console-provider";
import { Notice, PageHeader } from "../ui/primitives";
import { ServiceBadge } from "../service/service-feedback";

export function MediaUploadPage() {
  const { t, localize, notify } = useConsole();
  const mutation = useInitiateUpload();
  const [file, setFile] = useState<File | null>(null);
  const [ownerScope, setOwnerScope] = useState("user");
  const [visibility, setVisibility] = useState("private");
  const [folderId, setFolderId] = useState("");
  const [response, setResponse] = useState<Record<string, unknown> | null>(null);

  async function initiate() {
    if (!file) return;
    try {
      const result = await mutation.mutateAsync({
        filename: file.name,
        size_bytes: file.size,
        mime_type: file.type || null,
        owner_scope: ownerScope,
        visibility,
        folder_id: folderId.trim() || null,
      });
      setResponse(result);
      notify("uploadInitiated");
    } catch {
      notify("serviceError");
    }
  }

  return (
    <>
      <PageHeader
        title={localize(content.modules.media.title)}
        copy={localize(content.modules.media.copy)}
        reference="OpenAPI: POST /api/files/upload"
        action={<ServiceBadge />}
      />
      <section className="panel">
        <Notice>{t("uploadContractNote")}</Notice>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void initiate();
          }}
        >
          <div className="form-grid">
            <label className="field">
              {t("file")}
              <input
                type="file"
                required
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <label className="field">
              {t("filename")}
              <input readOnly value={file?.name ?? ""} />
            </label>
            <label className="field">
              {t("sizeBytes")}
              <input readOnly type="number" value={file?.size ?? ""} />
            </label>
            <label className="field">
              {t("mimeType")}
              <input readOnly value={file?.type ?? ""} />
            </label>
            <label className="field">
              {t("ownerScope")}
              <input value={ownerScope} onChange={(event) => setOwnerScope(event.target.value)} />
            </label>
            <label className="field">
              {t("visibility")}
              <input value={visibility} onChange={(event) => setVisibility(event.target.value)} />
            </label>
            <label className="field">
              {t("folderId")}
              <input value={folderId} onChange={(event) => setFolderId(event.target.value)} />
            </label>
          </div>
          <div className="form-actions">
            <button className="button primary" type="submit" disabled={!file || mutation.isPending}>
              {mutation.isPending ? t("serviceSaving") : t("uploadFile")}
            </button>
          </div>
        </form>
      </section>
      {response && (
        <section className="panel">
          <h2>{t("uploadInitiated")}</h2>
          <pre className="config-preview">{JSON.stringify(response, null, 2)}</pre>
        </section>
      )}
    </>
  );
}
