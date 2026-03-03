import re

file_path = 'src/app/page.tsx'

header_imports = """'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ConsoleWorkspaceView } from '@/components/console/ConsoleWorkspaceView';
import { CONSOLE_NAV_ITEMS, CONSOLE_UTILITY_ITEMS } from '@/components/console/consoleNav';
import { ConsoleLayout } from '@/components/shell/ConsoleLayout';
import { useConsoleViewState } from '@/hooks/useConsoleViewState';
import {
    LayoutDashboard, Disc, Music, Sliders, Clock, Bot, Headphones, Gauge, Wifi, Users, TrendingUp, TrendingDown, Minus, Zap, Signal, AlertTriangle, Activity, Radio, Mic2, Settings as SettingsIcon, Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Volume2, VolumeX, Volume1
} from 'lucide-react';
import { DegenAIHost } from '../components/ai/DegenAIHost';
import { LibraryBrowser } from '../components/shell/library-browser';
import { MixerPanel } from '../components/shell/mixer-panel';
import { DegenScheduleTimeline } from '../components/schedule/DegenScheduleTimeline';
import { AppShell, type ShellNavItem } from '../components/shell/app-shell';
import { DashboardView, DecksView } from '../components/shell/console-views';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { createDJTelemetry, type DJTelemetry } from '../lib/audio/telemetry';
import { createMockTelemetry } from '../lib/audio/mockTelemetry';
import { cn } from '../lib/utils';
import { DegenEffectRack } from '../components/audio/DegenEffectRack';
import { DegenBeatGrid } from '../components/audio/DegenBeatGrid';
import { DegenWaveform } from '../components/audio/DegenWaveform';
import { DegenMixer } from '../components/audio/DegenMixer';
import { DegenTransport } from '../components/audio/DegenTransport';
import { DegenTrackList } from '../components/audio/DegenTrackList';
import { StageTimeline } from '../components/workflow/StageTimeline';
import { DegenButton } from '../components/primitives/DegenButton';
import { GorillaLogo, Sidebar, TabStrip, Topbar, Workspace } from '../components/shell';

"""

with open(file_path, 'r') as f:
    lines = f.readlines()

# Find the start of the function
func_start_idx = -1
for i, line in enumerate(lines):
    if 'export default function StudioPage' in line:
        func_start_idx = i
        break

if func_start_idx == -1:
    print("Could not find function start")
    exit(1)

# Keep everything from function start onwards
body_lines = lines[func_start_idx:]

# Remove the garbage block inside the function
# The garbage starts after "type ViewMode..." and ends before the second "type ViewMode..."?
# Or rather, let's look for the garbage identifiers lines.
# "    LayoutDashboard,"
# ...
# "    AlertTriangle,"

clean_body = []
skip = False
for line in body_lines:
    stripped = line.strip()
    if stripped == 'LayoutDashboard,':
        skip = True

    if skip:
        if stripped == 'AlertTriangle,':
            skip = False
            continue # skip this last line too
        continue

    clean_body.append(line)

# Combine
final_content = header_imports + "".join(clean_body)

with open(file_path, 'w') as f:
    f.write(final_content)

print("Page final fix applied.")
