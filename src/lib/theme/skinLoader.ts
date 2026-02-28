export const REQUIRED_SKIN_TOKENS = [
    'color_bg',
    'color_surface',
    'color_text',
    'color_accent',
    'color_deck_a',
    'color_deck_b',
    'radius_md',
    'shadow_soft',
] as const;

export const MAX_SKIN_MANIFEST_SIZE_BYTES = 256 * 1024;
export const MAX_SKIN_ASSET_SIZE_BYTES = 5 * 1024 * 1024;
const ASSET_PATH_PATTERN = /^(skins|assets)\/[A-Za-z0-9._/-]+\.(woff2?|ttf|otf|png|jpe?g|webp|svg)$/;

type RequiredToken = (typeof REQUIRED_SKIN_TOKENS)[number];

export interface SkinCompatibilityRange {
    min_app_version: string;
    max_app_version: string;
}

export interface SkinAssetPaths {
    fonts?: string[];
    background_textures?: string[];
    icons?: string[];
}

export interface SkinManifest {
    id: string;
    name: string;
    version: string;
    author: string;
    description?: string;
    compatibility: SkinCompatibilityRange;
    tokens: Record<RequiredToken, string> & Record<string, string>;
    assets?: SkinAssetPaths;
}

export interface SkinValidationResult {
    valid: boolean;
    errors: string[];
    missingTokens: RequiredToken[];
    manifest: SkinManifest;
    fallbackApplied: boolean;
}

