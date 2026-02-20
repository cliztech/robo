/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // DGN-Neon Palette
                'deck-a': '#0091FF',
                'deck-b': '#FF5500',
                'surface-glass': 'rgba(24, 24, 27, 0.7)',
                'bg-master': '#050505',
                'bg-panel': '#0E0E0E',
                'bg-element': '#1A1A1A',
                'border-dim': '#222222',
                'border-active': '#333333',
            },
            fontFamily: {
                'sans': ['Inter', 'system-ui', 'sans-serif'],
                'mono': ['"JetBrains Mono"', 'monospace'],
            }
        },
    },
    plugins: [],
}
