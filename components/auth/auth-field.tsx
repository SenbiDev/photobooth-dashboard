"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";
import { useAuthLocale } from "../providers/auth-locale-provider";

export function AuthField({
  label,
  type,
  registration,
  error,
  autoComplete,
  placeholder,
}: {
  label: string;
  type: "email" | "password" | "text";
  registration: UseFormRegisterReturn;
  error?: FieldError;
  autoComplete?: string;
  placeholder?: string;
}) {
  const { t } = useAuthLocale();
  const [visible, setVisible] = useState(false);
  const password = type === "password";
  return (
    <label className="auth-field">
      <span>{label}</span>
      <span className="auth-input-wrap">
        <input
          {...registration}
          type={password && visible ? "text" : type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
        />
        {password && (
          <button
            type="button"
            className="auth-password-toggle"
            onClick={() => setVisible((current) => !current)}
            aria-label={t(visible ? "authHidePassword" : "authShowPassword")}
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </span>
      {error && <small role="alert">{error.message}</small>}
    </label>
  );
}
