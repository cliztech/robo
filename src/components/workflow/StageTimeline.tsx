'use client';

import { cn } from '../../lib/utils';
import { ClipboardList, Route, Hammer, ShieldCheck, Send } from 'lucide-react';

type StageState = 'done' | 'active' | 'upcoming';

interface Stage {
    id: string;
    label: string;
    description: string;
    eta: string;
    state: StageState;
}

interface StageTimelineProps {
    className?: string;
    route?: 'QA' | 'Change' | 'Proposal';
    stages?: Stage[];
}

const defaultStages: Stage[] = [
    { id: 'intake', label: 'Intake', description: 'Scope request and constraints', eta: '00:01', state: 'done' },
    { id: 'plan', label: 'Plan', description: 'Build minimal execution plan', eta: '00:03', state: 'done' },
    { id: 'execute', label: 'Execute', description: 'Apply scoped implementation', eta: '00:08', state: 'active' },
    { id: 'verify', label: 'Verify', description: 'Run checks and policy validation', eta: '00:04', state: 'upcoming' },
    { id: 'handoff', label: 'Handoff', description: 'Summarize outcome and next steps', eta: '00:02', state: 'upcoming' },
];

const stageIconMap = {
    intake: ClipboardList,
    plan: Route,
    execute: Hammer,
    verify: ShieldCheck,
    handoff: Send,
};

const routeStyleMap = {
    QA: 'text-cyan-300 border-cyan-400/30 bg-cyan-500/10',
    Change: 'text-lime-300 border-lime-400/30 bg-lime-500/10',
    Proposal: 'text-purple-300 border-purple-400/30 bg-purple-500/10',
};

const stageStateClassMap: Record<StageState, string> = {
    done: 'border-lime-500/30 bg-lime-500/8 text-lime-300',
    active: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200 shadow-[0_0_18px_rgba(6,182,212,0.16)]',
    upcoming: 'border-white/10 bg-white/[0.02] text-zinc-400',
};

export function StageTimeline({ className, route = 'Change', stages = defaultStages }: StageTimelineProps) {
    return (
        <section className={cn('glass-panel overflow-hidden', className)}>
            <header className="panel-header">
                <div className="flex items-center gap-2">
                    <Route size={12} className="text-cyan-400/80" />
                    <span className="panel-header-title">Stage Timeline</span>
                </div>
                <span
                    className={cn(
                        'rounded border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.18em]',
                        routeStyleMap[route]
                    )}
                >
                    {route} route
                </span>
            </header>

            <div className="p-3 space-y-3">
                <div className="relative">
                    <div className="absolute left-[18px] top-5 bottom-5 w-px bg-white/10" aria-hidden="true" />

                    <ol className="space-y-2.5">
                        {stages.map((stage, index) => {
                            const Icon = stageIconMap[stage.id as keyof typeof stageIconMap] ?? ClipboardList;

                            return (
                                <li key={stage.id} className="relative flex gap-2.5">
                                    <div
                                        className={cn(
                                            'z-[1] mt-1 flex h-7 w-7 items-center justify-center rounded-full border',
                                            stage.state === 'done' && 'border-lime-400/35 bg-lime-500/12 text-lime-300',
                                            stage.state === 'active' && 'border-cyan-400/45 bg-cyan-500/14 text-cyan-200',
                                            stage.state === 'upcoming' && 'border-white/10 bg-zinc-950 text-zinc-500'
                                        )}
                                    >
                                        <Icon size={12} />
                                    </div>

                                    <div className={cn('flex-1 rounded-md border p-2', stageStateClassMap[stage.state])}>
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="text-[10px] font-bold uppercase tracking-[0.16em]">
                                                {index + 1}. {stage.label}
                                            </div>
                                            <span className="text-[9px] font-mono text-zinc-500">{stage.eta}</span>
                                        </div>
                                        <p className="mt-1 text-[10px] leading-tight text-zinc-400">
                                            {stage.description}
                                        </p>
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                </div>
            </div>
        </section>
    );
}
