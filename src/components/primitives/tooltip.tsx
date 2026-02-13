import { HTMLAttributes } from 'react';

type TooltipProps = HTMLAttributes<HTMLDivElement>;

export function Tooltip({ className = '', role = 'tooltip', ...props }: TooltipProps) {
  return <div role={role} className={`ui-tooltip ${className}`.trim()} {...props} />;
}
