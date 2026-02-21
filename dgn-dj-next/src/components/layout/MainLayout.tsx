import React from 'react';

interface MainLayoutProps {
    children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <div className="flex flex-col h-screen w-screen bg-bg-base text-white overflow-hidden select-none">
            {children}
        </div>
    );
};
