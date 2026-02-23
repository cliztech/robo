import re

path = 'src/components/audio/DegenEffectRack.tsx'
with open(path, 'r') as f:
    content = f.read()

# Remove the first deckColor block
# Match const deckColorToken ... up to const deckColor = `hsl...`;

bad_block_regex = r"const deckColorToken = deck === 'B'[^;]+;\s+const deckColor = `hsl\(var\(\$\{deckColorToken\}\)\)`;"

content = re.sub(bad_block_regex, "", content, flags=re.DOTALL)

with open(path, 'w') as f:
    f.write(content)

print("Effect Rack fixed.")