export const DEFAULT_SKIN: SkinManifest = {
    id: 'dgn.default.dark',
    name: 'DGN Default Dark',
    version: '1.0.0',
    author: 'DGNradio',
    compatibility: {
        min_app_version: '1.0.0',
        max_app_version: '2.0.0',
    },
    tokens: {
        color_bg: '240 10% 2%',
        color_surface: '240 6% 7%',
        color_text: '210 20% 98%',
        color_accent: '207 98% 45%',
        color_deck_a: '207 98% 45%',
        color_deck_b: '207 81% 79%',
        radius_md: '8px',
        shadow_soft: '0 2px 8px hsl(0 0 0% / 0.2)',
    },
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseCoreSemver(value: string): [number, number, number] | null {
    const match = value.match(/^(\d+)\.(\d+)\.(\d+)/);
    if (!match) {
        return null;
    }

    return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function isCompatibilityRangeValid(range: SkinCompatibilityRange): boolean {
    const min = parseCoreSemver(range.min_app_version);
    const max = parseCoreSemver(range.max_app_version);
    if (!min || !max) {
        return false;
    }

    for (let index = 0; index < 3; index += 1) {
        if (min[index] < max[index]) {
            return true;
        }
        if (min[index] > max[index]) {
            return false;
        }
    }

    return true;
}

function hasForbiddenScriptFields(manifest: Record<string, unknown>): boolean {
    return 'script' in manifest || 'scripts' in manifest;
}

function validateAssetPaths(assets: unknown, errors: string[]): SkinAssetPaths | undefined {
    if (assets === undefined) {
        return undefined;
    }

    if (!isRecord(assets)) {
        errors.push('assets must be an object when provided.');
        return undefined;
    }

    const parsed: SkinAssetPaths = {};

    const parseAssetList = (field: keyof SkinAssetPaths, maxItems: number): void => {
        const value = assets[field];
        if (value === undefined) {
            return;
        }

        if (!Array.isArray(value)) {
            errors.push(`assets.${field} must be an array of paths.`);
            return;
        }

        if (value.length > maxItems) {
            errors.push(`assets.${field} exceeds max item count (${maxItems}).`);
            return;
        }

        const validated = value.filter((path) => {
            if (typeof path !== 'string') {
                errors.push(`assets.${field} entries must be strings.`);
                return false;
            }

            if (!ASSET_PATH_PATTERN.test(path) || path.includes('..') || path.includes('://')) {
                errors.push(`assets.${field} contains unsupported path '${path}'.`);
                return false;
            }

            return true;
        });

        parsed[field] = validated as string[];
    };

    parseAssetList('fonts', 4);
    parseAssetList('background_textures', 8);
    parseAssetList('icons', 32);

    return parsed;
}

function normalizeManifest(candidate: unknown, errors: string[]): SkinManifest {
    if (!isRecord(candidate)) {
        errors.push('Manifest must be a JSON object.');
        return DEFAULT_SKIN;
    }

    if (hasForbiddenScriptFields(candidate)) {
        errors.push('Manifest cannot define script/script fields.');
    }

    const tokensInput = candidate.tokens;
    if (!isRecord(tokensInput)) {
        errors.push('tokens must be an object.');
    }

    const tokens = Object.fromEntries(
        Object.entries(isRecord(tokensInput) ? tokensInput : {}).filter(([, value]) => typeof value === 'string')
    ) as SkinManifest['tokens'];

    const manifest: SkinManifest = {
        id: typeof candidate.id === 'string' ? candidate.id : DEFAULT_SKIN.id,
        name: typeof candidate.name === 'string' ? candidate.name : DEFAULT_SKIN.name,
        version: typeof candidate.version === 'string' ? candidate.version : DEFAULT_SKIN.version,
        author: typeof candidate.author === 'string' ? candidate.author : DEFAULT_SKIN.author,
        description: typeof candidate.description === 'string' ? candidate.description : undefined,
        compatibility: isRecord(candidate.compatibility)
            ? {
                  min_app_version:
                      typeof candidate.compatibility.min_app_version === 'string'
                          ? candidate.compatibility.min_app_version
                          : DEFAULT_SKIN.compatibility.min_app_version,
                  max_app_version:
                      typeof candidate.compatibility.max_app_version === 'string'
                          ? candidate.compatibility.max_app_version
                          : DEFAULT_SKIN.compatibility.max_app_version,
              }
            : DEFAULT_SKIN.compatibility,
        tokens,
        assets: validateAssetPaths(candidate.assets, errors),
    };

    if (!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(manifest.id)) {
        errors.push('id must match ^[a-z0-9][a-z0-9._-]{2,63}$.');
    }

    if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(manifest.version)) {
        errors.push('version must be semver.');
    }

    if (!isCompatibilityRangeValid(manifest.compatibility)) {
        errors.push('compatibility range must be semver and min_app_version <= max_app_version.');
    }

    if (!manifest.name.trim() || !manifest.author.trim()) {
        errors.push('name and author are required non-empty strings.');
    }

    return manifest;
}

export function detectMissingTokens(tokens: Record<string, string>): RequiredToken[] {
    return REQUIRED_SKIN_TOKENS.filter((token) => !tokens[token]);
}

export function validateSkinManifest(candidate: unknown): SkinValidationResult {
    const errors: string[] = [];
    const manifest = normalizeManifest(candidate, errors);
    const missingTokens = detectMissingTokens(manifest.tokens);

    if (missingTokens.length > 0) {
        errors.push(`Missing required token mappings: ${missingTokens.join(', ')}.`);
    }

    const valid = errors.length === 0;

    return {
        valid,
        errors,
        missingTokens,
        manifest: valid ? manifest : DEFAULT_SKIN,
        fallbackApplied: !valid,
    };
}

export async function loadSkinManifestFromFile(file: File): Promise<SkinValidationResult> {
    if (file.size > MAX_SKIN_MANIFEST_SIZE_BYTES) {
        return {
            valid: false,
            errors: [`Manifest exceeds max size (${MAX_SKIN_MANIFEST_SIZE_BYTES} bytes).`],
            missingTokens: [],
            manifest: DEFAULT_SKIN,
            fallbackApplied: true,
        };
    }

    const raw = await file.text();

    try {
        const candidate = JSON.parse(raw) as unknown;
        return validateSkinManifest(candidate);
    } catch {
        return {
            valid: false,
            errors: ['Manifest is not valid JSON.'],
            missingTokens: [],
            manifest: DEFAULT_SKIN,
            fallbackApplied: true,
        };
    }
}

export function isAssetSizeAllowed(sizeBytes: number): boolean {
    return sizeBytes <= MAX_SKIN_ASSET_SIZE_BYTES;
}

export function applySkinPreview(manifest: SkinManifest): void {
    if (typeof document === 'undefined') {
        return;
    }

    const root = document.documentElement;
    root.style.setProperty('--color-bg', manifest.tokens.color_bg);
    root.style.setProperty('--color-surface', manifest.tokens.color_surface);
    root.style.setProperty('--color-text', manifest.tokens.color_text);
    root.style.setProperty('--color-accent', manifest.tokens.color_accent);
    root.style.setProperty('--color-deck-a', manifest.tokens.color_deck_a);
    root.style.setProperty('--color-deck-b', manifest.tokens.color_deck_b);
    root.style.setProperty('--radius-md', manifest.tokens.radius_md);
    root.style.setProperty('--shadow-soft', manifest.tokens.shadow_soft);
}
