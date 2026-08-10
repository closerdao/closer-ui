import { useTranslations } from 'next-intl';

import { Button, Input, Textarea } from '../../ui';
import PageEditorCheckbox from '../PageEditorCheckbox';

import type { BlockInspectorFormProps } from './types';

export type ContentFieldType =
  | 'text'
  | 'textarea'
  | 'url'
  | 'number'
  | 'checkbox'
  | 'select';

export interface ContentFieldDef {
  key: string;
  labelKey: string;
  type?: ContentFieldType;
  rows?: number;
  options?: Array<{ value: string; labelKey: string }>;
}

export interface SettingsFieldDef {
  key: string;
  labelKey: string;
  type: 'text' | 'number' | 'checkbox';
  defaultValue?: string | number | boolean;
}

export interface NestedListConfig {
  key: string;
  labelKey: string;
  addLabelKey: string;
  itemFields: ContentFieldDef[];
  defaultItem: Record<string, string | boolean>;
  minItems?: number;
}

export interface ContentListInspectorConfig {
  hint?: string;
  fields?: ContentFieldDef[];
  settingsFields?: SettingsFieldDef[];
  listKey?: string;
  listLabelKey?: string;
  listAddLabelKey?: string;
  listItemFields?: ContentFieldDef[];
  defaultItem?: Record<string, string | boolean | Record<string, unknown>[]>;
  minItems?: number;
  nestedList?: NestedListConfig;
  stringListKey?: string;
  stringListLabelKey?: string;
  stringListAddLabelKey?: string;
}

interface Props extends BlockInspectorFormProps {
  config: ContentListInspectorConfig;
}

