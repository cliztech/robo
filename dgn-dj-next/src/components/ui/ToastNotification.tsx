import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '../../lib/utils';

export interface Toast {
    id: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    duration?: number;
}

interface ToastNotificationProps {
    toasts: Toast[];
    onDismiss: (id: string) => void;
}

const accentIcons: Record<string, string> = {
    info: 'ℹ',
    success: '✓',
    warning: '⚠',
    error: '✕',
};

const accentColors: Record<string, string> = {
    info: '#00BFD8',
    success: '#2ECC71',
    warning: '#F1C40F',
    error: '#E54848',
};

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, onDismiss }) => {
    return (
        <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50 pointer-events-none">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
            ))}
        </div>
    );
};

const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
    const [isExiting, setIsExiting] = useState(false);
    const type = toast.type || 'info';
    const duration = toast.duration || 2500;

    const dismiss = useCallback(() => {
        setIsExiting(true);
        setTimeout(() => onDismiss(toast.id), 150);
    }, [onDismiss, toast.id]);

    useEffect(() => {
        const timer = setTimeout(dismiss, duration);
        return () => clearTimeout(timer);
    }, [dismiss, duration]);

    return (
        <div
            className={cn(
                "pointer-events-auto flex items-center gap-2 rounded-lg border border-white/5",
                isExiting ? "animate-toast-out" : "animate-toast-in"
            )}
            style={{
                width: '220px',
                padding: '16px',
                backgroundColor: 'rgba(20,24,30,0.95)',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            }}
        >
            {/* Accent icon */}
            <span
                className="text-sm font-bold shrink-0"
                style={{ color: accentColors[type] }}
            >
                {accentIcons[type]}
            </span>

            {/* Message */}
            <span className="text-xs text-zinc-300 font-mono tracking-meta flex-1 min-w-0">
                {toast.message}
            </span>
        </div>
    );
};
