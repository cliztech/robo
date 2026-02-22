import StreamStatus from './StreamStatus';
import ListenerMonitor from './ListenerMonitor';
import ScheduleTimeline from './ScheduleTimeline';
import RecordingControls from './RecordingControls';

/* ─────────────────────────────────────────────────────────────
   BroadcastPanel — Master Broadcast Container
   Assembles all broadcast sub-components into a vertical stack
   Agent Dispatch: Design Team (3a) + Radio Broadcasting (10a-c)
   ───────────────────────────────────────────────────────────── */

interface BroadcastPanelProps {
    className?: string;
}

export default function BroadcastPanel({ className = '' }: BroadcastPanelProps) {
    return (
        <div className={`flex flex-col gap-1.5 h-full ${className}`}>
            {/* ── Panel Header ── */}
            <div className="flex items-center gap-2 px-2 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-alert-on-air animate-live-dot" />
                <span className="text-[10px] font-semibold text-white/60 uppercase tracking-widest">
                    Broadcast
                </span>
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[8px] font-mono text-white/25">DGN-DJ v2.1</span>
            </div>

            {/* ── Stream Connection Status ── */}
            <StreamStatus />

            {/* ── Listener Analytics ── */}
            <ListenerMonitor />

            {/* ── Schedule Timeline (takes remaining space) ── */}
            <ScheduleTimeline className="flex-1 min-h-0" />

            {/* ── Recording Controls ── */}
            <RecordingControls />
        </div>
    );
}
