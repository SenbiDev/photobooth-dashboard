"use client";

import { useId } from "react";
import type { FormSchema, Values, Value } from "../../lib/types";
import { useConsole } from "../providers/console-provider";
import { useServiceReferences } from "../../hooks/use-edge-service";

export function SchemaFields({
  schema,
  values,
  errors,
  onChange,
  lockedFields = [],
  serviceMode = false,
}: {
  schema: FormSchema;
  values: Values;
  errors: Record<string, string>;
  onChange: (key: string, value: Value) => void;
  lockedFields?: string[];
  serviceMode?: boolean;
}) {
  const prefix = useId();
  const { localize, t } = useConsole();
  const references = useServiceReferences();
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
                  ? references.devices.map((device) => ({
                      value: device.id,
                      label: `${device.device_code} · ${device.name || device.id}`,
                    }))
                  : field.type === "event"
                    ? references.campaigns.map((event) => ({
                        value: event.id,
                        label: event.name,
                      }))
                    : field.type === "template"
                      ? references.templates.map((template) => ({
                          value: template.id,
                          label: `${template.name} · v${template.version}`,
                        }))
                      : field.type === "templates"
                        ? references.templates.map((template) => ({
                            value: template.id,
                            label: `${template.name} · v${template.version} · ${template.publish_state}`,
                          }))
                        : field.type === "cameraProfile"
                          ? references.cameraProfiles
                              .filter((profile) => !profile.device_pluged)
                              .map((profile) => ({
                                value: profile.id,
                                label: `${profile.name} · ${t(profile.status ? "profileEnabled" : "profileDisabled")}`,
                              }))
                          : field.type === "printerProfile"
                            ? references.printerProfiles
                                .filter((profile) => !profile.device_pluged)
                                .map((profile) => ({
                                  value: profile.id,
                                  label: `${profile.name} · ${t(profile.status ? "profileEnabled" : "profileDisabled")}`,
                                }))
                            : field.options?.map((option) => ({
                                value: option.value,
                                label: localize(option.label),
                              }));
              const displayedOptions =
                options &&
                typeof value === "string" &&
                value &&
                !options.some((option) => option.value === value)
                  ? [...options, { value, label: value }]
                  : options;
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
                    {field.required ? (
                      <span aria-hidden="true"> *</span>
                    ) : (
                      <span className="optional-flag">{t("optional")}</span>
                    )}
                  </label>
                  {displayedOptions ? (
                    <select
                      {...attributes}
                      multiple={field.type === "devices" || field.type === "templates"}
                      value={Array.isArray(value) ? value : String(value ?? "")}
                      onChange={(event) =>
                        onChange(
                          field.key,
                          field.type === "devices" || field.type === "templates"
                            ? Array.from(event.target.selectedOptions, (option) => option.value)
                            : event.target.value,
                        )
                      }
                    >
                      {field.type !== "devices" &&
                        field.type !== "templates" &&
                        !displayedOptions?.some((option) => option.value === "") && (
                          <option value="" disabled={Boolean(field.required)}>
                            {t("choose")}
                          </option>
                        )}
                      {displayedOptions.map((option) => (
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
