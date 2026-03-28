'use client';

import {
  CalendarClock,
  Disc3,
  Headphones,
  ListMusic,
  Mic2,
  Radio,
  Signal,
  SlidersHorizontal,
  Sparkles,
  TimerReset,
  Users,
  WandSparkles,
} from 'lucide-react';

interface StationMetric {
  label: string;
  value: string;
  tone: 'lime' | 'cyan' | 'violet' | 'amber';
}

interface ScheduleLaneItem {
  time: string;
  title: string;
  detail: string;
  status: 'live' | 'queued' | 'locked';
}

interface PlaylistItem {
  title: string;
  artist: string;
  mix: string;
  energy: string;
  length: string;
}

const stationMetrics: StationMetric[] = [
  { label: 'Stream health', value: '99.992%', tone: 'lime' },
  { label: 'Active listeners', value: '12.4K', tone: 'cyan' },
  { label: 'Automation confidence', value: '96.1', tone: 'violet' },
  { label: 'Ad clock margin', value: '+00:18', tone: 'amber' },
];

const scheduleLane: ScheduleLaneItem[] = [
  { time: '06:00', title: 'Sunrise Drive', detail: 'Music sweep + top of hour imaging', status: 'live' },
  { time: '06:15', title: 'Host break', detail: 'Weather, traffic, sponsor sting', status: 'queued' },
  { time: '06:30', title: 'A-list recurrence', detail: 'Hot rotation / power currents', status: 'queued' },
  { time: '06:52', title: 'News network join', detail: 'Hard-timed network window', status: 'locked' },
  { time: '07:00', title: 'Morning flagship', detail: 'Dual host mode + listener hooks', status: 'queued' },
];

const playlist: PlaylistItem[] = [
  { title: 'Neon Skyline', artist: 'Aria Vector', mix: 'Power recurrent', energy: '88', length: '03:24' },
  { title: 'Static Hearts', artist: 'Midnight Relay', mix: 'Gold separator', energy: '72', length: '04:02' },
  { title: 'Signal Bloom', artist: 'Chrome Aurora', mix: 'Category A / female pop', energy: '84', length: '03:37' },
  { title: 'Frequency Atlas', artist: 'DGN House Band', mix: 'Imaging bed', energy: '61', length: '00:32' },
  { title: 'Citylight Echo', artist: 'Nova Kin', mix: 'Power recurrent', energy: '91', length: '03:11' },
];

const hostTools = [
  'Voice tracking with intro/outro timing',
  'Hot keys for station ID, legal ID, and emergency takeover',
  'Listener request inbox with priority queue',
  'Sponsor clock guardrail and make-good alerts',
];

const streamTargets = [
  { name: 'Main AAC 320', detail: 'Icecast primary • On-air stable', tone: 'lime' },
  { name: 'Mobile AAC+ 96', detail: 'Low-bandwidth mirror • Healthy', tone: 'cyan' },
  { name: 'Smart speaker MP3', detail: 'Metadata relay • Synced', tone: 'violet' },
  { name: 'Confidence monitor', detail: 'Producer return • 46 ms', tone: 'amber' },
];

