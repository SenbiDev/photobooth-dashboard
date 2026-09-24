export function assignmentWindowsOverlap(
  leftStart: string,
  leftEnd: string,
  rightStart?: string | null,
  rightEnd?: string | null,
) {
  const startA = leftStart ? Date.parse(leftStart) : Number.NEGATIVE_INFINITY;
  const endA = leftEnd ? Date.parse(leftEnd) : Number.POSITIVE_INFINITY;
  const startB = rightStart ? Date.parse(rightStart) : Number.NEGATIVE_INFINITY;
  const endB = rightEnd ? Date.parse(rightEnd) : Number.POSITIVE_INFINITY;
  return startA < endB && startB < endA;
}

export function formatDateTimeLocal(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function assignmentWithinCampaignWindow(
  assignedFrom: string,
  assignedUntil: string,
  campaignFrom?: string | null,
  campaignUntil?: string | null,
): boolean {
  const from = assignedFrom ? Date.parse(assignedFrom) : Number.NEGATIVE_INFINITY;
  const until = assignedUntil ? Date.parse(assignedUntil) : Number.POSITIVE_INFINITY;
  const campaignStart = campaignFrom ? Date.parse(campaignFrom) : Number.NEGATIVE_INFINITY;
  const campaignEnd = campaignUntil ? Date.parse(campaignUntil) : Number.POSITIVE_INFINITY;
  return (
    ![from, until, campaignStart, campaignEnd].some(Number.isNaN) &&
    from < until &&
    from >= campaignStart &&
    until <= campaignEnd
  );
}
