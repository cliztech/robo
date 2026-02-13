import { ReactNode } from 'react';

type TopbarProps = {
  children?: ReactNode;
};

export function Topbar({ children }: TopbarProps) {
  return <header>{children}</header>;
}
