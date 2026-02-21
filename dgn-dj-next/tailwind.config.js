/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // DGN-DJ Studio Color System
                'deck-a': '#0091FF',
                'deck-b': '#FF5500',
                'primary-accent': '#00BFD8',
                'secondary-accent': '#2C7BE5',
                'meter-green': '#2ECC71',
                'meter-yellow': '#F1C40F',
                'alert-red': '#E54848',

                // Panel Layers
                'bg-base': '#0F1216',
                'panel-1': '#151A21',
                'panel-2': '#1B212A',

                // Legacy aliases (preserved)
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
            },
            spacing: {
                '18': '4.5rem',
                '88': '22rem',
                '112': '28rem',
                '128': '32rem',
            },
            fontSize: {
                'xxs': ['0.625rem', { lineHeight: '0.875rem' }],
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'pad-trigger': 'padTrigger 150ms ease-out',
            },
            keyframes: {
                padTrigger: {
                    '0%': { transform: 'scale(0.95)', opacity: '1' },
                    '50%': { transform: 'scale(1.02)', opacity: '0.9' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}
