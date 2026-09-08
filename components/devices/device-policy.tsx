"use client";

import { useConsole } from "../providers/console-provider";
import { WorkspaceEditor } from "../forms/workspace-editor";
import { PageHeader } from "../ui/primitives";

export function DevicePolicy({ deviceId }: { deviceId: string }) {
  const { state, t } = useConsole();
  if (!state.devices.some((device) => device.id === deviceId)) {
    return <PageHeader title={t("notFound")} back="/devices/policy" />;
  }
  return <WorkspaceEditor schemaId="storage" deviceId={deviceId} back="/devices/policy" />;
}
