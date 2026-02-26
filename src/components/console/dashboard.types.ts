export type DashboardSeverity = "info" | "warning" | "critical";

export type DashboardServiceStatus = "online" | "degraded" | "offline";

export type DashboardTrend = "up" | "down" | "stable";

export type DashboardCardColor = "lime" | "purple" | "cyan" | "orange" | "red";

export interface DashboardMetric {
  value: number;
  unit?: string;
  trend: DashboardTrend;
  sparkline: number[];
  status: DashboardServiceStatus;
  severity: DashboardSeverity;
}

export interface DashboardTelemetry {
  uptime: DashboardMetric;
  listeners: DashboardMetric;
  latency: DashboardMetric;
  streamBitrate: DashboardMetric;
  aiLoad: DashboardMetric;
  localTimeLabel: string;
}

export const DEFAULT_DASHBOARD_TELEMETRY: DashboardTelemetry = {
  uptime: {
    value: 99.8,
    unit: "%",
    trend: "stable",
    sparkline: [95, 96, 98, 97, 99, 99, 100, 99, 100, 100, 99, 100],
    status: "online",
    severity: "info",
  },
  listeners: {
    value: 1247,
    trend: "up",
    sparkline: [40, 45, 55, 60, 58, 70, 75, 80, 85, 82, 90, 95],
    status: "online",
    severity: "info",
  },
  latency: {
    value: 12,
    unit: "ms",
    trend: "down",
    sparkline: [40, 35, 30, 28, 25, 22, 20, 18, 15, 14, 13, 12],
    status: "online",
    severity: "info",
  },
  streamBitrate: {
    value: 320,
    unit: "kbps",
    trend: "stable",
    sparkline: [80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80],
    status: "online",
    severity: "info",
  },
  aiLoad: {
    value: 34,
    unit: "%",
    trend: "up",
    sparkline: [15, 20, 25, 22, 30, 28, 35, 32, 38, 36, 35, 34],
    status: "degraded",
    severity: "warning",
  },
  localTimeLabel: "Local Time",
};

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
