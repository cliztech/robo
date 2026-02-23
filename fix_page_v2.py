import re

file_path = 'src/app/page.tsx'

with open(file_path, 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False

# We need to consolidate lucide-react imports
lucide_imports = set(['Bot', 'Clock', 'Disc', 'LayoutDashboard', 'Music', 'Sliders'])
# Add ones found in the debris
lucide_imports.update(['Activity', 'Radio', 'Mic2', 'AlertTriangle', 'Headphones', 'Settings']) # Assuming SettingsIcon is Settings

for i, line in enumerate(lines):
    stripped = line.strip()

    # Remove the partial import block
    if stripped == 'import {' and lines[i+1].strip().startswith('export default'):
        continue

    # Remove the debris lines
    if stripped in ['Activity,', 'Radio,', 'Mic2,']:
        continue

    # Remove existing lucide import to replace it later
    if 'from \'lucide-react\'' in stripped:
        continue

    new_lines.append(line)

# Insert the consolidated lucide import
import_line = f"import {{ {', '.join(sorted(list(lucide_imports)))} }} from 'lucide-react';\n"

# Find a good place to insert (after react import)
insert_idx = 0
for i, line in enumerate(new_lines):
    if 'from \'react\'' in line:
        insert_idx = i + 1
        break

new_lines.insert(insert_idx, import_line)

with open(file_path, 'w') as f:
    f.writelines(new_lines)

print("Page fixes applied.")
