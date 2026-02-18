import { ButtonHTMLAttributes, forwardRef } from 'react';

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { className = '', type = 'button', ...props },
  ref,
) {
  return <button ref={ref} type={type} className={`ui-icon-button ${className}`.trim()} {...props} />;
});
