import React, { useState, useMemo } from 'react';
import { cn } from '../../lib/utils';

interface Track {
    id: number;
    title: string;
    artist: string;
    bpm: number;
    key: string;
    energy: number;
    rating: number;
    duration: string;
    artwork?: string;
}

type SortField = 'title' | 'artist' | 'bpm' | 'key' | 'energy' | 'rating' | 'duration';

/* Camelot wheel key compatibility: same key, ±1 position, or relative major/minor */
const COMPATIBLE_KEYS: Record<string, string[]> = {
    '1A': ['1A', '12A', '2A', '1B'], '1B': ['1B', '12B', '2B', '1A'],
    '2A': ['2A', '1A', '3A', '2B'], '2B': ['2B', '1B', '3B', '2A'],
    '3A': ['3A', '2A', '4A', '3B'], '3B': ['3B', '2B', '4B', '3A'],
    '4A': ['4A', '3A', '5A', '4B'], '4B': ['4B', '3B', '5B', '4A'],
    '5A': ['5A', '4A', '6A', '5B'], '5B': ['5B', '4B', '6B', '5A'],
    '6A': ['6A', '5A', '7A', '6B'], '6B': ['6B', '5B', '7B', '6A'],
    '7A': ['7A', '6A', '8A', '7B'], '7B': ['7B', '6B', '8B', '7A'],
    '8A': ['8A', '7A', '9A', '8B'], '8B': ['8B', '7B', '9B', '8A'],
    '9A': ['9A', '8A', '10A', '9B'], '9B': ['9B', '8B', '10B', '9A'],
    '10A': ['10A', '9A', '11A', '10B'], '10B': ['10B', '9B', '11B', '10A'],
    '11A': ['11A', '10A', '12A', '11B'], '11B': ['11B', '10B', '12B', '11A'],
    '12A': ['12A', '11A', '1A', '12B'], '12B': ['12B', '11B', '1B', '12A'],
};
const isKeyCompatible = (trackKey: string, deckKey: string) =>
    COMPATIBLE_KEYS[deckKey]?.includes(trackKey) ?? false;

