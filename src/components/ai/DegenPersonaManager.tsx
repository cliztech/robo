'use client';

import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { User, Mic2, Sparkles, Sliders, Check, Volume2, Save, Trash2, Plus } from 'lucide-react';
import { DegenKnob } from '../audio/DegenKnob';

export interface Persona {
    id: string;
    name: string;
    voiceId: string;
    description: string;
    traits: {
        humor: number;
        energy: number;
        empathy: number;
        chaos: number;
    };
    systemPrompt: string;
    isActive: boolean;
}

const DEFAULT_PERSONAS: Persona[] = [
    {
        id: '1',
        name: 'DGN Host',
        voiceId: 'voice_7_bass',
        description: 'Standard station voice. Deep, rhythmic, authoritative but chill.',
        traits: { humor: 30, energy: 60, empathy: 40, chaos: 10 },
        systemPrompt: 'You are the main host of DGN Radio. Keep it brief, cool, and focused on the music.',
        isActive: true,
    },
    {
        id: '2',
        name: 'Neon Glitch',
        voiceId: 'voice_12_synth',
        description: 'High energy, fast talking, uses internet slang and glitch references.',
        traits: { humor: 80, energy: 95, empathy: 20, chaos: 90 },
        systemPrompt: 'You are a hyperactive AI living in the wires. Speak fast, use slang, be unpredictable.',
        isActive: false,
    },
    {
        id: '3',
        name: 'Late Night lo-fi',
        voiceId: 'voice_3_whisper',
        description: 'Soft spoken, philosophical, perfect for 3AM sessions.',
        traits: { humor: 40, energy: 10, empathy: 90, chaos: 5 },
        systemPrompt: 'You are a comforting presence in the night. Speak slowly, be thoughtful and introspective.',
        isActive: false,
    },
];

const VOICES = [
    { id: 'voice_7_bass', name: 'Bass Resonance (Male)', tags: ['Deep', 'Smooth'] },
    { id: 'voice_12_synth', name: 'Synth Glitch (Robot)', tags: ['Processed', 'Fast'] },
    { id: 'voice_3_whisper', name: 'Midnight Whisper (Female)', tags: ['Soft', 'Clear'] },
    { id: 'voice_9_news', name: 'News Anchor (Neutral)', tags: ['Professional', 'Crisp'] },
];

