
path = 'src/components/audio/DegenWaveform.tsx'
with open(path, 'r') as f:
    content = f.read()

# Fix duplicates in style objects (duplicate keys)
# Pattern: backgroundColor: ... \n boxShadow: ... \n backgroundColor: ... \n boxShadow: ...
# I'll replace the first occurrence of the specific bad lines.

# Bad block 1:
# backgroundColor: cue.color || 'hsl(var(--color-warning))',
# boxShadow: `0 0 4px ${cue.color || 'hsl(var(--color-warning))'}`,
content = content.replace("backgroundColor: cue.color || 'hsl(var(--color-warning))',\n                                boxShadow: `0 0 4px ${cue.color || 'hsl(var(--color-warning))'}`,\n", "")

# Fix triplicated div
# className="absolute bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 opacity-60 group-hover/cue:opacity-100 transition-opacity"
# style={{ backgroundColor: cue.color || 'hsl(var(--color-warning))' }}
content = content.replace('className="absolute bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 opacity-60 group-hover/cue:opacity-100 transition-opacity"\n                            style={{ backgroundColor: cue.color || \'hsl(var(--color-warning))\' }}\n                            ', "")

# className="absolute bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 opacity-60 group-hover/cue:opacity-100 transition-opacity motion-reduce:transition-none"
# style={{ backgroundColor: cue.color || '#ff6b00' }}
content = content.replace('className="absolute bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 opacity-60 group-hover/cue:opacity-100 transition-opacity motion-reduce:transition-none"\n                            style={{ backgroundColor: cue.color || \'#ff6b00\' }}\n                            ', "")


# Fix another duplicated div
# className="absolute bottom-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 text-[7px] font-black uppercase rounded opacity-0 group-hover/cue:opacity-100 transition-all duration-150 motion-reduce:transition-none whitespace-nowrap"
# style={{
#     backgroundColor: cue.color || 'hsl(var(--color-warning))',
#     color: 'hsl(var(--color-bg))',
#     boxShadow: `0 0 6px ${cue.color || 'hsl(var(--color-warning))'}`,
content = content.replace("backgroundColor: cue.color || 'hsl(var(--color-warning))',\n                                color: 'hsl(var(--color-bg))',\n                                boxShadow: `0 0 6px ${cue.color || 'hsl(var(--color-warning))'}`,\n", "")


# Fix duplicated button at the bottom
# style={{
#     borderColor: cue.color || 'hsla(var(--color-warning), 0.45)',
#     color: cue.color || 'hsl(var(--color-warning))',
#     background: cue.color ? `${cue.color}14` : 'hsla(var(--color-warning), 0.1)',
content = content.replace("borderColor: cue.color || 'hsla(var(--color-warning), 0.45)',\n                                color: cue.color || 'hsl(var(--color-warning))',\n                                background: cue.color ? `${cue.color}14` : 'hsla(var(--color-warning), 0.1)',\n", "")

with open(path, 'w') as f:
    f.write(content)

print("Waveform fixed.")
