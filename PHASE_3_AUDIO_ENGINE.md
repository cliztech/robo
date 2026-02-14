# Phase 3: Core Audio Engine Implementation

**Timeline**: Day 5-7  
**Goal**: Build professional-grade Web Audio API engine with crossfading, EQ, and visualization

## Prerequisites

- [ ] Phase 0, 1, 2 completed
- [ ] Understanding of Web Audio API
- [ ] Modern browser for testing

## Step 1: Create Audio Engine Core

Create file: `src/lib/audio/engine.ts`

```typescript
/**
 * AudioEngine - Core Web Audio API wrapper for broadcast automation
 * Handles playback, crossfading, EQ, compression, and analysis
 */

import { EventEmitter } from 'events'

export interface Track {
  id: string
  url: string
  title: string
  artist: string
  duration: number
  fadeIn?: number
  fadeOut?: number
  startAt?: number
  endAt?: number
  gain?: number
}

export interface AudioEngineConfig {
  sampleRate?: number
  latencyHint?: AudioContextLatencyCategory
  autoResume?: boolean
}

export interface AudioMetrics {
  currentTime: number
  duration: number
  remainingTime: number
  isPlaying: boolean
  volume: number
  frequencyData: Uint8Array
  waveformData: Uint8Array
  peakLevel: number
  rmsLevel: number
}

export class AudioEngine extends EventEmitter {
  private context: AudioContext | null = null
  private tracks: Map<string, AudioBuffer> = new Map()

  // Audio sources
  private currentSource: AudioBufferSourceNode | null = null
  private nextSource: AudioBufferSourceNode | null = null
  private currentTrack: Track | null = null
  private nextTrack: Track | null = null

  // Audio nodes - Main chain
  private masterGain: GainNode | null = null
  private currentGain: GainNode | null = null
  private nextGain: GainNode | null = null

  // Effects chain
  private eq: {
    low: BiquadFilterNode | null
    lowMid: BiquadFilterNode | null
    mid: BiquadFilterNode | null
    highMid: BiquadFilterNode | null
    high: BiquadFilterNode | null
  } = {
    low: null,
    lowMid: null,
    mid: null,
    highMid: null,
    high: null,
  }

  private compressor: DynamicsCompressorNode | null = null
  private limiter: DynamicsCompressorNode | null = null
  private analyser: AnalyserNode | null = null
  private meterAnalyser: AnalyserNode | null = null
  private meterDataArray: Uint8Array | null = null

  // State
  private isInitialized = false
  private startTime = 0
  private pauseTime = 0
  private isPaused = false
  private volume = 1.0

  // Crossfade state
  private crossfading = false
  private crossfadeStartTime = 0

  // Animation frame for updates
  private animationFrame: number | null = null

  // Configuration
  private config: Required<AudioEngineConfig>

  constructor(config: AudioEngineConfig = {}) {
    super()

    this.config = {
      sampleRate: config.sampleRate || 48000,
      latencyHint: config.latencyHint || 'interactive',
      autoResume: config.autoResume !== false,
    }
  }

  /**
   * Initialize audio context and create audio graph
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Create AudioContext
      this.context = new AudioContext({
        sampleRate: this.config.sampleRate,
        latencyHint: this.config.latencyHint,
      })

      // Handle suspended state (browser autoplay policy)
      if (this.context.state === 'suspended' && this.config.autoResume) {
        await this.context.resume()
      }

      // Create audio nodes
      this.createAudioGraph()

      this.isInitialized = true
      this.emit('initialized')

      // Start metrics update loop
      this.startMetricsLoop()
    } catch (error) {
      this.emit('error', { type: 'initialization', error })
      throw error
    }
  }

  /**
   * Create the complete audio processing graph
   */
  private createAudioGraph(): void {
    if (!this.context) throw new Error('AudioContext not initialized')

    // Create gain nodes for current and next tracks
    this.currentGain = this.context.createGain()
    this.nextGain = this.context.createGain()
    this.nextGain.gain.value = 0 // Start silent

    // Master gain
    this.masterGain = this.context.createGain()
    this.masterGain.gain.value = this.volume

    // 5-band parametric EQ
    // Low Shelf (80 Hz)
    this.eq.low = this.context.createBiquadFilter()
    this.eq.low.type = 'lowshelf'
    this.eq.low.frequency.value = 80
    this.eq.low.gain.value = 0

    // Low Mid Peak (250 Hz)
    this.eq.lowMid = this.context.createBiquadFilter()
    this.eq.lowMid.type = 'peaking'
    this.eq.lowMid.frequency.value = 250
    this.eq.lowMid.Q.value = 1
    this.eq.lowMid.gain.value = 0

    // Mid Peak (1000 Hz)
    this.eq.mid = this.context.createBiquadFilter()
    this.eq.mid.type = 'peaking'
    this.eq.mid.frequency.value = 1000
    this.eq.mid.Q.value = 1
    this.eq.mid.gain.value = 0

    // High Mid Peak (4000 Hz)
    this.eq.highMid = this.context.createBiquadFilter()
    this.eq.highMid.type = 'peaking'
    this.eq.highMid.frequency.value = 4000
    this.eq.highMid.Q.value = 1
    this.eq.highMid.gain.value = 0

    // High Shelf (8000 Hz)
    this.eq.high = this.context.createBiquadFilter()
    this.eq.high.type = 'highshelf'
    this.eq.high.frequency.value = 8000
    this.eq.high.gain.value = 0

    // Compressor (gentle, broadcast-style)
    this.compressor = this.context.createDynamicsCompressor()
    this.compressor.threshold.value = -24 // dB
    this.compressor.knee.value = 12 // dB
    this.compressor.ratio.value = 4
    this.compressor.attack.value = 0.003 // 3ms
    this.compressor.release.value = 0.25 // 250ms

    // Limiter (brick wall)
    this.limiter = this.context.createDynamicsCompressor()
    this.limiter.threshold.value = -1 // dB
    this.limiter.knee.value = 0
    this.limiter.ratio.value = 20
    this.limiter.attack.value = 0.001 // 1ms
    this.limiter.release.value = 0.1 // 100ms

    // Analyser for frequency/waveform visualization
    this.analyser = this.context.createAnalyser()
    this.analyser.fftSize = 2048
    this.analyser.smoothingTimeConstant = 0.8

    // Separate analyser for metering (no smoothing)
    this.meterAnalyser = this.context.createAnalyser()
    this.meterAnalyser.fftSize = 256
    this.meterAnalyser.smoothingTimeConstant = 0
    this.meterDataArray = new Uint8Array(this.meterAnalyser.frequencyBinCount)

    // Connect the audio graph
    this.currentGain.connect(this.eq.low!)
    this.nextGain.connect(this.eq.low!)
    this.eq.low!.connect(this.eq.lowMid!)
    this.eq.lowMid!.connect(this.eq.mid!)
    this.eq.mid!.connect(this.eq.highMid!)
    this.eq.highMid!.connect(this.eq.high!)
    this.eq.high!.connect(this.compressor)
    this.compressor.connect(this.limiter)
    this.limiter.connect(this.masterGain!)
    this.masterGain!.connect(this.analyser)
    this.masterGain!.connect(this.meterAnalyser)
    this.analyser.connect(this.context.destination)
  }

  /**
   * Load a track into memory
   */
  async loadTrack(track: Track): Promise<void> {
    if (!this.context) throw new Error('AudioContext not initialized')

    try {
      if (this.tracks.has(track.id)) {
        this.emit('track-loaded', { trackId: track.id, cached: true })
        return
      }

      const response = await fetch(track.url)
      if (!response.ok) throw new Error(`Failed to fetch track: ${response.statusText}`)

      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer)

      this.tracks.set(track.id, audioBuffer)
      this.emit('track-loaded', { trackId: track.id, duration: audioBuffer.duration })
    } catch (error) {
      this.emit('error', { type: 'track-load', trackId: track.id, error })
      throw error
    }
  }

  /**
   * Play a track immediately
   */
  async play(track: Track): Promise<void> {
    if (!this.context) throw new Error('AudioContext not initialized')

    if (this.context.state === 'suspended') {
      await this.context.resume()
    }

    if (!this.tracks.has(track.id)) {
      await this.loadTrack(track)
    }

    const buffer = this.tracks.get(track.id)
    if (!buffer) throw new Error('Track not loaded')

    this.stopCurrent()

    this.currentSource = this.context.createBufferSource()
    this.currentSource.buffer = buffer
    this.currentSource.connect(this.currentGain!)

    const gainValue = track.gain !== undefined ? track.gain : 1.0
    this.currentGain!.gain.setValueAtTime(gainValue, this.context.currentTime)

    const fadeIn = track.fadeIn || 0
    if (fadeIn > 0) {
      this.currentGain!.gain.setValueAtTime(0, this.context.currentTime)
      this.currentGain!.gain.linearRampToValueAtTime(gainValue, this.context.currentTime + fadeIn)
    }

    const startAt = track.startAt || 0
    const endAt = track.endAt || buffer.duration

    this.currentSource.start(this.context.currentTime, startAt, endAt - startAt)

    this.currentTrack = track
    this.startTime = this.context.currentTime - startAt
    this.isPaused = false

    this.currentSource.onended = () => {
      if (!this.crossfading) {
        this.emit('track-ended', { track })
      }
    }

    this.emit('track-started', { track })
  }

  /**
   * Crossfade to next track
   */
  async crossfade(nextTrack: Track, duration = 3): Promise<void> {
    if (!this.context) throw new Error('AudioContext not initialized')
    if (!this.currentSource || !this.currentTrack) {
      return this.play(nextTrack)
    }

    if (this.context.state === 'suspended') {
      await this.context.resume()
    }

    if (!this.tracks.has(nextTrack.id)) {
      await this.loadTrack(nextTrack)
    }

    const buffer = this.tracks.get(nextTrack.id)
    if (!buffer) throw new Error('Next track not loaded')

    this.crossfading = true
    this.crossfadeStartTime = this.context.currentTime

    this.nextSource = this.context.createBufferSource()
    this.nextSource.buffer = buffer
    this.nextSource.connect(this.nextGain!)

    const fadeOutStart = this.context.currentTime
    const fadeOutEnd = fadeOutStart + duration
    const fadeInStart = this.context.currentTime
    const fadeInEnd = fadeInStart + duration

    const currentGainValue = this.currentTrack.gain !== undefined ? this.currentTrack.gain : 1.0
    const nextGainValue = nextTrack.gain !== undefined ? nextTrack.gain : 1.0

    // Equal power crossfade
    this.currentGain!.gain.setValueAtTime(currentGainValue, fadeOutStart)
    this.currentGain!.gain.exponentialRampToValueAtTime(0.001, fadeOutEnd)

    this.nextGain!.gain.setValueAtTime(0.001, fadeInStart)
    this.nextGain!.gain.exponentialRampToValueAtTime(nextGainValue, fadeInEnd)

    const startAt = nextTrack.startAt || 0
    const endAt = nextTrack.endAt || buffer.duration
    this.nextSource.start(this.context.currentTime, startAt, endAt - startAt)

    this.nextTrack = nextTrack
    this.emit('crossfade-started', { from: this.currentTrack, to: nextTrack, duration })

    setTimeout(() => {
      this.completeCrossfade()
    }, duration * 1000)
  }

  /**
   * Complete crossfade and swap sources
   */
  private completeCrossfade(): void {
    if (!this.context) return

    if (this.currentSource) {
      try {
        this.currentSource.stop()
      } catch {
        // Already stopped
      }
      this.currentSource.disconnect()
      this.currentSource = null
    }

    this.currentSource = this.nextSource
    this.currentTrack = this.nextTrack
    this.nextSource = null
    this.nextTrack = null

    const swapGain = this.currentGain
    this.currentGain = this.nextGain
    this.nextGain = swapGain

    if (this.nextGain) {
      this.nextGain.gain.setValueAtTime(0, this.context.currentTime)
    }

    this.startTime = this.crossfadeStartTime - (this.currentTrack?.startAt || 0)
    this.crossfading = false
    this.emit('crossfade-completed', { track: this.currentTrack })

    if (this.currentSource) {
      this.currentSource.onended = () => {
        if (!this.crossfading) {
          this.emit('track-ended', { track: this.currentTrack })
        }
      }
    }
  }

  /**
   * Stop current playback
   */
  stop(): void {
    this.stopCurrent()
    this.currentTrack = null
    this.startTime = 0
    this.isPaused = false
    this.emit('stopped')
  }

  private stopCurrent(): void {
    if (this.currentSource) {
      try {
        this.currentSource.stop()
      } catch {
        // no-op
      }
      this.currentSource.disconnect()
      this.currentSource = null
    }
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (!this.context || !this.currentSource || this.isPaused) return

    this.pauseTime = this.context.currentTime - this.startTime
    this.stopCurrent()
    this.isPaused = true
    this.emit('paused', { at: this.pauseTime })
  }

  /**
   * Resume playback
   */
  async resume(): Promise<void> {
    if (!this.context || !this.currentTrack || !this.isPaused) return

    if (this.context.state === 'suspended') {
      await this.context.resume()
    }

    const buffer = this.tracks.get(this.currentTrack.id)
    if (!buffer) throw new Error('Track not loaded')

    this.currentSource = this.context.createBufferSource()
    this.currentSource.buffer = buffer
    this.currentSource.connect(this.currentGain!)

    const remainingDuration = buffer.duration - this.pauseTime
    this.currentSource.start(this.context.currentTime, this.pauseTime, remainingDuration)

    this.startTime = this.context.currentTime - this.pauseTime
    this.isPaused = false

    this.currentSource.onended = () => {
      if (!this.crossfading) {
        this.emit('track-ended', { track: this.currentTrack })
      }
    }

    this.emit('resumed', { from: this.pauseTime })
  }

  /**
   * Set master volume (0 to 1)
   */
  setVolume(level: number): void {
    if (!this.context || !this.masterGain) return

    const clampedLevel = Math.max(0, Math.min(1, level))
    this.volume = clampedLevel

    const now = this.context.currentTime
    this.masterGain.gain.cancelScheduledValues(now)
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now)
    this.masterGain.gain.exponentialRampToValueAtTime(Math.max(0.001, clampedLevel), now + 0.05)

    this.emit('volume-changed', { level: clampedLevel })
  }

  /**
   * Set EQ band gain (-12 to +12 dB)
   */
  setEQ(band: 'low' | 'lowMid' | 'mid' | 'highMid' | 'high', gain: number): void {
    if (!this.context) return

    const filter = this.eq[band]
    if (!filter) return

    const clampedGain = Math.max(-12, Math.min(12, gain))
    const now = this.context.currentTime

    filter.gain.cancelScheduledValues(now)
    filter.gain.setValueAtTime(filter.gain.value, now)
    filter.gain.linearRampToValueAtTime(clampedGain, now + 0.05)

    this.emit('eq-changed', { band, gain: clampedGain })
  }

  /**
   * Get current audio metrics
   */
  getMetrics(): AudioMetrics {
    if (!this.context || !this.analyser || !this.meterAnalyser || !this.meterDataArray) {
      return {
        currentTime: 0,
        duration: 0,
        remainingTime: 0,
        isPlaying: false,
        volume: this.volume,
        frequencyData: new Uint8Array(0),
        waveformData: new Uint8Array(0),
        peakLevel: 0,
        rmsLevel: 0,
      }
    }

    const frequencyData = new Uint8Array(this.analyser.frequencyBinCount)
    this.analyser.getByteFrequencyData(frequencyData)

    const waveformData = new Uint8Array(this.analyser.fftSize)
    this.analyser.getByteTimeDomainData(waveformData)

    this.meterAnalyser.getByteTimeDomainData(this.meterDataArray)

    let peak = 0
    let sumSquares = 0
    for (let i = 0; i < this.meterDataArray.length; i++) {
      const normalized = (this.meterDataArray[i] - 128) / 128
      const abs = Math.abs(normalized)
      if (abs > peak) peak = abs
      sumSquares += normalized * normalized
    }

    const rms = Math.sqrt(sumSquares / this.meterDataArray.length)

    const currentTime = this.isPaused ? this.pauseTime : this.context.currentTime - this.startTime

    const duration = this.currentTrack ? (this.tracks.get(this.currentTrack.id)?.duration || 0) : 0

    const remainingTime = Math.max(0, duration - currentTime)

    return {
      currentTime,
      duration,
      remainingTime,
      isPlaying: !this.isPaused && !!this.currentSource,
      volume: this.volume,
      frequencyData,
      waveformData,
      peakLevel: peak,
      rmsLevel: rms,
    }
  }

  /**
   * Start metrics update loop
   */
  private startMetricsLoop(): void {
    const update = () => {
      this.emit('metrics-update', this.getMetrics())
      this.animationFrame = requestAnimationFrame(update)
    }
    update()
  }

  getCurrentTrack(): Track | null {
    return this.currentTrack
  }

  getNextTrack(): Track | null {
    return this.nextTrack
  }

  isCrossfading(): boolean {
    return this.crossfading
  }

  /**
   * Destroy engine and release resources
   */
  async destroy(): Promise<void> {
    this.stop()

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }

    this.currentGain?.disconnect()
    this.nextGain?.disconnect()
    this.masterGain?.disconnect()
    this.eq.low?.disconnect()
    this.eq.lowMid?.disconnect()
    this.eq.mid?.disconnect()
    this.eq.highMid?.disconnect()
    this.eq.high?.disconnect()
    this.compressor?.disconnect()
    this.limiter?.disconnect()
    this.analyser?.disconnect()
    this.meterAnalyser?.disconnect()

    if (this.context && this.context.state !== 'closed') {
      await this.context.close()
    }

    this.context = null
    this.tracks.clear()
    this.isInitialized = false

    this.emit('destroyed')
    this.removeAllListeners()
  }
}
```

