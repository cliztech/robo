import os

def fix_file(filepath):
    try:
        # Read as UTF-8 but ignore errors to cleanly get the content
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # Fix escaped quotes specifically
        content = content.replace('\"', '"')
        
        # Write back cleanly
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Fixed {filepath}')
    except Exception as e:
        print(f'Error fixing {filepath}: {e}')

fix_file('src/components/audio/DegenTransport.tsx')
fix_file('src/components/console/DashboardView.tsx')