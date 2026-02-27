'use client';

import { useMemo, useState, type ChangeEvent } from 'react';
import { Eye, Power, PowerOff, Trash2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    applySkinPreview,
    DEFAULT_SKIN,
    loadSkinManifestFromFile,
    type SkinManifest,
} from '@/lib/theme/skinLoader';

interface StoredSkin {
    manifest: SkinManifest;
    active: boolean;
}

export function SkinManagerPanel({ className }: { className?: string }) {
    const [skins, setSkins] = useState<StoredSkin[]>([{ manifest: DEFAULT_SKIN, active: true }]);
    const [status, setStatus] = useState<string>('Ready. Import a skin manifest to begin.');

    const activeSkinId = useMemo(() => skins.find((skin) => skin.active)?.manifest.id, [skins]);

    const onImportSkin = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        const result = await loadSkinManifestFromFile(file);
        if (!result.valid) {
            setStatus(`Import failed. Default skin kept. ${result.errors.join(' ')}`);
            return;
        }

        setSkins((current) => {
            const withoutDuplicate = current.filter((skin) => skin.manifest.id !== result.manifest.id);
            return [...withoutDuplicate, { manifest: result.manifest, active: false }];
        });
        setStatus(`Imported '${result.manifest.name}'.`);
    };

    const activateSkin = (skinId: string) => {
        setSkins((current) =>
            current.map((skin) => ({
                ...skin,
                active: skin.manifest.id === skinId,
            }))
        );
        const skin = skins.find((entry) => entry.manifest.id === skinId);
        if (skin) {
            applySkinPreview(skin.manifest);
            setStatus(`Activated '${skin.manifest.name}'.`);
        }
    };

    const deactivateSkin = (skinId: string) => {
        if (skinId === DEFAULT_SKIN.id) {
            return;
        }

        setSkins((current) =>
            current.map((skin) => ({
                ...skin,
                active: skin.manifest.id === DEFAULT_SKIN.id,
            }))
        );
        applySkinPreview(DEFAULT_SKIN);
        setStatus('Skin deactivated. Default skin restored.');
    };

    const deleteSkin = (skinId: string) => {
        if (skinId === DEFAULT_SKIN.id) {
            setStatus('Default skin cannot be deleted.');
            return;
        }

        setSkins((current) => current.filter((skin) => skin.manifest.id !== skinId));
        setStatus('Skin deleted.');
    };

    const previewSkin = (skin: SkinManifest) => {
        applySkinPreview(skin);
        setStatus(`Previewing '${skin.name}'.`);
    };

    return (
        <section className={cn('rounded-lg border border-white/10 bg-[#0b0f16] p-4 text-zinc-100', className)}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div>
                    <h2 className="text-sm font-semibold uppercase tracking-[0.12em]">Skin Manager</h2>
                    <p className="text-xs text-zinc-400">Import, preview, activate, deactivate, or remove skin packs.</p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20">
                    <Upload size={14} />
                    Import package
                    <input type="file" accept="application/json" className="sr-only" onChange={onImportSkin} />
                </label>
            </div>

            <div className="mt-3 space-y-2">
                {skins.map((skin) => (
                    <article
                        key={skin.manifest.id}
                        className="rounded-md border border-white/10 bg-black/20 p-3"
                    >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                                <h3 className="text-sm font-medium">{skin.manifest.name}</h3>
                                <p className="text-xs text-zinc-400">
                                    {skin.manifest.id} · v{skin.manifest.version} · {skin.manifest.author}
                                </p>
                            </div>
                            {skin.active && (
                                <span className="rounded-full border border-lime-400/40 bg-lime-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-lime-300">
                                    Active
                                </span>
                            )}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => previewSkin(skin.manifest)}
                                className="inline-flex items-center gap-1 rounded border border-white/15 px-2 py-1 text-xs hover:bg-white/10"
                            >
                                <Eye size={12} /> Preview
                            </button>
                            <button
                                type="button"
                                onClick={() => activateSkin(skin.manifest.id)}
                                disabled={skin.active}
                                className="inline-flex items-center gap-1 rounded border border-cyan-400/35 px-2 py-1 text-xs text-cyan-200 disabled:opacity-40"
                            >
                                <Power size={12} /> Activate
                            </button>
                            <button
                                type="button"
                                onClick={() => deactivateSkin(skin.manifest.id)}
                                disabled={!skin.active || skin.manifest.id === DEFAULT_SKIN.id}
                                className="inline-flex items-center gap-1 rounded border border-amber-400/35 px-2 py-1 text-xs text-amber-200 disabled:opacity-40"
                            >
                                <PowerOff size={12} /> Deactivate
                            </button>
                            <button
                                type="button"
                                onClick={() => deleteSkin(skin.manifest.id)}
                                disabled={skin.manifest.id === DEFAULT_SKIN.id || skin.manifest.id === activeSkinId}
                                className="inline-flex items-center gap-1 rounded border border-red-400/35 px-2 py-1 text-xs text-red-200 disabled:opacity-40"
                            >
                                <Trash2 size={12} /> Delete
                            </button>
                        </div>
                    </article>
                ))}
            </div>

            <p className="mt-3 rounded border border-white/10 bg-black/20 p-2 text-xs text-zinc-300">{status}</p>
        </section>
    );
}
