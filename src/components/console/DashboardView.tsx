"use client";

import { useEffect, useId, useState, type ElementType } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Gauge,
  Minus,
  Signal,
  TrendingDown,
  TrendingUp,
  Users,
  Wifi,
  Zap,
} from "lucide-react";
import { DegenEffectRack } from "@/components/audio/DegenEffectRack";
import { DegenBeatGrid } from "@/components/audio/DegenBeatGrid";
import { DegenWaveform } from "@/components/audio/DegenWaveform";
import { DegenScheduleTimeline } from "@/components/schedule/DegenScheduleTimeline";
import { DegenAIHost } from "@/components/ai/DegenAIHost";
import { cn } from "@/lib/utils";
import {
  type DashboardCardColor,
  type DashboardTelemetry,
  mapSeverityToCardColor,
  mapSeverityToStatusTextClass,
  mapStatusToTrend,
} from "./dashboard.types";

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: ElementType;
  color?: DashboardCardColor;
  trend?: "up" | "down" | "stable";
  sparkline?: number[];
  delay?: number;
}

function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  color = "lime",
  trend,
  sparkline,
  delay = 0,
}: StatCardProps) {
  const sparkId = useId();
  const colors = {
    lime: {
      gradient: "from-lime-500/8 via-lime-500/3 to-transparent",
      border: "border-lime-500/15",
      icon: "text-lime-500/70",
      spark: "#aaff00",
    },
    purple: {
      gradient: "from-purple-500/8 via-purple-500/3 to-transparent",
      border: "border-purple-500/15",
      icon: "text-purple-500/70",
      spark: "#9933ff",
    },
    cyan: {
      gradient: "from-cyan-500/8 via-cyan-500/3 to-transparent",
      border: "border-cyan-500/15",
      icon: "text-cyan-500/70",
      spark: "#00bfff",
    },
    orange: {
      gradient: "from-orange-500/8 via-orange-500/3 to-transparent",
      border: "border-orange-500/15",
      icon: "text-orange-500/70",
      spark: "#ff6b00",
    },
    red: {
      gradient: "from-red-500/8 via-red-500/3 to-transparent",
      border: "border-red-500/15",
      icon: "text-red-500/70",
      spark: "#ef4444",
    },
  };

  const points = sparkline ?? [30, 45, 38, 52, 48, 60, 55, 70, 65, 75, 72, 80];
  const trendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const TrendIcon = trendIcon;
  const trendClass =
    trend === "up"
      ? "text-lime-500"
      : trend === "down"
        ? "text-red-400"
        : "text-zinc-600";
  const c = colors[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25 }}
      className={cn(
        "rounded-xl border p-4 bg-gradient-to-br",
        c.gradient,
        c.border,
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-zinc-500 text-[9px] uppercase tracking-[0.15em]">
            <Icon size={13} className={c.icon} />
            <span>{label}</span>
          </div>
          <div className="mt-1 text-2xl font-black text-white tabular-nums">
            {value}
            {unit ? (
              <span className="ml-1 text-[10px] font-medium text-zinc-500">
                {unit}
              </span>
            ) : null}
          </div>
        </div>
        {trend ? <TrendIcon size={10} className={trendClass} /> : null}
      </div>

      <div className="mt-3 h-6">
        <svg
          viewBox="0 0 100 30"
          preserveAspectRatio="none"
          className="h-full w-full"
        >
          <defs>
            <linearGradient id={sparkId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.spark} stopOpacity="0.2" />
              <stop offset="100%" stopColor={c.spark} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={`M 0 30 ${points
              .map(
                (v, i, arr) =>
                  `L ${(i / (arr.length - 1)) * 100} ${30 - (v / 100) * 28}`,
              )
              .join(" ")} L 100 30 Z`}
            fill={`url(#${sparkId})`}
          />
          <polyline
            points={points
              .map(
                (v, i, arr) =>
                  `${(i / (arr.length - 1)) * 100},${30 - (v / 100) * 28}`,
              )
              .join(" ")}
            fill="none"
            stroke={c.spark}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.7"
          />
        </svg>
      </div>
    </motion.div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="h-px flex-1 bg-gradient-to-r from-zinc-800 to-transparent" />
      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">
        {children}
      </span>
      <div className="h-px flex-1 bg-gradient-to-l from-zinc-800 to-transparent" />
    </div>
  );
}

