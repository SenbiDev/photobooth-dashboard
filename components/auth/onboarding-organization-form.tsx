"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useCreateOrganization } from "../../hooks/use-organization";
import { useAuthLocale } from "../providers/auth-locale-provider";
import { AuthField } from "./auth-field";

export function OnboardingOrganizationForm() {
  const router = useRouter();
  const { locale, t } = useAuthLocale();
  const mutation = useCreateOrganization();
  const schema = z.object({
    name: z.string().min(2, t("authOrganizationLength")),
    package_type: z.enum(["free", "premium_monthly", "premium_annual"]),
  });
  type Values = z.infer<typeof schema>;
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", package_type: "free" },
  });

  useEffect(() => form.clearErrors(), [locale, form]);

  return (
    <form
      className="auth-form"
      onSubmit={form.handleSubmit((values) =>
        mutation.mutate(values, {
          onSuccess: () => router.push("/onboarding/tenant"),
          onError: (error: unknown) => {
            const response = error as {
              response?: { data?: { detail?: string; name?: string[] } };
            };
            toast.error(
              response.response?.data?.detail ||
                response.response?.data?.name?.[0] ||
                t("authCreateOrganizationFailed"),
            );
          },
        }),
      )}
      noValidate
    >
      <AuthField
        label={t("authOrganizationName")}
        type="text"
        autoComplete="organization"
        placeholder="Acme Corp"
        registration={form.register("name")}
        error={form.formState.errors.name}
      />
      <label className="auth-field">
        <span>{t("authPackage")}</span>
        <select {...form.register("package_type")}>
          <option value="free">{t("authFree")}</option>
          <option value="premium_monthly">{t("authPremiumMonthly")}</option>
          <option value="premium_annual">{t("authPremiumAnnual")}</option>
        </select>
      </label>
      <button type="submit" className="auth-primary" disabled={mutation.isPending}>
        {mutation.isPending ? <LoaderCircle size={18} className="spin" /> : <Sparkles size={18} />}
        {t("authCreateOrganization")}
      </button>
    </form>
  );
}
