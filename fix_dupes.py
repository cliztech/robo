import re

# Fix DegenEffectRack.tsx
path = 'src/components/audio/DegenEffectRack.tsx'
with open(path, 'r') as f:
    content = f.read()
# Duplicate className
# className="p-1 rounded text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.03] transition-all"
# className="p-1 rounded-sm border border-transparent text-zinc-600 hover:text-zinc-400 hover:b...
content = re.sub(r'className="p-1 rounded text-zinc-600 hover:text-zinc-400 hover:bg-white/\[0.03\] transition-all"\s+', '', content)
with open(path, 'w') as f:
    f.write(content)

# Fix DegenWaveform.tsx
path = 'src/components/audio/DegenWaveform.tsx'
with open(path, 'r') as f:
    content = f.read()
# Duplicate fill
# fill={isPast ? waveColor : '#ffffff'}
# fill={isPast ? 'hsl(var(--color-waveform-played-strong))' : 'hsl(var(--color-waveform...
# I'll remove the first one.
content = content.replace("fill={isPast ? waveColor : '#ffffff'}\n", "")

# Another duplicate fill
# fill={waveColor}
# fill="hsl(var(--color-waveform-played-strong))"
content = content.replace("fill={waveColor}\n", "")

with open(path, 'w') as f:
    f.write(content)

# Fix DegenKnob.tsx
path = 'src/components/audio/DegenKnob.tsx'
with open(path, 'r') as f:
    content = f.read()
# Duplicate style
# style={{ filter: `drop-shadow(0 0 2px ${accentColor})` }}
# style={{ filter: `drop-shadow(0 0 4px color-mix(in srgb, ${accentColor} 35%, transparent)...
content = content.replace("style={{ filter: `drop-shadow(0 0 2px ${accentColor})` }}\n", "")

with open(path, 'w') as f:
    f.write(content)

print("Dupes fixed.")
