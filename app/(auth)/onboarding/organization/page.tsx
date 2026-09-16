"use client";

import { OnboardingLayout } from "../../../../components/auth/onboarding-layout";
import { OnboardingOrganizationForm } from "../../../../components/auth/onboarding-organization-form";
import { useAuthLocale } from "../../../../components/providers/auth-locale-provider";

export default function OnboardingOrganizationPage() {
  const { t } = useAuthLocale();
  return (
    <OnboardingLayout title={t("authCreateOrganization")} copy={t("authOrganizationCopy")}>
      <OnboardingOrganizationForm />
    </OnboardingLayout>
  );
}