export function RadioStationControlRoom() {
  return (
    <section className="radio-station-screen" role="region" aria-label="Radio station control room">
      <div className="radio-station-hero glass-panel skin-panel overflow-hidden">
        <div className="radio-station-hero__backdrop" aria-hidden />
        <div className="radio-station-hero__content">
          <div>
            <div className="radio-station-kicker">
              <Radio size={14} />
              Station operations command deck
            </div>
            <h2 className="radio-station-title">Run the full station from one cinematic broadcast surface.</h2>
            <p className="radio-station-copy">
              Scheduling, playlists, live assist, voice breaks, sponsor clocks, stream outputs, and operator safeguards are fused into a single high-fidelity control room for always-on internet radio.
            </p>
          </div>
          <div className="radio-station-nowcard">
            <div className="radio-station-nowcard__eyebrow">Now on air</div>
            <div className="radio-station-nowcard__title">Sunrise Drive • DGN Pulse FM</div>
            <div className="radio-station-nowcard__meta">
              <span><Disc3 size={12} /> Neon Skyline</span>
              <span><Mic2 size={12} /> Break in 00:42</span>
              <span><Signal size={12} /> 4 outputs green</span>
            </div>
            <div className="radio-station-wavegrid" aria-hidden>
              {Array.from({ length: 20 }, (_, index) => (
                <span key={index} style={{ height: `${32 + ((index * 17) % 54)}%` }} />
              ))}
            </div>
          </div>
        </div>
        <div className="radio-station-metrics" role="list" aria-label="Station metrics">
          {stationMetrics.map((metric) => (
            <div key={metric.label} className="radio-station-metric" data-tone={metric.tone} role="listitem">
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="radio-station-grid">
        <section className="glass-panel skin-panel radio-station-panel radio-station-panel--schedule">
          <div className="panel-header">
            <span className="panel-header-title">Clock & scheduling</span>
            <span className="radio-station-chip radio-station-chip--lime"><CalendarClock size={12} /> Clock locked</span>
          </div>
          <div className="radio-station-schedule-lane" role="list" aria-label="Upcoming schedule events">
            {scheduleLane.map((item) => (
              <article key={`${item.time}-${item.title}`} className="radio-station-schedule-item" data-status={item.status} role="listitem">
                <div className="radio-station-schedule-item__time">{item.time}</div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.detail}</p>
                </div>
                <span className="radio-station-status-pill">{item.status}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="glass-panel skin-panel radio-station-panel radio-station-panel--playlist">
          <div className="panel-header">
            <span className="panel-header-title">Smart playlist stack</span>
            <span className="radio-station-chip radio-station-chip--violet"><Sparkles size={12} /> AI balanced</span>
          </div>
          <div className="radio-station-playlist" role="table" aria-label="Playlist queue">
            {playlist.map((track, index) => (
              <article key={track.title} className="radio-station-playlist__row" role="row">
                <div className="radio-station-playlist__index" aria-hidden>{String(index + 1).padStart(2, '0')}</div>
                <div className="radio-station-playlist__title" role="cell">
                  <strong>{track.title}</strong>
                  <span>{track.artist}</span>
                </div>
                <div className="radio-station-playlist__meta" role="cell">
                  <span>{track.mix}</span>
                  <span>Energy {track.energy}</span>
                </div>
                <div className="radio-station-playlist__length" role="cell">{track.length}</div>
              </article>
            ))}
          </div>
        </section>

        <section className="glass-panel skin-panel radio-station-panel radio-station-panel--host-tools">
          <div className="panel-header">
            <span className="panel-header-title">Host tools & live assist</span>
            <span className="radio-station-chip radio-station-chip--cyan"><Headphones size={12} /> Confidence mode</span>
          </div>
          <div className="radio-station-tool-grid">
            <div className="radio-station-feature-card" data-tone="cyan">
              <Mic2 size={16} />
              <div>
                <strong>Voice break composer</strong>
                <p>Auto-times spoken breaks against intros, outros, and hard breaks.</p>
              </div>
            </div>
            <div className="radio-station-feature-card" data-tone="lime">
              <ListMusic size={16} />
              <div>
                <strong>Playlist guardrails</strong>
                <p>Enforces rotations, artist separation, category rules, and tempo continuity.</p>
              </div>
            </div>
            <div className="radio-station-feature-card" data-tone="violet">
              <SlidersHorizontal size={16} />
              <div>
                <strong>Live assist macros</strong>
                <p>One-touch dump, segue extension, emergency fill, and remote host handoff.</p>
              </div>
            </div>
            <div className="radio-station-feature-card" data-tone="amber">
              <TimerReset size={16} />
              <div>
                <strong>Clock recovery</strong>
                <p>Predicts drift and recommends trims before sponsor or news joins slip.</p>
              </div>
            </div>
          </div>
          <ul className="radio-station-tool-list">
            {hostTools.map((tool) => (
              <li key={tool}>{tool}</li>
            ))}
          </ul>
        </section>

        <section className="glass-panel skin-panel radio-station-panel radio-station-panel--streams">
          <div className="panel-header">
            <span className="panel-header-title">Outputs, compliance, and audience</span>
            <span className="radio-station-chip radio-station-chip--amber"><Users size={12} /> Multi-platform live</span>
          </div>
          <div className="radio-station-streams">
            {streamTargets.map((stream) => (
              <div key={stream.name} className="radio-station-stream" data-tone={stream.tone}>
                <strong>{stream.name}</strong>
                <span>{stream.detail}</span>
              </div>
            ))}
          </div>
          <div className="radio-station-compliance">
            <div>
              <span className="radio-station-compliance__label">Legal ID</span>
              <strong>Due in 13:20</strong>
            </div>
            <div>
              <span className="radio-station-compliance__label">Ad stopset</span>
              <strong>Locked 07:14:30</strong>
            </div>
            <div>
              <span className="radio-station-compliance__label">Remote talent</span>
              <strong>2 contributors armed</strong>
            </div>
            <div>
              <span className="radio-station-compliance__label">Automation</span>
              <strong><WandSparkles size={12} /> Predictive handoff ready</strong>
            </div>
          </div>
          <div className="radio-station-audience-bar" aria-hidden>
            <span style={{ width: '88%' }} />
          </div>
          <p className="radio-station-footnote">
            Designed as the high-gloss radio station surface: built for scheduling, playlist rotation, host execution, imaging, ads, compliance, and 24/7 online stream control.
          </p>
        </section>
      </div>
    </section>
  );
}
