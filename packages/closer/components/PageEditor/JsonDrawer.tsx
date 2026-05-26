import { useCallback, useState } from 'react';

import { Check, Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Props {
  open: boolean;
  onClose: () => void;
  payload: unknown;
}

const JsonDrawer = ({ open, onClose, payload }: Props) => {
  const t = useTranslations();
  const [copied, setCopied] = useState(false);
  const jsonText = JSON.stringify(payload, null, 2);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [jsonText]);

  if (!open) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] max-w-[min(420px,calc(100vw-2rem))] w-full max-h-60 overflow-auto rounded-lg bg-gray-900 text-gray-100 text-xs font-mono p-4 shadow-lg">
      <div className="flex justify-between items-center mb-2 text-gray-400 uppercase tracking-wider text-[10px]">
        <span>PUT /page/:id</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="inline-flex items-center gap-1 text-gray-400 hover:text-white px-2 py-1 rounded normal-case tracking-normal text-xs"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            {copied ? t('pages_editor_json_copied') : t('display_copy')}
          </button>
          <button
            type="button"
            className="text-gray-400 hover:text-white px-2 py-1 rounded normal-case tracking-normal text-xs"
            onClick={onClose}
          >
            {t('pages_editor_json_close')}
          </button>
        </div>
      </div>
      <pre className="whitespace-pre-wrap break-words">{jsonText}</pre>
    </div>
  );
};

export default JsonDrawer;
