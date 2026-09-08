import { DeviceDetail } from "../../../../components/devices/device-detail";

export default function Page({ params }: { params: { deviceId: string } }) {
  return <DeviceDetail deviceId={params.deviceId} />;
}
