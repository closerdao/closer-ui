import Head from 'next/head';

import { useEffect, useMemo, useRef, useState } from 'react';

import AdminLayout from '../../components/Dashboard/AdminLayout';
import { Button, Heading } from '../../components/ui';

import { Menu, PanelRight, Palette, RotateCcw, SlidersHorizontal, Type, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { configDescription } from '../../config';
import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import useRBAC from '../../hooks/useRBAC';
import {
  THEME_COLOR_GROUPS,
  THEME_COLOR_TOKENS,
  THEME_FONTS,
  THEME_FONT_SLOTS,
  buildThemeColors,
  colorTokenConfigKey,
  contrastOn,
  fontSlotConfigKey,
  isHexColor,
  resolveFontStack,
} from '../../theming';
import { parseMessageFromError } from '../../utils/common';
import { getDefaultConfigValue } from '../../utils/config.utils';
import PageNotFound from '../not-found';

const THEMING_SLUG = 'theming';

type SectionId = 'colors' | 'fonts' | 'tokens';
type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';
type ThemingValue = Record<string, any>;

/**
 * The colour fields in the order an admin thinks about them, each paired with
 * the preview swatches its derived tokens produce. `THEME_COLOR_FIELDS` in
 * theming.js owns the actual token mapping — this list only drives the form.
 */
const COLOR_FIELDS = [
  { key: 'primaryColor', derivedTokens: ['accent-dark', 'accent-light'] },
  { key: 'secondaryColor', derivedTokens: ['accent-alt-light'] },
  { key: 'backgroundColor', derivedTokens: ['neutral'] },
  { key: 'foregroundColor', derivedTokens: ['complimentary-light'] },
];

const FONT_FIELDS = [
  'fontFamilyHeading',
  'fontFamilyBody',
  ...THEME_FONT_SLOTS.map(fontSlotConfigKey),
];

const TOKEN_OVERRIDE_FIELDS = THEME_COLOR_TOKENS.map(({ token }) =>
  colorTokenConfigKey(token),
);

const SECTIONS: {
  id: SectionId;
  labelKey: string;
  hintKey: string;
  icon: typeof Palette;
  fields: string[];
}[] = [
  {
    id: 'colors',
    labelKey: 'theming_colors',
    hintKey: 'theming_colors_hint',
    icon: Palette,
    fields: COLOR_FIELDS.map((field) => field.key),
  },
  {
    id: 'fonts',
    labelKey: 'theming_fonts',
    hintKey: 'theming_fonts_hint',
    icon: Type,
    fields: FONT_FIELDS,
  },
  {
    id: 'tokens',
    labelKey: 'theming_advanced',
    hintKey: 'theming_advanced_hint',
    icon: SlidersHorizontal,
    fields: TOKEN_OVERRIDE_FIELDS,
  },
];

const fontStackToCss = (stack: string[] | null): string | undefined =>
  stack
    ?.map((family) => (family.includes(' ') ? `'${family}'` : family))
    .join(',');

/**
 * Every field always has a value now that the schema ships neutral defaults, so
 * the sidebar counts what a community has actually *changed* — otherwise the
 * badge would read 4/4 on a platform that has customised nothing. Compared
 * against the schema defaults rather than `THEME_DEFAULTS`, which only covers
 * the source colours: the per-token and per-slot overrides default to ''.
 */
const countCustomisedFields = (
  value: ThemingValue,
  defaults: ThemingValue,
  fields: string[],
) =>
  fields.filter((field) => (value[field] ?? '') !== (defaults[field] ?? ''))
    .length;

const ThemingPage = () => {
  const t = useTranslations();
  const { user } = useAuth();
  const { hasAccess } = useRBAC();
  const { platform }: any = usePlatform();

  const defaults = useMemo(
    () => getDefaultConfigValue(THEMING_SLUG, configDescription),
    [],
  );

  const [value, setValue] = useState<ThemingValue>(defaults);
  const [section, setSection] = useState<SectionId>('colors');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);

  const configs = platform.config.find();
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    Promise.resolve(platform.config.get()).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load config once on mount, matching /dashboard/admin/config
  }, []);

  /**
   * Seed the form from the API exactly once. Re-seeding on every store update
   * would throw away edits the moment an unrelated config request resolves.
   */
  useEffect(() => {
    if (isLoaded || !configs) return;
    const rows = configs.toJS?.() ?? configs;
    if (!Array.isArray(rows)) return;
    const stored = rows.find((row: any) => row?.slug === THEMING_SLUG);
    setValue({ ...defaults, ...(stored?.value || {}) });
    setIsLoaded(true);
  }, [configs, defaults, isLoaded]);

  const previewColors = useMemo(() => buildThemeColors(value), [value]);

  const setField = (key: string, next: string) => {
    setSaveStatus('unsaved');
    setValue((current) => ({ ...current, [key]: next }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('saving');
    setSaveErrorMessage(null);
    try {
      /**
       * PUT upserts on the slug, so this is one call whether or not the
       * community has a theming document yet. The platform store resolves with
       * an `error` action rather than rejecting, so a failed save has to be
       * read off the result — a bare try/catch would report success.
       */
      const action = await platform.config.put(THEMING_SLUG, {
        slug: THEMING_SLUG,
        value: { ...valueRef.current, enabled: true },
      });
      if (action?.error) {
        setSaveStatus('error');
        setSaveErrorMessage(
          parseMessageFromError(action.error) || t('theming_save_error'),
        );
        return;
      }
      await platform.config.getOne(THEMING_SLUG, { force: true });
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('error');
      setSaveErrorMessage(parseMessageFromError(err) || t('theming_save_error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSaveStatus('unsaved');
    setValue({ ...defaults });
  };

  if (!user || !hasAccess('PlatformSettings')) {
    return <PageNotFound error="User may not access" />;
  }

  const bodyStack = fontStackToCss(resolveFontStack(value.fontFamilyBody));
  const headingStack = fontStackToCss(
    resolveFontStack(value.fontFamilyHeading),
  );
  const activeSection = SECTIONS.find((item) => item.id === section) ?? SECTIONS[0];

  const statusDotClass =
    saveStatus === 'saving'
      ? 'bg-amber-400'
      : saveStatus === 'unsaved'
        ? 'bg-amber-500'
        : saveStatus === 'error'
          ? 'bg-red-500'
          : 'bg-green-500';

  const statusLabel = t(`theming_status_${saveStatus}`);

  const renderColorField = (key: string, derivedTokens: string[]) => {
    const current = value[key] || '';
    const isValid = current === '' || isHexColor(current);
    return (
      <div key={key} className="flex flex-col gap-1.5">
        <label
          className="block text-sm font-medium text-gray-700"
          htmlFor={`theming-${key}`}
        >
          {t(`theming_label_${key}`)}
        </label>
        <div className="flex items-center gap-2">
          <input
            id={`theming-${key}`}
            type="color"
            aria-label={t(`theming_label_${key}`)}
            value={isHexColor(current) ? current : '#ffffff'}
            onChange={(event) => setField(key, event.target.value)}
            className="h-9 w-11 shrink-0 rounded-md border border-gray-200 bg-white p-1 cursor-pointer"
          />
          <input
            type="text"
            aria-label={`${t(`theming_label_${key}`)} hex`}
            value={current}
            placeholder={t('theming_color_placeholder')}
            onChange={(event) => setField(key, event.target.value.trim())}
            className={`w-full min-w-0 rounded-md border px-2 py-1.5 text-sm font-mono focus:outline-none ${
              isValid
                ? 'border-gray-200 focus:border-accent'
                : 'border-red-300 text-red-600'
            }`}
          />
          {current !== defaults[key] && (
            <button
              type="button"
              className="p-1.5 shrink-0 rounded-lg text-gray-500 hover:bg-gray-100"
              aria-label={`${t('theming_clear')} ${t(`theming_label_${key}`)}`}
              title={t('theming_clear')}
              onClick={() => setField(key, defaults[key])}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {isValid ? (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-gray-400">
              {t('theming_derives')}
            </span>
            {derivedTokens.map((token) => (
              <span
                key={token}
                title={token}
                className="h-4 w-4 rounded-full border border-gray-200 inline-block"
                style={{ backgroundColor: previewColors[token] }}
              />
            ))}
          </div>
        ) : (
          <span className="text-xs text-red-600">
            {t('theming_invalid_color')}
          </span>
        )}
      </div>
    );
  };

  const renderFontField = (key: string) => (
    <div key={key} className="flex flex-col gap-1.5">
      <label
        className="block text-sm font-medium text-gray-700"
        htmlFor={`theming-${key}`}
      >
        {t.has(`theming_label_${key}`)
          ? t(`theming_label_${key}`)
          : `font-${key.replace(/^font/, '').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`}
      </label>
      <select
        id={`theming-${key}`}
        value={value[key] || ''}
        onChange={(event) => setField(key, event.target.value)}
        className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-accent"
      >
        <option value="">{t('theming_font_default')}</option>
        {THEME_FONTS.map((font) => (
          <option key={font.id} value={font.id}>
            {font.label}
          </option>
        ))}
      </select>
    </div>
  );

  /**
   * One row per compiled colour token. Empty means "keep what the source
   * colours derived", which is why the swatch shows the effective value while
   * the input stays blank until somebody deliberately pins the token.
   */
  const renderTokenField = ({
    token,
    derivedFrom,
  }: {
    token: string;
    derivedFrom?: string;
  }) => {
    const key = colorTokenConfigKey(token);
    const current = value[key] || '';
    const isValid = current === '' || isHexColor(current);
    const effective = previewColors[token];
    return (
      <div key={token} className="flex items-center gap-2">
        <span
          className="h-7 w-7 shrink-0 rounded-md border border-gray-200"
          style={{ backgroundColor: effective }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <label
            className="block font-mono text-xs text-gray-700 truncate"
            htmlFor={`theming-${key}`}
          >
            {token}
          </label>
          <span className="text-[10px] text-gray-400">
            {current === ''
              ? `${derivedFrom ? t('theming_derived') : t('theming_fixed')} · ${effective}`
              : t('theming_overridden')}
          </span>
        </div>
        <input
          id={`theming-${key}`}
          type="text"
          aria-label={token}
          value={current}
          placeholder={effective}
          onChange={(event) => setField(key, event.target.value.trim())}
          className={`w-24 shrink-0 rounded-md border px-2 py-1 text-xs font-mono focus:outline-none ${
            isValid
              ? 'border-gray-200 focus:border-accent'
              : 'border-red-300 text-red-600'
          }`}
        />
        <button
          type="button"
          className={`p-1.5 shrink-0 rounded-lg text-gray-500 hover:bg-gray-100 ${
            current === '' ? 'invisible' : ''
          }`}
          aria-label={`${t('theming_clear')} ${token}`}
          title={t('theming_clear')}
          onClick={() => setField(key, '')}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>{t('theming_title')}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminLayout flush>
        <div className="flex flex-col gap-0 h-full overflow-hidden min-h-0">
          <div className="flex items-center gap-2 px-2 py-2 border-b border-gray-200 bg-white lg:hidden shrink-0">
            <button
              type="button"
              className="p-2 rounded-lg border border-gray-200"
              aria-label={t('theming_menu')}
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="flex min-w-0 flex-1 justify-center text-center text-xs text-gray-600 truncate px-2">
              {t(activeSection.labelKey)}
            </span>
            <button
              type="button"
              className="p-2 rounded-lg border border-gray-200"
              aria-label={t('theming_panel')}
              onClick={() => setInspectorOpen(true)}
            >
              <PanelRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-1 min-h-0 relative">
            {(sidebarOpen || inspectorOpen) && (
              <button
                type="button"
                className="fixed inset-0 z-[45] bg-black/40 lg:hidden"
                aria-label={t('theming_close')}
                onClick={() => {
                  setSidebarOpen(false);
                  setInspectorOpen(false);
                }}
              />
            )}

            <aside
              className={`flex flex-col border-r border-gray-200 bg-white min-h-0 w-[280px] max-w-[86vw] shrink-0 fixed lg:relative inset-y-0 left-0 z-[55] lg:z-0 transform transition-transform lg:transform-none pt-12 xl:pt-0 ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
              }`}
            >
              <div className="p-4 border-b border-gray-100 flex items-start justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-2 bg-accent/10 rounded-lg shrink-0">
                    <Palette className="w-5 h-5 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <Heading level={4} className="text-sm sm:text-base truncate">
                      {t('theming_title')}
                    </Heading>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {t('theming_subtitle')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 lg:hidden shrink-0"
                  aria-label={t('theming_close')}
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto p-2 min-h-0">
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  {t('theming_sections')}
                </div>
                {SECTIONS.map(({ id, labelKey, icon: Icon, fields }) => {
                  const setCount = countCustomisedFields(value, defaults, fields);
                  const isActive = id === section;
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-sm ${
                        isActive
                          ? 'bg-accent/10 text-gray-900 font-medium'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      onClick={() => {
                        setSection(id);
                        setSidebarOpen(false);
                        setInspectorOpen(true);
                      }}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-accent' : 'text-gray-400'
                        }`}
                      />
                      <span className="flex-1 min-w-0 truncate">
                        {t(labelKey)}
                      </span>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {setCount}/{fields.length}
                      </span>
                    </button>
                  );
                })}
              </nav>

              <div className="p-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500 shrink-0">
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDotClass}`}
                  aria-hidden
                />
                <span>{statusLabel}</span>
              </div>
            </aside>

            <div className="flex-1 min-w-0 min-h-0 flex flex-col">
              <div className="flex flex-col min-h-0 h-full bg-white">
                <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-gray-200 bg-white/90 backdrop-blur shrink-0">
                  <span className="text-xs text-gray-600 truncate min-w-0 flex-1">
                    {t('theming_preview')}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      type="button"
                      variant="secondary"
                      size="small"
                      isFullWidth={false}
                      className="!text-xs !min-h-[28px] !px-2.5 !py-0.5 !normal-case !tracking-normal"
                      onClick={handleReset}
                    >
                      {t('theming_reset')}
                    </Button>
                    <Button
                      type="button"
                      size="small"
                      isFullWidth={false}
                      isLoading={isSaving}
                      isEnabled={!isSaving}
                      className={`!text-xs !min-h-[28px] !px-2.5 !py-0.5 !normal-case !tracking-normal ${
                        saveStatus === 'unsaved' || saveStatus === 'error'
                          ? '!ring-2 !ring-amber-400'
                          : ''
                      }`}
                      onClick={handleSave}
                    >
                      {t('theming_save')}
                    </Button>
                  </div>
                </div>

                {saveStatus === 'error' && saveErrorMessage ? (
                  <div
                    role="alert"
                    className="flex items-start gap-3 px-4 py-2 border-b border-red-200 bg-red-50 text-sm text-red-700"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{t('theming_save_error')}</div>
                      <div className="mt-1 whitespace-pre-line break-words text-xs">
                        {saveErrorMessage}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="p-1 rounded hover:bg-red-100 shrink-0"
                      aria-label={t('theming_dismiss')}
                      onClick={() => setSaveErrorMessage(null)}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : null}

                <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 flex flex-col gap-6">
                  <p className="text-xs text-gray-500 italic">
                    {t('theming_build_notice')}
                  </p>

                  <div
                    className="rounded-lg border border-gray-200 p-6 sm:p-8 flex flex-col gap-4"
                    style={{
                      backgroundColor: previewColors.background,
                      color: previewColors.foreground,
                      fontFamily: bodyStack,
                    }}
                  >
                    <h3
                      className="text-2xl sm:text-3xl font-bold"
                      style={{ fontFamily: headingStack || bodyStack }}
                    >
                      {t('theming_preview_heading')}
                    </h3>
                    <p className="text-sm max-w-prose">
                      {t('theming_preview_body')}
                    </p>
                    <div className="flex gap-3 flex-wrap">
                      <span
                        className="px-5 py-2 rounded-full uppercase tracking-wide text-sm border-2"
                        style={{
                          backgroundColor: previewColors.accent,
                          borderColor: previewColors.accent,
                          color:
                            previewColors['accent-foreground'] ||
                            (previewColors.accent
                              ? contrastOn(previewColors.accent)
                              : undefined),
                        }}
                      >
                        {t('theming_preview_primary_button')}
                      </span>
                      <span
                        className="px-5 py-2 rounded-full uppercase tracking-wide text-sm border-2"
                        style={{
                          borderColor: previewColors.accent,
                          color: previewColors.accent,
                        }}
                      >
                        {t('theming_preview_secondary_button')}
                      </span>
                      <span
                        className="px-5 py-2 rounded-full uppercase tracking-wide text-sm border-2"
                        style={{
                          backgroundColor: previewColors.secondary,
                          borderColor: previewColors.secondary,
                          color: previewColors.secondary
                            ? contrastOn(previewColors.secondary)
                            : undefined,
                        }}
                      >
                        {t('theming_preview_secondary_accent')}
                      </span>
                    </div>
                    <div
                      className="rounded-md p-4 text-sm"
                      style={{
                        backgroundColor: previewColors['accent-light'],
                        color: previewColors['complimentary-medium'],
                      }}
                    >
                      {t('theming_preview_card')}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      {t('theming_generated_tokens')}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(previewColors).map(([token, color]) => (
                        <span
                          key={token}
                          className="flex items-center gap-1.5 text-xs text-gray-600 border border-gray-200 rounded-full pl-1 pr-2 py-0.5"
                        >
                          <span
                            className="h-4 w-4 rounded-full border border-gray-200 inline-block"
                            style={{ backgroundColor: color }}
                          />
                          {token}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`w-[min(340px,86vw)] shrink-0 border-l border-gray-200 min-h-0 fixed lg:relative inset-y-0 right-0 z-[55] lg:z-0 transform transition-transform lg:transform-none pt-12 xl:pt-0 bg-white ${
                inspectorOpen
                  ? 'translate-x-0'
                  : 'translate-x-full lg:translate-x-0'
              }`}
            >
              <div className="flex flex-col h-full min-h-0 bg-white">
                <div className="p-4 border-b border-gray-100 shrink-0 flex justify-between items-start gap-2">
                  <div>
                    <Heading level={4} className="text-base">
                      {t(activeSection.labelKey)}
                    </Heading>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
                      {t('theming_settings')}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 lg:hidden"
                    aria-label={t('theming_close')}
                    onClick={() => setInspectorOpen(false)}
                  >
                    &times;
                  </button>
                </div>

                <div className="flex border-b border-gray-100 px-2 gap-0 shrink-0">
                  {SECTIONS.map(({ id, labelKey }) => (
                    <button
                      key={id}
                      type="button"
                      className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
                        section === id
                          ? 'border-accent text-gray-900'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                      onClick={() => setSection(id)}
                    >
                      {t(labelKey)}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto p-4 min-h-0 flex flex-col gap-4">
                  {section === 'colors' &&
                    COLOR_FIELDS.map(({ key, derivedTokens }) =>
                      renderColorField(key, derivedTokens),
                    )}
                  {section === 'fonts' && FONT_FIELDS.map(renderFontField)}
                  {section === 'tokens' &&
                    THEME_COLOR_GROUPS.map((group) => (
                      <div key={group} className="flex flex-col gap-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                          {t(`theming_group_${group}`)}
                        </p>
                        {THEME_COLOR_TOKENS.filter(
                          (entry) => entry.group === group,
                        ).map(renderTokenField)}
                      </div>
                    ))}
                  <p className="text-xs text-gray-500 mt-2">
                    {t(activeSection.hintKey)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </>
  );
};

export default ThemingPage;
