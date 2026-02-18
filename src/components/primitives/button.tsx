import { ButtonHTMLAttributes, forwardRef } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className = '', type = 'button', ...props },
  ref,
) {
  return <button ref={ref} type={type} className={`ui-button ${className}`.trim()} {...props} />;
});
