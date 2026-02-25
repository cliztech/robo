const fs = require('fs');
const path = require('path');

const replacements = [
    ['flex-shrink-0', 'shrink-0'],
    ['w-[28px]', 'w-7'],
    ['h-[28px]', 'h-7'],
    ['w-[10px]', 'w-2.5'],
    ['h-[10px]', 'h-2.5'],
    ['h-[3px]', 'h-0.75'],
    ['hover:bg-white/[0.02]', 'hover:bg-white/2'],
    ['w-[14px]', 'w-3.5'],
    ['max-w-[120px]', 'max-w-30'],
    ['w-[12px]', 'w-3'],
    ['w-[32px]', 'w-8'],
    ['bg-white/[0.06]', 'bg-white/6'],
    ['h-[72px]', 'h-18'],
    ['bg-white/[0.08]', 'bg-white/8'],
    ['hover:bg-white/[0.04]', 'hover:bg-white/4'],
    ['max-w-[100px]', 'max-w-25'],
    ['flex-[3]', 'flex-3'],
    ['flex-[2]', 'flex-2'],
    ['gap-[1px]', 'gap-px'],
    ['p-[2px]', 'p-0.5'],
    ['bg-gradient-to-b', 'bg-linear-to-b'],
    ['border-white/[0.06]', 'border-white/6'],
    ['!h-7', 'h-7!'],
    ['!w-7', 'w-7!'],
    ['h-[60px]', 'h-15'],
    ['!h-5', 'h-5!'],
    ['!w-full', 'w-full!'],
    ['h-[2px]', 'h-0.5'],
    ['w-[2px]', 'w-0.5'],
    ['gap-[3px]', 'gap-0.75'],
    ['h-[1px]', 'h-px'],
    ['gap-[2px]', 'gap-0.5'],
    ['!transform', 'transform!'],
    ['!translate-y-[2px]', 'translate-y-0.5!'],
    ['rounded-[6px]', 'rounded-md'],
    ['bg-gradient-to-r', 'bg-linear-to-r'],
    ['-rotate-[210deg]', '-rotate-210']
];

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                processDir(fullPath);
            }
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let changed = false;
            for (const [search, replace] of replacements) {
                const newContent = content.split(search).join(replace);
                if (newContent !== content) {
                    content = newContent;
                    changed = true;
                }
            }
            if (changed) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

processDir('src');