interface DashboardViewProps {
  telemetry: DashboardTelemetry;
}

export function DashboardView({ telemetry }: DashboardViewProps) {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const tick = () => {
      setCurrentTime(
        new Date().toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
      );
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-end justify-between"
      >
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Station <span className="text-lime-400">Overview</span>
          </h1>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Live monitoring ·{" "}
            <span
              className={mapSeverityToStatusTextClass(
                telemetry.aiLoad.severity,
              )}
            >
              All systems {telemetry.aiLoad.status}
            </span>
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-mono font-bold text-zinc-300 tabular-nums tracking-wider">
            {currentTime}
          </div>
          <div className="text-[9px] text-zinc-600 uppercase tracking-widest">
            {telemetry.localTimeLabel}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        <StatCard
          label="Uptime"
          value={telemetry.uptime.value}
          unit={telemetry.uptime.unit}
          icon={Activity}
          color={mapSeverityToCardColor(telemetry.uptime.severity)}
          trend={mapStatusToTrend(telemetry.uptime.status)}
          sparkline={telemetry.uptime.sparkline}
        />
        <StatCard
          label="Listeners"
          value={telemetry.listeners.value.toLocaleString()}
          icon={Users}
          color="purple"
          trend={telemetry.listeners.trend}
          sparkline={telemetry.listeners.sparkline}
          delay={0.05}
        />
        <StatCard
          label="Latency"
          value={telemetry.latency.value}
          unit={telemetry.latency.unit}
          icon={Gauge}
          color="cyan"
          trend={telemetry.latency.trend}
          sparkline={telemetry.latency.sparkline}
          delay={0.1}
        />
        <StatCard
          label="Stream"
          value={telemetry.streamBitrate.value}
          unit={telemetry.streamBitrate.unit}
          icon={Wifi}
          color={mapSeverityToCardColor(telemetry.streamBitrate.severity)}
          trend={mapStatusToTrend(telemetry.streamBitrate.status)}
          sparkline={telemetry.streamBitrate.sparkline}
          delay={0.15}
        />
        <StatCard
          label="AI Load"
          value={telemetry.aiLoad.value}
          unit={telemetry.aiLoad.unit}
          icon={Zap}
          color={mapSeverityToCardColor(telemetry.aiLoad.severity)}
          trend={mapStatusToTrend(telemetry.aiLoad.status)}
          sparkline={telemetry.aiLoad.sparkline}
          delay={0.2}
        />
      </div>

      <SectionHeader>Now Playing</SectionHeader>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <div className="glass-panel overflow-hidden">
            <div className="panel-header">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full bg-lime-500 animate-pulse"
                  style={{ boxShadow: "0 0 8px rgba(170,255,0,0.45)" }}
                />
                <span className="panel-header-title">Master Output</span>
              </div>
              <div className="flex items-center gap-2">
                <Signal size={10} className="text-lime-500" />
                <span className="text-[9px] font-mono text-zinc-500">
                  AAC 320k
                </span>
              </div>
            </div>
            <div className="p-3">
              <DegenWaveform
                progress={0.42}
                duration={234}
                trackTitle="Neural Drift v2.1 - SynthKong"
                isPlaying
                cuePoints={[
                  { position: 0.12, label: "CUE 1", color: "#ff6b00" },
                  { position: 0.68, label: "DROP", color: "#bf00ff" },
                ]}
              />
            </div>
          </div>
          <SectionHeader>On-Air Schedule</SectionHeader>
          <DegenScheduleTimeline />
        </div>

        <div className="space-y-4">
          <DegenAIHost className="glass-panel" />
        </div>
      </div>

      <SectionHeader>Audio Engine</SectionHeader>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="glass-panel overflow-hidden">
          <div className="panel-header">
            <span className="panel-header-title">Beat Sequencer</span>
          </div>
          <div className="p-3">
            <DegenBeatGrid decks={4} steps={16} />
          </div>
        </div>

        <DegenEffectRack
          title="Master FX"
          deck="MST"
          isActive
          controls={[
            { key: "reverb", label: "Reverb", unit: "%" },
            { key: "comp", label: "Comp", unit: "dB", max: 30 },
            { key: "rate", label: "Rate", unit: "Hz", max: 20 },
            { key: "limit", label: "Limiter", unit: "dB", max: 0 },
            { key: "width", label: "Stereo", unit: "%" },
          ]}
        />
      </div>
    </div>
  );
}
