import { FC, useMemo } from 'react';

import { useTranslations } from 'next-intl';

import { THEME_FONTS, buildThemeColors } from '../../../theming';
import SaveBar from '../SaveBar';

/**
 * The four colours and two fonts a village actually chooses. Closer derives the
 * rest of the palette from these, so per-token overrides stay on the full
 * theming page where the people who want them will look.
 *
 * The preview is computed locally with the same `buildThemeColors` the theming
 * page uses, which is the only way to show the result before a build: colours
 * are compiled into Tailwind at build time, so the live site does not change
 * until the deploy in the last step.
 */

const COLOR_FIELDS = [
  { key: 'primaryColor', labelKey: 'first_steps_theme_primary' },
  { key: 'secondaryColor', labelKey: 'first_steps_theme_secondary' },
  { key: 'backgroundColor', labelKey: 'first_steps_theme_background' },
  { key: 'foregroundColor', labelKey: 'first_steps_theme_foreground' },
];

const FONT_FIELDS = [
  { key: 'fontFamilyHeading', labelKey: 'first_steps_theme_font_heading' },
  { key: 'fontFamilyBody', labelKey: 'first_steps_theme_font_body' },
];

export interface ThemeStepProps {
  value: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onSave: () => void;
  isSaving: boolean;
  isDirty: boolean;
}

const ThemeStep: FC<ThemeStepProps> = ({
  value,
  onChange,
  onSave,
  isSaving,
  isDirty,
}) => {
  const t = useTranslations();
  const preview = useMemo(() => buildThemeColors(value), [value]);

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        {COLOR_FIELDS.map(({ key, labelKey }) => (
          <div key={key} className="flex flex-col gap-1.5">
            <label htmlFor={`theme-${key}`} className="font-bold">
              {t(labelKey)}
            </label>
            <div className="flex items-center gap-3">
              <input
                id={`theme-${key}`}
                type="color"
                className="h-10 w-16 rounded-md"
                value={value?.[key] || '#000000'}
                disabled={isSaving}
                onChange={(event) => onChange(key, event.target.value)}
              />
              <input
                aria-label={`${t(labelKey)} hex`}
                className="w-full rounded-md bg-neutral p-2"
                value={value?.[key] ?? ''}
                disabled={isSaving}
                onChange={(event) => onChange(key, event.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {FONT_FIELDS.map(({ key, labelKey }) => (
          <div key={key} className="flex flex-col gap-1.5">
            <label htmlFor={`theme-${key}`} className="font-bold">
              {t(labelKey)}
            </label>
            <select
              id={`theme-${key}`}
              className="w-full rounded-md bg-neutral p-2"
              value={value?.[key] ?? ''}
              disabled={isSaving}
              onChange={(event) => onChange(key, event.target.value)}
            >
              <option value="">—</option>
              {THEME_FONTS.map((font: any) => (
                <option key={font.id} value={font.id}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div
        className="rounded-md border border-neutral-dark p-5"
        data-testid="first-steps-theme-preview"
        style={{
          backgroundColor: preview.background,
          color: preview.foreground,
        }}
      >
        <p className="mb-3 text-lg font-bold">
          {t('first_steps_theme_preview_heading')}
        </p>
        <div className="flex flex-wrap gap-3">
          <span
            className="rounded-full px-4 py-2"
            style={{
              backgroundColor: preview.accent,
              color: preview['accent-foreground'],
            }}
          >
            {t('first_steps_theme_preview_primary')}
          </span>
          <span
            className="rounded-full border px-4 py-2"
            style={{ borderColor: preview.accent, color: preview.accent }}
          >
            {t('first_steps_theme_preview_secondary')}
          </span>
        </div>
      </div>

      <SaveBar onSave={onSave} isSaving={isSaving} isDirty={isDirty} />
    </>
  );
};

export default ThemeStep;
