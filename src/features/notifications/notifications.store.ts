import type { AlertCenter, AlertCenterItem, AlertSeverity } from "@/lib/status/dashboardClient";

export interface NotificationsState {
  alerts: AlertCenterItem[];
  selectedSeverities: AlertSeverity[];
}

export function createNotificationsState(alertCenter?: AlertCenter): NotificationsState {
  return {
    alerts: alertCenter?.items ?? [],
    selectedSeverities: alertCenter?.filters ?? [],
  };
}

export function setNotificationAlerts(
  state: NotificationsState,
  alerts: AlertCenterItem[]
): NotificationsState {
  return {
    ...state,
    alerts,
  };
}

export function toggleNotificationSeverity(
  state: NotificationsState,
  severity: AlertSeverity
): NotificationsState {
  const selected = state.selectedSeverities.includes(severity)
    ? state.selectedSeverities.filter((item) => item !== severity)
    : [...state.selectedSeverities, severity];

  return {
    ...state,
    selectedSeverities: selected,
  };
}

export function getFilteredNotificationAlerts(state: NotificationsState): AlertCenterItem[] {
  if (state.selectedSeverities.length === 0) {
    return state.alerts;
  }

  return state.alerts.filter((item) => state.selectedSeverities.includes(item.severity));
}

