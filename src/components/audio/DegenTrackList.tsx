'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '../../lib/utils';
import {
    Search,
    Filter,
    ArrowUpDown,
    Play,
    Plus,
    Music2,
    Clock,
    Zap,
    ChevronDown,
} from 'lucide-react';

interface Track {
    id: string;
    title: string;
    artist: string;
    bpm: number;
    key: string;
    duration: number;
    genre: string;
    energy: number;
}

interface DegenTrackListProps {
    tracks?: Track[];
    onTrackSelect?: (track: Track) => void;
    onTrackLoad?: (track: Track, deck: 'A' | 'B') => void;
    className?: string;
}

const DEMO_TRACKS: Track[] = [
    { id: '1', title: 'Neural Drift v2.1', artist: 'SynthKong', bpm: 128, key: 'Am', duration: 234, genre: 'Deep House', energy: 7 },
    { id: '2', title: 'Bass Gorilla', artist: 'DJ DegenApe', bpm: 140, key: 'Fm', duration: 198, genre: 'DnB', energy: 9 },
    { id: '3', title: 'Quantum Entanglement', artist: 'PixelVault', bpm: 124, key: 'Cm', duration: 312, genre: 'Techno', energy: 6 },
    { id: '4', title: 'Zero Knowledge Proof', artist: 'HashRate', bpm: 132, key: 'Gm', duration: 276, genre: 'Electro', energy: 8 },
    { id: '5', title: 'Liquidation Event', artist: 'Margin Call', bpm: 138, key: 'Dm', duration: 186, genre: 'DnB', energy: 10 },
    { id: '6', title: 'Smart Contract', artist: 'Eth Gardener', bpm: 120, key: 'Bbm', duration: 298, genre: 'Deep House', energy: 5 },
    { id: '7', title: 'Fork This', artist: 'GitPush', bpm: 126, key: 'Em', duration: 204, genre: 'Tech House', energy: 7 },
    { id: '8', title: 'Block Height', artist: 'MinerBot', bpm: 136, key: 'Ab', duration: 245, genre: 'Techno', energy: 8 },
    { id: '9', title: 'Rug Pull Blues', artist: 'Sad Pepe', bpm: 118, key: 'Eb', duration: 190, genre: 'Lo-Fi', energy: 3 },
    { id: '10', title: 'Diamond Hands', artist: 'HODL Gang', bpm: 145, key: 'Fm', duration: 222, genre: 'Hardstyle', energy: 10 },
];

const GENRES = ['All', 'Deep House', 'DnB', 'Techno', 'Electro', 'Tech House', 'Lo-Fi', 'Hardstyle'];

type SortField = 'title' | 'artist' | 'bpm' | 'key' | 'duration' | 'energy';