const ContentListInspector = ({ data, onChange, config }: Props) => {
  const t = useTranslations();
  const settings = (data.settings as Record<string, unknown>) ?? {};
  const content = (data.content as Record<string, unknown>) ?? {};
  const listKey = config.listKey;
  const rawItems = listKey ? content[listKey] : undefined;
  const items =
    listKey && Array.isArray(rawItems)
      ? (rawItems as Record<string, unknown>[])
      : [];
  const stringListKey = config.stringListKey;
  const rawStringItems = stringListKey ? content[stringListKey] : undefined;
  const stringItems =
    stringListKey && Array.isArray(rawStringItems)
      ? (rawStringItems as string[])
      : [];

  const patch = (next: Record<string, unknown>) =>
    onChange({ ...data, ...next });

  const patchContent = (key: string, value: unknown) =>
    patch({ settings, content: { ...content, [key]: value } });

  const patchSettings = (key: string, value: unknown) =>
    patch({ settings: { ...settings, [key]: value }, content });

  const updateItem = (idx: number, partial: Record<string, unknown>) => {
    if (!listKey) return;
    const nextItems = items.map((item, i) =>
      i === idx ? { ...item, ...partial } : item,
    );
    patch({ settings, content: { ...content, [listKey]: nextItems } });
  };

  const renderField = (
    field: ContentFieldDef,
    value: string | boolean,
    onChangeValue: (next: string | boolean) => void,
    fieldKey?: string,
  ) => {
    const label = t(field.labelKey);
    const key = fieldKey ?? field.key;
    if (field.type === 'checkbox') {
      return (
        <PageEditorCheckbox
          key={key}
          checked={Boolean(value)}
          onChange={(checked) => onChangeValue(checked)}
        >
          {label}
        </PageEditorCheckbox>
      );
    }
    if (field.type === 'textarea') {
      return (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
          <Textarea
            rows={field.rows ?? 3}
            value={String(value ?? '')}
            onChange={(e) => onChangeValue(e.target.value)}
          />
        </div>
      );
    }
    if (field.type === 'select' && field.options?.length) {
      return (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
          <select
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
            value={String(value ?? field.options[0]?.value ?? '')}
            onChange={(e) => onChangeValue(e.target.value)}
          >
            {field.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t(opt.labelKey)}
              </option>
            ))}
          </select>
        </div>
      );
    }
    return (
      <div key={key}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        <Input
          type={
            field.type === 'url'
              ? 'url'
              : field.type === 'number'
                ? 'number'
                : 'text'
          }
          value={String(value ?? '')}
          onChange={(e) => onChangeValue(e.target.value)}
        />
      </div>
    );
  };

  const renderNestedList = (
    parentIdx: number,
    parentItem: Record<string, unknown>,
  ) => {
    const nested = config.nestedList;
    if (!nested) return null;
    const nestedItems =
      (parentItem[nested.key] as Record<string, unknown>[]) ?? [];

    return (
      <div className="mt-2 pt-2 border-t border-gray-200 flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {t(nested.labelKey)}
        </p>
        {nestedItems.map((nestedItem, nestedIdx) => (
          <div
            key={nestedIdx}
            className="border border-gray-200 rounded-md p-2 flex flex-col gap-2 bg-white"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-500">
                {t('pages_editor_field_item_n', { n: nestedIdx + 1 })}
              </span>
              <Button
                type="button"
                variant="secondary"
                size="small"
                isFullWidth={false}
                isEnabled={nestedItems.length > (nested.minItems ?? 0)}
                onClick={() =>
                  updateItem(parentIdx, {
                    [nested.key]: nestedItems.filter((_, i) => i !== nestedIdx),
                  })
                }
              >
                {t('pages_editor_remove')}
              </Button>
            </div>
            {nested.itemFields.map((field) =>
              renderField(
                field,
                field.type === 'checkbox'
                  ? Boolean(nestedItem[field.key])
                  : String(nestedItem[field.key] ?? ''),
                (next) => {
                  const nextNested = nestedItems.map((item, i) =>
                    i === nestedIdx ? { ...item, [field.key]: next } : item,
                  );
                  updateItem(parentIdx, { [nested.key]: nextNested });
                },
                `${parentIdx}-${nested.key}-${nestedIdx}-${field.key}`,
              ),
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          size="small"
          isFullWidth={false}
          onClick={() =>
            updateItem(parentIdx, {
              [nested.key]: [...nestedItems, { ...nested.defaultItem }],
            })
          }
        >
          {t(nested.addLabelKey)}
        </Button>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {config.hint ? (
        <p className="text-xs text-gray-500 leading-relaxed bg-neutral-light rounded-md p-3 border border-gray-100">
          {t(config.hint)}
        </p>
      ) : null}
      {(config.settingsFields ?? []).map((field) => {
        if (field.type === 'checkbox') {
          const checked =
            settings[field.key] !== undefined
              ? Boolean(settings[field.key])
              : Boolean(field.defaultValue ?? false);
          return (
            <PageEditorCheckbox
              key={field.key}
              checked={checked}
              onChange={(next) => patchSettings(field.key, next)}
            >
              {t(field.labelKey)}
            </PageEditorCheckbox>
          );
        }
        return (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t(field.labelKey)}
            </label>
            <Input
              type={field.type === 'number' ? 'number' : 'text'}
              value={String(
                settings[field.key] ?? field.defaultValue ?? '',
              )}
              onChange={(e) =>
                patchSettings(
                  field.key,
                  field.type === 'number'
                    ? e.target.value === ''
                      ? ''
                      : Number(e.target.value)
                    : e.target.value,
                )
              }
            />
          </div>
        );
      })}
      {(config.fields ?? []).map((field) =>
        renderField(
          field,
          field.type === 'checkbox'
            ? Boolean(content[field.key])
            : String(content[field.key] ?? ''),
          (next) => patchContent(field.key, next),
        ),
      )}
      {listKey && config.listItemFields ? (
        <div className="flex flex-col gap-3">
          {config.listLabelKey ? (
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              {t(config.listLabelKey)}
            </p>
          ) : null}
          {items.map((item, idx) => (
            <div
              key={idx}
              className="border border-gray-200 rounded-lg p-3 flex flex-col gap-2 bg-neutral-light"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-600">
                  {t('pages_editor_field_item_n', { n: idx + 1 })}
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  size="small"
                  isFullWidth={false}
                  isEnabled={items.length > (config.minItems ?? 0)}
                  onClick={() =>
                    patch({
                      settings,
                      content: {
                        ...content,
                        [listKey]: items.filter((_, i) => i !== idx),
                      },
                    })
                  }
                >
                  {t('pages_editor_remove')}
                </Button>
              </div>
              {(config.listItemFields ?? []).map((field) =>
                renderField(
                  field,
                  field.type === 'checkbox'
                    ? Boolean(item[field.key])
                    : String(item[field.key] ?? ''),
                  (next) => updateItem(idx, { [field.key]: next }),
                  `${idx}-${field.key}`,
                ),
              )}
              {renderNestedList(idx, item)}
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="small"
            isFullWidth={false}
            onClick={() =>
              patch({
                settings,
                content: {
                  ...content,
                  [listKey]: [
                    ...items,
                    {
                      ...(config.defaultItem ?? { title: '' }),
                      ...(config.nestedList
                        ? { [config.nestedList.key]: [] }
                        : {}),
                    },
                  ],
                },
              })
            }
          >
            {t(config.listAddLabelKey ?? 'pages_editor_add_item')}
          </Button>
        </div>
      ) : null}
      {stringListKey ? (
        <div className="flex flex-col gap-3">
          {config.stringListLabelKey ? (
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              {t(config.stringListLabelKey)}
            </p>
          ) : null}
          {stringItems.map((value, idx) => (
            <div
              key={idx}
              className="border border-gray-200 rounded-lg p-3 flex flex-col gap-2 bg-neutral-light"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-600">
                  {t('pages_editor_field_item_n', { n: idx + 1 })}
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  size="small"
                  isFullWidth={false}
                  onClick={() =>
                    patchContent(
                      stringListKey,
                      stringItems.filter((_, i) => i !== idx),
                    )
                  }
                >
                  {t('pages_editor_remove')}
                </Button>
              </div>
              <Input
                value={value}
                onChange={(e) => {
                  const next = stringItems.map((item, i) =>
                    i === idx ? e.target.value : item,
                  );
                  patchContent(stringListKey, next);
                }}
              />
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="small"
            isFullWidth={false}
            onClick={() =>
              patchContent(stringListKey, [...stringItems, ''])
            }
          >
            {t(config.stringListAddLabelKey ?? 'pages_editor_add_item')}
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export default ContentListInspector;
