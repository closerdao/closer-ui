interface BaseProps {
  label?: string;
  isRequired?: boolean;
  placeholder?: string;
  className?: string;
  dataTestId?: string;
}

export interface MultiSelectProps extends BaseProps {
  values?: string[];
  onChange?: (value: string[]) => void;
  options: string[];
}

export type Item = {
  value: string;
  label: string;
};

export interface DropdownProps extends BaseProps {
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
  options: Item[];
  size?: 'large' | 'medium'
}
