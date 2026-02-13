import { InputHTMLAttributes } from 'react';

import { Input } from '../primitives';

type AddressBarProps = InputHTMLAttributes<HTMLInputElement>;

export function AddressBar(props: AddressBarProps) {
  return <Input aria-label="Address bar" {...props} />;
}
