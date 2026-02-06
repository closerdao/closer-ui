import type { FC } from 'react';

interface SwitchProps {
  checked?: boolean;
  disabled?: boolean;
  name: string;
  label?: string;
  labelledBy?: string;
  onChange: (value: boolean) => void | ((prev: boolean) => boolean);
}

declare const Switch: FC<SwitchProps>;
export default Switch;
