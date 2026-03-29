import re

path = 'src/components/audio/DegenTransport.tsx'
with open(path, 'r') as f:
    content = f.read()

# Replace the lucide-react import block with a clean one containing Radio
new_import = """import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Shuffle,
    Repeat,
    Volume2,
    VolumeX,
    Volume1,
    Radio
} from 'lucide-react';"""

# Regex to match the existing block
# It starts with "import {" and ends with "} from 'lucide-react';"
# and contains "Play," etc.
import_regex = r"import\s+\{[^}]*Play,[^}]*\}\s+from\s+'lucide-react';"

content = re.sub(import_regex, new_import, content, flags=re.DOTALL)

with open(path, 'w') as f:
    f.write(content)

print("Transport import fixed.")
