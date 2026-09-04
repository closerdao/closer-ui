import { FC } from 'react';

import { useTranslations } from 'next-intl';

import { configDescription } from '../../config';
import { makeConfigLabel } from '../../utils/config.utils';
import ConfigImageUpload from '../ConfigImageUpload';
import FaviconUpload from '../FaviconUpload';

/**
 * Renders a hand-picked subset of one config group.
 *
 * `/first-steps` shows a new admin the four or five fields that matter now, not
 * the thirty a group can hold. That is a different job from the admin config
 * form, which has to render everything and carries seven special cases to do it
 * — VAT-by-product tables, the locale checkbox grid, photo galleries, array
 * editors. None of those appear in a curated list, so this renders only the
 * scalar types the curated lists use and stays small enough to read.
 *
 * Labels come from the same generated `config_label_*` messages the admin form
 * uses, so a field is never named two different things.
 */

/** Field types this renderer knows. Anything else is skipped, loudly in dev. */
const SUPPORTED_TYPES = [
  'text',
  'long-text',
  'number',
  'boolean',
  'select',
  'time',
  'color',
  'image',
];

export interface ConfigFieldsProps {
  slug: string;
  keys: string[];
  value: Record<string, any>;
  onChange: (key: string, value: any) => void;
  disabled?: boolean;
  /** Passed to the favicon uploader so it can draw a sensible placeholder. */
  platformName?: string;
}

const descriptorFor = (slug: string, key: string): any =>
  configDescription.find((group) => group.slug === slug)?.value?.[key];

const ConfigFields: FC<ConfigFieldsProps> = ({
  slug,
  keys,
  value,
  onChange,
  disabled = false,
  platformName,
}) => {
  const t = useTranslations();
  const configLabel = makeConfigLabel(t as any);

  return (
    <div className="flex flex-col gap-5">
      {keys.map((key) => {
        const descriptor = descriptorFor(slug, key);
        const type = descriptor?.type;

        if (!descriptor || !SUPPORTED_TYPES.includes(type)) {
          // A curated list naming a field the schema no longer has is a bug in
          // the list, not something a village should see a broken input for.
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.warn(
              `[first-steps] no renderable schema field ${slug}.${key}`,
            );
          }
          return null;
        }

        const current = value?.[key];
        const label = configLabel(key);
        const fieldId = `first-steps-${slug}-${key}`;
        const inputClass =
          'w-full rounded-md bg-neutral p-2 disabled:opacity-50';

        return (
          <div key={key} className="flex flex-col gap-1.5">
            <label htmlFor={fieldId} className="font-bold">
              {label}
            </label>

            {type === 'image' &&
              (key === 'favicon' ? (
                <FaviconUpload
                  value={current ?? ''}
                  onChange={(next) => onChange(key, next)}
                  disabled={disabled}
                  platformName={platformName}
                />
              ) : (
                <ConfigImageUpload
                  value={current ?? ''}
                  onChange={(next) => onChange(key, next)}
                  disabled={disabled}
                />
              ))}

            {type === 'boolean' && (
              <div className="flex gap-4" role="radiogroup" aria-label={label}>
                {[true, false].map((option) => (
                  <label
                    key={String(option)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={fieldId}
                      checked={current === option}
                      disabled={disabled}
                      onChange={() => onChange(key, option)}
                    />
                    {option ? t('config_true') : t('config_false')}
                  </label>
                ))}
              </div>
            )}

            {type === 'select' && (
              <select
                id={fieldId}
                className={inputClass}
                value={current ?? ''}
                disabled={disabled}
                onChange={(event) => onChange(key, event.target.value)}
              >
                <option value="">—</option>
                {(descriptor.enum ?? []).map((option: string) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}

            {type === 'long-text' && (
              <textarea
                id={fieldId}
                className={inputClass}
                rows={4}
                value={current ?? ''}
                disabled={disabled}
                onChange={(event) => onChange(key, event.target.value)}
              />
            )}

            {(type === 'text' || type === 'number' || type === 'time') && (
              <input
                id={fieldId}
                className={inputClass}
                type={
                  type === 'number'
                    ? 'number'
                    : type === 'time'
                    ? 'time'
                    : 'text'
                }
                value={current ?? ''}
                disabled={disabled}
                onChange={(event) =>
                  onChange(
                    key,
                    type === 'number'
                      ? Number(event.target.value)
                      : event.target.value,
                  )
                }
              />
            )}

            {type === 'color' && (
              <div className="flex items-center gap-3">
                <input
                  id={fieldId}
                  type="color"
                  className="h-10 w-16 rounded-md"
                  value={current || '#000000'}
                  disabled={disabled}
                  onChange={(event) => onChange(key, event.target.value)}
                />
                <input
                  aria-label={`${label} hex`}
                  className={inputClass}
                  value={current ?? ''}
                  disabled={disabled}
                  onChange={(event) => onChange(key, event.target.value)}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ConfigFields;
