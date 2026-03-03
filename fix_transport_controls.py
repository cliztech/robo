
path = 'src/components/audio/DegenTransport.tsx'
with open(path, 'r') as f:
    content = f.read()

# Define start and end markers
start_marker = '<div className="flex items-center gap-1 px-3 shrink-0">'
end_marker = '<div className="flex-1 flex items-center gap-3 px-4 min-w-0">'

# Find indices
start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find markers")
    exit(1)

# Construct clean controls block
clean_controls = """
                <button
                    onClick={() => setShuffle(!shuffle)}
                    aria-label="Toggle shuffle"
                    aria-pressed={shuffle}
                    className={cn(
                        'p-1.5 rounded transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                        shuffle ? 'text-deck-a' : 'text-zinc-600 hover:text-zinc-300'
                    )}
                >
                    <Shuffle size={12} />
                </button>

                <button
                    onClick={onPrev}
                    aria-label="Previous track"
                    className="p-1.5 rounded text-zinc-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                    <SkipBack size={14} fill="currentColor" />
                </button>

                <button
                    onClick={onPlayPause}
                    aria-label={isPlaying ? 'Pause playback' : 'Start playback'}
                    aria-pressed={isPlaying}
                    className={cn(
                        'relative w-10 h-10 rounded-full flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                        isPlaying
                            ? 'bg-deck-a-soft border border-deck-a-soft text-deck-a hover:bg-[hsla(var(--color-deck-a),0.2)]'
                            : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                    )}
                    style={isPlaying ? { boxShadow: 'var(--glow-deck-a-ring)' } : {}}
                >
                    {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                </button>

                <button
                    onClick={onNext}
                    aria-label="Next track"
                    className="p-1.5 rounded text-zinc-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                    <SkipForward size={14} fill="currentColor" />
                </button>

                <button
                    onClick={() => setRepeat(!repeat)}
                    aria-label="Toggle repeat"
                    aria-pressed={repeat}
                    className={cn(
                        'p-1.5 rounded transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                        repeat ? 'text-deck-b' : 'text-zinc-600 hover:text-zinc-300'
                    )}
                >
                    <Repeat size={12} />
                </button>
            </div>

            """

# Replace
new_content = content[:start_idx + len(start_marker)] + clean_controls + content[end_idx:]

with open(path, 'w') as f:
    f.write(new_content)

print("Controls fixed.")
