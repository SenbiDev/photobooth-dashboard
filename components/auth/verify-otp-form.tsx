"use client";

import { ArrowLeft, LoaderCircle } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { useAuthLocale } from "../providers/auth-locale-provider";

export interface VerifyOtpFormValues {
  otp: string;
}

export function VerifyOtpForm({
  form,
  isPending,
  onSubmit,
  onBack,
  onResend,
  isResending,
  email,
}: {
  form: UseFormReturn<VerifyOtpFormValues>;
  isPending: boolean;
  onSubmit: (values: VerifyOtpFormValues) => void;
  onBack: () => void;
  onResend: () => void;
  isResending: boolean;
  email: string;
}) {
  const { t } = useAuthLocale();
  const error = form.formState.errors.otp;
  return (
    <form className="auth-form" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <div className="auth-step-heading auth-step-plain">
        <h2>{t("authVerifyEmail")}</h2>
        <p>
          {t("authCodeSent")} <strong>{email}</strong>
        </p>
      </div>
      <label className="auth-field">
        <span>{t("authVerificationCode")}</span>
        <input
          {...form.register("otp")}
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
      <div className="auth-form-row auth-form-actions">
        <button type="button" className="auth-link-button" onClick={onBack} disabled={isPending}>
          <ArrowLeft size={16} /> {t("back")}
        </button>
        <button
          type="button"
          className="auth-link-button auth-accent-link"
          onClick={onResend}
          disabled={isPending || isResending}
        >
          {isResending && <LoaderCircle size={16} className="spin" />}
          {t("authResendCode")}
        </button>
      </div>
    </form>
  );
}
