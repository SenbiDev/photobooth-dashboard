import type { ConsoleState, Device, Values } from "./types";

function inWindow(values: Values, now: Date): boolean {
  try {
    const localTime = new Intl.DateTimeFormat("sv-SE", {
      timeZone: String(values.timezone),
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .format(now)
      .replace(" ", "T");
    return String(values.validFrom) <= localTime && localTime <= String(values.validUntil);
  } catch {
    return false;
  }
}

export function eventReady(state: ConsoleState, device: Device, now = new Date()): boolean {
  const event = state.entities.events.find((record) => record.id === device.eventId);
  return Boolean(
    event &&
    event.status === "PUBLISHED" &&
    inWindow(event.values, now) &&
    Array.isArray(event.values.eligibleDevices) &&
    event.values.eligibleDevices.includes(device.id),
  );
}

export function inventoryReady(state: ConsoleState, device: Device, now = new Date()): boolean {
  return (
    eventReady(state, device, now) &&
    state.entities.allocations.some(
      (allocation) =>
        allocation.status === "SIGNED_FIXTURE" &&
        allocation.values.deviceId === device.id &&
        allocation.values.eventId === device.eventId &&
        Number(allocation.values.available) > 0 &&
        inWindow(allocation.values, now),
    )
  );
}
