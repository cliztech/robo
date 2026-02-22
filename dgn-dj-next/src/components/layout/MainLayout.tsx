import React from 'react';

interface MainLayoutProps {
    children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <div className="flex flex-col h-screen w-screen bg-carbon-fiber text-white overflow-hidden select-none relative">
            {/* Ambient console glow */}
            <div className="absolute inset-0 pointer-events-none" style={{
                background: 'radial-gradient(circle at 50% 10%, rgba(255,255,255,0.02) 0%, transparent 60%)'
            }} />
            <div className="relative z-10 flex flex-col h-full w-full">
                {children}
            </div>
        </div>
    );
};
