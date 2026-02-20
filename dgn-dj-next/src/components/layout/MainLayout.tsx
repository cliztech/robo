import React from 'react';

interface MainLayoutProps {
    children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <div className="flex flex-col h-screen w-screen bg-bg-master text-white overflow-hidden p-2 gap-2 select-none">
            {/* Header / Status Bar could go here */}

            {/* Main Workspace */}
            <div className="flex-1 min-h-0 grid grid-cols-[1.2fr_0.8fr_1.2fr] gap-2">
                {children}
            </div>

            {/* Library Section (Bottom) - Placeholder for now */}
            <div className="h-[30vh] bg-bg-panel border border-border-dim rounded-xl p-4">
                <h3 className="text-xs font-mono text-gray-500 mb-2">LIBRARY BROWSER</h3>
                {/* Library Content */}
            </div>
        </div>
    );
};
