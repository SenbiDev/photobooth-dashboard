import { WorkspaceEditor } from "../../../../components/forms/workspace-editor";
import { DeploymentTopology } from "../../../../components/events/deployment-topology";

export default function Page() {
  return (
    <>
      <WorkspaceEditor schemaId="campaign" back="/events" />
      <DeploymentTopology />
    </>
  );
}
