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
                },
                surface: {
                    DEFAULT: "hsl(var(--color-surface) / <alpha-value>)",
                    secondary: "hsl(var(--color-surface-2) / <alpha-value>)",
                }
            },
            fontFamily: {
                sans: ["var(--font-inter)"],
                mono: ["var(--font-mono)"],
            },
        },
    },
    plugins: [],
};
export default config;
