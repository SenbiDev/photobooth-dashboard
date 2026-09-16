import { useMutation } from "@tanstack/react-query";
import { siteApi } from "../lib/api";

interface SsoBridgeBeginResponse {
  redirect_url: string;
}

export function usePasskeyLogin() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await siteApi.post<SsoBridgeBeginResponse>(
        "/auth/sso/bridge/begin/",
        {},
        { withCredentials: true },
      );
      if (!data.redirect_url) throw new Error("SSO bridge did not return a redirect URL.");
      window.location.assign(data.redirect_url);
      return data;
    },
  });
}
