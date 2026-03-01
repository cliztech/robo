
file_path = 'src/app/page.tsx'

with open(file_path, 'r') as f:
    lines = f.readlines()

# Truncate at the second "export default function"
first_export_found = False
truncate_index = -1

for i, line in enumerate(lines):
    if 'export default function StudioPage' in line:
        if first_export_found:
            truncate_index = i
            break
        first_export_found = True

if truncate_index != -1:
    lines = lines[:truncate_index]

# Fix internal duplicates in the remaining lines
content = "".join(lines)

# Fix double ViewMode
content = content.replace("type ViewMode = 'dashboard' | 'decks' | 'mixer' | 'library' | 'schedule' | 'ai-host';\n\n\ntype ViewMode = 'dashboard' | 'decks' | 'mixer' | 'library' | 'schedule' | 'ai-host';", "type ViewMode = 'dashboard' | 'decks' | 'mixer' | 'library' | 'schedule' | 'ai-host';")

# Fix SidebarIcon duplicates
# aria-label={label}
# aria-pressed={active}
# aria-label={badge ? `${label}, ${badge} new items` : label}
# aria-pressed={active}
# aria-label={label}

# I'll replace this block with the correct one.
bad_sidebar = """            aria-label={label}
            aria-pressed={active}
            aria-label={badge ? `${label}, ${badge} new items` : label}
            aria-pressed={active}
            aria-label={label}"""

good_sidebar = """            aria-pressed={active}
            aria-label={badge ? `${label}, ${badge} new items` : label}"""

content = content.replace(bad_sidebar, good_sidebar)

with open(file_path, 'w') as f:
    f.write(content)

print("Page truncated and fixed.")