## Step 2: Create Audio Engine Hook

Create file: `src/hooks/useAudioEngine.ts`

```typescript
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { AudioEngine, Track, AudioMetrics } from '@/lib/audio/engine'

export interface UseAudioEngineReturn {
  engine: AudioEngine | null
  isInitialized: boolean
  currentTrack: Track | null
  isPlaying: boolean
  metrics: AudioMetrics | null
  initialize: () => Promise<void>
  play: (track: Track) => Promise<void>
  crossfade: (track: Track, duration?: number) => Promise<void>
  stop: () => void
  pause: () => void
  resume: () => Promise<void>
  setVolume: (level: number) => void
  setEQ: (band: string, gain: number) => void
  error: Error | null
}

export function useAudioEngine(): UseAudioEngineReturn {
  const engineRef = useRef<AudioEngine | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [metrics, setMetrics] = useState<AudioMetrics | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const initialize = useCallback(async () => {
    if (engineRef.current) return

    try {
      const engine = new AudioEngine({
        sampleRate: 48000,
        latencyHint: 'interactive',
        autoResume: true,
      })

      await engine.initialize()
      engineRef.current = engine
      setIsInitialized(true)
      setError(null)
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }, [])

  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return

    const handleTrackStarted = ({ track }: { track: Track }) => {
      setCurrentTrack(track)
      setIsPlaying(true)
    }

    const handleTrackEnded = () => {
      setIsPlaying(false)
    }

    const handlePaused = () => {
      setIsPlaying(false)
    }

    const handleResumed = () => {
      setIsPlaying(true)
    }

    const handleStopped = () => {
      setCurrentTrack(null)
      setIsPlaying(false)
    }

    const handleMetricsUpdate = (newMetrics: AudioMetrics) => {
      setMetrics(newMetrics)
    }

    const handleError = ({ error: err }: { error: Error }) => {
      setError(err)
    }

    engine.on('track-started', handleTrackStarted)
    engine.on('track-ended', handleTrackEnded)
    engine.on('paused', handlePaused)
    engine.on('resumed', handleResumed)
    engine.on('stopped', handleStopped)
    engine.on('metrics-update', handleMetricsUpdate)
    engine.on('error', handleError)

    return () => {
      engine.off('track-started', handleTrackStarted)
      engine.off('track-ended', handleTrackEnded)
      engine.off('paused', handlePaused)
      engine.off('resumed', handleResumed)
      engine.off('stopped', handleStopped)
      engine.off('metrics-update', handleMetricsUpdate)
      engine.off('error', handleError)
    }
  }, [isInitialized])

  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy()
        engineRef.current = null
      }
    }
  }, [])

  const play = useCallback(async (track: Track) => {
    if (!engineRef.current) throw new Error('Engine not initialized')
    await engineRef.current.play(track)
  }, [])

  const crossfade = useCallback(async (track: Track, duration = 3) => {
    if (!engineRef.current) throw new Error('Engine not initialized')
    await engineRef.current.crossfade(track, duration)
  }, [])

  const stop = useCallback(() => {
    if (!engineRef.current) return
    engineRef.current.stop()
  }, [])

  const pause = useCallback(() => {
    if (!engineRef.current) return
    engineRef.current.pause()
  }, [])

  const resume = useCallback(async () => {
    if (!engineRef.current) return
    await engineRef.current.resume()
  }, [])

  const setVolume = useCallback((level: number) => {
    if (!engineRef.current) return
    engineRef.current.setVolume(level)
  }, [])

  const setEQ = useCallback((band: string, gain: number) => {
    if (!engineRef.current) return
    engineRef.current.setEQ(band as any, gain)
  }, [])

  return {
    engine: engineRef.current,
    isInitialized,
    currentTrack,
    isPlaying,
    metrics,
    initialize,
    play,
    crossfade,
    stop,
    pause,
    resume,
    setVolume,
    setEQ,
    error,
  }
}
```

