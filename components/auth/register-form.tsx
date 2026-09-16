"use client";

import { ArrowRight, LoaderCircle } from "lucide-react";
import Link from "next/link";
import type { UseFormReturn } from "react-hook-form";
import { useAuthLocale } from "../providers/auth-locale-provider";
import { AuthField } from "./auth-field";

export interface RegisterFormValues {
  email: string;
  password: string;
  confirmPassword: string;
}

export function RegisterForm({
  form,
  isLoading,
  onSubmit,
}: {
  form: UseFormReturn<RegisterFormValues>;
  isLoading: boolean;
  onSubmit: (values: RegisterFormValues) => void;
}) {
  const { t } = useAuthLocale();
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
        autoComplete="new-password"
        placeholder="••••••••"
        registration={form.register("password")}
        error={form.formState.errors.password}
      />
      <AuthField
        label={t("authConfirmPassword")}
        type="password"
        autoComplete="new-password"
        placeholder="••••••••"
        registration={form.register("confirmPassword")}
        error={form.formState.errors.confirmPassword}
      />
      <button type="submit" className="auth-primary" disabled={isLoading}>
        {isLoading ? <LoaderCircle size={18} className="spin" /> : <ArrowRight size={18} />}
        {t("authCreateAccount")}
      </button>
      <p className="auth-footnote">
        {t("authHaveAccount")} <Link href="/login">{t("authSignIn")}</Link>
      </p>
    </form>
  );
}
