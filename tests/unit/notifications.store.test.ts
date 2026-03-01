import { describe, it, expect } from 'vitest';
import {
  toggleNotificationSeverity,
  type NotificationsState,
} from '@/features/notifications/notifications.store';

describe('Notifications Store - toggleNotificationSeverity', () => {
  it('adds a severity when it is not present in selectedSeverities', () => {
    const initialState: NotificationsState = {
      alerts: [],
      selectedSeverities: ['info'],
    };

    const newState = toggleNotificationSeverity(initialState, 'warning');

    expect(newState.selectedSeverities).toEqual(['info', 'warning']);
  });

  it('removes a severity when it is already present in selectedSeverities', () => {
    const initialState: NotificationsState = {
      alerts: [],
      selectedSeverities: ['info', 'warning'],
    };

    const newState = toggleNotificationSeverity(initialState, 'warning');

    expect(newState.selectedSeverities).toEqual(['info']);
  });

  it('maintains state immutability', () => {
    const initialState: NotificationsState = {
      alerts: [],
      selectedSeverities: [],
    };

    const newState = toggleNotificationSeverity(initialState, 'critical');

    // The original state should not be mutated
    expect(initialState.selectedSeverities).toHaveLength(0);
    // The new state should be a new object
    expect(newState).not.toBe(initialState);
  });

  it('preserves other state properties', () => {
    const mockAlerts = [
      {
        alert_id: 'test-1',
        severity: 'info' as const,
        title: 'Test',
        description: 'Test alert',
        created_at: new Date().toISOString(),
        acknowledged: false,
        acknowledged_at: null,
      },
    ];

    const initialState: NotificationsState = {
      alerts: mockAlerts,
      selectedSeverities: [],
    };

    const newState = toggleNotificationSeverity(initialState, 'info');

    expect(newState.alerts).toBe(initialState.alerts); // Should retain exactly the same reference
    expect(newState.alerts).toEqual(mockAlerts);
  });
});