export function DegenTrackList({
    tracks = DEMO_TRACKS,
    onTrackSelect,
    onTrackLoad,
    className,
}: DegenTrackListProps) {
    const [search, setSearch] = useState('');
    const [genre, setGenre] = useState('All');
    const [sortField, setSortField] = useState<SortField>('title');
    const [sortAsc, setSortAsc] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const handleSort = (field: SortField) => {
        if (sortField === field) setSortAsc(!sortAsc);
        else { setSortField(field); setSortAsc(true); }
    };

    const filtered = useMemo(() => {
        let list = [...tracks];
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(
                (t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
            );
        }
        if (genre !== 'All') list = list.filter((t) => t.genre === genre);
        list.sort((a, b) => {
            const av = a[sortField];
            const bv = b[sortField];
            const cmp = typeof av === 'string' ? (av as string).localeCompare(bv as string) : (av as number) - (bv as number);
            return sortAsc ? cmp : -cmp;
        });
        return list;
    }, [tracks, search, genre, sortField, sortAsc]);

    const formatDur = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    const energyBar = (e: number) => {
        const colors = e >= 8 ? 'hsl(var(--color-danger-bright))' : e >= 6 ? 'hsl(var(--color-warning))' : e >= 4 ? 'hsl(var(--color-deck-a))' : 'hsl(var(--color-deck-mic))';
        return (
            <div className="flex items-center gap-1.5 w-16">
                <div className="flex-1 h-[3px] rounded-full bg-white/[0.04] overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${e * 10}%`, backgroundColor: colors }}
                    />
                </div>
                <span className="text-[8px] font-mono text-zinc-600 tabular-nums w-3 text-right">{e}</span>
            </div>
        );
    };

    const SortHeader = ({ field, label, width }: { field: SortField; label: string; width: string }) => (
        <button
            onClick={() => handleSort(field)}
            className={cn(
                'flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.12em] transition-colors',
                sortField === field ? 'text-[hsl(var(--color-deck-a))]' : 'text-zinc-600 hover:text-zinc-400'
            )}
            style={{ width }}
        >
            {label}
            {sortField === field && (
                <ArrowUpDown size={8} className={sortAsc ? '' : 'rotate-180'} />
            )}
        </button>
    );

    return (
        <div className={cn(
            'glass-panel overflow-hidden flex flex-col',
            className
        )}>
            {/* Header */}
            <div className="panel-header">
                <div className="flex items-center gap-2">
                    <Music2 size={12} className="text-[hsla(var(--color-deck-a),0.7)]" />
                    <span className="panel-header-title">Track Library</span>
                </div>
                <span className="text-[9px] font-mono text-zinc-600">{filtered.length} tracks</span>
            </div>

            {/* Search & filters */}
            <div className="px-3 py-2.5 flex gap-2 border-b border-white/[0.03]">
                <div className="relative flex-1">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" />
                    <input
                        type="text"
                        placeholder="Search tracks, artists..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-black/30 border border-white/[0.05] rounded-md pl-8 pr-3 py-2 text-[11px] text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-lime-500/20 transition-colors"
                    />
                </div>
                <div className="relative">
                    <select
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                        className="appearance-none bg-black/30 border border-white/[0.05] rounded-md pl-3 pr-7 py-2 text-[10px] text-zinc-300 focus:outline-none focus:border-lime-500/20 cursor-pointer"
                    >
                        {GENRES.map((g) => (
                            <option key={g} value={g}>{g}</option>
                        ))}
                    </select>
                    <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                </div>
            </div>

            {/* Column headers */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.03] bg-white/[0.01]">
                <div className="w-7" /> {/* play icon space */}
                <SortHeader field="title" label="Title / Artist" width="flex-1" />
                <SortHeader field="bpm" label="BPM" width="3rem" />
                <SortHeader field="key" label="Key" width="2.5rem" />
                <SortHeader field="energy" label="Energy" width="4.5rem" />
                <SortHeader field="duration" label="Time" width="2.5rem" />
                <div className="w-16" /> {/* load buttons */}
            </div>

            {/* Track rows */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-zinc-700">
                        <Music2 size={24} className="mb-2 opacity-50" />
                        <span className="text-[11px]">No tracks found</span>
                    </div>
                )}
                {filtered.map((track, i) => {
                    const isSelected = selectedId === track.id;
                    const isHovered = hoveredId === track.id;
                    return (
                        <div
                            key={track.id}
                            className={cn(
                                'flex items-center gap-2 px-3 py-2 cursor-pointer transition-all duration-100 group border-b border-white/[0.02]',
                                isSelected
                                    ? 'bg-lime-500/[0.04] border-l-2 border-l-lime-500'
                                    : 'hover:bg-white/[0.02] border-l-2 border-l-transparent'
                            )}
                            onClick={() => {
                                setSelectedId(track.id);
                                onTrackSelect?.(track);
                            }}
                            onMouseEnter={() => setHoveredId(track.id)}
                            onMouseLeave={() => setHoveredId(null)}
                        >
                            {/* Play preview */}
                            <div className="w-7 flex items-center justify-center shrink-0">
                                {isHovered ? (
                                    <Play size={12} className="text-lime-400" fill="currentColor" />
                                ) : (
                                    <span className="text-[9px] font-mono text-zinc-700 tabular-nums">{i + 1}</span>
                                )}
                            </div>

                            {/* Title & artist */}
                            <div className="flex-1 min-w-0">
                                <div className="text-[11px] font-semibold text-zinc-200 truncate leading-tight">
                                    {track.title}
                                </div>
                                <div className="text-[9px] text-zinc-600 truncate">{track.artist}</div>
                            </div>

                            {/* BPM */}
                            <div className="w-12 text-right shrink-0">
                                <span className="text-[10px] font-mono text-zinc-400 tabular-nums">{track.bpm}</span>
                            </div>

                            {/* Key */}
                            <div className="w-10 text-center shrink-0">
                                <span className="text-[10px] font-mono text-purple-400/80 bg-purple-500/[0.06] px-1.5 py-0.5 rounded">
                                    {track.key}
                                </span>
                            </div>

                            {/* Energy */}
                            <div className="w-[4.5rem] flex items-center justify-center shrink-0">
                                {energyBar(track.energy)}
                            </div>

                            {/* Duration */}
                            <div className="w-10 text-right shrink-0">
                                <span className="text-[10px] font-mono text-zinc-600 tabular-nums">
                                    {formatDur(track.duration)}
                                </span>
                            </div>

                            {/* Load buttons */}
                            <div className={cn(
                                'flex gap-1 w-16 justify-end transition-opacity',
                                isHovered || isSelected ? 'opacity-100' : 'opacity-0'
                            )}>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onTrackLoad?.(track, 'A'); }}
                                    className="text-[7px] font-black px-2 py-1 rounded-sm border border-lime-500/20 text-lime-500 bg-lime-500/[0.06] hover:bg-lime-500/15 transition-colors"
                                >
                                    A
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onTrackLoad?.(track, 'B'); }}
                                    className="text-[7px] font-black px-2 py-1 rounded-sm border border-purple-500/20 text-purple-500 bg-purple-500/[0.06] hover:bg-purple-500/15 transition-colors"
                                >
                                    B
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
