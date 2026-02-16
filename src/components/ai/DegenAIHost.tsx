'use client';

import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { Bot, Mic2, Sparkles, Play, Square, Pause, MessageSquare, Send, RefreshCw } from 'lucide-react';

interface AIMessage {
    id: string;
    type: 'intro' | 'outro' | 'commentary' | 'news';
    content: string;
    status: 'queued' | 'generating' | 'ready' | 'playing';
    timestamp: string;
}

interface DegenAIHostProps {
    persona?: {
        name: string;
        style: string;
        voice: string;
    };
    className?: string;
}

const TYPE_COLORS = {
    intro: { color: '#aaff00', label: 'Intro' },
    outro: { color: '#9933ff', label: 'Outro' },
    commentary: { color: '#00bfff', label: 'Commentary' },
    news: { color: '#ffcc00', label: 'News' },
};

const STATUS_CONFIG = {
    queued: { color: '#666', label: 'Queued', dot: 'bg-zinc-600' },
    generating: { color: '#ffcc00', label: 'Generating...', dot: 'bg-yellow-500 animate-pulse' },
    ready: { color: '#aaff00', label: 'Ready', dot: 'bg-lime-500' },
    playing: { color: '#ff3333', label: 'On Air', dot: 'bg-red-500 animate-pulse' },
};

const DEMO_MESSAGES: AIMessage[] = [
    { id: '1', type: 'intro', content: "What's up night owls! You're locked into DGN Radio with me, your AI host, spinning the freshest beats from the underground.", status: 'playing', timestamp: '9:42 PM' },
    { id: '2', type: 'commentary', content: "That was SynthKong with 'Neural Drift' — absolute heater at 128 BPM. You can feel that bass in your bones.", status: 'ready', timestamp: '9:45 PM' },
    { id: '3', type: 'news', content: "Quick update: Bitcoin just broke through resistance at 95k. The markets are pumping and so is this playlist.", status: 'queued', timestamp: '10:00 PM' },
    { id: '4', type: 'outro', content: "That's a wrap on the evening session. Stay wavy, stay degen. DGN Radio — we don't sleep.", status: 'queued', timestamp: '10:30 PM' },
];

