import '@testing-library/jest-dom/vitest';
import React from 'react';
import { vi } from 'vitest';

vi.mock('framer-motion', () => {
  const ProxyComponent = ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => {
    const { layoutId, ...safeProps } = props as React.HTMLAttributes<HTMLElement> & {
      layoutId?: string;
    };

    void layoutId;
    return React.createElement('div', safeProps, children);
  };

  return {
    motion: new Proxy(
      {},
      {
        get: () => ProxyComponent,
      }
    ),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useReducedMotion: () => false,
    useMotionValue: (v: any) => v,
    useMotionValue: (v: unknown) => v,
  };
});
