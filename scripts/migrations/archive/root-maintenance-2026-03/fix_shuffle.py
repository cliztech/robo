import re
path = 'src/components/audio/DegenTransport.tsx'
with open(path, 'r') as f:
    content = f.read()

# Fix the Shuffle button CN block
# Bad pattern:
# className={cn(
#     'p-1.5 rounded transition-all',
#     shuffle ? 'text-deck-a' : 'text-zinc-600 hover:text-zinc-300'
#     'p-1.5 rounded transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
#     shuffle ? 'text-lime-400' : 'text-zinc-600 hover:text-zinc-300'
# )}

bad_shuffle = r"""className=\{cn\(\s+'p-1\.5 rounded transition-all',\s+shuffle \? 'text-deck-a' : 'text-zinc-600 hover:text-zinc-300'\s+'p-1\.5 rounded transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black',\s+shuffle \? 'text-lime-400' : 'text-zinc-600 hover:text-zinc-300'\s+\)\}"""

good_shuffle = """className={cn(
                        'p-1.5 rounded transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                        shuffle ? 'text-deck-a' : 'text-zinc-600 hover:text-zinc-300'
                    )}"""

content = re.sub(bad_shuffle, good_shuffle, content, flags=re.DOTALL)

with open(path, 'w') as f:
    f.write(content)
