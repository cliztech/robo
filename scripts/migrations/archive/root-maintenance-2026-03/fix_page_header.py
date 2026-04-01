import re

file_path = 'src/app/page.tsx'

imports = """'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ConsoleWorkspaceView } from '@/components/console/ConsoleWorkspaceView';
import { CONSOLE_NAV_ITEMS, CONSOLE_UTILITY_ITEMS } from '@/components/console/consoleNav';
import { ConsoleLayout } from '@/components/shell/ConsoleLayout';
import { useConsoleViewState } from '@/hooks/useConsoleViewState';
import {
    LayoutDashboard, Disc, Music, Sliders, Clock, Bot, Headphones, Gauge, Wifi, Users, TrendingUp, TrendingDown, Minus, Zap, Signal, AlertTriangle, Activity, Radio, Mic2, Settings as SettingsIcon
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

export default function StudioPage() {
    const { currentView, isOnAir, setCurrentView, toggleOnAir } = useConsoleViewState();

    type ViewMode = 'dashboard' | 'decks' | 'mixer' | 'library' | 'schedule' | 'ai-host';
"""

# I need to read the existing file, skip everything up to and including the second 'type ViewMode' definition?
# Or just find the start of the function body and splice.

with open(file_path, 'r') as f:
    lines = f.readlines()

# Find the line: "    type ViewMode = 'dashboard' | 'decks' | 'mixer' | 'library' | 'schedule' | 'ai-host';"
# And discard everything before it (except the function signature, which I'll rewrite).

# Actually, I'll search for the SidebarIcon definition which comes after.
# /* ═══════════════════════════════════════════════
#    SIDEBAR ICON — with glass hover and glow bar
#    ═══════════════════════════════════════════════ */

start_of_rest = -1
for i, line in enumerate(lines):
    if 'SIDEBAR ICON' in line:
        start_of_rest = i - 1 # Include the comment start
        break

if start_of_rest != -1:
    remaining_content = "".join(lines[start_of_rest:])
else:
    # If not found, try to find function SidebarIcon
    for i, line in enumerate(lines):
        if 'function SidebarIcon' in line:
            start_of_rest = i
            break
    if start_of_rest != -1:
         remaining_content = "".join(lines[start_of_rest:])
    else:
        print("Could not find sync point in page.tsx")
        exit(1)

# Wait, this logic deletes the rest of the StudioPage function body!
# The StudioPage function continues AFTER the SidebarIcon definition?
# No, usually helper components are outside.
# But `head` output showed SidebarIcon definition... inside?
# Let's check `head` again.
# "function SidebarIcon" is defined... wait, usually files have helper components at the bottom or top.
# If I look at the `cat` output from earlier, the file ENDS with `}`.
# SidebarIcon is used inside the render.
# Ah, lines 42-45 in the `head` output showed:
# /* ... SIDEBAR ICON ... */
# function SidebarIcon(...)

# This suggests SidebarIcon is defined INSIDE StudioPage or at the module level but appearing after.
# If it's at module level, then my splice is fine.
# If it's inside, then I am deleting the function body.

# Let's assume the file structure is:
# Imports
# export default function StudioPage() {
#    ... hooks ...
#    type ViewMode ...
#    ... logic ...
#    return ( ... );
# }
# function SidebarIcon ...

# The `head` output showed the start of SidebarIcon definition around line 50.
# If SidebarIcon is defined outside, then `StudioPage` must have ended?
# But I don't see a closing brace for `StudioPage` before SidebarIcon.
# This implies SidebarIcon is defined INSIDE StudioPage? That's unusual but possible.
# OR `head` output was misleading because I only asked for 40 lines.

# Let's look deeper into page.tsx to see where StudioPage ends.
pass
