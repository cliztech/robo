'use client';

<<<<<<< HEAD
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
    <div className="min-h-screen bg-[hsl(240,10%,2%)] text-zinc-100 px-4 py-5 md:px-8 relative overflow-hidden ambient-bg">
      {/* Floating ambient orbs */}
      <div className="floating-orb w-[300px] h-[300px] bg-[#027de1] top-[-80px] left-[10%]" style={{ animationDelay: '0s' }} />
      <div className="floating-orb w-[250px] h-[250px] bg-[#9933ff] bottom-[10%] right-[5%]" style={{ animationDelay: '5s' }} />
      <div className="floating-orb w-[200px] h-[200px] bg-[#00bfff] top-[40%] left-[60%]" style={{ animationDelay: '10s' }} />

      <header className="relative z-10 mb-5 glass-panel gradient-border px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">DGN-DJ <span className="text-[#4da6f0]">Ultra Console</span></h1>
            <p className="text-[11px] text-zinc-500 mt-0.5">Rekordbox/VirtualDJ inspired workflows · original DGN implementation</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" aria-pressed={onAir} onClick={() => setOnAir((v) => !v)} className={`rounded-sm px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] border transition-all duration-200 ${onAir ? 'bg-red-500/15 border-red-500/25 text-red-400 pulse-ring' : 'bg-white/[0.03] border-white/[0.06] text-zinc-500 hover:text-zinc-300'}`}>{onAir ? 'On Air' : 'Off Air'}</button>
            <button type="button" aria-pressed={rec} onClick={() => setRec((v) => !v)} className={`rounded-sm px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] border transition-all duration-200 ${rec ? 'bg-rose-500/15 border-rose-500/25 text-rose-400' : 'bg-white/[0.03] border-white/[0.06] text-zinc-500 hover:text-zinc-300'}`}>{rec ? 'Recording' : 'Record'}</button>
            <button type="button" aria-pressed={autoMix} onClick={() => setAutoMix((v) => !v)} className={`rounded-sm px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] border transition-all duration-200 ${autoMix ? 'bg-[#027de1]/15 border-[#027de1]/25 text-[#4da6f0]' : 'bg-white/[0.03] border-white/[0.06] text-zinc-500 hover:text-zinc-300'}`}>{autoMix ? 'AutoMix On' : 'AutoMix Off'}</button>
            <button type="button" aria-pressed={uhd} onClick={() => setUhd((v) => !v)} className={`rounded-sm px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] border transition-all duration-200 ${uhd ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400' : 'bg-white/[0.03] border-white/[0.06] text-zinc-500 hover:text-zinc-300'}`}>{uhd ? 'UHD' : 'Compact'}</button>
          </div>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-3 xl:grid-cols-5">
          {PROFILES.map((p) => (
            <button key={p.id} type="button" onClick={() => setProfileId(p.id)} className={`rounded-lg border px-3 py-2.5 text-left transition-all duration-200 backdrop-blur-sm ${p.id === profileId ? 'border-[#027de1]/40 bg-[#027de1]/[0.08] shadow-[0_0_15px_rgba(2,125,225,0.08)]' : 'border-white/[0.05] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.04]'}`}>
              <div className="text-[11px] font-bold text-zinc-200">{p.n}</div>
              <div className="text-[9px] text-zinc-500 mt-0.5">{p.d}</div>
            </button>
          ))}
        </div>
      </header>

      <main className="relative z-10 grid gap-4 xl:grid-cols-[1fr_340px]">
        <section className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            {profile.decks.map((id) => {
              const d = decks[id];
              const m = meters[id];
              const prog = m.d > 0 ? clamp(m.c / m.d, 0, 1) : 0;
              const deckColor = id === 'A' ? '#027de1' : id === 'B' ? '#a1cff5' : id === 'C' ? '#00bfff' : '#ff6b00';
              return (
                <article key={id} className="glass-panel overflow-hidden">
                  {/* Deck header */}
                  <div className="panel-header">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${d.p ? 'animate-pulse' : ''}`} style={{ backgroundColor: deckColor, boxShadow: d.p ? `0 0 10px ${deckColor}80` : 'none' }} />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: deckColor }}>{d.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.05]">
                        <span className="text-[9px] font-mono font-bold text-zinc-300 tabular-nums">{d.b}</span>
                        <span className="text-[8px] text-zinc-600">BPM</span>
                      </div>
                      <div className="px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/15">
                        <span className="text-[9px] font-mono font-bold text-purple-400">{d.k}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 space-y-3">
                    {/* Track info */}
                    <div>
                      <h2 className={`${uhd ? 'text-sm' : 'text-xs'} font-bold text-zinc-100`}>{d.t}</h2>
                      <p className="text-[10px] text-zinc-500">{d.a}</p>
                    </div>

                    {/* Waveform / progress */}
                    {profile.wm === 'h' ? (
                      <div className="glass-inset p-2">
                        <div className="h-3 rounded-full bg-black/30 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-100" style={{ width: `${Math.round(prog * 100)}%`, background: `linear-gradient(90deg, ${deckColor}, ${deckColor}80)`, boxShadow: `0 0 8px ${deckColor}40` }} />
                        </div>
                        <div className="mt-1.5 flex justify-between text-[9px] font-mono text-zinc-600 tabular-nums"><span>{fmt(m.c)}</span><span>{fmt(m.d)}</span></div>
                      </div>
                    ) : (
                      <div className="glass-inset p-2 flex items-end gap-3 h-28">
                        <div className="w-3 h-full rounded bg-black/30 overflow-hidden">
                          <div className="w-full rounded transition-all duration-100" style={{ height: `${Math.round(prog * 100)}%`, background: `linear-gradient(to top, ${deckColor}, ${deckColor}60)`, boxShadow: `0 0 6px ${deckColor}40` }} />
                        </div>
                        <div className="text-[9px] font-mono text-zinc-600"><div className="tabular-nums">{fmt(m.c)} / {fmt(m.d)}</div><div className="mt-1 text-zinc-700">Vertical mode</div></div>
                      </div>
                    )}

                    {/* Audio element */}
                    <audio
                      ref={(n) => setRef(id, n)}
                      src={d.u}
                      preload="metadata"
                      controls
                      className="w-full opacity-70 hover:opacity-100 transition-opacity"
                      onPlay={() => syncPlay(id, true)}
                      onPause={() => syncPlay(id, false)}
                      onTimeUpdate={() => onTime(id)}
                      onLoadedMetadata={() => onMeta(id)}
                    />

                    {/* Transport buttons */}
                    <div className="grid grid-cols-3 gap-1.5">
                      <button type="button" onClick={() => cue(id)} className="flex items-center justify-center gap-1.5 rounded-sm bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] px-2 py-2 text-[9px] font-black uppercase tracking-wider text-zinc-400 hover:text-zinc-200 transition-all"><SkipBack size={11} />CUE</button>
                      <button type="button" onClick={() => void toggleDeck(id)} className="flex items-center justify-center gap-1.5 rounded-sm border px-2 py-2 text-[9px] font-black uppercase tracking-wider transition-all" style={{ backgroundColor: d.p ? `${deckColor}20` : 'rgba(255,255,255,0.03)', borderColor: d.p ? `${deckColor}30` : 'rgba(255,255,255,0.06)', color: d.p ? deckColor : '#a1a1aa' }}>{d.p ? <><Pause size={11} />Pause</> : <><Play size={11} />Play</>}</button>
                      <button type="button" onClick={() => loadNext(id)} className="flex items-center justify-center gap-1.5 rounded-sm bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] px-2 py-2 text-[9px] font-black uppercase tracking-wider text-zinc-400 hover:text-zinc-200 transition-all"><SkipForward size={11} />Next</button>
                    </div>

                    {/* Sliders */}
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block"><span className="text-[8px] font-black uppercase tracking-wider text-zinc-600">Volume</span><input type="range" min={0} max={1} step={0.01} value={d.v} onChange={(e) => setDeck(id, { v: Number(e.target.value) })} className="w-full mt-1 accent-[#027de1]" /></label>
                      <label className="block"><span className="text-[8px] font-black uppercase tracking-wider text-zinc-600">Rate</span><input type="range" min={0.8} max={1.25} step={0.01} value={d.r} onChange={(e) => setDeck(id, { r: Number(e.target.value) })} className="w-full mt-1 accent-[#a1cff5]" /></label>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <section className="glass-panel overflow-hidden">
            <div className="panel-header">
              <span className="panel-header-title">Crossfader</span>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-mono text-[#027de1] tabular-nums">A {Math.round((1 - xf) * 100)}%</span>
                <span className="text-[9px] text-zinc-700">|</span>
                <span className="text-[9px] font-mono text-[#a1cff5] tabular-nums">B {Math.round(xf * 100)}%</span>
              </div>
            </div>
            <div className="p-3 space-y-3">
              <input aria-label="Crossfader" type="range" min={0} max={1} step={0.01} value={xf} onChange={(e) => setXf(Number(e.target.value))} className="w-full accent-[#027de1]" />
              <button type="button" onClick={() => void master()} className="w-full flex items-center justify-center gap-2 rounded-sm bg-[#027de1]/10 border border-[#027de1]/20 text-[9px] font-black uppercase tracking-[0.15em] text-[#4da6f0] hover:bg-[#027de1]/20 px-4 py-2 transition-all">Master Play/Pause</button>
            </div>
          </section>
        </section>

        <aside className="glass-panel overflow-hidden space-y-0">
          <div className="panel-header">
            <span className="panel-header-title">Browser</span>
          </div>
          <section className="p-3 border-b border-white/[0.03]">
            <div className="text-[8px] font-black uppercase tracking-wider text-zinc-600 mb-1.5">Load Target</div>
            <div className="flex flex-wrap gap-1">
              {profile.decks.map((id) => {
                const c = id === 'A' ? '#027de1' : id === 'B' ? '#a1cff5' : id === 'C' ? '#00bfff' : '#ff6b00';
                return (
                  <button key={id} type="button" onClick={() => setTargetDeck(id)} className="rounded-sm px-2.5 py-1 text-[8px] font-black uppercase tracking-wider border transition-all" style={targetDeck === id ? { backgroundColor: `${c}15`, borderColor: `${c}30`, color: c } : { backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)', color: '#71717a' }}>Deck {id}</button>
                );
              })}
            </div>
          </section>
          <section className="p-3 border-b border-white/[0.03]">
            <div className="text-[8px] font-black uppercase tracking-wider text-zinc-600 mb-1.5">Tracks</div>
            <div className="max-h-72 overflow-auto custom-scrollbar space-y-1">
              {TRACKS.map((tr, i) => (
                <div key={tr.id} className="rounded-md border border-white/[0.04] bg-white/[0.015] px-2.5 py-2 hover:bg-white/[0.03] transition-colors group">
                  <div className="text-[10px] font-bold text-zinc-200">{tr.t}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] text-zinc-500">{tr.a}</span>
                    <span className="text-[8px] font-mono text-zinc-600 tabular-nums">{tr.b} BPM</span>
                    <span className="text-[8px] font-mono text-purple-400/60">{tr.k}</span>
                  </div>
                  <button type="button" onClick={() => loadTo(targetDeck, i)} className="mt-1.5 rounded-sm bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-all opacity-0 group-hover:opacity-100">Load → {targetDeck}</button>
                </div>
              ))}
            </div>
          </section>

          {profile.f && (
            <section className="p-3 border-b border-white/[0.03]">
              <div className="text-[8px] font-black uppercase tracking-wider text-zinc-600 mb-1.5">Performance FX</div>
              <div className="space-y-1.5">
                {profile.decks.map((id) => {
                  const c = id === 'A' ? '#027de1' : id === 'B' ? '#a1cff5' : id === 'C' ? '#00bfff' : '#ff6b00';
                  return (
                    <div key={`fx-${id}`} className="rounded-md border border-white/[0.04] bg-white/[0.015] px-2.5 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold" style={{ color: c }}>Deck {id}</span>
                        <span className="text-[8px] font-mono text-zinc-600 tabular-nums">{decks[id].r.toFixed(2)}x</span>
                      </div>
                      <div className="mt-1.5 flex gap-1">{[0.9, 1, 1.1].map((n) => <button key={`${id}-${n}`} type="button" onClick={() => setDeck(id, { r: n })} className={`rounded-sm px-2 py-0.5 text-[8px] font-black border transition-all ${decks[id].r === n ? 'bg-white/[0.06] border-white/[0.1] text-zinc-200' : 'bg-white/[0.02] border-white/[0.04] text-zinc-600 hover:text-zinc-300'}`}>{n.toFixed(2)}x</button>)}</div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {profile.s && (
            <section className="p-3 border-b border-white/[0.03]">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="text-[8px] font-black uppercase tracking-wider text-zinc-600">Sampler Pads</div>
                <label className="text-[9px] text-zinc-500 flex items-center gap-1"><Volume2 size={10} /><input type="range" min={0} max={1} step={0.01} value={padVol} onChange={(e) => setPadVol(Number(e.target.value))} className="w-16 accent-[#027de1]" /></label>
              </div>
              <div className="grid grid-cols-2 gap-1.5">{PADS.map((pad) => <button key={pad.id} type="button" onClick={() => void triggerPad(pad)} className={`rounded-sm border px-2 py-2 text-[9px] font-black uppercase tracking-wider transition-all ${padHot === pad.id ? 'bg-[#027de1]/20 border-[#027de1]/30 text-[#4da6f0] shadow-[0_0_10px_rgba(2,125,225,0.15)]' : 'bg-white/[0.02] border-white/[0.05] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'}`}>{pad.l}</button>)}</div>
            </section>
          )}

          {profile.b && (
            <section className="p-3 border-b border-white/[0.03]">
              <div className="text-[8px] font-black uppercase tracking-wider text-zinc-600 mb-1.5">Broadcast Rail</div>
              <div className="space-y-2">
                <div className="flex items-center gap-2.5"><div className={`glow-dot ${onAir ? 'glow-dot-red' : 'bg-zinc-700'}`} style={{ width: 6, height: 6 }} /><span className="text-[9px] text-zinc-400">{onAir ? 'On Air Live' : 'Standby'}</span></div>
                <div className="flex items-center gap-2.5"><div className={`glow-dot ${rec ? 'glow-dot-orange' : 'bg-zinc-700'}`} style={{ width: 6, height: 6 }} /><span className="text-[9px] text-zinc-400">{rec ? 'Recording' : 'Rec Off'}</span></div>
                <div className="flex items-center gap-2.5"><div className={`glow-dot ${autoMix ? 'glow-dot-cyan' : 'bg-zinc-700'}`} style={{ width: 6, height: 6 }} /><span className="text-[9px] text-zinc-400">{autoMix ? 'AutoMix Active' : 'Manual'}</span></div>
              </div>
            </section>
          )}

          <section className="p-3">
            <div className="text-[8px] font-black uppercase tracking-wider text-zinc-600 mb-1.5">Keyboard Map</div>
            <div className="space-y-0.5 max-h-48 overflow-auto custom-scrollbar">{KEYMAP.map((k) => <div key={k} className="rounded-sm bg-white/[0.015] border border-white/[0.03] px-2 py-1 text-[9px] text-zinc-500">{k}</div>)}</div>
            <button type="button" onClick={() => { window.localStorage.removeItem(STORAGE); window.location.reload(); }} className="mt-3 flex items-center gap-1.5 rounded-sm bg-white/[0.03] border border-white/[0.05] hover:bg-red-500/[0.05] hover:border-red-500/[0.1] hover:text-red-400 px-3 py-1.5 text-[8px] font-black uppercase tracking-wider text-zinc-500 transition-all"><RotateCcw size={10} />Reset State</button>
          </section>
        </aside>
      </main>
    </div>
  );
=======
import React, { useState } from 'react';
import { ConsoleWorkspaceView } from '@/components/console/ConsoleWorkspaceView';
import { CONSOLE_NAV_ITEMS, CONSOLE_UTILITY_ITEMS } from '@/components/console/consoleNav';
import { ConsoleLayout } from '@/components/shell/ConsoleLayout';
import { useConsoleViewState } from '@/hooks/useConsoleViewState';

export default function StudioPage() {
    const { currentView, isOnAir, setCurrentView, toggleOnAir } = useConsoleViewState();

    return (
        <ConsoleLayout
            navItems={CONSOLE_NAV_ITEMS}
            utilityItems={CONSOLE_UTILITY_ITEMS}
            currentView={currentView}
            isOnAir={isOnAir}
            onViewChange={setCurrentView}
            onToggleOnAir={toggleOnAir}
        >
            <ConsoleWorkspaceView currentView={currentView} />
        </ConsoleLayout>
    );
>>>>>>> 2cc56c6ee848ad6741f5dbbbd83c3cdf0aaf1581
}
