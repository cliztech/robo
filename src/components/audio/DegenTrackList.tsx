'use client';

import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { DegenButton } from '../primitives/DegenButton';
import { Search, ListFilter, ChevronDown, Music, Disc, Clock, Zap } from 'lucide-react';

interface LibraryTrack {
    id: string;
    title: string;
    artist: string;
    duration: number;
    bpm?: number;
    key?: string;
    genre?: string;
    energy?: number; // 0-100
    mood?: string;
    addedAt?: string;
}

interface DegenTrackListProps {
    tracks?: LibraryTrack[];
    onTrackSelect?: (track: LibraryTrack) => void;
    onTrackLoad?: (track: LibraryTrack, deck: 'A' | 'B') => void;
    className?: string;
}

const DEMO_TRACKS: LibraryTrack[] = [
    { id: '1', title: 'Neural Drift v2.1', artist: 'SynthKong', duration: 234, bpm: 128, key: 'Am', genre: 'Electronic', energy: 78, mood: 'Dark' },
    { id: '2', title: 'Bass Gorilla', artist: 'DJ DegenApe', duration: 198, bpm: 140, key: 'Fm', genre: 'DnB', energy: 92, mood: 'Hype' },
    { id: '3', title: 'Acid Rain Protocol', artist: 'ZeroDay', duration: 312, bpm: 130, key: 'Cm', genre: 'Techno', energy: 85, mood: 'Dark' },
    { id: '4', title: 'Moonlight Serenade AI', artist: 'AetherBot', duration: 276, bpm: 95, key: 'Dm', genre: 'Lo-fi', energy: 35, mood: 'Chill' },
    { id: '5', title: 'Electric Primate', artist: 'KongBass', duration: 185, bpm: 174, key: 'Em', genre: 'DnB', energy: 95, mood: 'Energetic' },
    { id: '6', title: 'Quantum Breaks', artist: 'SynthKong', duration: 245, bpm: 126, key: 'Gm', genre: 'House', energy: 72, mood: 'Groovy' },
    { id: '7', title: 'Void Walker', artist: 'DegenNodes', duration: 290, bpm: 138, key: 'Bbm', genre: 'Techno', energy: 88, mood: 'Dark' },
    { id: '8', title: 'Sunset Frequencies', artist: 'AetherBot', duration: 210, bpm: 110, key: 'C', genre: 'Deep House', energy: 55, mood: 'Chill' },
    { id: '9', title: 'Binary Stars', artist: 'KongBass', duration: 168, bpm: 150, key: 'Am', genre: 'Trance', energy: 80, mood: 'Uplifting' },
    { id: '10', title: 'GlitchHop Manifesto', artist: 'DJ DegenApe', duration: 195, bpm: 108, key: 'Eb', genre: 'Glitch Hop', energy: 65, mood: 'Experimental' },
];

type SortKey = 'title' | 'artist' | 'bpm' | 'duration' | 'energy';

