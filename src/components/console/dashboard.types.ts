export type DashboardSeverity = "info" | "warning" | "critical";

export type DashboardServiceStatus = "online" | "degraded" | "offline";

export type DashboardTrend = "up" | "down" | "stable";

export type DashboardCardColor = "lime" | "purple" | "cyan" | "orange" | "red";

function assertNever(value: never): never {
  throw new Error(`Unhandled dashboard value: ${String(value)}`);
}

export function mapSeverityToCardColor(
  severity: DashboardSeverity,
): DashboardCardColor {
  switch (severity) {
    case "info":
      return "lime";
    case "warning":
      return "orange";
    case "critical":
      return "red";
    default:
      return assertNever(severity);
  }
}

export function mapStatusToTrend(
  status: DashboardServiceStatus,
): DashboardTrend {
  switch (status) {
    case "online":
      return "up";
    case "degraded":
      return "stable";
    case "offline":
      return "down";
    default:
      return assertNever(status);
  }
}

export function mapSeverityToStatusTextClass(
  severity: DashboardSeverity,
): string {
  switch (severity) {
    case "info":
      return "text-lime-400";
    case "warning":
      return "text-orange-400";
    case "critical":
      return "text-red-400";
    default:
      return assertNever(severity);
  }
}
