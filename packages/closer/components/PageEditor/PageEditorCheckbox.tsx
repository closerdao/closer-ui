import type { ReactNode } from 'react';

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  id?: string;
}

const PageEditorCheckbox = ({ checked, onChange, children, id }: Props) => (
  <label
    htmlFor={id}
    className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer"
  >
    <input
      id={id}
      type="checkbox"
      className="w-4 h-4 shrink-0 accent-accent"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
    <span className="leading-snug">{children}</span>
  </label>
);

export default PageEditorCheckbox;
