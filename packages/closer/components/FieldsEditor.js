import { useState } from 'react';

import { ObjectId } from 'bson';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

const fieldTypes = [
  { value: 'text', label: 'Text' },
  { value: 'datetime', label: 'Date & Time' },
  { value: 'select', label: 'Multi select' },
];

const FieldsEditor = ({ value, onChange }) => {
  const t = useTranslations();

  const [options, setOptions] = useState(value);
  const updateOptions = (update) => {
    setOptions(update);
    onChange?.(update);
  };
  const updateOption = (index, option) => {
    const update = options.map((o, i) => (i === index ? option : o));
    updateOptions(update);
  };
  const addOption = (e) => {
    e.preventDefault();
    updateOptions(
      options.concat({
        id: new ObjectId().toString(),
        name: '',
        fieldType: 'text',
        options: [],
      }),
    );
  };
  const removeOption = (e, index) => {
    e.preventDefault();
    updateOptions(options.filter((o, i) => index !== i));
  };

  return (
    <div className="space-y-4">
      {options?.map((option, index) => (
        <div
          key={option._id || option.id || index}
          className="rounded-lg border border-neutral-dark/30 bg-neutral-light/50 p-4 space-y-4"
        >
          <div className="grid gap-1">
            <label className="block text-xs font-medium text-foreground/70 uppercase tracking-wide">
              {t('fields_editor_questions')}
            </label>
            <input
              type="text"
              value={option.name}
              placeholder={option.placeholder}
              className="w-full rounded-md border border-neutral-dark/40 bg-white px-3 py-2 text-foreground focus:border-accent focus:outline-none"
              onChange={(e) => {
                e.preventDefault();
                updateOption(index, { ...option, name: e.target.value });
              }}
            />
          </div>
          <div className="grid gap-1">
            <label className="block text-xs font-medium text-foreground/70 uppercase tracking-wide">
              {t('fields_editor_type')}
            </label>
            <select
              value={option.fieldType}
              className="w-full max-w-[200px] rounded-md border border-neutral-dark/40 bg-white px-3 py-2 text-foreground focus:border-accent focus:outline-none"
              onChange={(e) =>
                updateOption(index, { ...option, fieldType: e.target.value })
              }
            >
              {fieldTypes.map((opt) => (
                <option value={opt.value} key={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {option.fieldType === 'select' && (
            <div className="space-y-2">
              <label className="block text-xs font-medium text-foreground/70 uppercase tracking-wide">
                {t('fields_editor_options')}
              </label>
              <div className="space-y-2">
                {option.options?.map((opt, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={opt}
                      placeholder={`Option ${i + 1}`}
                      className="flex-1 rounded-md border border-neutral-dark/40 bg-white px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                      onChange={(e) =>
                        updateOption(index, {
                          ...option,
                          options: (option.options || []).map((v, y) =>
                            y === i ? e.target.value : v,
                          ),
                        })
                      }
                    />
                    <button
                      type="button"
                      className="shrink-0 rounded p-1.5 text-foreground/50 hover:bg-error/10 hover:text-error focus:outline-none"
                      onClick={(e) => {
                        e.preventDefault();
                        updateOption(index, {
                          ...option,
                          options: (option.options || []).filter((v, y) => y !== i),
                        });
                      }}
                      aria-label={t('fields_editor_remove')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="btn-small mt-1 inline-flex items-center gap-1.5"
                onClick={(e) => {
                  e.preventDefault();
                  updateOption(index, {
                    ...option,
                    options: (option.options || []).concat(''),
                  });
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                {t('fields_editor_add_option')}
              </button>
            </div>
          )}
          <div className="flex justify-end pt-1 border-t border-neutral-dark/20">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-error focus:outline-none"
              onClick={(e) => removeOption(e, index)}
            >
              <Trash2 className="h-4 w-4" />
              {t('fields_editor_remove')}
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border-2 border-dashed border-neutral-dark/40 rounded-lg py-3 px-4 text-foreground/70 hover:border-accent hover:text-accent focus:outline-none transition-colors cursor-pointer"
        onClick={(e) => addOption(e)}
      >
        <Plus className="h-4 w-4" />
        {t('fields_editor_add_custom_field')}
      </button>
    </div>
  );
};

FieldsEditor.defaultProps = {
  onChange: null,
  value: [],
};

export default FieldsEditor;
