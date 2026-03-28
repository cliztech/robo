export type DashboardSeverity = "info" | "warning" | "critical";

export type DashboardServiceStatus = "online" | "degraded" | "offline";

export type DashboardTrend = "up" | "down" | "stable";

export type DashboardCardColor = "lime" | "purple" | "cyan" | "orange" | "red";

function assertNever(value: never): never {
  throw new Error(`Unhandled dashboard value: ${String(value)}`);
}

const SEVERITY_TO_CARD_COLOR: Record<DashboardSeverity, DashboardCardColor> = {
  info: "lime",
  warning: "orange",
  critical: "red",
};

const STATUS_TO_TREND: Record<DashboardServiceStatus, DashboardTrend> = {
  online: "up",
  degraded: "stable",
  offline: "down",
};

const SEVERITY_TO_STATUS_TEXT_CLASS: Record<DashboardSeverity, string> = {
  info: "text-lime-400",
  warning: "text-orange-400",
  critical: "text-red-400",
};

export function mapSeverityToCardColor(
  severity: DashboardSeverity,
): DashboardCardColor {
  return SEVERITY_TO_CARD_COLOR[severity] ?? assertNever(severity);
}

export function mapStatusToTrend(
  status: DashboardServiceStatus,
): DashboardTrend {
  return STATUS_TO_TREND[status] ?? assertNever(status);
}

export function mapSeverityToStatusTextClass(
  severity: DashboardSeverity,
): string {
  return SEVERITY_TO_STATUS_TEXT_CLASS[severity] ?? assertNever(severity);
}
