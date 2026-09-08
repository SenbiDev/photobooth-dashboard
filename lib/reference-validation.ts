import { content } from "./content";
import { validateValues } from "./domain";
import type { ConsoleState, Values } from "./types";

export function validateReferences(state: ConsoleState, schemaId: string, values: Values) {
  const errors = validateValues(content.schemas[schemaId], values);
  if (values.deviceId && !state.devices.some((device) => device.id === values.deviceId))
    errors.deviceId = "guardrailError";
  if (values.eventId && !state.entities.events.some((event) => event.id === values.eventId))
    errors.eventId = "guardrailError";
  if (
    Array.isArray(values.eligibleDevices) &&
    values.eligibleDevices.some((id) => !state.devices.some((device) => device.id === id))
  ) {
    errors.eligibleDevices = "guardrailError";
  }
  if (
    values.deviceId &&
    Array.isArray(values.eligibleDevices) &&
    !values.eligibleDevices.includes(String(values.deviceId))
  )
    errors.deviceId = "guardrailError";
  if (schemaId === "allocation") {
    const maximum = Math.max(
      0,
      ...state.entities.allocations
        .filter((item) => item.values.deviceId === values.deviceId)
        .map((item) => Number(item.values.version)),
    );
    if (Number(values.version) <= maximum) errors.version = "range";
  }
  if (schemaId === "template") {
    const maximum = Math.max(
      0,
      ...state.entities.templates
        .filter((item) => item.values.templateId === values.templateId && item.status !== "DRAFT")
        .map((item) => Number(item.values.version)),
    );
    if (Number(values.version) <= maximum) errors.version = "range";
  }
  return errors;
}

export function publishScope(state: ConsoleState, values: Values): string[] {
  const event = state.entities.events.find((item) => item.id === values.eventId);
  const eligible = values.eligibleDevices ?? event?.values.eligibleDevices;
  return state.devices
    .filter((device) => values.rollout === "all" || device.id === values.deviceId)
    .filter((device) => !Array.isArray(eligible) || eligible.includes(device.id))
    .map((device) => device.id);
}
