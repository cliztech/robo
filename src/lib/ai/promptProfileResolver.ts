import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import type { PromptProfileResolver, ResolvedPromptProfile, TrackAnalysisInput } from '@/lib/ai/analysisService';

interface PromptVariablesConfig {
    custom_variables?: Record<string, unknown>;
    variable_settings?: {
        missing_variable_behavior?: string;
        override_precedence?: string;
    };
    version?: string;
}

interface NormalizedPromptProfileConfig {
    stationName: string;
    analysisTone: string;
    missingVariableBehavior: string;
    overridePrecedence: string;
    configVersion: string;
}

export interface PromptProfileResolverOptions {
    configPath?: string;
    loadConfig?: () => PromptVariablesConfig;
}

const DEFAULT_CONFIG_PATH = path.join(process.cwd(), 'config', 'prompt_variables.json');

const DEFAULT_PROFILE_CONFIG: NormalizedPromptProfileConfig = {
    stationName: 'DGN-DJ by DGNradio',
    analysisTone: 'radio_programming_technical',
    missingVariableBehavior: 'empty_string',
    overridePrecedence: 'custom_over_builtin',
    configVersion: '0.0',
};

function stableStringify(value: unknown): string {
    if (Array.isArray(value)) {
        return `[${value.map((item) => stableStringify(item)).join(',')}]`;
    }
    if (value && typeof value === 'object') {
        const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
        return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
    }
    return JSON.stringify(value);
}

function normalizeConfig(config: PromptVariablesConfig): NormalizedPromptProfileConfig {
    const customVariables = config.custom_variables ?? {};

    return {
        stationName:
            typeof customVariables.station_name === 'string' && customVariables.station_name.trim().length > 0
                ? customVariables.station_name.trim()
                : DEFAULT_PROFILE_CONFIG.stationName,
        analysisTone:
            typeof customVariables.analysis_tone === 'string' && customVariables.analysis_tone.trim().length > 0
                ? customVariables.analysis_tone.trim()
                : DEFAULT_PROFILE_CONFIG.analysisTone,
        missingVariableBehavior:
            typeof config.variable_settings?.missing_variable_behavior === 'string'
                ? config.variable_settings.missing_variable_behavior
                : DEFAULT_PROFILE_CONFIG.missingVariableBehavior,
        overridePrecedence:
            typeof config.variable_settings?.override_precedence === 'string'
                ? config.variable_settings.override_precedence
                : DEFAULT_PROFILE_CONFIG.overridePrecedence,
        configVersion:
            typeof config.version === 'string' && config.version.length > 0
                ? config.version
                : DEFAULT_PROFILE_CONFIG.configVersion,
    };
}

export function resolvePromptProfile(config: PromptVariablesConfig): ResolvedPromptProfile {
    const normalized = normalizeConfig(config);

    const promptTemplate = [
        'You are a radio music analyst.',
        `Station: ${normalized.stationName}.`,
        `Tone: ${normalized.analysisTone}.`,
        `MissingTokenPolicy: ${normalized.missingVariableBehavior}.`,
        `OverridePrecedence: ${normalized.overridePrecedence}.`,
        'Analyze track metadata fields: title, artist, genre, bpm, durationSeconds.',
        'Return concise normalized mood, energy, era, and genre confidence values.',
    ].join(' ');

    const versionInput = {
        promptTemplate,
        normalized,
    };

    const promptProfileVersion = createHash('sha256').update(stableStringify(versionInput)).digest('hex').slice(0, 16);

    return {
        promptTemplate,
        promptProfileVersion: `ppv-${promptProfileVersion}`,
    };
}

export function loadPromptVariablesConfig(configPath = DEFAULT_CONFIG_PATH): PromptVariablesConfig {
    const raw = readFileSync(configPath, 'utf-8');
    return JSON.parse(raw) as PromptVariablesConfig;
}

export function createPromptProfileResolver(options: PromptProfileResolverOptions = {}): PromptProfileResolver {
    const loadConfig = options.loadConfig ?? (() => loadPromptVariablesConfig(options.configPath));
    const config = loadConfig();

    return (_input: TrackAnalysisInput) => {
        return resolvePromptProfile(config);
    };
}
}
