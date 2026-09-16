"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { AlertTriangle, LoaderCircle, RefreshCw } from "lucide-react";
import { useConsole } from "../providers/console-provider";
import { Notice } from "../ui/primitives";

export function ServiceLoading() {
  const { t } = useConsole();
  return (
    <div className="service-state" role="status">
      <LoaderCircle className="spin" size={20} />
      <span>{t("serviceLoading")}</span>
    </div>
  );
}

export function ServiceError({ retry }: { retry: () => void }) {
  const { t } = useConsole();
  return (
    <Notice warning>
      <div className="service-error" role="alert">
        <AlertTriangle size={18} />
        <span>{t("serviceError")}</span>
        <button className="text-button" type="button" onClick={retry}>
          <RefreshCw size={15} />
          {t("retry")}
        </button>
      </div>
    </Notice>
  );
}

export function ServiceBoundary<T>({
  query,
  children,
}: {
  query: UseQueryResult<T>;
  children: (data: T) => React.ReactNode;
}) {
  if (query.isPending) return <ServiceLoading />;
  if (query.isError) return <ServiceError retry={() => void query.refetch()} />;
  return <>{children(query.data)}</>;
}

export function ServiceBadge() {
  const { t } = useConsole();
  return <span className="service-badge">{t("liveService")}</span>;
}

export function LocalOnlyNotice() {
  const { t } = useConsole();
  return <Notice warning>{t("notAvailableInService")}</Notice>;
}
