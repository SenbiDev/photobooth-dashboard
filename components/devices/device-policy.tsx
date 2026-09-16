import { WorkspaceEditor } from "../forms/workspace-editor";

export function DevicePolicy({ deviceId }: { deviceId: string }) {
  return <WorkspaceEditor schemaId="storage" deviceId={deviceId} back="/devices/policy" />;
}
