"use client";

import { OnboardingLayout } from "../../../../components/auth/onboarding-layout";
import { OnboardingTenantForm } from "../../../../components/auth/onboarding-tenant-form";
import { useAuthLocale } from "../../../../components/providers/auth-locale-provider";

export default function OnboardingTenantPage() {
  const { t } = useAuthLocale();
  return (
    <OnboardingLayout title={t("authSetupWorkspace")} copy={t("authTenantCopy")}>
      <OnboardingTenantForm />
    </OnboardingLayout>
  );
}
