import React from 'react';
import { Activity, Gauge, Radio, Signal, SlidersHorizontal } from 'lucide-react';

interface MainLayoutProps {
    children: React.ReactNode;
}

const libraryRows = [
    { title: 'Jin (Original Mix)', artist: 'Arche', bpm: '128.00', key: 'Gm', rating: '★★★★★', time: '05:31' },
    { title: 'Womanloop (Original Mix)', artist: 'Sergio Saffe', bpm: '128.00', key: 'D', rating: '★★★★☆', time: '06:03' },
    { title: 'Slow Down (Original Mix)', artist: "GuyMac, Murphy's Law", bpm: '125.00', key: 'Abm', rating: '★★★★☆', time: '06:54' },
    { title: 'Closing Doors (Original Mix)', artist: 'Imanol Molina', bpm: '122.00', key: 'Fm', rating: '★★★☆☆', time: '06:50' },
];

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <div className="flex flex-col h-screen w-screen bg-bg-master text-white overflow-hidden p-2 gap-2 select-none">
            <header className="h-16 rounded-xl border border-border-dim bg-gradient-to-r from-[#07090f] via-[#0a0d17] to-[#06070a] px-4 flex items-center justify-between">
                <div className="flex items-center gap-4 min-w-0">
                    <div className="min-w-[250px]">
                        <h1 className="text-3xl font-semibold tracking-tight leading-none text-zinc-100">DGN-DJ Studio</h1>
                        <p className="text-zinc-400 text-sm">Console V2 Studio Mode</p>
                        <div className="mt-1 h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                            <div className="h-full w-[6%] bg-gradient-to-r from-[#90a8ff] to-[#2f5dff]" />
                        </div>
                    </div>
                    <div className="hidden lg:flex items-center gap-2 text-xs text-zinc-300">
                        <span className="px-2 py-1 rounded bg-zinc-900 border border-zinc-700">Professional</span>
                        <span className="px-2 py-1 rounded bg-[#0f1f39] border border-[#25477a] text-[#9ec2ff]">MASTER</span>
                        <span className="px-2 py-1 rounded bg-[#10241a] border border-[#2f6d4d] text-[#8ee4b7]">LIVE SAFE</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-zinc-300">
                    {[Radio, Signal, Gauge, SlidersHorizontal, Activity].map((Icon, idx) => (
                        <div key={idx} className="h-8 w-8 rounded border border-zinc-700 bg-zinc-900/70 flex items-center justify-center">
                            <Icon size={14} />
                        </div>
                    ))}
                </div>
            </header>

            <div className="flex-1 min-h-0 grid grid-cols-[1.2fr_0.8fr_1.2fr] gap-2">{children}</div>

            <section className="h-[30vh] bg-bg-panel border border-border-dim rounded-xl p-3 flex flex-col">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                    <h3 className="text-xs font-mono text-zinc-400 tracking-widest">COLLECTION (2040 TRACKS)</h3>
                    <span className="text-[10px] text-zinc-500">PLAYER A</span>
                </div>
                <div className="overflow-auto mt-2 text-xs">
                    <table className="w-full text-left border-collapse">
                        <thead className="text-zinc-500 sticky top-0 bg-bg-panel">
                            <tr>
                                <th className="py-1.5 px-2 font-medium">Track Title</th>
                                <th className="py-1.5 px-2 font-medium">Artist</th>
                                <th className="py-1.5 px-2 font-medium">BPM</th>
                                <th className="py-1.5 px-2 font-medium">Key</th>
                                <th className="py-1.5 px-2 font-medium">Rating</th>
                                <th className="py-1.5 px-2 font-medium">Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {libraryRows.map((row) => (
                                <tr key={row.title} className="border-t border-zinc-800/80 hover:bg-zinc-800/40">
                                    <td className="px-2 py-2 text-zinc-100">{row.title}</td>
                                    <td className="px-2 py-2 text-zinc-300">{row.artist}</td>
                                    <td className="px-2 py-2 text-zinc-300">{row.bpm}</td>
                                    <td className="px-2 py-2 text-lime-400 font-semibold">{row.key}</td>
                                    <td className="px-2 py-2 text-zinc-300">{row.rating}</td>
                                    <td className="px-2 py-2 text-zinc-300">{row.time}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};
