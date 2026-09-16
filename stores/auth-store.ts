import Cookies from "js-cookie";
import { create } from "zustand";

interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  user: unknown | null;
  activeTenantDomain: string | null;
  setAuth: (access: string, refresh: string) => void;
  setUser: (user: unknown) => void;
  setActiveTenantDomain: (domain: string) => void;
  logout: () => void;
}

const cookieOptions = () => ({
  secure: typeof window !== "undefined" && window.location.protocol === "https:",
  sameSite: "lax" as const,
  path: "/",
});

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: Cookies.get("access_token") ?? null,
  isAuthenticated: Boolean(Cookies.get("access_token")),
  activeTenantDomain: Cookies.get("active_tenant_domain") ?? null,
  user: null,

  setAuth: (access, refresh) => {
    Cookies.set("access_token", access, { ...cookieOptions(), expires: 1 });
    Cookies.set("refresh_token", refresh, { ...cookieOptions(), expires: 7 });
    set({ accessToken: access, isAuthenticated: true });
  },

  setUser: (user) => set({ user }),

  setActiveTenantDomain: (domain) => {
    Cookies.set("active_tenant_domain", domain, cookieOptions());
    set({ activeTenantDomain: domain });
  },

  logout: () => {
    Cookies.remove("access_token", { path: "/" });
    Cookies.remove("refresh_token", { path: "/" });
    Cookies.remove("active_tenant_domain", { path: "/" });
    set({
      accessToken: null,
      isAuthenticated: false,
      user: null,
      activeTenantDomain: null,
    });
  },
}));
