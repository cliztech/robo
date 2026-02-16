'use client';

import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { DegenButton } from '../primitives/DegenButton';
import { Mic2, Bot, Sparkles, Play, Square, Volume2, MessageSquare } from 'lucide-react';

interface AIHostMessage {
    id: string;
    type: 'intro' | 'outro' | 'commentary' | 'news' | 'weather' | 'custom';
    text: string;
    status: 'pending' | 'generating' | 'ready' | 'playing' | 'done';
    duration?: number;
}

interface DegenAIHostProps {
    persona?: string;
    status?: 'idle' | 'recording' | 'generating' | 'live';
    messages?: AIHostMessage[];
    onGenerate?: (type: string) => void;
    onPlay?: (messageId: string) => void;
    className?: string;
}

const DEMO_MESSAGES: AIHostMessage[] = [
    { id: '1', type: 'intro', text: 'Welcome back to DGN Radio, your AI-powered frequency for the underground.', status: 'done', duration: 8 },
    { id: '2', type: 'commentary', text: "That was SynthKong with 'Neural Drift v2.1', a deep house banger straight from the algorithm.", status: 'ready', duration: 6 },
    { id: '3', type: 'intro', text: "Coming up next, we've got DJ DegenApe dropping some heavy DnB beats. Stay locked in.", status: 'pending', duration: 5 },
];

export function DegenAIHost({
    persona = 'NightOwl',
    status = 'idle',
    messages = DEMO_MESSAGES,
    onGenerate,
    onPlay,
    className,
}: DegenAIHostProps) {
    const [prompt, setPrompt] = useState('');
    const [selectedType, setSelectedType] = useState<string>('commentary');

    const statusColors = {
        idle: 'bg-zinc-700',
        recording: 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]',
        generating: 'bg-purple-500 animate-pulse shadow-[0_0_8px_rgba(191,0,255,0.6)]',
        live: 'bg-lime-500 animate-pulse shadow-[0_0_8px_rgba(170,255,0,0.6)]',
    };

    const statusLabels = {
        idle: 'Idle',
        recording: 'Recording',
        generating: 'Generating...',
        live: 'On Air',
    };

    const typeButtons = [
        { type: 'intro', label: 'Intro' },
        { type: 'outro', label: 'Outro' },
        { type: 'commentary', label: 'Commentary' },
        { type: 'news', label: 'News' },
        { type: 'weather', label: 'Weather' },
    ];

    const getStatusIcon = (msgStatus: string) => {
        switch (msgStatus) {
            case 'generating': return <Sparkles size={8} className="text-purple-400 animate-spin" />;
            case 'ready': return <Play size={8} className="text-lime-500" />;
            case 'playing': return <Volume2 size={8} className="text-lime-500 animate-pulse" />;
            case 'done': return <div className="w-2 h-2 rounded-full bg-zinc-600" />;
            default: return <div className="w-2 h-2 rounded-full bg-zinc-700" />;
        }
    };

    return (
        <div className={cn('bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden flex flex-col', className)}>
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-800/40 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                    <Bot size={12} className="text-purple-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">
                        AI Host
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className={cn('w-2 h-2 rounded-full', statusColors[status])} />
                    <span className="text-[9px] font-mono text-zinc-500">{statusLabels[status]}</span>
                </div>
            </div>

            {/* Persona info */}
            <div className="px-3 py-2 flex items-center gap-3 border-b border-zinc-800/30">
                <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-600 to-lime-500 flex items-center justify-center">
                    <Mic2 size={14} className="text-black" />
                </div>
                <div>
                    <div className="text-[11px] font-bold text-white">{persona}</div>
                    <div className="text-[9px] text-zinc-500">AI Persona · Voice: Neural-v3</div>
                </div>
                <div className="ml-auto">
                    <DegenButton variant="outline" size="xs">Switch</DegenButton>
                </div>
            </div>

            {/* Type selection */}
            <div className="px-3 py-2 flex gap-1 flex-wrap border-b border-zinc-800/30">
                {typeButtons.map((tb) => (
                    <button
                        key={tb.type}
                        onClick={() => setSelectedType(tb.type)}
                        className={cn(
                            'text-[8px] font-bold uppercase px-2 py-0.5 rounded-sm border transition-all',
                            selectedType === tb.type
                                ? 'bg-purple-600/20 border-purple-500/40 text-purple-400'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-600 hover:text-zinc-400'
                        )}
                    >
                        {tb.label}
                    </button>
                ))}
            </div>

            {/* Message queue */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={cn(
                            'flex gap-2 p-2 rounded border transition-colors',
                            msg.status === 'playing'
                                ? 'bg-lime-500/5 border-lime-500/20'
                                : 'bg-zinc-900/40 border-zinc-800/50 hover:border-zinc-700/50'
                        )}
                    >
                        <div className="flex items-start pt-0.5">
                            {getStatusIcon(msg.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">
                                    {msg.type}
                                </span>
                                {msg.duration && (
                                    <span className="text-[8px] font-mono text-zinc-600">{msg.duration}s</span>
                                )}
                            </div>
                            <p className="text-[10px] text-zinc-300 leading-relaxed">{msg.text}</p>
                        </div>
                        {msg.status === 'ready' && (
                            <button
                                onClick={() => onPlay?.(msg.id)}
                                className="shrink-0 p-1 bg-lime-500/20 border border-lime-500/30 rounded text-lime-500 hover:bg-lime-500/30 transition-colors"
                            >
                                <Play size={10} />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Prompt input */}
            <div className="px-3 py-2 border-t border-zinc-800">
                <div className="flex gap-1.5">
                    <div className="relative flex-1">
                        <MessageSquare size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-600" />
                        <input
                            type="text"
                            placeholder="Custom prompt for AI host..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded pl-7 pr-2 py-1.5 text-[10px] text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-purple-500/40 transition-colors"
                        />
                    </div>
                    <DegenButton
                        variant="secondary"
                        size="sm"
                        onClick={() => onGenerate?.(selectedType)}
                    >
                        <Sparkles size={10} className="mr-1" />
                        Generate
                    </DegenButton>
                </div>
            </div>
        </div>
    );
}