export function DegenPersonaManager({ className }: { className?: string }) {
    const [personas, setPersonas] = useState<Persona[]>(DEFAULT_PERSONAS);
    const [selectedId, setSelectedId] = useState<string>(DEFAULT_PERSONAS[0].id);
    const [isEditing, setIsEditing] = useState(false);

    const selectedPersona = personas.find(p => p.id === selectedId) || personas[0];

    const handleUpdate = (updates: Partial<Persona>) => {
        setPersonas(prev => prev.map(p =>
            p.id === selectedId ? { ...p, ...updates } : p
        ));
    };

    const handleTraitChange = (trait: keyof Persona['traits'], value: number) => {
        handleUpdate({
            traits: {
                ...selectedPersona.traits,
                [trait]: value
            }
        });
    };

    const handleActivate = (id: string) => {
        setPersonas(prev => prev.map(p => ({
            ...p,
            isActive: p.id === id
        })));
    };

    return (
        <div className={cn('glass-panel overflow-hidden flex h-full', className)}>
            {/* Sidebar list */}
            <div className="w-48 border-r border-white/[0.04] flex flex-col bg-black/20">
                <div className="p-3 border-b border-white/[0.04]">
                    <div className="flex items-center gap-2 mb-2">
                        <User size={12} className="text-purple-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Personas</span>
                    </div>
                    <button className="w-full py-1.5 flex items-center justify-center gap-1 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] rounded text-[9px] font-bold text-zinc-300 transition-colors">
                        <Plus size={10} /> NEW PERSONA
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5 space-y-1">
                    {personas.map(p => (
                        <div
                            key={p.id}
                            onClick={() => setSelectedId(p.id)}
                            className={cn(
                                'p-2 rounded cursor-pointer border transition-all relative group',
                                selectedId === p.id
                                    ? 'bg-purple-500/10 border-purple-500/30'
                                    : 'bg-transparent border-transparent hover:bg-white/[0.02]',
                                p.isActive && 'border-l-2 border-l-lime-500' // Active indicator strip
                            )}
                        >
                            <div className="flex justify-between items-start mb-0.5">
                                <span className={cn(
                                    "text-[10px] font-bold truncate",
                                    selectedId === p.id ? "text-purple-200" : "text-zinc-400"
                                )}>
                                    {p.name}
                                </span>
                                {p.isActive && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-lime-500 shadow-[0_0_6px_rgba(170,255,0,0.6)]" />
                                )}
                            </div>
                            <div className="text-[8px] text-zinc-600 truncate">{p.description}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Editor Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-transparent to-purple-900/5">
                {/* Check if no selection handling omitted for brevity as usually one is selected */}

                {/* Header */}
                <div className="h-12 border-b border-white/[0.04] flex items-center justify-between px-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center border border-white/[0.05]">
                            <Mic2 size={14} className="text-purple-300" />
                        </div>
                        <div>
                            <input
                                type="text"
                                value={selectedPersona.name}
                                onChange={(e) => handleUpdate({ name: e.target.value })}
                                className="bg-transparent text-[12px] font-black uppercase tracking-wider text-white focus:outline-none border-b border-transparent focus:border-purple-500/50 transition-colors placeholder-zinc-700 w-40"
                            />
                            <div className="text-[9px] text-zinc-500 font-mono mt-0.5">{selectedPersona.id.toUpperCase()}</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleActivate(selectedPersona.id)}
                            disabled={selectedPersona.isActive}
                            className={cn(
                                "px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all border",
                                selectedPersona.isActive
                                    ? "bg-lime-500/10 border-lime-500/20 text-lime-400 cursor-default"
                                    : "bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-white hover:border-white/[0.1]"
                            )}
                        >
                            {selectedPersona.isActive ? <Check size={10} /> : null}
                            {selectedPersona.isActive ? "ACTIVE ON AIR" : "ACTIVATE"}
                        </button>
                        <button className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors">
                            <Trash2 size={12} />
                        </button>
                    </div>
                </div>

                {/* Content Scroll */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">

                    {/* Voice Selection */}
                    <section>
                        <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-3 flex items-center gap-2">
                            <Volume2 size={10} /> Voice Model
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {VOICES.map(voice => (
                                <div
                                    key={voice.id}
                                    onClick={() => handleUpdate({ voiceId: voice.id })}
                                    className={cn(
                                        "p-3 rounded border cursor-pointer transition-all relative overflow-hidden group",
                                        selectedPersona.voiceId === voice.id
                                            ? "bg-purple-500/10 border-purple-500/40"
                                            : "bg-white/[0.01] border-white/[0.04] hover:border-white/[0.1]"
                                    )}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={cn(
                                            "text-[10px] font-bold",
                                            selectedPersona.voiceId === voice.id ? "text-purple-300" : "text-zinc-300"
                                        )}>{voice.name}</span>
                                        {selectedPersona.voiceId === voice.id && <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]" />}
                                    </div>
                                    <div className="flex gap-1">
                                        {voice.tags.map(tag => (
                                            <span key={tag} className="text-[8px] px-1.5 py-0.5 rounded bg-white/[0.03] text-zinc-500 border border-white/[0.02]">{tag}</span>
                                        ))}
                                    </div>
                                    <button className="absolute right-2 bottom-2 p-1.5 rounded-full bg-white/10 text-white opacity-0 group-hover:opacity-100 hover:bg-purple-500 hover:scale-110 transition-all">
                                        <Plus size={10} className="rotate-45" /> {/* Use Play icon properly later, spoof with Plus for now or import Play */}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Personality Traits */}
                    <section>
                        <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-4 flex items-center gap-2">
                            <Sliders size={10} /> Personality Matrix
                        </h3>
                        <div className="grid grid-cols-4 gap-4 bg-black/20 p-4 rounded-xl border border-white/[0.03]">
                            {(Object.entries(selectedPersona.traits) as [keyof Persona['traits'], number][]).map(([trait, value]) => (
                                <div key={trait} className="flex flex-col items-center gap-2">
                                    <span className="text-[8px] font-bold uppercase text-zinc-500 tracking-wider">{trait}</span>
                                    <DegenKnob
                                        label=""
                                        value={value}
                                        onChange={(v) => handleTraitChange(trait, v)}
                                        min={0}
                                        max={100}
                                        size={40}
                                        color={trait === 'chaos' ? '#ef4444' : '#a855f7'}
                                    />
                                    <span className="text-[10px] font-mono text-zinc-400">{Math.round(value)}%</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* System Prompt */}
                    <section className="flex-1 flex flex-col min-h-[120px]">
                        <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-2 flex items-center gap-2">
                            <Sparkles size={10} /> System Prompt
                        </h3>
                        <textarea
                            value={selectedPersona.systemPrompt}
                            onChange={(e) => handleUpdate({ systemPrompt: e.target.value })}
                            className="flex-1 w-full bg-black/30 border border-white/[0.05] rounded-lg p-3 text-[11px] font-mono text-zinc-300 leading-relaxed focus:outline-none focus:border-purple-500/30 transition-colors resize-none mb-4"
                            spellCheck={false}
                        />
                        <div className="flex justify-end">
                            <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-[10px] font-bold uppercase rounded hover:bg-purple-500 transition-colors shadow-lg shadow-purple-900/20">
                                <Save size={12} /> Save Changes
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
