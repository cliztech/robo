'use client';

import { Music2, Play, Square, ChevronLeft, ChevronRight, Search, ListMusic, Volume2 } from 'lucide-react';

const tracks = [
    ['Jin (Original Mix)', 'Arche', '128.0', 'Gm', '05:31'],
    ['Womanloop (Original Mix)', 'Sergio Saffe', '128.0', 'D', '06:03'],
    ['Pelusa (Original Mix)', 'Nacho Scoppa', '128.0', 'Db', '07:00'],
    ['Slow Down (Original Mix)', "GuyMac, Murphy's Law", '125.0', 'Abm', '06:54'],
    ['Closing Doors (Original Mix)', 'Imanol Molina', '122.0', 'Fm', '06:50'],
    ['All Nighter (Original Mix)', 'Mescal Kids', '123.0', 'F#m', '05:48'],
];

const memoryPoints = [
    { label: 'A', time: '00:00', color: 'bg-red-500/90' },
    { label: 'B', time: '00:30', color: 'bg-blue-500/90' },
    { label: 'C', time: '01:45', color: 'bg-green-500/90' },
    { label: 'D', time: '02:30', color: 'bg-purple-500/90' },
    { label: 'E', time: '03:00', color: 'bg-emerald-500/90' },
    { label: 'F', time: '03:30', color: 'bg-orange-500/90' },
    { label: 'G', time: '04:15', color: 'bg-indigo-500/90' },
    { label: 'H', time: '04:52', color: 'bg-yellow-500/90' },
];

function Waveform({ compact = false }: { compact?: boolean }) {
    return (
        <div className={`relative w-full overflow-hidden rounded border border-zinc-700 bg-black ${compact ? 'h-16' : 'h-40'}`}>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,#0c2248_30%,#122f66_65%,#0b2d5a_100%)] opacity-60" />
            <div className="absolute inset-x-0 top-1/2 h-px bg-zinc-500/40" />
            <div className="absolute inset-0 flex items-end gap-[2px] px-2 pb-2">
                {Array.from({ length: 180 }).map((_, idx) => (
                    <div
                        key={idx}
                        className={`w-[3px] rounded-t ${idx % 8 < 4 ? 'bg-blue-500/90' : 'bg-orange-300/90'}`}
                        style={{ height: `${24 + ((idx * 13) % (compact ? 28 : 75))}%` }}
                    />
                ))}
            </div>
        </div>
    );
}

