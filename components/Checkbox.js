export const Checkbox = ({ className, label, checked, onChange }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <input
        type="checkbox"
        className="w-6 h-6 bg-neutral-100 rounded-lg border-neutral-400 checked:text-slate-600 dark:bg-gray-700 dark:border-gray-600"
        checked={checked}
        onChange={onChange}
      />
      <label className="text-base font-normal text-gray-900 dark:text-gray-300 normal-case">
        {label}
      </label>
    </div>
  );
};
