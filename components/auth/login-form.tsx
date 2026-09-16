"use client";

import { GoogleLogin } from "@react-oauth/google";
import { KeyRound, LoaderCircle } from "lucide-react";
import Link from "next/link";
import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { useAuthLocale } from "../providers/auth-locale-provider";
import { AuthField } from "./auth-field";

export interface LoginFormValues {
  email: string;
  password: string;
}

export function LoginForm({
  form,
  isLoading,
  isPasskeyPending,
  onSubmit,
  onGoogleSuccess,
  onPasskeyLogin,
}: {
  form: UseFormReturn<LoginFormValues>;
  isLoading: boolean;
  isPasskeyPending: boolean;
  onSubmit: (values: LoginFormValues) => void;
  onGoogleSuccess: (credential: string) => void;
  onPasskeyLogin: () => void;
}) {
  const { t } = useAuthLocale();
  const hasGoogleClientId = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
  return (
    <form className="auth-form" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <AuthField
        label={t("authEmail")}
        type="email"
        autoComplete="email"
        placeholder={t("authEmailPlaceholder")}
        registration={form.register("email")}
        error={form.formState.errors.email}
      />
      <AuthField
        label={t("authPassword")}
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        registration={form.register("password")}
        error={form.formState.errors.password}
      />
      <div className="auth-form-row">
        <label className="auth-check">
          <input type="checkbox" />
          <span>{t("authRemember")}</span>
        </label>
        <a href="#" onClick={(event) => event.preventDefault()}>
          {t("authForgot")}
        </a>
      </div>
      <button type="submit" className="auth-primary" disabled={isLoading}>
        {isLoading && <LoaderCircle size={18} className="spin" />}
        {t("authSignIn")}
      </button>
      <div className="auth-divider">
        <span>{t("authContinueWith")}</span>
      </div>
      {hasGoogleClientId && (
        <div className="auth-google">
          <GoogleLogin
            shape="pill"
            theme="outline"
            onSuccess={(response) => response.credential && onGoogleSuccess(response.credential)}
            onError={() => toast.error(t("authGoogleFailed"))}
          />
        </div>
      )}
      <button
        type="button"
        className="auth-secondary"
        onClick={onPasskeyLogin}
        disabled={isPasskeyPending}
      >
        {isPasskeyPending ? <LoaderCircle size={18} className="spin" /> : <KeyRound size={18} />}
        {t("authPasskey")}
      </button>
      <p className="auth-footnote">
        {t("authNoAccount")} <Link href="/register">{t("authSignUpHere")}</Link>
      </p>
    </form>
  );
}
