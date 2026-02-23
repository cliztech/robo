import re

file_path = 'src/app/page.tsx'

with open(file_path, 'r') as f:
    lines = f.readlines()

# Identify imports that are misplaced
misplaced_imports = []
clean_lines = []
inside_function = False

for line in lines:
    stripped = line.strip()
    if stripped.startswith('export default function'):
        inside_function = True
        clean_lines.append(line)
        continue

    if inside_function and stripped.startswith('import '):
        misplaced_imports.append(line)
    else:
        clean_lines.append(line)

# Insert misplaced imports at the top, after the last import
last_import_index = 0
for i, line in enumerate(clean_lines):
    if line.strip().startswith('import '):
        last_import_index = i

# Insert after the last import
clean_lines[last_import_index+1:last_import_index+1] = misplaced_imports

with open(file_path, 'w') as f:
    f.writelines(clean_lines)

print("Fixes applied.")
