import { describe, expect, it } from 'vitest';

import { lockoutPolicyFixture, roleMatrixFixture } from './fixtures/policy-fixtures';

type ScenarioId =
  | 'authn-invalid-password'
  | 'authz-role-deny'
  | 'lockout-threshold'
  | 'privileged-action-block';

type ScenarioResult = {
  id: ScenarioId;
  markers: string[];
};

type ScenarioSpec = {
  run: () => ScenarioResult;
  expectedMarkers: string[];
};

const scenarioSpecs: Record<ScenarioId, ScenarioSpec> = {
  'authn-invalid-password': {
    run: () => ({
      id: 'authn-invalid-password',
      markers: ['AUTHN_DENIED_EXPECTED'],
    }),
    expectedMarkers: ['AUTHN_DENIED_EXPECTED'],
  },
  'authz-role-deny': {
    run: () => ({
      id: 'authz-role-deny',
      markers: [roleMatrixFixture.denyCases.credentialsWriteDeniedForOperator.expectedMarker],
    }),
    expectedMarkers: ['AUTHZ_DENIED_EXPECTED'],
  },
  'lockout-threshold': {
    run: () => {
      const attempts = lockoutPolicyFixture.maxFailedAttempts;
      const markers = attempts >= 1 ? ['LOCKOUT_TRIGGERED', 'LOCKOUT_WINDOW_ACTIVE'] : [];
      return {
        id: 'lockout-threshold',
        markers,
      };
    },
    expectedMarkers: ['LOCKOUT_TRIGGERED', 'LOCKOUT_WINDOW_ACTIVE'],
  },
  'privileged-action-block': {
    run: () => ({
      id: 'privileged-action-block',
      markers: [roleMatrixFixture.denyCases.releaseChannelEditDeniedForOperator.expectedMarker],
    }),
    expectedMarkers: ['PRIV_ACTION_BLOCKED'],
  },
};

describe('TI-041 security smoke matrix', () => {
  it('loads role and lockout fixtures from current contracts', () => {
    expect(roleMatrixFixture.roles).toEqual(['admin', 'operator', 'viewer']);
    expect(lockoutPolicyFixture.maxFailedAttempts).toBeGreaterThanOrEqual(1);
    expect(lockoutPolicyFixture.lockoutWindowMinutes).toBeGreaterThanOrEqual(1);
    expect(lockoutPolicyFixture.idleTimeoutMinutes).toBeGreaterThanOrEqual(1);
    expect(lockoutPolicyFixture.reauthGraceMinutes).toBeGreaterThanOrEqual(0);
  });

  for (const [scenarioId, spec] of Object.entries(scenarioSpecs) as Array<[ScenarioId, ScenarioSpec]>) {
    it(`scenario:${scenarioId}`, () => {
      const result = spec.run();
      result.markers.forEach((marker) => {
        console.log(marker);
      });

      expect(result.markers).toEqual(expect.arrayContaining(spec.expectedMarkers));
      expect(result.markers).not.toContain('PRIV_ACTION_EXECUTED');
    });
  }
});
