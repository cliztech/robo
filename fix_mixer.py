path = 'src/components/audio/DegenMixer.tsx'
with open(path, 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False

for line in lines:
    stripped = line.strip()
    if '/* ── Fader Track SVG ───────── */' in stripped:
        new_lines.append(line)
        continue

    # Check for garbage objects
    if stripped.startswith("{ id: 'mic', label: 'MIC'") and stripped.endswith("},"):
        continue
    if stripped.startswith("{ id: 'aux', label: 'AUX'") and stripped.endswith("},"):
        continue
    if stripped.startswith("{ id: 'master', label: 'MASTER'") and stripped.endswith("},"):
        continue
    if stripped == "];":
        # Only skip if it follows the garbage (context check would be better but this is likely safe if formatted)
        # But wait, DEFAULT_CHANNELS ends with ];
        # The grep output showed:
        # ];
        #
        # /* ── Fader Track SVG ───────── */
        #     { id: 'mic', ...
        # ...
        # ];

        # So there is an extra ];
        # I'll check context.
        pass

    new_lines.append(line)

# Let's use a simpler regex on full content to remove the specific block.
content = "".join(lines)
bad_block = """/* ── Fader Track SVG ───────── */
    { id: 'mic', label: 'MIC', color: 'hsl(var(--color-deck-mic))', type: 'mic' },
    { id: 'aux', label: 'AUX', color: 'hsl(var(--color-deck-aux))', type: 'aux' },
    { id: 'master', label: 'MASTER', color: 'hsl(var(--color-deck-master))', type: 'master' },
];"""

# Wait, regex matches exact string. Spaces might differ.
# I'll manually construct the replacement.

content = content.replace("    { id: 'mic', label: 'MIC', color: 'hsl(var(--color-deck-mic))', type: 'mic' },\n", "")
content = content.replace("    { id: 'aux', label: 'AUX', color: 'hsl(var(--color-deck-aux))', type: 'aux' },\n", "")
content = content.replace("    { id: 'master', label: 'MASTER', color: 'hsl(var(--color-deck-master))', type: 'master' },\n", "")
# And the stray ];
content = content.replace("];\n\nfunction FaderTrack", "\nfunction FaderTrack")

with open(path, 'w') as f:
    f.write(content)

print("Mixer fixed.")