export function DegenTrackList({
    tracks = DEMO_TRACKS,
    onTrackSelect,
    onTrackLoad,
    className,
}: DegenTrackListProps) {
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<SortKey>('title');
    const [sortAsc, setSortAsc] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [genreFilter, setGenreFilter] = useState<string | null>(null);

    const genres = Array.from(new Set(tracks.map((t) => t.genre).filter(Boolean)));

    const filtered = tracks
        .filter((t) => {
            const q = search.toLowerCase();
            const matchSearch =
                !q ||
                t.title.toLowerCase().includes(q) ||
                t.artist.toLowerCase().includes(q) ||
                (t.genre && t.genre.toLowerCase().includes(q));
            const matchGenre = !genreFilter || t.genre === genreFilter;
            return matchSearch && matchGenre;
        })
        .sort((a, b) => {
            const mul = sortAsc ? 1 : -1;
            if (sortBy === 'title') return mul * a.title.localeCompare(b.title);
            if (sortBy === 'artist') return mul * a.artist.localeCompare(b.artist);
            if (sortBy === 'bpm') return mul * ((a.bpm || 0) - (b.bpm || 0));
            if (sortBy === 'duration') return mul * (a.duration - b.duration);
            if (sortBy === 'energy') return mul * ((a.energy || 0) - (b.energy || 0));
            return 0;
        });

    const toggleSort = (key: SortKey) => {
        if (sortBy === key) setSortAsc(!sortAsc);
        else {
            setSortBy(key);
            setSortAsc(true);
        }
    };

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    return (
        <div className={cn('bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden flex flex-col', className)}>
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-800/40 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                    <Music size={12} className="text-lime-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">
                        Track Library
                    </span>
                    <span className="text-[9px] text-zinc-600 font-mono">{filtered.length} tracks</span>
                </div>
            </div>

            {/* Search & filters */}
            <div className="px-3 py-2 flex gap-2 border-b border-zinc-800/50">
                <div className="relative flex-1">
                    <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-600" />
                    <input
                        type="text"
                        placeholder="Search tracks..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded pl-7 pr-2 py-1 text-[11px] text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-lime-500/40 transition-colors"
                    />
                </div>
                <div className="relative">
                    <select
                        value={genreFilter || ''}
                        onChange={(e) => setGenreFilter(e.target.value || null)}
                        className="appearance-none bg-zinc-900 border border-zinc-800 rounded px-2 py-1 pr-6 text-[10px] text-zinc-400 cursor-pointer focus:outline-none focus:border-lime-500/40"
                    >
                        <option value="">All Genres</option>
                        {genres.map((g) => (
                            <option key={g} value={g!}>{g}</option>
                        ))}
                    </select>
                    <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                </div>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[1fr_1fr_50px_40px_40px_60px] gap-1 px-3 py-1 text-[8px] font-black uppercase tracking-widest text-zinc-600 border-b border-zinc-800/30">
                <button onClick={() => toggleSort('title')} className="text-left hover:text-zinc-400 transition-colors">
                    Title {sortBy === 'title' && (sortAsc ? '↑' : '↓')}
                </button>
                <button onClick={() => toggleSort('artist')} className="text-left hover:text-zinc-400 transition-colors">
                    Artist {sortBy === 'artist' && (sortAsc ? '↑' : '↓')}
                </button>
                <button onClick={() => toggleSort('bpm')} className="text-right hover:text-zinc-400 transition-colors">
                    BPM {sortBy === 'bpm' && (sortAsc ? '↑' : '↓')}
                </button>
                <div className="text-center">Key</div>
                <button onClick={() => toggleSort('energy')} className="text-center hover:text-zinc-400 transition-colors">
                    <Zap size={8} className="inline" /> {sortBy === 'energy' && (sortAsc ? '↑' : '↓')}
                </button>
                <button onClick={() => toggleSort('duration')} className="text-right hover:text-zinc-400 transition-colors">
                    <Clock size={8} className="inline" /> {sortBy === 'duration' && (sortAsc ? '↑' : '↓')}
                </button>
            </div>

            {/* Track rows */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filtered.map((track) => (
                    <div
                        key={track.id}
                        onClick={() => {
                            setSelectedId(track.id);
                            onTrackSelect?.(track);
                        }}
                        onDoubleClick={() => onTrackLoad?.(track, 'A')}
                        className={cn(
                            'grid grid-cols-[1fr_1fr_50px_40px_40px_60px] gap-1 px-3 py-1.5 cursor-pointer transition-colors group',
                            selectedId === track.id
                                ? 'bg-lime-500/10 border-l-2 border-lime-500'
                                : 'hover:bg-zinc-900/60 border-l-2 border-transparent'
                        )}
                    >
                        <div className="flex items-center gap-1.5 min-w-0">
                            <Disc size={10} className="text-zinc-700 shrink-0" />
                            <span className="text-[11px] text-white truncate font-medium">{track.title}</span>
                        </div>
                        <span className="text-[11px] text-zinc-500 truncate">{track.artist}</span>
                        <span className="text-[10px] font-mono text-zinc-400 text-right">{track.bpm || '—'}</span>
                        <span className="text-[10px] font-mono text-purple-400/70 text-center">{track.key || '—'}</span>
                        <div className="flex items-center justify-center">
                            <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className={cn(
                                        'h-full rounded-full',
                                        (track.energy || 0) > 80 ? 'bg-red-500' :
                                            (track.energy || 0) > 50 ? 'bg-lime-500' :
                                                'bg-blue-500'
                                    )}
                                    style={{ width: `${track.energy || 0}%` }}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-1">
                            <span className="text-[10px] font-mono text-zinc-600">{formatTime(track.duration)}</span>
                            {/* Load to deck buttons (visible on hover) */}
                            <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onTrackLoad?.(track, 'A'); }}
                                    className="text-[7px] font-black bg-lime-500/20 text-lime-500 border border-lime-500/30 px-1 rounded hover:bg-lime-500/30"
                                >
                                    A
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onTrackLoad?.(track, 'B'); }}
                                    className="text-[7px] font-black bg-purple-500/20 text-purple-400 border border-purple-500/30 px-1 rounded hover:bg-purple-500/30"
                                >
                                    B
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
