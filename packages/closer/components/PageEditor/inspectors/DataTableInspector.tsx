import { useTranslations } from 'next-intl';

import { Button, Input, Textarea } from '../../ui';
import PageEditorCheckbox from '../PageEditorCheckbox';

import type { BlockInspectorFormProps } from './types';

interface Cell {
  text?: string;
  note?: string;
  tone?: string;
}

interface Row {
  cells?: Cell[];
}

interface Column {
  label?: string;
  align?: string;
}

const TONES = [
  { value: 'default', labelKey: 'pages_editor_tone_default' },
  { value: 'positive', labelKey: 'pages_editor_tone_positive' },
  { value: 'muted', labelKey: 'pages_editor_tone_muted' },
];

const ALIGNMENTS = [
  { value: 'left', labelKey: 'pages_editor_align_left' },
  { value: 'right', labelKey: 'pages_editor_align_right' },
];

const DataTableInspector = ({ data, onChange }: BlockInspectorFormProps) => {
  const t = useTranslations();
  const settings = (data.settings as Record<string, unknown>) ?? {};
  const content = (data.content as Record<string, unknown>) ?? {};
  const columns = Array.isArray(content.columns)
    ? (content.columns as Column[])
    : [];
  const rows = Array.isArray(content.rows) ? (content.rows as Row[]) : [];
  const footer = (content.footer as Row | undefined) ?? undefined;
  const hasFooter = Array.isArray(footer?.cells) && footer.cells.length > 0;

  const patchContent = (next: Record<string, unknown>) =>
    onChange({ ...data, settings, content: { ...content, ...next } });

  const patchSettings = (key: string, value: unknown) =>
    onChange({ ...data, settings: { ...settings, [key]: value }, content });

  const sizeCells = (cells: Cell[] | undefined, length: number): Cell[] =>
    Array.from({ length }, (_, i) => cells?.[i] ?? { text: '' });

  const setColumns = (nextColumns: Column[]) => {
    // Rows carry one cell per column, so resize them alongside.
    patchContent({
      columns: nextColumns,
      rows: rows.map((row) => ({
        ...row,
        cells: sizeCells(row.cells, nextColumns.length),
      })),
      ...(hasFooter
        ? { footer: { cells: sizeCells(footer?.cells, nextColumns.length) } }
        : {}),
    });
  };

  const columnCount = Math.max(
    columns.length,
    ...rows.map((row) => row.cells?.length ?? 0),
    1,
  );

  const updateRowCell = (
    rowIndex: number,
    cellIndex: number,
    partial: Partial<Cell>,
  ) => {
    patchContent({
      rows: rows.map((row, i) =>
        i === rowIndex
          ? {
              ...row,
              cells: sizeCells(row.cells, columnCount).map((cell, ci) =>
                ci === cellIndex ? { ...cell, ...partial } : cell,
              ),
            }
          : row,
      ),
    });
  };

  const updateFooterCell = (cellIndex: number, partial: Partial<Cell>) => {
    patchContent({
      footer: {
        cells: sizeCells(footer?.cells, columnCount).map((cell, ci) =>
          ci === cellIndex ? { ...cell, ...partial } : cell,
        ),
      },
    });
  };

  const renderCellFields = (
    cell: Cell,
    cellIndex: number,
    onCellChange: (partial: Partial<Cell>) => void,
    keyPrefix: string,
  ) => (
    <div
      key={`${keyPrefix}-${cellIndex}`}
      className="border border-gray-200 rounded-md p-2 flex flex-col gap-2 bg-white"
    >
      <span className="text-xs font-medium text-gray-500">
        {columns[cellIndex]?.label ||
          t('pages_editor_field_item_n', { n: cellIndex + 1 })}
      </span>
      <Input
        value={String(cell.text ?? '')}
        onChange={(e) => onCellChange({ text: e.target.value })}
      />
      <div>
        <label className="block text-xs text-gray-500 mb-1">
          {t('pages_editor_field_note')}
        </label>
        <Input
          value={String(cell.note ?? '')}
          onChange={(e) => onCellChange({ note: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">
          {t('pages_editor_field_tone')}
        </label>
        <select
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
          value={String(cell.tone ?? 'default')}
          onChange={(e) => onCellChange({ tone: e.target.value })}
        >
          {TONES.map((tone) => (
            <option key={tone.value} value={tone.value}>
              {t(tone.labelKey)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {(
        [
          ['eyebrow', 'pages_editor_field_eyebrow'],
          ['title', 'pages_editor_field_title'],
        ] as const
      ).map(([key, labelKey]) => (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t(labelKey)}
          </label>
          <Input
            value={String(content[key] ?? '')}
            onChange={(e) => patchContent({ [key]: e.target.value })}
          />
        </div>
      ))}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('pages_editor_field_description')}
        </label>
        <Textarea
          rows={3}
          value={String(content.description ?? '')}
          onChange={(e) => patchContent({ description: e.target.value })}
        />
      </div>

      <PageEditorCheckbox
        checked={Boolean(settings.isCompact)}
        onChange={(checked) => patchSettings('isCompact', checked)}
      >
        {t('pages_editor_field_compact')}
      </PageEditorCheckbox>

      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {t('pages_editor_field_columns')}
        </p>
        {columns.map((column, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg p-3 flex flex-col gap-2 bg-neutral-light"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-600">
                {t('pages_editor_field_item_n', { n: index + 1 })}
              </span>
              <Button
                type="button"
                variant="secondary"
                size="small"
                isFullWidth={false}
                isEnabled={columns.length > 1}
                onClick={() =>
                  setColumns(columns.filter((_, i) => i !== index))
                }
              >
                {t('pages_editor_remove')}
              </Button>
            </div>
            <Input
              value={String(column.label ?? '')}
              onChange={(e) =>
                setColumns(
                  columns.map((c, i) =>
                    i === index ? { ...c, label: e.target.value } : c,
                  ),
                )
              }
            />
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                {t('pages_editor_field_align')}
              </label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                value={String(column.align ?? 'left')}
                onChange={(e) =>
                  setColumns(
                    columns.map((c, i) =>
                      i === index ? { ...c, align: e.target.value } : c,
                    ),
                  )
                }
              >
                {ALIGNMENTS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          size="small"
          isFullWidth={false}
          onClick={() => setColumns([...columns, { label: '', align: 'left' }])}
        >
          {t('pages_editor_add_column')}
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {t('pages_editor_field_rows')}
        </p>
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="border border-gray-200 rounded-lg p-3 flex flex-col gap-2 bg-neutral-light"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-600">
                {t('pages_editor_field_item_n', { n: rowIndex + 1 })}
              </span>
              <Button
                type="button"
                variant="secondary"
                size="small"
                isFullWidth={false}
                onClick={() =>
                  patchContent({ rows: rows.filter((_, i) => i !== rowIndex) })
                }
              >
                {t('pages_editor_remove')}
              </Button>
            </div>
            {sizeCells(row.cells, columnCount).map((cell, cellIndex) =>
              renderCellFields(
                cell,
                cellIndex,
                (partial) => updateRowCell(rowIndex, cellIndex, partial),
                `row-${rowIndex}`,
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
            patchContent({
              rows: [...rows, { cells: sizeCells(undefined, columnCount) }],
            })
          }
        >
          {t('pages_editor_add_row')}
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        <PageEditorCheckbox
          checked={hasFooter}
          onChange={(checked) =>
            patchContent({
              footer: checked
                ? { cells: sizeCells(undefined, columnCount) }
                : { cells: [] },
            })
          }
        >
          {t('pages_editor_field_footer_row')}
        </PageEditorCheckbox>
        {hasFooter
          ? sizeCells(footer?.cells, columnCount).map((cell, cellIndex) =>
              renderCellFields(
                cell,
                cellIndex,
                (partial) => updateFooterCell(cellIndex, partial),
                'footer',
              ),
            )
          : null}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('pages_editor_field_note')}
        </label>
        <Textarea
          rows={2}
          value={String(content.note ?? '')}
          onChange={(e) => patchContent({ note: e.target.value })}
        />
      </div>
    </div>
  );
};

export default DataTableInspector;
