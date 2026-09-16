"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AuthShell } from "../../../components/auth/auth-shell";
import { TenantCheckOverlay } from "../../../components/auth/tenant-check-overlay";
import { VerifyOtpForm, type VerifyOtpFormValues } from "../../../components/auth/verify-otp-form";
import { useAuthLocale } from "../../../components/providers/auth-locale-provider";
import {
  useCheckOrganizationsMutation,
  useCheckTenantsMutation,
  useResendEmailOtpMutation,
  useVerifyEmailMutation,
} from "../../../hooks/use-auth";

function VerifyOtpContent() {
  const router = useRouter();
  const email = useSearchParams().get("email") || "";
  const { locale, t } = useAuthLocale();
  const verifyMutation = useVerifyEmailMutation();
  const resendMutation = useResendEmailOtpMutation();
  const tenantsMutation = useCheckTenantsMutation();
  const orgsMutation = useCheckOrganizationsMutation();
  const form = useForm<VerifyOtpFormValues>({
    resolver: zodResolver(z.object({ otp: z.string().regex(/^\d{6}$/, t("authOtpLength")) })),
    defaultValues: { otp: "" },
  });

  useEffect(() => {
    if (!email) {
      toast.error(t("authEmailMissing"));
      router.replace("/register");
    }
  }, [email, router, t]);

  useEffect(() => form.clearErrors(), [locale, form]);

  const checkWorkspace = () =>
    orgsMutation.mutate(undefined, {
      onSuccess: (organizations) => {
        if (!organizations.length) {
          toast.warning(t("authOrganizationMissing"));
          router.push("/onboarding/organization");
          return;
        }
        tenantsMutation.mutate(undefined, {
          onSuccess: (tenants) => {
            if (tenants.length) router.push("/");
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

  if (!email) return null;
  const isPending = verifyMutation.isPending || orgsMutation.isPending || tenantsMutation.isPending;
  return (
    <AuthShell title={t("authCheckEmail")} copy={t("authCheckEmailCopy")}>
      <TenantCheckOverlay visible={orgsMutation.isPending || tenantsMutation.isPending} />
      <VerifyOtpForm
        form={form}
        isPending={isPending}
        isResending={resendMutation.isPending}
        email={email}
        onBack={() => router.push("/register")}
        onSubmit={(values) =>
          verifyMutation.mutate(
            { email, otp: values.otp },
            {
              onSuccess: () => {
                toast.success(t("authEmailVerified"));
                checkWorkspace();
              },
            },
          )
        }
        onResend={() =>
          resendMutation.mutate({ email }, { onSuccess: () => toast.success(t("authOtpResent")) })
        }
      />
    </AuthShell>
  );
}

export default function VerifyOtpPage() {
  const { t } = useAuthLocale();
  return (
    <Suspense fallback={<div className="auth-route-loading">{t("authLoading")}</div>}>
      <VerifyOtpContent />
    </Suspense>
  );
}
