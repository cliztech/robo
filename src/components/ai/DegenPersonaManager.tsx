'use client';

import React, { useState } from 'react';
import { Check, Mic2, RefreshCw, Save, Sliders, Sparkles, User } from 'lucide-react';

import { cn } from '../../lib/utils';
import { analyzeTrack } from '@/lib/aiApi';
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
];

export function DegenPersonaManager({ className }: { className?: string }) {
  const [personas, setPersonas] = useState<Persona[]>(DEFAULT_PERSONAS);
  const [selectedId, setSelectedId] = useState(DEFAULT_PERSONAS[0].id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCorrelationId, setLastCorrelationId] = useState<string | null>(null);

  const selectedPersona = personas.find((p) => p.id === selectedId) ?? personas[0];

  const handleUpdate = (updates: Partial<Persona>) => {
    setPersonas((prev) => prev.map((p) => (p.id === selectedId ? { ...p, ...updates } : p)));
  };

  const handleTraitChange = (trait: keyof Persona['traits'], value: number) => {
    handleUpdate({
      traits: {
        ...selectedPersona.traits,
        [trait]: value,
      },
    });
  };

  const handleActivate = (id: string) => {
    setPersonas((prev) => prev.map((p) => ({ ...p, isActive: p.id === id })));
  };

  const savePersona = async () => {
    setSaving(true);
    setError(null);
    try {
      const { response, correlationId } = await analyzeTrack({
        title: selectedPersona.name,
        artist: 'DGN Persona Engine',
        genre: 'station',
        bpm: Math.max(50, Math.min(220, selectedPersona.traits.energy + 80)),
        duration_seconds: 180,
        notes: selectedPersona.systemPrompt,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error ?? 'Unable to validate persona');
      }

      setLastCorrelationId(correlationId);
      handleUpdate({
        description: `${selectedPersona.description} | mood=${response.data.mood} energy=${response.data.energy_score}`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown API error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cn('glass-panel overflow-hidden flex h-full', className)}>
      <div className="w-48 border-r border-white/[0.04] flex flex-col bg-black/20">
        <div className="p-3 border-b border-white/[0.04] flex items-center gap-2">
          <User size={12} className="text-purple-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Personas</span>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5 space-y-1">
          {personas.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={cn(
                'w-full p-2 text-left rounded border transition-all',
                selectedId === p.id ? 'bg-purple-500/10 border-purple-500/30' : 'border-transparent hover:bg-white/[0.02]'
              )}
            >
              <div className="text-[10px] font-bold text-zinc-300">{p.name}</div>
              <div className="text-[8px] text-zinc-600 truncate">{p.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-14 px-4 border-b border-white/[0.04] flex items-center justify-between bg-white/[0.01]">
          <div>
            <div className="text-[11px] font-bold text-zinc-100">{selectedPersona.name}</div>
            <div className="text-[8px] text-zinc-500">{selectedPersona.voiceId}</div>
          </div>
          <button
            onClick={() => handleActivate(selectedPersona.id)}
            className="px-3 py-1 rounded text-[9px] font-bold border border-lime-500/30 text-lime-300"
          >
            <Check size={10} className="inline mr-1" />
            {selectedPersona.isActive ? 'LIVE ON AIR' : 'ACTIVATE'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
          <section>
            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-2 flex items-center gap-2">
              <Mic2 size={10} /> Description
            </h3>
            <textarea
              value={selectedPersona.description}
              onChange={(e) => handleUpdate({ description: e.target.value })}
              className="w-full bg-black/30 border border-white/[0.05] rounded-lg p-3 text-[11px] text-zinc-300"
            />
          </section>

          <section>
            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-2 flex items-center gap-2">
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

          <section>
            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-2 flex items-center gap-2">
              <Sparkles size={10} /> System Prompt
            </h3>
            <textarea
              value={selectedPersona.systemPrompt}
              onChange={(e) => handleUpdate({ systemPrompt: e.target.value })}
              className="w-full min-h-[120px] bg-black/30 border border-white/[0.05] rounded-lg p-3 text-[11px] font-mono text-zinc-300"
            />
          </section>

          {error && (
            <div className="text-[10px] rounded border border-red-500/30 text-red-300 bg-red-500/10 px-2 py-1">
              {error}
              <button className="ml-2 underline" onClick={savePersona} disabled={saving}>
                Retry
              </button>
            </div>
          )}

          <div className="flex justify-end gap-3 items-center">
            {lastCorrelationId && <span className="text-[9px] text-zinc-500">corr={lastCorrelationId}</span>}
            <button
              onClick={savePersona}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-[10px] font-bold uppercase rounded hover:bg-purple-500 transition-colors disabled:opacity-50"
            >
              {saving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />} Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
