import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "hsl(var(--color-bg) / <alpha-value>)",
                foreground: "hsl(var(--color-text) / <alpha-value>)",
                accent: {
                    DEFAULT: "hsl(var(--color-accent) / <alpha-value>)",
                    secondary: "hsl(var(--color-accent-2) / <alpha-value>)",
                    tertiary: "hsl(var(--color-accent-3) / <alpha-value>)",
                },
                surface: {
                    DEFAULT: "hsl(var(--color-surface) / <alpha-value>)",
                    secondary: "hsl(var(--color-surface-2) / <alpha-value>)",
                    tertiary: "hsl(var(--color-surface-3) / <alpha-value>)",
                },
                danger: "hsl(var(--color-danger) / <alpha-value>)",
                warning: "hsl(var(--color-warning) / <alpha-value>)",
            },
            fontFamily: {
                sans: ["var(--font-inter)"],
                mono: ["var(--font-mono)"],
            },
            borderRadius: {
                xs: "var(--radius-xs)",
                sm: "var(--radius-sm)",
                md: "var(--radius-md)",
                lg: "var(--radius-lg)",
                xl: "var(--radius-xl)",
            },
            boxShadow: {
                glow: "var(--shadow-glow)",
                hard: "var(--shadow-hard)",
                soft: "var(--shadow-soft)",
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
        },
    },
    plugins: [],
};
export default config;