export default function StudioPage() {
    return (
        <main className="h-screen w-full overflow-hidden bg-[#0a0a0a] text-zinc-100">
            <div className="grid h-full grid-cols-[72px_1fr_260px] grid-rows-[34px_1fr_290px]">
                <header className="col-span-3 flex items-center justify-between border-b border-zinc-800 bg-black px-4 text-xs font-semibold uppercase tracking-wide">
                    <div className="flex items-center gap-3 text-zinc-300"><span>Export</span><span>▾</span></div>
                    <div className="flex items-center gap-6 text-zinc-400">
                        <span className="rounded bg-zinc-800 px-2 py-0.5">Professional</span>
                        <span>125.00</span>
                        <span>20:49</span>
                    </div>
                </header>

                <aside className="row-span-2 flex flex-col items-center gap-4 border-r border-zinc-800 bg-[#111] py-4">
                    <button className="rounded-full border border-yellow-500/60 p-3 text-yellow-400"><Play size={16} /></button>
                    <button className="rounded-full border border-zinc-600 p-3 text-zinc-300"><Square size={16} /></button>
                    <div className="h-px w-8 bg-zinc-700" />
                    <button className="rounded border border-zinc-700 p-2"><ChevronLeft size={14} /></button>
                    <button className="rounded border border-zinc-700 p-2"><ChevronRight size={14} /></button>
                    <div className="mt-2 text-[11px] uppercase text-zinc-500">4 Beats</div>
                    <button className="rounded-full border border-yellow-500/70 px-3 py-1 text-[10px] font-bold uppercase text-yellow-400">Cue</button>
                </aside>

                <section className="space-y-2 border-r border-zinc-800 bg-[#080808] p-2">
                    <div className="flex items-end justify-between text-xs">
                        <div>
                            <p className="text-base font-bold">Jin (Original Mix)</p>
                            <p className="text-zinc-400">Arche</p>
                        </div>
                        <div className="flex gap-2">
                            <span className="rounded bg-zinc-900 px-2 py-0.5">KEY SYNC</span>
                            <span className="rounded bg-blue-700 px-2 py-0.5">BEAT SYNC</span>
                        </div>
                    </div>
                    <Waveform compact />
                    <div className="grid grid-cols-[1fr_130px] gap-2">
                        <Waveform />
                        <div className="space-y-2 rounded border border-zinc-700 bg-[#121212] p-2 text-xs">
                            <div className="flex items-center justify-between"><span>MASTER</span><span>125.00</span></div>
                            <div className="h-24 rounded bg-black p-2">
                                <div className="h-full w-full border border-zinc-700" />
                            </div>
                            <button className="w-full rounded bg-blue-700 py-1 font-semibold">Q</button>
                        </div>
                    </div>
                    <Waveform compact />
                </section>

                <section className="overflow-hidden border-b border-zinc-800 bg-[#0f0f0f]">
                    <div className="flex items-center justify-between border-b border-zinc-700 px-2 py-1 text-xs font-semibold uppercase text-zinc-300">
                        <span>Memory</span>
                        <div className="flex gap-2">
                            <button className="rounded bg-zinc-800 px-2 py-0.5">Hot Cue</button>
                            <button className="rounded bg-zinc-800 px-2 py-0.5">Info</button>
                        </div>
                    </div>
                    <div className="h-full space-y-1 overflow-auto p-2 text-xs">
                        {memoryPoints.map((point) => (
                            <div key={point.label} className="flex items-center justify-between border-b border-zinc-800 pb-1">
                                <div className="flex items-center gap-2">
                                    <span className={`w-4 rounded text-center text-[10px] font-bold text-black ${point.color}`}>{point.label}</span>
                                    <span>{point.time}</span>
                                    <span className="text-zinc-500">Cue(Auto)</span>
                                </div>
                                <span className="text-zinc-500">×</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="col-span-2 grid grid-cols-[250px_1fr] border-r border-zinc-800 bg-[#0b0b0b]">
                    <div className="border-r border-zinc-800">
                        <div className="flex items-center gap-2 border-b border-zinc-800 p-2 text-sm font-semibold">
                            <ListMusic size={16} /> Collection
                        </div>
                        <ul className="space-y-1 p-2 text-sm text-zinc-300">
                            {['All', 'Date Added', 'Genre', 'Artist', 'Album'].map((item, idx) => (
                                <li key={item} className={`rounded px-2 py-1 ${idx === 0 ? 'bg-blue-800/60 text-white' : 'hover:bg-zinc-800/70'}`}>{item}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="overflow-hidden">
                        <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2 text-xs">
                            <span>Collection (2040 Tracks)</span>
                            <div className="flex items-center gap-2 text-zinc-500"><Search size={14} /><Volume2 size={14} /><Music2 size={14} /></div>
                        </div>
                        <table className="w-full table-fixed text-left text-sm">
                            <thead className="bg-zinc-900/90 text-xs uppercase text-zinc-400">
                                <tr>
                                    <th className="px-2 py-2">Track Title</th><th className="px-2 py-2">Artist</th><th className="px-2 py-2">BPM</th><th className="px-2 py-2">Key</th><th className="px-2 py-2">Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tracks.map((track, idx) => (
                                    <tr key={track[0]} className={idx % 2 ? 'bg-[#121212]' : 'bg-[#0d0d0d]'}>
                                        <td className="truncate px-2 py-2">{track[0]}</td>
                                        <td className="truncate px-2 py-2 text-zinc-300">{track[1]}</td>
                                        <td className="px-2 py-2">{track[2]}</td>
                                        <td className="px-2 py-2"><span className="rounded bg-green-500/90 px-2 py-0.5 text-black">{track[3]}</span></td>
                                        <td className="px-2 py-2">{track[4]}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="bg-[#0f0f0f]" />
            </div>
        </main>
    );
}
