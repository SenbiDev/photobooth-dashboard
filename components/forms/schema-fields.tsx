"use client";

import { useId } from "react";
import type { FormSchema, Values, Value } from "../../lib/types";
import { useConsole } from "../providers/console-provider";

export function SchemaFields({
  schema,
  values,
  errors,
  onChange,
  lockedFields = [],
}: {
  schema: FormSchema;
  values: Values;
  errors: Record<string, string>;
  onChange: (key: string, value: Value) => void;
  lockedFields?: string[];
}) {
  const prefix = useId();
  const { localize, state, t } = useConsole();
  return (
    <>
      {schema.groups.map((group, groupIndex) => (
        <fieldset className="form-section" key={groupIndex}>
          <legend>{localize(group.title)}</legend>
          <div className="form-grid">
            {group.fields.map((field) => {
              const id = `${prefix}-${groupIndex}-${field.key}`;
              const value = values[field.key];
              const options =
                field.type === "device" || field.type === "devices"
                  ? state.devices.map((device) => ({
                      value: device.id,
                      label: `${device.id} · ${device.name}`,
                    }))
                  : field.type === "event"
                    ? state.entities.events.map((event) => ({ value: event.id, label: event.name }))
                    : field.options?.map((option) => ({
                        value: option.value,
                        label: localize(option.label),
                      }));
              const attributes = {
                id,
                name: field.key,
                required: field.required,
                disabled: lockedFields.includes(field.key),
                "aria-invalid": Boolean(errors[field.key]),
                "aria-describedby": errors[field.key] ? `${id}-error` : undefined,
              };
              return (
                <div
                  className={`field${field.type === "textarea" ? " field-wide" : ""}`}
                  key={field.key}
                >
                  <label htmlFor={id}>
                    {localize(field.label)}
                    {field.required && <span aria-hidden="true"> *</span>}
                  </label>
                  {options ? (
                    <select
                      {...attributes}
                      multiple={field.type === "devices"}
                      value={Array.isArray(value) ? value : String(value ?? "")}
                      onChange={(event) =>
                        onChange(
                          field.key,
                          field.type === "devices"
                            ? Array.from(event.target.selectedOptions, (option) => option.value)
                            : event.target.value,
                        )
                      }
                    >
                      {field.type !== "devices" && (
                        <option value="" disabled>
                          {t("choose")}
                        </option>
                      )}
                      {options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "textarea" ? (
                    <textarea
                      {...attributes}
                      rows={9}
                      value={String(value ?? "")}
                      onChange={(event) => onChange(field.key, event.target.value)}
                      spellCheck={false}
                    />
                  ) : field.type === "checkbox" ? (
                    <input
                      {...attributes}
                      type="checkbox"
                      checked={value === true}
                      onChange={(event) => onChange(field.key, event.target.checked)}
                    />
                  ) : (
                    <input
                      {...attributes}
                      type={field.type}
                      min={field.min}
                      max={field.max}
                      step={field.type === "number" ? "any" : undefined}
                      value={typeof value === "number" || typeof value === "string" ? value : ""}
                      onChange={(event) =>
                        onChange(
                          field.key,
                          field.type === "number" && event.target.value !== ""
                            ? Number(event.target.value)
                            : event.target.value,
                        )
                      }
                    />
                  )}
                  {errors[field.key] && (
                    <span className="field-error" id={`${id}-error`}>
                      {t(errors[field.key])}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </fieldset>
      ))}
    </>
  );
}
