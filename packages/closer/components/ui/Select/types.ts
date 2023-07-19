interface BaseProps {
  label?: string;
  isRequired?: boolean;
  placeholder?: string;
  className?: string;
  dataTestId?: string;
  id?: string;
}

export interface MultiSelectProps extends BaseProps {
  values?: string[];
  onChange?: (value: string[]) => void;
  options: string[];
}

export type Item = {
  value: string;
  label: string | number;
};

export interface DropdownProps extends BaseProps {
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
  options: Item[];
  isDisabled?: boolean;
  size?: 'large' | 'medium'
}
