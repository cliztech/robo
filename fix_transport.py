import re

file_path = 'src/components/audio/DegenTransport.tsx'

with open(file_path, 'r') as f:
    content = f.read()

# 1. Duplicate State Declarations
content = re.sub(
    r'(const \[volume, setVolume\] = useState\(85\);\s+const \[isMuted, setIsMuted\] = useState\(false\);\s+const \[repeat, setRepeat\] = useState\(false\);\s+const \[shuffle, setShuffle\] = useState\(false\);)(\s+const \[volume, setVolume\] = useState\(85\);\s+const \[isMuted, setIsMuted\] = useState\(false\);\s+const \[repeat, setRepeat\] = useState\(false\);\s+const \[shuffle, setShuffle\] = useState\(false\);)+',
    r'\1',
    content
)

# 2. Duplicate className in Previous button
content = content.replace(
    'className="p-1.5 rounded text-zinc-400 hover:text-white transition-colors"\n                    className="p-1.5 rounded text-zinc-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"',
    'className="p-1.5 rounded text-zinc-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"'
)

# 3. Duplicate Next button props
content = re.sub(
    r'<button onClick={onNext} className="p-1.5 rounded text-zinc-400 hover:text-white transition-colors">\s+<button',
    '<button',
    content
)
content = content.replace(
    'className="p-1.5 rounded text-zinc-400 hover:text-white transition-colors"\n                    className="p-1.5 rounded text-zinc-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"',
    'className="p-1.5 rounded text-zinc-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"'
)

# 4. Duplicate Repeat button props
# Using regex to match the structure roughly.
repeat_regex = r'<button\s+onClick=\{\(\) => setRepeat\(!repeat\)\}\s+className=\{cn\(\'p-1\.5 rounded transition-all\', repeat \? \'text-purple-400\' : \'text-zinc-600 hover:text-zinc-300\'\)\}\s+aria-label="Toggle repeat"\s+aria-pressed=\{repeat\}\s+className=\{cn\(\s+\'p-1\.5 rounded transition-all\',\s+repeat \? \'text-deck-b\' : \'text-zinc-600 hover:text-zinc-300\'\s+\'p-1\.5 rounded transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black\',\s+repeat \? \'text-purple-400\' : \'text-zinc-600 hover:text-zinc-300\'\s+\)\}\s+>'

repeat_replacement = """<button
                    onClick={() => setRepeat(!repeat)}
                    aria-label="Toggle repeat"
                    aria-pressed={repeat}
                    className={cn(
                        'p-1.5 rounded transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                        repeat ? 'text-deck-b' : 'text-zinc-600 hover:text-zinc-300'
                    )}
                >"""

content = re.sub(repeat_regex, repeat_replacement, content, flags=re.DOTALL)


# 5. Duplicate Progress Bar Input
input_bad = """<input
                        aria-label="Playback position"
                        type="range"
                        min={0}
                        max={1}
                        step={0.001}
                        value={progress}
                        onChange={(e) => setProgress(parseFloat(e.target.value))}
                        aria-label="Track progress"
                        onChange={(e) => setProgressOverride(parseFloat(e.target.value))}
                        className="absolute inset-x-0 h-7 w-full opacity-0 cursor-pointer z-10"
                    />"""

input_good = """<input
                        aria-label="Playback position"
                        type="range"
                        min={0}
                        max={1}
                        step={0.001}
                        value={progress}
                        onChange={(e) => setProgressOverride(parseFloat(e.target.value))}
                        className="absolute inset-x-0 h-7 w-full opacity-0 cursor-pointer z-10"
                    />"""

content = content.replace(input_bad, input_good)

# 6. Duplicate Progress Indicator (green dot)
indicator_bad_str = """<div
                        className="absolute w-3 h-3 rounded-full bg-lime-400 border-2 border-lime-500/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                        style={{ left: `calc(${progress * 100}% - 6px)`, boxShadow: '0 0 8px rgba(170,255,0,0.4)' }}
                        className="absolute w-3 h-3 rounded-full bg-[hsl(var(--color-deck-a))] border-2 border-deck-a-soft opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                        style={{
                            left: `calc(${progress * 100}% - 6px)`,
                            boxShadow: '0 0 8px hsla(var(--color-deck-a),0.4)',
                        }}
                    />"""

indicator_good_str = """<div
                        className="absolute w-3 h-3 rounded-full bg-[hsl(var(--color-deck-a))] border-2 border-deck-a-soft opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                        style={{
                            left: `calc(${progress * 100}% - 6px)`,
                            boxShadow: '0 0 8px hsla(var(--color-deck-a),0.4)',
                        }}
                    />"""

content = content.replace(indicator_bad_str, indicator_good_str)

# 7. Duplicate Key Display
key_bad_str = """<span className="text-[12px] font-mono font-black text-purple-400 tabular-nums">{track.key || '—'}</span>
                    <span className="text-[12px] font-mono font-black text-[hsl(var(--color-deck-b))] tabular-nums">
                        {currentTrack.key || '—'}
                    </span>"""

key_good_str = """<span className="text-[12px] font-mono font-black text-[hsl(var(--color-deck-b))] tabular-nums">
                        {currentTrack.key || '—'}
                    </span>"""
content = content.replace(key_bad_str, key_good_str)


# 8. Duplicate Mute Button
# Regex for Mute button
mute_regex = r'<button\s+onClick=\{\(\) => setIsMuted\(!isMuted\)\}\s+className=\{cn\(\'p-1 rounded transition-colors\', isMuted \? \'text-red-400\' : \'text-zinc-500 hover:text-zinc-300\'\)\}\s+aria-label=\{isMuted \? \'Unmute output\' : \'Mute output\'\}\s+aria-pressed=\{isMuted\}\s+className=\{cn\(\s+\'p-1 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black\',\s+isMuted \? \'text-red-400\' : \'text-zinc-500 hover:text-zinc-300\'\s+\)\}\s+>'

mute_good_str = """<button
                    onClick={() => setIsMuted(!isMuted)}
                    aria-label={isMuted ? 'Unmute output' : 'Mute output'}
                    aria-pressed={isMuted}
                    className={cn(
                        'p-1 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                        isMuted ? 'text-red-400' : 'text-zinc-500 hover:text-zinc-300'
                    )}
                >"""

content = re.sub(mute_regex, mute_good_str, content, flags=re.DOTALL)


# 9. Duplicate Volume Slider Input
volume_bad_str = """<input
                        aria-label="Output volume"
                        type="range"
                        min={0}
                        max={100}
                        value={isMuted ? 0 : volume}
                        onChange={(e) => {
                            setVolume(parseInt(e.target.value, 10));
                            if (isMuted) setIsMuted(false);
                        }}
                        aria-label="Output volume"
                        className="absolute inset-0 w-full opacity-0 cursor-pointer"
                    />"""

volume_good_str = """<input
                        aria-label="Output volume"
                        type="range"
                        min={0}
                        max={100}
                        value={isMuted ? 0 : volume}
                        onChange={(e) => {
                            setVolume(parseInt(e.target.value, 10));
                            if (isMuted) setIsMuted(false);
                        }}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer"
                    />"""
content = content.replace(volume_bad_str, volume_good_str)

with open(file_path, 'w') as f:
    f.write(content)

print("Fixes applied.")
