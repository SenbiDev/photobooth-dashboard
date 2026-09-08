import { ConsoleProvider } from "../components/providers/console-provider";
import { FallbackPage } from "../components/pages/fallback-page";

export default function NotFound() {
  return (
    <ConsoleProvider>
      <FallbackPage />
    </ConsoleProvider>
  );
}
