"use client";

import { FallbackPage } from "../../components/pages/fallback-page";

export default function Error({ reset }: { reset: () => void }) {
  return <FallbackPage error reset={reset} />;
}