export const BrowserPanel: React.FC = () => {
    const [selectedPlaylist, setSelectedPlaylist] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentDeckKey] = useState('8A'); // Current deck A key for compatibility check
    const [selectedTrack, setSelectedTrack] = useState<number | null>(null);
    const [sortField, setSortField] = useState<SortField>('title');
    const [sortAsc, setSortAsc] = useState(true);

    const playlists = [
        { name: 'All Tracks', count: 847 },
        { name: 'Peak Hour', count: 124 },
        { name: 'Warm Up', count: 89 },
        { name: 'Breaks', count: 56 },
        { name: 'Classics', count: 203 },
        { name: 'New Arrivals', count: 34 },
    ];

    const tracks: Track[] = useMemo(() => [
        { id: 1, title: 'Strobe', artist: 'deadmau5', bpm: 128.00, key: '5A', energy: 8, rating: 5, duration: '10:33' },
        { id: 2, title: 'Midnight City', artist: 'M83', bpm: 105.00, key: '2B', energy: 7, rating: 4, duration: '4:03' },
        { id: 3, title: 'One More Time', artist: 'Daft Punk', bpm: 122.50, key: '8A', energy: 9, rating: 5, duration: '5:20' },
        { id: 4, title: 'Apex', artist: 'Unleash The Archers', bpm: 140.00, key: '3B', energy: 10, rating: 4, duration: '5:45' },
        { id: 5, title: 'Ghosts n Stuff', artist: 'deadmau5', bpm: 128.00, key: '1A', energy: 8, rating: 5, duration: '6:42' },
        { id: 6, title: 'Get Lucky', artist: 'Daft Punk', bpm: 116.00, key: '11B', energy: 6, rating: 5, duration: '6:07' },
        { id: 7, title: 'Levels', artist: 'Avicii', bpm: 126.00, key: '6A', energy: 9, rating: 5, duration: '5:38' },
        { id: 8, title: 'Scary Monsters', artist: 'Skrillex', bpm: 140.00, key: '4B', energy: 10, rating: 4, duration: '5:00' },
        { id: 9, title: 'In The Name Of Love', artist: 'Martin Garrix', bpm: 128.00, key: '7A', energy: 8, rating: 4, duration: '3:41' },
        { id: 10, title: 'Titanium', artist: 'David Guetta', bpm: 126.00, key: '2A', energy: 7, rating: 5, duration: '4:05' },
        { id: 11, title: 'Silence', artist: 'Marshmello', bpm: 150.00, key: '8B', energy: 8, rating: 4, duration: '3:07' },
        { id: 12, title: 'Faded', artist: 'Alan Walker', bpm: 90.00, key: '6A', energy: 7, rating: 5, duration: '3:32' },
    ], []);

    const sortedTracks = useMemo(() => {
        return [...tracks].sort((a, b) => {
            const aVal = a[sortField];
            const bVal = b[sortField];
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            return sortAsc ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
        });
    }, [tracks, sortField, sortAsc]);

    const handleSort = (field: SortField) => {
        if (sortField === field) setSortAsc(!sortAsc);
        else { setSortField(field); setSortAsc(true); }
    };

    const sortIcon = (field: SortField) =>
        sortField === field ? (sortAsc ? '▲' : '▼') : '';

    return (
        <div className="h-full flex bg-panel-1 border-t border-white/5">
            {/* Playlist Sidebar */}
            <div className="w-48 shrink-0 border-r border-white/5 flex flex-col">
                <div className="p-2 text-xxs font-mono tracking-micro text-zinc-600 border-b border-white/5">
                    PLAYLISTS
                </div>
                <div className="flex-1 overflow-y-auto scroll-inertia">
                    {playlists.map((pl, i) => (
                        <button
                            key={i}
                            onClick={() => setSelectedPlaylist(i)}
                            className={cn(
                                "w-full text-left px-3 py-1.5 text-xs font-mono transition-all flex justify-between",
                                selectedPlaylist === i
                                    ? "text-white bg-white/[0.06] border-l-2 border-primary-accent"
                                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02] border-l-2 border-transparent"
                            )}
                        >
                            <span className="truncate">{pl.name}</span>
                            <span className="text-zinc-700 tabular-nums">{pl.count}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Search Bar */}
                <div className="h-9 shrink-0 flex items-center gap-2 px-3 border-b border-white/5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-600 shrink-0">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search tracks, artists, keys..."
                        className="flex-1 bg-transparent text-xs font-mono text-white placeholder-zinc-600 outline-none"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="text-zinc-600 hover:text-white text-xs">✕</button>
                    )}
                    <span className="text-[9px] font-mono text-zinc-600 tabular-nums">{sortedTracks.length} TRACKS</span>
                </div>

                {/* Album Carousel — 72px height, 64px artwork */}
                <div className="h-[72px] shrink-0 flex items-center gap-2 px-3 border-b border-white/5 overflow-x-auto scroll-inertia">
                    {tracks.slice(0, 8).map((track) => (
                        <div
                            key={track.id}
                            className={cn(
                                "shrink-0 flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-all",
                                selectedTrack === track.id
                                    ? "bg-white/[0.08] ring-1 ring-primary-accent/30"
                                    : "hover:bg-white/[0.04]"
                            )}
                            onClick={() => setSelectedTrack(track.id)}
                        >
                            {/* 64px Artwork placeholder */}
                            <div
                                className="shrink-0 rounded bg-panel-3 flex items-center justify-center"
                                style={{ width: '48px', height: '48px' }}
                            >
                                <span className="text-[10px] text-zinc-700 font-mono">♪</span>
                            </div>
                            <div className="min-w-0 max-w-[100px]">
                                <div className="text-xxs text-white truncate tracking-title">{track.title}</div>
                                <div className="text-xxs text-zinc-600 truncate">{track.artist}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Track Table */}
                <div className="flex-1 flex flex-col min-h-0">
                    {/* Header */}
                    <div className="flex items-center px-3 h-7 border-b border-white/5 text-xxs font-mono text-zinc-600 tracking-micro shrink-0">
                        <div className="w-8 text-center">#</div>
                        <div className="flex-[3] cursor-pointer hover:text-zinc-400" onClick={() => handleSort('title')}>
                            TITLE {sortIcon('title')}
                        </div>
                        <div className="flex-[2] cursor-pointer hover:text-zinc-400" onClick={() => handleSort('artist')}>
                            ARTIST {sortIcon('artist')}
                        </div>
                        <div className="w-16 text-right cursor-pointer hover:text-zinc-400" onClick={() => handleSort('bpm')}>
                            BPM {sortIcon('bpm')}
                        </div>
                        <div className="w-10 text-center cursor-pointer hover:text-zinc-400" onClick={() => handleSort('key')}>
                            KEY {sortIcon('key')}
                        </div>
                        <div className="w-14 text-center cursor-pointer hover:text-zinc-400" onClick={() => handleSort('energy')}>
                            NRG {sortIcon('energy')}
                        </div>
                        <div className="w-14 text-center cursor-pointer hover:text-zinc-400" onClick={() => handleSort('rating')}>
                            ★ {sortIcon('rating')}
                        </div>
                        <div className="w-14 text-right cursor-pointer hover:text-zinc-400" onClick={() => handleSort('duration')}>
                            TIME {sortIcon('duration')}
                        </div>
                    </div>

                    {/* Rows — 34px height per spec */}
                    <div className="flex-1 overflow-y-auto scroll-inertia">
                        {sortedTracks.map((track, idx) => (
                            <div
                                key={track.id}
                                onClick={() => setSelectedTrack(track.id)}
                                className={cn(
                                    "group flex items-center px-3 text-xs font-mono cursor-pointer transition-all",
                                    selectedTrack === track.id
                                        ? "bg-white/[0.06] border-l-2 border-primary-accent"
                                        : "hover:bg-white/[0.04] border-l-2 border-transparent"
                                )}
                                style={{ height: '34px' }}
                            >
                                <div className="w-8 text-center text-zinc-700 tabular-nums">{idx + 1}</div>
                                <div className="flex-[3] text-white truncate tracking-title">{track.title}</div>
                                <div className="flex-[2] text-zinc-500 truncate tracking-meta">{track.artist}</div>
                                <div className="w-16 text-right text-zinc-400 tabular-nums">{track.bpm.toFixed(2)}</div>
                                <div className={cn(
                                    "w-10 text-center tabular-nums font-bold",
                                    isKeyCompatible(track.key, currentDeckKey) ? "text-meter-green" : "text-zinc-500"
                                )}>{track.key}</div>
                                <div className="w-14 text-center">
                                    <div className="inline-flex gap-[1px]">
                                        {Array.from({ length: 10 }).map((_, j) => (
                                            <div key={j} className={cn(
                                                "w-1 h-2.5 rounded-[0.5px]",
                                                j < track.energy ? "bg-primary-accent/70" : "bg-white/5"
                                            )} />
                                        ))}
                                    </div>
                                </div>
                                <div className="w-14 text-center text-zinc-600">
                                    {'★'.repeat(track.rating)}
                                </div>
                                <div className="w-14 text-right text-zinc-600 tabular-nums">{track.duration}</div>
                                {/* Load to deck buttons */}
                                <div className="w-12 flex gap-0.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="text-[8px] font-mono font-bold text-deck-a px-1 py-0.5 rounded hover:bg-deck-a/20 transition-colors">A</button>
                                    <button className="text-[8px] font-mono font-bold text-deck-b px-1 py-0.5 rounded hover:bg-deck-b/20 transition-colors">B</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
