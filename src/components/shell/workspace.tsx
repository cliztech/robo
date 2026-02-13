import { ReactNode } from 'react';

type WorkspaceProps = {
  children?: ReactNode;
};

export function Workspace({ children }: WorkspaceProps) {
  return <main>{children}</main>;
}
