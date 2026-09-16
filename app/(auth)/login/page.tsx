"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AuthShell } from "../../../components/auth/auth-shell";
import { LoginForm, type LoginFormValues } from "../../../components/auth/login-form";
import { MfaForm, type MfaFormValues } from "../../../components/auth/mfa-form";
import { TenantCheckOverlay } from "../../../components/auth/tenant-check-overlay";
import { useAuthLocale } from "../../../components/providers/auth-locale-provider";
import {
  useCheckOrganizationsMutation,
  useCheckTenantsMutation,
  useGoogleLoginMutation,
  useLoginMutation,
  useMfaVerifyMutation,
} from "../../../hooks/use-auth";
import { usePasskeyLogin } from "../../../hooks/use-passkey-login";
import { useAuthStore } from "../../../stores/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const { locale, t } = useAuthLocale();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [step, setStep] = useState<"LOGIN" | "MFA">("LOGIN");
  const [preAuthToken, setPreAuthToken] = useState<string | null>(null);
  const loginMutation = useLoginMutation();
  const mfaMutation = useMfaVerifyMutation();
  const googleMutation = useGoogleLoginMutation();
  const tenantsMutation = useCheckTenantsMutation();
  const orgsMutation = useCheckOrganizationsMutation();
  const passkeyMutation = usePasskeyLogin();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(
      z.object({
        email: z.string().email(t("authInvalidEmail")),
        password: z.string().min(1, t("authRequiredPassword")),
      }),
    ),
    defaultValues: { email: "", password: "" },
  });
  const mfaForm = useForm<MfaFormValues>({
    resolver: zodResolver(z.object({ mfa_token: z.string().regex(/^\d{6}$/, t("authMfaLength")) })),
    defaultValues: { mfa_token: "" },
  });

  useEffect(() => {
    loginForm.clearErrors();
    mfaForm.clearErrors();
  }, [locale, loginForm, mfaForm]);

  const handlePostLogin = (access: string, refresh: string) => {
    setAuth(access, refresh);
    orgsMutation.mutate(undefined, {
      onSuccess: (organizations) => {
        if (!organizations.length) {
          toast.warning(t("authOrganizationMissing"));
          router.push("/onboarding/organization");
          router.refresh();
          return;
        }
        tenantsMutation.mutate(undefined, {
          onSuccess: (tenants) => {
            if (tenants.length) window.location.href = "/";
            else {
              toast.warning(t("authTenantMissing"));
              router.push("/onboarding/tenant");
            }
          },
          onError: () => router.push("/onboarding/tenant"),
        });
      },
      onError: () => router.push("/onboarding/organization"),
    });
  };

  const consumeLoginResponse = (data: {
    access?: string;
    refresh?: string;
    mfa_required?: boolean;
    token?: string;
  }) => {
    if (data.mfa_required && data.token) {
      setPreAuthToken(data.token);
      setStep("MFA");
      return;
    }
    if (data.access && data.refresh) handlePostLogin(data.access, data.refresh);
    else toast.error(t("authSsoFailed"));
  };

  const isLoading =
    loginMutation.isPending ||
    mfaMutation.isPending ||
    googleMutation.isPending ||
    passkeyMutation.isPending ||
    orgsMutation.isPending ||
    tenantsMutation.isPending;

  return (
    <AuthShell title={t("authSignInTitle")} copy={t("authSignInCopy")}>
      <TenantCheckOverlay visible={tenantsMutation.isPending || orgsMutation.isPending} />
      {step === "LOGIN" ? (
        <LoginForm
          form={loginForm}
          isLoading={isLoading}
          isPasskeyPending={passkeyMutation.isPending}
          onSubmit={(values) => loginMutation.mutate(values, { onSuccess: consumeLoginResponse })}
          onGoogleSuccess={(credential) =>
            googleMutation.mutate(credential, { onSuccess: consumeLoginResponse })
          }
          onPasskeyLogin={() =>
            passkeyMutation.mutate(undefined, {
              onError: (error: unknown) => {
                const response = error as {
                  message?: string;
                  response?: { data?: { detail?: string } };
                };
                toast.error(
                  response.response?.data?.detail || response.message || t("authPasskeyFailed"),
                );
              },
            })
          }
        />
      ) : (
        <MfaForm
          form={mfaForm}
          isPending={isLoading}
          onSubmit={(values) => {
            if (!preAuthToken) return;
            mfaMutation.mutate(
              { token: preAuthToken, mfa_token: values.mfa_token },
              { onSuccess: (data) => handlePostLogin(data.access, data.refresh) },
            );
          }}
          onBack={() => {
            setPreAuthToken(null);
            mfaForm.reset();
            setStep("LOGIN");
          }}
        />
      )}
    </AuthShell>
  );
}
