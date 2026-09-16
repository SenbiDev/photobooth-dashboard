"use client";

import { LoaderCircle, LockKeyhole } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { useAuthLocale } from "../providers/auth-locale-provider";

export interface MfaFormValues {
  mfa_token: string;
}

export function MfaForm({
  form,
  isPending,
  onSubmit,
  onBack,
}: {
  form: UseFormReturn<MfaFormValues>;
  isPending: boolean;
  onSubmit: (values: MfaFormValues) => void;
  onBack: () => void;
}) {
  const { t } = useAuthLocale();
  const error = form.formState.errors.mfa_token;
  return (
    <form className="auth-form" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <div className="auth-step-heading">
        <span>
          <LockKeyhole size={24} />
        </span>
        <h2>{t("authMfaTitle")}</h2>
        <p>{t("authMfaCopy")}</p>
      </div>
      <label className="auth-field">
        <span>{t("authMfaCode")}</span>
        <input
          {...form.register("mfa_token")}
          className="auth-code-input"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          aria-invalid={Boolean(error)}
        />
        {error && <small role="alert">{error.message}</small>}
      </label>
      <button type="submit" className="auth-primary" disabled={isPending}>
        {isPending && <LoaderCircle size={18} className="spin" />}
        {t("authVerifyCode")}
      </button>
      <button type="button" className="auth-link-button" onClick={onBack} disabled={isPending}>
        {t("authBackLogin")}
      </button>
    </form>
  );
}
