import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import '../styles/globals.css';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';
import { getThemeBootstrapScript } from '@/lib/theme/themeStore';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
    title: 'DGN-DJ Studio | AetherRadio',
    description: 'Premium AI-Powered Radio Automation',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: getThemeBootstrapScript() }} />
            </head>
            <body className={`${inter.variable} ${mono.variable} font-sans antialiased bg-black text-white selection:bg-lime-500 selection:text-black`}>
                <ThemeProvider>{children}</ThemeProvider>
            </body>
        </html>
    );
}
