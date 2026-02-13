import { ReactNode } from 'react';

type TabStripProps = {
  children?: ReactNode;
};

export function TabStrip({ children }: TabStripProps) {
  return <nav aria-label="Tabs">{children}</nav>;
}