export function DegenAIHost({
    persona = { name: 'DGN Host', style: 'Edgy & Energetic', voice: 'Voice #7 (Bass)' },
    className,
}: DegenAIHostProps) {
    const [messages, setMessages] = useState<AIMessage[]>(DEMO_MESSAGES);
    const [promptInput, setPromptInput] = useState('');
    const [selectedType, setSelectedType] = useState<keyof typeof TYPE_COLORS>('commentary');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = () => {
        if (!promptInput.trim()) return;
        setIsGenerating(true);
        const newMsg: AIMessage = {
            id: Date.now().toString(),
            type: selectedType,
            content: promptInput,
            status: 'generating',
            timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, newMsg]);
        setPromptInput('');
        setTimeout(() => {
            setMessages((prev) =>
                prev.map((m) => (m.id === newMsg.id ? { ...m, status: 'ready' as const } : m))
            );
            setIsGenerating(false);
        }, 2000);
    };

    return (
        <div className={cn('glass-panel overflow-hidden flex flex-col', className)}>
            {/* Header */}
            <div className="panel-header">
                <div className="flex items-center gap-2">
                    <Bot size={12} className="text-cyan-400/70" />
                    <span className="panel-header-title">AI Host</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-lime-500" style={{ boxShadow: '0 0 6px rgba(170,255,0,0.4)' }} />
                    <span className="text-[9px] text-zinc-500">Active</span>
                </div>
            </div>

            {/* Persona info */}
            <div className="px-3 py-2.5 border-b border-white/[0.03] bg-white/[0.01]">
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/[0.06] flex items-center justify-center shrink-0">
                        <Mic2 size={16} className="text-cyan-400/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold text-zinc-200">{persona.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[8px] bg-cyan-500/[0.08] text-cyan-400/80 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                {persona.style}
                            </span>
                            <span className="text-[8px] text-zinc-600">{persona.voice}</span>
                        </div>
                    </div>
                    <button className="p-1.5 rounded text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors">
                        <RefreshCw size={12} />
                    </button>
                </div>
            </div>

            {/* Message queue */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1.5">
                {messages.map((msg) => {
                    const typeConfig = TYPE_COLORS[msg.type];
                    const statusConfig = STATUS_CONFIG[msg.status];
                    return (
                        <div
                            key={msg.id}
                            className={cn(
                                'rounded-lg p-2.5 border transition-all cursor-pointer group',
                                'hover:border-white/[0.06]',
                                msg.status === 'playing'
                                    ? 'bg-red-500/[0.04] border-red-500/10'
                                    : 'bg-white/[0.015] border-white/[0.03]'
                            )}
                        >
                            {/* Status bar */}
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                    <span
                                        className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm"
                                        style={{
                                            color: typeConfig.color,
                                            backgroundColor: `${typeConfig.color}10`,
                                        }}
                                    >
                                        {typeConfig.label}
                                    </span>
                                    <span className="text-[8px] text-zinc-700">{msg.timestamp}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className={cn('w-1.5 h-1.5 rounded-full', statusConfig.dot)} />
                                    <span className="text-[8px] font-bold" style={{ color: statusConfig.color }}>
                                        {statusConfig.label}
                                    </span>
                                </div>
                            </div>
                            {/* Message content */}
                            <p className="text-[10px] text-zinc-400 leading-relaxed line-clamp-2">
                                "{msg.content}"
                            </p>
                            {/* Actions */}
                            <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {msg.status === 'ready' && (
                                    <button className="text-[7px] font-black uppercase px-2 py-1 rounded-sm bg-lime-500/10 text-lime-400 border border-lime-500/15 hover:bg-lime-500/20 transition-colors flex items-center gap-1">
                                        <Play size={8} fill="currentColor" /> Play
                                    </button>
                                )}
                                {msg.status === 'playing' && (
                                    <button className="text-[7px] font-black uppercase px-2 py-1 rounded-sm bg-red-500/10 text-red-400 border border-red-500/15 hover:bg-red-500/20 transition-colors flex items-center gap-1">
                                        <Square size={8} fill="currentColor" /> Stop
                                    </button>
                                )}
                                <button className="text-[7px] font-black uppercase px-2 py-1 rounded-sm bg-white/[0.03] text-zinc-500 border border-white/[0.05] hover:bg-white/[0.06] transition-colors">
                                    Edit
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Generate input */}
            <div className="px-3 py-2.5 border-t border-white/[0.04] bg-white/[0.01]">
                {/* Type selector */}
                <div className="flex gap-1 mb-2">
                    {(Object.entries(TYPE_COLORS) as [keyof typeof TYPE_COLORS, typeof TYPE_COLORS[keyof typeof TYPE_COLORS]][]).map(([key, cfg]) => (
                        <button
                            key={key}
                            onClick={() => setSelectedType(key)}
                            className={cn(
                                'text-[7px] font-black uppercase px-2 py-1 rounded-sm border transition-all tracking-wider',
                                selectedType === key
                                    ? 'border-opacity-30'
                                    : 'border-white/[0.04] text-zinc-600 hover:text-zinc-400'
                            )}
                            style={
                                selectedType === key
                                    ? {
                                        color: cfg.color,
                                        borderColor: `${cfg.color}30`,
                                        backgroundColor: `${cfg.color}08`,
                                    }
                                    : {}
                            }
                        >
                            {cfg.label}
                        </button>
                    ))}
                </div>
                {/* Input */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Custom prompt for AI host..."
                        value={promptInput}
                        onChange={(e) => setPromptInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                        className="flex-1 bg-black/30 border border-white/[0.05] rounded-md px-3 py-2 text-[11px] text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-cyan-500/20 transition-colors"
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !promptInput.trim()}
                        className={cn(
                            'px-3 py-2 rounded-md text-[10px] font-bold flex items-center gap-1.5 transition-all border',
                            isGenerating
                                ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                                : promptInput.trim()
                                    ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20'
                                    : 'bg-white/[0.02] border-white/[0.04] text-zinc-700'
                        )}
                    >
                        {isGenerating ? (
                            <>
                                <Sparkles size={10} className="animate-spin" /> Generating
                            </>
                        ) : (
                            <>
                                <Send size={10} /> Generate
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
