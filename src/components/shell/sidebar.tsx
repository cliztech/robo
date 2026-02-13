import { ReactNode } from 'react';

type SidebarProps = {
  children?: ReactNode;
};

export function Sidebar({ children }: SidebarProps) {
  return <aside>{children}</aside>;
}
