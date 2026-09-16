"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AuthShell } from "../../../../components/auth/auth-shell";
import { useAuthLocale } from "../../../../components/providers/auth-locale-provider";
import type { Organization } from "../../../../hooks/use-organization";
import type { SsoTenant } from "../../../../hooks/use-tenant-sso";
import { api, siteApi } from "../../../../lib/api";
import { useAuthStore } from "../../../../stores/auth-store";

interface BridgeTokenResponse {
  access: string;
  refresh: string;
}

function unwrapList<T>(payload: T[] | { results?: T[] }) {
  return Array.isArray(payload) ? payload : (payload.results ?? []);
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const { t } = useAuthLocale();
  const setAuth = useAuthStore((state) => state.setAuth);
  const hasRun = useRef(false);
  const [message, setMessage] = useState<{ key?: string; text?: string }>({
    key: "authCallbackProgress",
  });
  const messageText = message.key ? t(message.key) : (message.text ?? t("authSsoFailed"));

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const completeLogin = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code") || "";
      const state = params.get("state") || "";
      if (!code || !state) {
        setMessage({ key: "authMissingCallback" });
        return;
      }

      try {
        const { data } = await siteApi.post<BridgeTokenResponse>(
          "/auth/sso/bridge/callback/",
          { code, state },
          { withCredentials: true },
        );
        if (!data.access || !data.refresh) throw new Error(t("authSsoFailed"));
        setAuth(data.access, data.refresh);
        setMessage({ key: "authCheckingAccess" });

        const organizations = unwrapList(
          (await api.get<Organization[] | { results?: Organization[] }>("/organizations/")).data,
        );
        if (!organizations.length) {
          toast.warning(t("authOrganizationMissing"));
          router.replace("/onboarding/organization");
          return;
        }

        const tenants = unwrapList(
          (await siteApi.get<SsoTenant[] | { results?: SsoTenant[] }>("/tenants/")).data,
        );
        if (!tenants.length) {
          toast.warning(t("authTenantMissing"));
          router.replace("/onboarding/tenant");
          return;
        }

        toast.success(t("authPasskeySuccess"));
        window.location.replace("/");
      } catch (error: unknown) {
        const response = error as {
          message?: string;
          response?: { data?: { detail?: string } };
        };
        setMessage({
          text: response.response?.data?.detail || response.message || t("authSsoFailed"),
        });
      }
    };

    void completeLogin();
  }, [router, setAuth, t]);

  return (
    <AuthShell title={t("authCallbackTitle")} copy={messageText}>
      <div className="auth-callback-status" role="status" aria-live="polite">
        <LoaderCircle size={34} className="spin" />
        <p>{messageText}</p>
      </div>
    </AuthShell>
  );
}
