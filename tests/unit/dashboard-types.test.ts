import { describe, expect, it } from "vitest";

import {
  mapSeverityToCardColor,
  mapSeverityToStatusTextClass,
  mapStatusToTrend,
  type DashboardServiceStatus,
  type DashboardSeverity,
} from "@/components/console/dashboard.types";

describe("dashboard mapping helpers", () => {
  it.each<[DashboardSeverity, ReturnType<typeof mapSeverityToCardColor>]>([
    ["info", "lime"],
    ["warning", "orange"],
    ["critical", "red"],
  ])("maps severity %s to card color %s", (severity, expected) => {
    expect(mapSeverityToCardColor(severity)).toBe(expected);
  });

  it.each<[DashboardServiceStatus, ReturnType<typeof mapStatusToTrend>]>([
    ["online", "up"],
    ["degraded", "stable"],
    ["offline", "down"],
  ])("maps service status %s to trend %s", (status, expected) => {
    expect(mapStatusToTrend(status)).toBe(expected);
  });

  it.each<[DashboardSeverity, string]>([
    ["info", "text-lime-400"],
    ["warning", "text-orange-400"],
    ["critical", "text-red-400"],
  ])("maps severity %s to status text class %s", (severity, expected) => {
    expect(mapSeverityToStatusTextClass(severity)).toBe(expected);
  });
});
