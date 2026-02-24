'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Mic, Pause, Play, Radio, RotateCcw, SkipBack, SkipForward, Sparkles, Volume2 } from 'lucide-react';

type DeckId = 'A' | 'B' | 'C' | 'D';
type ProfileId = 'starter' | 'essentials' | 'pro4' | 'vertical' | 'broadcast';

type WaveMode = 'h' | 'v';

type Track = { id: string; t: string; a: string; b: number; k: string; u: string };
type Deck = {
  id: DeckId; label: string; i: number; t: string; a: string; b: number; k: string; u: string;
  p: boolean; v: number; r: number;
};
type Meter = { c: number; d: number };
type Profile = { id: ProfileId; n: string; d: string; decks: DeckId[]; wm: WaveMode; s: boolean; f: boolean; b: boolean };
type Pad = { id: string; l: string; u: string; cls: string };
type Persist = {
  profileId?: ProfileId; crossfader?: number; cursor?: number; onAir?: boolean; autoMix?: boolean;
  rec?: boolean; uhd?: boolean; decks?: Partial<Record<DeckId, Partial<Deck>>>;
};

const STORAGE = 'dgn_console_v2';
const IDS: DeckId[] = ['A', 'B', 'C', 'D'];
const TRACKS: Track[] = [
  { id: 't1', t: 'Neon Transit', a: 'DGN Lab', b: 126, k: '8A', u: 'https://cdn.pixabay.com/download/audio/2022/02/16/audio_d1718ab41b.mp3?filename=lofi-study-112191.mp3' },
  { id: 't2', t: 'Afterhours Carrier', a: 'DGN Ops', b: 128, k: '10A', u: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=future-bass-logo-116997.mp3' },
  { id: 't3', t: 'Gridline Surge', a: 'DGN Motion', b: 124, k: '9A', u: 'https://cdn.pixabay.com/download/audio/2022/07/31/audio_8e4f9d3a68.mp3?filename=deep-house-fashion-show-ambient-130155.mp3' },
  { id: 't4', t: 'Pulse Control', a: 'DGN Night', b: 130, k: '11A', u: 'https://cdn.pixabay.com/download/audio/2023/03/09/audio_a5ac5fe3f3.mp3?filename=technology-house-139458.mp3' },
];
const PADS: Pad[] = [
  { id: 'p1', l: 'Stinger', u: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_f7416df17c.mp3?filename=notification-1-126505.mp3', cls: 'bg-fuchsia-600/30 border-fuchsia-500/40 text-fuchsia-200' },
  { id: 'p2', l: 'Sweep', u: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_4e93850f23.mp3?filename=whoosh-transition-118607.mp3', cls: 'bg-cyan-600/30 border-cyan-500/40 text-cyan-200' },
];
const PROFILES: Profile[] = [
  { id: 'starter', n: 'DGN Starter', d: '2 deck basic shell', decks: ['A', 'B'], wm: 'h', s: false, f: false, b: true },
  { id: 'essentials', n: 'DGN Essentials', d: '2 deck + pads + fx', decks: ['A', 'B'], wm: 'h', s: true, f: true, b: true },
  { id: 'pro4', n: 'DGN Pro 4', d: '4 deck pro layout', decks: ['A', 'B', 'C', 'D'], wm: 'h', s: true, f: true, b: true },
  { id: 'vertical', n: 'DGN Vertical', d: '4 deck vertical wave', decks: ['A', 'B', 'C', 'D'], wm: 'v', s: true, f: true, b: false },
  { id: 'broadcast', n: 'DGN Broadcast', d: 'radio operations rail', decks: ['A', 'B'], wm: 'h', s: true, f: true, b: true },
];
const KEYMAP = [
  'Space master play/pause', 'Q/W cue/play A', 'O/P cue/play B', 'A/S cue/play C', 'K/L cue/play D',
  'Arrow Left/Right crossfader', '1/2/3/4 load next', 'M automix', 'V cycle version', 'R record'
];

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const fmt = (s: number) => `${Math.floor(Math.max(0, s) / 60)}:${Math.floor(Math.max(0, s) % 60).toString().padStart(2, '0')}`;
const mkDeck = (id: DeckId, i: number): Deck => {
  const tr = TRACKS[((i % TRACKS.length) + TRACKS.length) % TRACKS.length];
  return { id, label: `Deck ${id}`, i, t: tr.t, a: tr.a, b: tr.b, k: tr.k, u: tr.u, p: false, v: 0.8, r: 1 };
};

export default function StudioPage() {
  const refs = useRef<Record<DeckId, HTMLAudioElement | null>>({ A: null, B: null, C: null, D: null });
  const dirRef = useRef<1 | -1>(1);

  const [profileId, setProfileId] = useState<ProfileId>('starter');
  const [decks, setDecks] = useState<Record<DeckId, Deck>>({ A: mkDeck('A', 0), B: mkDeck('B', 1), C: mkDeck('C', 2), D: mkDeck('D', 3) });
  const [meters, setMeters] = useState<Record<DeckId, Meter>>({ A: { c: 0, d: 0 }, B: { c: 0, d: 0 }, C: { c: 0, d: 0 }, D: { c: 0, d: 0 } });
  const [cursor, setCursor] = useState(3);
  const [xf, setXf] = useState(0.5);
  const [autoMix, setAutoMix] = useState(false);
  const [onAir, setOnAir] = useState(false);
  const [rec, setRec] = useState(false);
  const [uhd, setUhd] = useState(true);
  const [padVol, setPadVol] = useState(0.6);
  const [padHot, setPadHot] = useState<string | null>(null);
  const [targetDeck, setTargetDeck] = useState<DeckId>('A');
  const [hydrated, setHydrated] = useState(false);

  const profile = useMemo(() => PROFILES.find((p) => p.id === profileId) ?? PROFILES[0], [profileId]);
  const vols = useMemo(() => ({ A: decks.A.v * (1 - xf), B: decks.B.v * xf, C: decks.C.v, D: decks.D.v }), [decks, xf]);

  useEffect(() => {
    IDS.forEach((id) => {
      const n = refs.current[id];
      if (!n) return;
      n.volume = clamp(vols[id], 0, 1);
      n.playbackRate = clamp(decks[id].r, 0.8, 1.25);
    });
  }, [decks, vols]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE);
      if (!raw) {
        setHydrated(true);
        return;
      }
      const p = JSON.parse(raw) as Persist;
      if (p.profileId && PROFILES.some((x) => x.id === p.profileId)) setProfileId(p.profileId);
      if (typeof p.crossfader === 'number') setXf(clamp(p.crossfader, 0, 1));
      if (typeof p.cursor === 'number') setCursor(Math.max(0, p.cursor));
      if (typeof p.autoMix === 'boolean') setAutoMix(p.autoMix);
      if (typeof p.onAir === 'boolean') setOnAir(p.onAir);
      if (typeof p.rec === 'boolean') setRec(p.rec);
      if (typeof p.uhd === 'boolean') setUhd(p.uhd);
      if (p.decks) {
        setDecks((prev) => ({ A: { ...prev.A, ...p.decks?.A }, B: { ...prev.B, ...p.decks?.B }, C: { ...prev.C, ...p.decks?.C }, D: { ...prev.D, ...p.decks?.D } }));
      }
    } catch {
      // ignore
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const payload: Persist = {
      profileId,
      crossfader: xf,
      cursor,
      autoMix,
      onAir,
      rec,
      uhd,
      decks: {
        A: { i: decks.A.i, t: decks.A.t, a: decks.A.a, b: decks.A.b, k: decks.A.k, u: decks.A.u, v: decks.A.v, r: decks.A.r },
        B: { i: decks.B.i, t: decks.B.t, a: decks.B.a, b: decks.B.b, k: decks.B.k, u: decks.B.u, v: decks.B.v, r: decks.B.r },
        C: { i: decks.C.i, t: decks.C.t, a: decks.C.a, b: decks.C.b, k: decks.C.k, u: decks.C.u, v: decks.C.v, r: decks.C.r },
        D: { i: decks.D.i, t: decks.D.t, a: decks.D.a, b: decks.D.b, k: decks.D.k, u: decks.D.u, v: decks.D.v, r: decks.D.r },
      },
    };
    window.localStorage.setItem(STORAGE, JSON.stringify(payload));
  }, [profileId, xf, cursor, autoMix, onAir, rec, uhd, decks, hydrated]);

  const setDeck = useCallback((id: DeckId, partial: Partial<Deck>) => {
    setDecks((p) => ({ ...p, [id]: { ...p[id], ...partial } }));
  }, []);

  const syncPlay = useCallback((id: DeckId, p: boolean) => {
    setDecks((s) => ({ ...s, [id]: { ...s[id], p } }));
  }, []);

  const setRef = useCallback((id: DeckId, n: HTMLAudioElement | null) => { refs.current[id] = n; }, []);

  const onTime = useCallback((id: DeckId) => {
    const n = refs.current[id];
    if (!n) return;
    setMeters((m) => ({ ...m, [id]: { c: n.currentTime, d: Number.isFinite(n.duration) ? n.duration : m[id].d } }));
  }, []);

  const onMeta = useCallback((id: DeckId) => {
    const n = refs.current[id];
    if (!n) return;
    setMeters((m) => ({ ...m, [id]: { ...m[id], d: Number.isFinite(n.duration) ? n.duration : 0 } }));
  }, []);

  const toggleDeck = useCallback(async (id: DeckId) => {
    const n = refs.current[id];
    if (!n) return;
    if (n.paused) {
      try {
        await n.play();
        syncPlay(id, true);
      } catch {
        syncPlay(id, false);
      }
      return;
    }
    n.pause();
    syncPlay(id, false);
  }, [syncPlay]);

  const cue = useCallback((id: DeckId) => {
    const n = refs.current[id];
    if (!n) return;
    n.currentTime = 0;
    onTime(id);
  }, [onTime]);

  const ensure = useCallback(async (id: DeckId) => {
    const n = refs.current[id];
    if (!n || !n.paused) return;
    try {
      await n.play();
      syncPlay(id, true);
    } catch {
      syncPlay(id, false);
    }
  }, [syncPlay]);

  const loadTo = useCallback((id: DeckId, i: number) => {
    const idx = ((i % TRACKS.length) + TRACKS.length) % TRACKS.length;
    const tr = TRACKS[idx];
    setDecks((d) => ({ ...d, [id]: { ...d[id], i: idx, t: tr.t, a: tr.a, b: tr.b, k: tr.k, u: tr.u, p: false } }));
    setMeters((m) => ({ ...m, [id]: { c: 0, d: m[id].d } }));
    const n = refs.current[id];
    if (n) {
      n.pause();
      n.currentTime = 0;
      n.load();
    }
  }, []);

  const loadNext = useCallback((id: DeckId) => {
    setCursor((c) => {
      const i = c % TRACKS.length;
      loadTo(id, i);
      return c + 1;
    });
  }, [loadTo]);

  const master = useCallback(async () => {
    const ids = profile.decks;
    const active = ids.some((id) => decks[id].p);
    if (active) {
      ids.forEach((id) => {
        const n = refs.current[id];
        if (!n) return;
        n.pause();
        syncPlay(id, false);
      });
      return;
    }
    await ensure('A');
  }, [profile.decks, decks, ensure, syncPlay]);

  const cycleProfile = useCallback(() => {
    const i = PROFILES.findIndex((x) => x.id === profileId);
    setProfileId(PROFILES[(i + 1) % PROFILES.length].id);
  }, [profileId]);

  const triggerPad = useCallback(async (pad: Pad) => {
    setPadHot(pad.id);
    const n = new Audio(pad.u);
    n.volume = clamp(padVol, 0, 1);
    try { await n.play(); } catch { /* ignore */ }
    window.setTimeout(() => setPadHot((p) => (p === pad.id ? null : p)), 350);
  }, [padVol]);

  useEffect(() => {
    if (!autoMix) return;
    void ensure('A');
    void ensure('B');
    const t = window.setInterval(() => {
      setXf((x) => {
        let nx = x + dirRef.current * 0.02;
        if (nx >= 1) {
          nx = 1;
          dirRef.current = -1;
          loadNext('A');
        } else if (nx <= 0) {
          nx = 0;
          dirRef.current = 1;
          loadNext('B');
        }
        return nx;
      });
    }, 280);
    return () => window.clearInterval(t);
  }, [autoMix, ensure, loadNext]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (e.code === 'Space') { e.preventDefault(); void master(); return; }
      if (k === 'q') cue('A'); if (k === 'w') void toggleDeck('A');
      if (k === 'o') cue('B'); if (k === 'p') void toggleDeck('B');
      if (k === 'a') cue('C'); if (k === 's') void toggleDeck('C');
      if (k === 'k') cue('D'); if (k === 'l') void toggleDeck('D');
      if (k === 'arrowleft') setXf((x) => clamp(x - 0.05, 0, 1));
      if (k === 'arrowright') setXf((x) => clamp(x + 0.05, 0, 1));
      if (k === '1') loadNext('A'); if (k === '2') loadNext('B'); if (k === '3') loadNext('C'); if (k === '4') loadNext('D');
      if (k === 'm') setAutoMix((v) => !v); if (k === 'r') setRec((v) => !v); if (k === 'v') cycleProfile();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cue, toggleDeck, loadNext, master, cycleProfile]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#111827_0%,_#030712_45%,_#02030a_100%)] text-zinc-100 px-4 py-5 md:px-8">
      <header className="mb-5 rounded-xl border border-white/10 bg-black/35 backdrop-blur px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">DGN-DJ Ultra Console Studio</h1>
            <p className="text-xs md:text-sm text-zinc-400 mt-1">Rekordbox/VirtualDJ inspired workflows, original DGN implementation.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" aria-pressed={onAir} onClick={() => setOnAir((v) => !v)} className={`rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wide ${onAir ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-300'}`}>{onAir ? 'On Air' : 'Off Air'}</button>
            <button type="button" aria-pressed={rec} onClick={() => setRec((v) => !v)} className={`rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wide ${rec ? 'bg-rose-600 text-white' : 'bg-zinc-800 text-zinc-300'}`}>{rec ? 'Recording' : 'Record'}</button>
            <button type="button" aria-pressed={autoMix} onClick={() => setAutoMix((v) => !v)} className={`rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wide ${autoMix ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-300'}`}>{autoMix ? 'AutoMix On' : 'AutoMix Off'}</button>
            <button type="button" aria-pressed={uhd} onClick={() => setUhd((v) => !v)} className={`rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wide ${uhd ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-300'}`}>{uhd ? 'UHD Density' : 'Compact Density'}</button>
          </div>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-3 xl:grid-cols-5">
          {PROFILES.map((p) => (
            <button key={p.id} type="button" onClick={() => setProfileId(p.id)} className={`rounded-lg border px-3 py-3 text-left transition-colors ${p.id === profileId ? 'border-emerald-400/60 bg-emerald-500/15' : 'border-white/10 bg-black/30 hover:border-white/30'}`}>
              <div className="text-sm font-semibold">{p.n}</div>
              <div className="text-[11px] text-zinc-400 mt-1 leading-snug">{p.d}</div>
            </button>
          ))}
        </div>
      </header>

      <main className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <section className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            {profile.decks.map((id) => {
              const d = decks[id];
              const m = meters[id];
              const prog = m.d > 0 ? clamp(m.c / m.d, 0, 1) : 0;
              return (
                <article key={id} className="rounded-xl border border-white/10 bg-black/35 backdrop-blur p-4">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">{d.label}</div>
                      <h2 className={`${uhd ? 'text-base' : 'text-sm'} font-semibold text-zinc-100`}>{d.t}</h2>
                      <p className="text-xs text-zinc-400">{d.a}</p>
                    </div>
                    <div className="text-right text-xs text-zinc-400"><div>{d.b} BPM</div><div>Key {d.k}</div></div>
                  </div>

                  {profile.wm === 'h' ? (
                    <div className="mb-3 rounded-md bg-zinc-900 border border-white/10 p-2">
                      <div className="h-3 rounded-full bg-zinc-800 overflow-hidden"><div className="h-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-lime-300" style={{ width: `${Math.round(prog * 100)}%` }} /></div>
                      <div className="mt-1 flex justify-between text-[11px] text-zinc-500"><span>{fmt(m.c)}</span><span>{fmt(m.d)}</span></div>
                    </div>
                  ) : (
                    <div className="mb-3 rounded-md bg-zinc-900 border border-white/10 p-2 flex items-end gap-2 h-28">
                      <div className="w-4 h-full rounded bg-zinc-800 overflow-hidden"><div className="w-full bg-gradient-to-t from-fuchsia-500 via-cyan-400 to-lime-300" style={{ height: `${Math.round(prog * 100)}%` }} /></div>
                      <div className="text-[11px] text-zinc-500"><div>{fmt(m.c)} / {fmt(m.d)}</div><div className="mt-1">Vertical waveform mode</div></div>
                    </div>
                  )}

                  <audio
                    ref={(n) => setRef(id, n)}
                    src={d.u}
                    preload="metadata"
                    controls
                    className="w-full"
                    onPlay={() => syncPlay(id, true)}
                    onPause={() => syncPlay(id, false)}
                    onTimeUpdate={() => onTime(id)}
                    onLoadedMetadata={() => onMeta(id)}
                  />

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <button type="button" onClick={() => cue(id)} className="rounded bg-zinc-800 hover:bg-zinc-700 px-2 py-2 text-xs font-semibold"><SkipBack size={13} className="inline mr-1" />CUE</button>
                    <button type="button" onClick={() => void toggleDeck(id)} className="rounded bg-blue-700 hover:bg-blue-600 px-2 py-2 text-xs font-semibold">{d.p ? <><Pause size={13} className="inline mr-1" />Pause</> : <><Play size={13} className="inline mr-1" />Play</>}</button>
                    <button type="button" onClick={() => loadNext(id)} className="rounded bg-zinc-800 hover:bg-zinc-700 px-2 py-2 text-xs font-semibold"><SkipForward size={13} className="inline mr-1" />Next</button>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <label className="block"><span className="text-zinc-400">Volume</span><input type="range" min={0} max={1} step={0.01} value={d.v} onChange={(e) => setDeck(id, { v: Number(e.target.value) })} className="w-full mt-1" /></label>
                    <label className="block"><span className="text-zinc-400">Rate</span><input type="range" min={0.8} max={1.25} step={0.01} value={d.r} onChange={(e) => setDeck(id, { r: Number(e.target.value) })} className="w-full mt-1" /></label>
                  </div>
                </article>
              );
            })}
          </div>

          <section className="rounded-xl border border-white/10 bg-black/35 backdrop-blur p-4">
            <div className="flex items-center justify-between gap-2 mb-2"><h2 className="text-sm font-semibold">Crossfader A/B</h2><span className="text-xs text-zinc-400">A {Math.round((1 - xf) * 100)}% / B {Math.round(xf * 100)}%</span></div>
            <input aria-label="Crossfader" type="range" min={0} max={1} step={0.01} value={xf} onChange={(e) => setXf(Number(e.target.value))} className="w-full" />
            <button type="button" onClick={() => void master()} className="mt-3 rounded bg-emerald-700 hover:bg-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide">Master Play/Pause</button>
          </section>
        </section>

        <aside className="rounded-xl border border-white/10 bg-black/35 backdrop-blur p-4 space-y-4">
          <section>
            <h2 className="text-sm font-semibold mb-2">Track Browser</h2>
            <div className="flex flex-wrap gap-1 mb-2">
              {profile.decks.map((id) => (
                <button key={id} type="button" onClick={() => setTargetDeck(id)} className={`rounded px-2 py-1 text-[11px] font-semibold ${targetDeck === id ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-300'}`}>Load to {id}</button>
              ))}
            </div>
            <div className="max-h-72 overflow-auto space-y-1">
              {TRACKS.map((tr, i) => (
                <div key={tr.id} className="rounded border border-white/10 bg-zinc-900/70 px-2 py-2 text-xs">
                  <div className="font-medium text-zinc-200">{tr.t}</div>
                  <div className="text-zinc-400">{tr.a} - {tr.b} BPM - {tr.k}</div>
                  <button type="button" onClick={() => loadTo(targetDeck, i)} className="mt-1 rounded bg-zinc-800 hover:bg-zinc-700 px-2 py-1 text-[11px]">Load to Deck {targetDeck}</button>
                </div>
              ))}
            </div>
          </section>

          {profile.f && (
            <section>
              <h2 className="text-sm font-semibold mb-2">Performance FX</h2>
              <div className="space-y-2">
                {profile.decks.map((id) => (
                  <div key={`fx-${id}`} className="rounded border border-white/10 bg-zinc-900/70 px-2 py-2 text-xs">
                    <div className="flex items-center justify-between"><span className="font-medium">Deck {id}</span><span className="text-zinc-400">Rate {decks[id].r.toFixed(2)}x</span></div>
                    <div className="mt-2 flex gap-1">{[0.9, 1, 1.1].map((n) => <button key={`${id}-${n}`} type="button" onClick={() => setDeck(id, { r: n })} className="rounded bg-zinc-800 hover:bg-zinc-700 px-2 py-1">{n.toFixed(2)}x</button>)}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {profile.s && (
            <section>
              <div className="flex items-center justify-between gap-2 mb-2"><h2 className="text-sm font-semibold">Sampler Pads</h2><label className="text-[11px] text-zinc-400 flex items-center gap-1"><Volume2 size={12} /><input type="range" min={0} max={1} step={0.01} value={padVol} onChange={(e) => setPadVol(Number(e.target.value))} /></label></div>
              <div className="grid grid-cols-2 gap-2">{PADS.map((pad) => <button key={pad.id} type="button" onClick={() => void triggerPad(pad)} className={`rounded border px-2 py-2 text-xs font-semibold transition-colors ${padHot === pad.id ? 'bg-emerald-500/30 border-emerald-400/50 text-emerald-100' : pad.cls}`}>{pad.l}</button>)}</div>
            </section>
          )}

          {profile.b && (
            <section className="rounded border border-white/10 bg-zinc-900/70 p-3">
              <h2 className="text-sm font-semibold mb-2">Broadcast Rail</h2>
              <div className="space-y-2 text-xs text-zinc-300">
                <div className="flex items-center gap-2"><Radio size={12} className={onAir ? 'text-red-400' : 'text-zinc-500'} /><span>Status: {onAir ? 'On Air Live' : 'Standby'}</span></div>
                <div className="flex items-center gap-2"><Mic size={12} className={rec ? 'text-rose-400' : 'text-zinc-500'} /><span>Recording: {rec ? 'Enabled' : 'Disabled'}</span></div>
                <div className="flex items-center gap-2"><Sparkles size={12} className={autoMix ? 'text-indigo-300' : 'text-zinc-500'} /><span>AutoMix: {autoMix ? 'Policy Active' : 'Manual'}</span></div>
              </div>
            </section>
          )}

          <section>
            <h2 className="text-sm font-semibold mb-2">Keyboard Map</h2>
            <div className="space-y-1 max-h-48 overflow-auto">{KEYMAP.map((k) => <div key={k} className="rounded bg-zinc-900/70 border border-white/10 px-2 py-1 text-[11px] text-zinc-300">{k}</div>)}</div>
            <button type="button" onClick={() => { window.localStorage.removeItem(STORAGE); window.location.reload(); }} className="mt-3 rounded bg-zinc-800 hover:bg-zinc-700 px-3 py-2 text-xs"><RotateCcw size={12} className="inline mr-1" />Reset Saved Console State</button>
          </section>
        </aside>
      </main>
    </div>
  );
}
