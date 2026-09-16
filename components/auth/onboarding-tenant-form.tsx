"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, CheckCircle2, ChevronRight, LoaderCircle, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import slugify from "slugify";
import { toast } from "sonner";
import { z } from "zod";
import { useRegisterTenant } from "../../hooks/use-tenant-sso";
import { useAuthLocale } from "../providers/auth-locale-provider";
import { AuthField } from "./auth-field";

export function OnboardingTenantForm() {
  const { locale, t } = useAuthLocale();
  const mutation = useRegisterTenant();
  const [warning, setWarning] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [targetDomain, setTargetDomain] = useState("");
  const schema = z.object({
    name: z.string().min(2, t("authTenantLength")),
    slug: z.string().min(2, t("authTenantLength")).max(50),
    plan: z.enum(["free", "premium_monthly", "premium_annual"]),
  });
  type Values = z.infer<typeof schema>;
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", slug: "", plan: "free" },
  });
  const name = form.watch("name");

  useEffect(() => {
    form.setValue("slug", slugify(name || "", { lower: true, strict: true, trim: true }), {
      shouldValidate: true,
    });
  }, [name, form]);

  useEffect(() => form.clearErrors(), [locale, form]);

  if (done) {
    return (
      <div className="auth-complete">
        <CheckCircle2 size={48} />
        <h2>{t("authTenantCreated")}</h2>
        <p>{t("authWorkspaceReady")}</p>
        <strong>{targetDomain}</strong>
        {warning && (
          <div className="auth-warning">
            <AlertTriangle size={19} />
            <span>{warning}</span>
          </div>
        )}
        <button
          type="button"
          className="auth-primary"
          disabled={!targetDomain}
          onClick={() => {
            if (!targetDomain) return;
            window.location.href = targetDomain.startsWith("http")
              ? targetDomain
              : `https://${targetDomain}`;
          }}
        >
          {t("authOpenWorkspace")} <ChevronRight size={18} />
        </button>
      </div>
    );
  }

  return (
    <form
      className="auth-form"
      onSubmit={form.handleSubmit((values) =>
        mutation.mutate(values, {
          onSuccess: (data) => {
            setTargetDomain(data.tenant.frontend_default_domain || data.tenant.domain || "");
            if (data.commerce_bootstrap?.success === false) {
              setWarning(data.commerce_bootstrap.detail || t("authBootstrapWarning"));
            }
            setDone(true);
          },
          onError: (error: unknown) => {
            const response = error as {
              response?: { data?: { detail?: string; slug?: string[] } };
            };
            toast.error(
              response.response?.data?.detail ||
                response.response?.data?.slug?.[0] ||
                t("authCreateTenantFailed"),
            );
          },
        }),
      )}
      noValidate
    >
      <AuthField
        label={t("authTenantName")}
        type="text"
        autoComplete="organization"
        placeholder="Acme Corp"
        registration={form.register("name")}
        error={form.formState.errors.name}
      />
      <input type="hidden" {...form.register("slug")} />
      <label className="auth-field">
        <span>{t("authPackage")}</span>
        <select {...form.register("plan")}>
          <option value="free">{t("authFree")}</option>
          <option value="premium_monthly">{t("authPremiumMonthly")}</option>
          <option value="premium_annual">{t("authPremiumAnnual")}</option>
        </select>
      </label>
      <button type="submit" className="auth-primary" disabled={mutation.isPending}>
        {mutation.isPending ? <LoaderCircle size={18} className="spin" /> : <Sparkles size={18} />}
        {t("authCreateTenant")}
      </button>
    </form>
  );
}
