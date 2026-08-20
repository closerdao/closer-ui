import { useTranslations } from 'next-intl';

import { resolveBlockText } from '../../utils/blockI18n';
import { Heading } from '../ui';

export type DataTableAlign = 'left' | 'right';
export type DataTableTone = 'default' | 'positive' | 'muted';

export interface DataTableColumn {
  label?: string;
  align?: DataTableAlign;
}

export interface DataTableCell {
  text?: string;
  note?: string;
  tone?: DataTableTone;
}

export interface DataTableRow {
  cells?: DataTableCell[];
}

export interface DataTableContent {
  eyebrow?: string;
  title?: string;
  description?: string;
  columns?: DataTableColumn[];
  rows?: DataTableRow[];
  footer?: DataTableRow;
  note?: string;
}

interface Props {
  settings?: { isCompact?: boolean };
  content?: DataTableContent;
}

const toneClass = (tone: DataTableTone | undefined): string => {
  switch (tone) {
    case 'positive':
      return 'text-emerald-700';
    case 'muted':
      return 'text-gray-600 font-light';
    default:
      return 'text-gray-900';
  }
};

const noteToneClass = (tone: DataTableTone | undefined): string =>
  tone === 'positive' ? 'text-emerald-700 font-medium' : 'text-gray-600 font-light';

const alignClass = (align: DataTableAlign | undefined): string =>
  align === 'right' ? 'text-right' : 'text-left';

const CustomDataTable = ({ content, settings }: Props) => {
  const t = useTranslations();
  const columns = Array.isArray(content?.columns) ? content.columns : [];
  const rows = Array.isArray(content?.rows) ? content.rows : [];
  const footerCells = Array.isArray(content?.footer?.cells)
    ? content.footer.cells
    : [];
  const isCompact = Boolean(settings?.isCompact);

  const eyebrow = resolveBlockText(content?.eyebrow, t);
  const title = resolveBlockText(content?.title, t);
  const description = resolveBlockText(content?.description, t);
  const note = resolveBlockText(content?.note, t);

  const columnAlign = (index: number) => alignClass(columns[index]?.align);

  const renderCell = (
    cell: DataTableCell | undefined,
    index: number,
    variant: 'body' | 'footer',
  ) => {
    const text = resolveBlockText(cell?.text, t);
    const cellNote = resolveBlockText(cell?.note, t);
    return (
      <td
        key={index}
        className={`px-6 ${isCompact ? 'py-3' : 'py-4'} ${columnAlign(index)} ${
          variant === 'footer' ? 'font-bold' : ''
        }`}
      >
        <div
          className={`${
            variant === 'footer' ? 'text-lg' : 'text-sm'
          } font-semibold ${toneClass(cell?.tone)}`}
        >
          {text}
        </div>
        {cellNote ? (
          <div className={`text-xs mt-1.5 ${noteToneClass(cell?.tone)}`}>
            {cellNote}
          </div>
        ) : null}
      </td>
    );
  };

  if (rows.length === 0 && footerCells.length === 0) return null;

  return (
    <section className="py-16 md:py-20">
      <div className="max-w-5xl mx-auto px-6">
        {eyebrow || title || description ? (
          <div className="text-center mb-10 flex flex-col gap-4">
            {eyebrow ? (
              <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <Heading
                level={2}
                className="text-3xl md:text-4xl text-gray-900 font-normal"
              >
                {title}
              </Heading>
            ) : null}
            {description ? (
              <p className="text-base text-gray-700 max-w-3xl mx-auto leading-relaxed font-light">
                {description}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="bg-white rounded-lg overflow-hidden border border-gray-300 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              {columns.length > 0 ? (
                <thead className="bg-gray-900 text-white">
                  <tr>
                    {columns.map((column, index) => (
                      <th
                        key={`${column.label}-${index}`}
                        className={`px-6 py-4 text-sm font-semibold ${alignClass(
                          column.align,
                        )}`}
                      >
                        {resolveBlockText(column.label, t)}
                      </th>
                    ))}
                  </tr>
                </thead>
              ) : null}
              <tbody className="divide-y divide-gray-200">
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                    {(row.cells ?? []).map((cell, cellIndex) =>
                      renderCell(cell, cellIndex, 'body'),
                    )}
                  </tr>
                ))}
              </tbody>
              {footerCells.length > 0 ? (
                <tfoot className="bg-gray-100 border-t-2 border-gray-900">
                  <tr>
                    {footerCells.map((cell, cellIndex) =>
                      renderCell(cell, cellIndex, 'footer'),
                    )}
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </div>
        </div>

        {note ? (
          <p className="text-sm text-gray-600 text-center font-light mt-8">
            {note}
          </p>
        ) : null}
      </div>
    </section>
  );
};

export default CustomDataTable;