## Step 3: Create Audio Analyzer

Create file: `src/lib/audio/analyzer.ts`

```typescript
export interface FrequencyBands {
  subBass: number
  bass: number
  lowMid: number
  mid: number
  highMid: number
  presence: number
  brilliance: number
}

export class AudioAnalyzer {
  static analyzeFrequencyBands(
    frequencyData: Uint8Array,
    sampleRate: number = 48000
  ): FrequencyBands {
    const nyquist = sampleRate / 2
    const binWidth = nyquist / frequencyData.length

    const getBandAverage = (startFreq: number, endFreq: number): number => {
      const startBin = Math.floor(startFreq / binWidth)
      const endBin = Math.ceil(endFreq / binWidth)

      let sum = 0
      let count = 0

      for (let i = startBin; i < endBin && i < frequencyData.length; i++) {
        sum += frequencyData[i]
        count++
      }

      return count > 0 ? sum / count / 255 : 0
    }

    return {
      subBass: getBandAverage(20, 60),
      bass: getBandAverage(60, 250),
      lowMid: getBandAverage(250, 500),
      mid: getBandAverage(500, 2000),
      highMid: getBandAverage(2000, 4000),
      presence: getBandAverage(4000, 6000),
      brilliance: getBandAverage(6000, 20000),
    }
  }

  static calculateSpectralCentroid(
    frequencyData: Uint8Array,
    sampleRate: number = 48000
  ): number {
    let weightedSum = 0
    let sum = 0

    const nyquist = sampleRate / 2
    const binWidth = nyquist / frequencyData.length

    for (let i = 0; i < frequencyData.length; i++) {
      const frequency = i * binWidth
      const magnitude = frequencyData[i]
      weightedSum += frequency * magnitude
      sum += magnitude
    }

    return sum > 0 ? weightedSum / sum : 0
  }

  static calculateEnergy(waveformData: Uint8Array): number {
    let sum = 0
    for (let i = 0; i < waveformData.length; i++) {
      const normalized = (waveformData[i] - 128) / 128
      sum += normalized * normalized
    }
    return sum / waveformData.length
  }

  static calculateRMS(waveformData: Uint8Array): number {
    return Math.sqrt(this.calculateEnergy(waveformData))
  }

  static calculatePeak(waveformData: Uint8Array): number {
    let peak = 0
    for (let i = 0; i < waveformData.length; i++) {
      const normalized = Math.abs((waveformData[i] - 128) / 128)
      if (normalized > peak) peak = normalized
    }
    return peak
  }

  static detectClipping(waveformData: Uint8Array, threshold: number = 0.99): boolean {
    const peak = this.calculatePeak(waveformData)
    return peak >= threshold
  }
}
```

