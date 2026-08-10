import React, { useMemo } from 'react';

import { useTranslations } from 'next-intl';

import { Button } from '../ui';
import Heading from '../ui/Heading';

import { ToconlineDocument } from 'closer/types/expense';

interface ToconlineDocumentDialogProps {
  document: ToconlineDocument | null;
  onClose: () => void;
}

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const collectLineKeysInOrder = (
  lines: NonNullable<ToconlineDocument['lines']>,
): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of lines) {
    for (const k of Object.keys(line)) {
      if (!seen.has(k)) {
        seen.add(k);
        out.push(k);
      }
    }
  }
  return out;
};

const ToconlineDocumentDialog: React.FC<ToconlineDocumentDialogProps> = ({
  document,
  onClose,
}) => {
  const t = useTranslations();

  const lineKeys = useMemo(() => {
    if (!document?.lines?.length) return [];
    return collectLineKeysInOrder(document.lines);
  }, [document]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white rounded-lg w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t('expense_tracking_toconline_document')}
      >
        <div className="flex justify-between items-start gap-2 px-4 sm:px-6 pt-4 sm:pt-6 pb-4 border-b border-gray-200 flex-shrink-0 bg-white">
          <Heading level={3} className="text-lg sm:text-xl">
            {t('expense_tracking_toconline_document')}
          </Heading>
          <Button
            onClick={onClose}
            variant="secondary"
            className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0"
            aria-label={t('expense_tracking_close')}
          >
            ✕
          </Button>
        </div>

        <div className="overflow-y-auto flex-1 min-h-0 px-4 sm:px-6 py-4 sm:pb-6">
          {!document ? (
            <p className="text-gray-600">
              {t('expense_tracking_toconline_document_not_found')}
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="px-2 py-2 text-left font-medium text-gray-600">
                        {t('expense_tracking_field')}
                      </th>
                      <th className="px-2 py-2 text-left font-medium text-gray-600">
                        {t('expense_tracking_value')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(document)
                      .filter(
                        ([key, value]) =>
                          !['_id', '__v', 'lines'].includes(key) &&
                          value !== undefined,
                      )
                      .map(([key, value]) => (
                        <tr key={key} className="border-b">
                          <td className="px-2 py-2 text-gray-600 font-medium font-mono text-xs">
                            {key}
                          </td>
                          <td className="px-2 py-2 text-gray-900 break-words">
                            {formatValue(value)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {document.lines && document.lines.length > 0 && lineKeys.length > 0 && (
                <div className="mt-6">
                  <Heading level={4} className="text-base mb-2 font-mono">
                    lines
                  </Heading>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b bg-gray-50">
                        <tr>
                          {lineKeys.map((k) => (
                            <th
                              key={k}
                              className="px-2 py-2 text-left font-medium text-gray-600 font-mono text-xs"
                            >
                              {k}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {document.lines.map((line, index) => (
                          <tr key={index} className="border-b">
                            {lineKeys.map((k) => (
                              <td
                                key={k}
                                className="px-2 py-2 text-gray-900 break-words"
                              >
                                {formatValue(
                                  (line as Record<string, unknown>)[k],
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ToconlineDocumentDialog;
