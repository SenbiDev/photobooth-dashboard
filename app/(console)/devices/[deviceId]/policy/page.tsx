import { DevicePolicy } from "../../../../../components/devices/device-policy";

export default function Page({ params }: { params: { deviceId: string } }) {
  return <DevicePolicy deviceId={params.deviceId} />;
}