## Step 4: Create Audio Player Component

Create file: `src/components/audio/AudioPlayer.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useAudioEngine } from '@/hooks/useAudioEngine'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Play, Pause, SkipForward, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/lib/utils'

interface AudioPlayerProps {
  playlist: Array<{
    id: string
    url: string
    title: string
    artist: string
    duration: number
  }>
  autoPlay?: boolean
  className?: string
}

export function AudioPlayer({ playlist, autoPlay = false, className }: AudioPlayerProps) {
  const {
    isInitialized,
    currentTrack,
    isPlaying,
    metrics,
    initialize,
    play,
    crossfade,
    pause,
    resume,
    setVolume,
  } = useAudioEngine()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [volume, setVolumeState] = useState(70)
  const [isMuted, setIsMuted] = useState(false)
  const [prevVolume, setPrevVolume] = useState(70)

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (isInitialized && autoPlay && playlist.length > 0 && !currentTrack) {
      handlePlay(0)
    }
  }, [isInitialized, autoPlay, playlist, currentTrack])

  useEffect(() => {
    if (!isPlaying && currentTrack && metrics) {
      if (metrics.remainingTime < 0.1) {
        handleNext()
      }
    }
  }, [isPlaying, currentTrack, metrics])

  const handlePlay = async (index: number) => {
    if (index < 0 || index >= playlist.length) return

    const track = playlist[index]
    await play({
      id: track.id,
      url: track.url,
      title: track.title,
      artist: track.artist,
      duration: track.duration,
      fadeIn: 0.5,
    })

    setCurrentIndex(index)
  }

  const handleCrossfade = async (index: number) => {
    if (index < 0 || index >= playlist.length) return

    const track = playlist[index]
    await crossfade(
      {
        id: track.id,
        url: track.url,
        title: track.title,
        artist: track.artist,
        duration: track.duration,
        fadeIn: 3,
      },
      3
    )

    setCurrentIndex(index)
  }

  const handlePlayPause = () => {
    if (isPlaying) {
      pause()
    } else {
      if (currentTrack) {
        resume()
      } else if (playlist.length > 0) {
        handlePlay(0)
      }
    }
  }

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % playlist.length

    if (currentTrack) {
      handleCrossfade(nextIndex)
    } else {
      handlePlay(nextIndex)
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolumeState(newVolume)
    setVolume(newVolume / 100)

    if (isMuted && newVolume > 0) {
      setIsMuted(false)
    }
  }

  const toggleMute = () => {
    if (isMuted) {
      setVolume(prevVolume / 100)
      setVolumeState(prevVolume)
      setIsMuted(false)
    } else {
      setPrevVolume(volume)
      setVolume(0)
      setVolumeState(0)
      setIsMuted(true)
    }
  }

  const currentPlaylistTrack = playlist[currentIndex]
  const progress = metrics ? (metrics.currentTime / metrics.duration) * 100 : 0

  return (
    <div className={cn('bg-zinc-900 rounded-lg p-6 space-y-4', className)}>
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white">
          {currentTrack?.title || currentPlaylistTrack?.title || 'No track loaded'}
        </h3>
        <p className="text-sm text-zinc-400">
          {currentTrack?.artist || currentPlaylistTrack?.artist || '—'}
        </p>
      </div>

      <div className="space-y-2">
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-zinc-500">
          <span>{formatDuration(metrics?.currentTime || 0)}</span>
          <span>{formatDuration(metrics?.duration || currentPlaylistTrack?.duration || 0)}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button
          size="lg"
          variant="ghost"
          onClick={handleNext}
          disabled={!isInitialized || playlist.length === 0}
        >
          <SkipForward className="w-5 h-5" />
        </Button>

        <Button
          size="lg"
          onClick={handlePlayPause}
          disabled={!isInitialized || playlist.length === 0}
          className="w-14 h-14 rounded-full"
        >
          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
        </Button>

        <Button
          size="lg"
          variant="ghost"
          onClick={handleNext}
          disabled={!isInitialized || playlist.length === 0}
        >
          <SkipForward className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Button size="sm" variant="ghost" onClick={toggleMute}>
          {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </Button>

        <Slider
          value={[volume]}
          max={100}
          step={1}
          onValueChange={handleVolumeChange}
          className="flex-1"
        />

        <span className="text-xs text-zinc-400 w-10 text-right">{Math.round(volume)}%</span>
      </div>
    </div>
  )
}
```

## Verification Checklist

- [ ] Audio engine initializes without errors
- [ ] Tracks load and play correctly
- [ ] Crossfade works smoothly
- [ ] Volume control functions
- [ ] Pause/resume works
- [ ] Metrics update in real-time
- [ ] No memory leaks on destroy

## Next Steps

Proceed to `PHASE_4_FILE_UPLOAD.md` for file upload implementation.

**Estimated Time**: 8-12 hours  
**Last Updated**: February 14, 2026
