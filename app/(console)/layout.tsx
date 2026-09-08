import { Suspense } from "react";
import { ConsoleProvider } from "../../components/providers/console-provider";
import { ConsoleShell } from "../../components/layout/console-shell";

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConsoleProvider>
      <ConsoleShell>
        <Suspense fallback={null}>{children}</Suspense>
      </ConsoleShell>
    </ConsoleProvider>
  );
}
