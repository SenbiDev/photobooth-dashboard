"use client";

import { AuthShell } from "./auth-shell";

export function OnboardingLayout({
  title,
  copy,
  children,
}: {
  title: string;
  copy: string;
  children: React.ReactNode;
}) {
  return (
    <AuthShell title={title} copy={copy} wide>
      {children}
    </AuthShell>
  );
}
