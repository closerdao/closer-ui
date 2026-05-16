import { Languages } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { extractBlockI18nKey } from '../../utils/blockI18n';

interface Props {
  raw: string | undefined | null;
  display: string;
  className?: string;
  textClassName?: string;
  stopLinkNavigation?: boolean;
}

const I18nHoverAction = ({
  raw,
  display,
  className,
  textClassName,
  stopLinkNavigation,
}: Props) => {
  const t = useTranslations();
  const key = extractBlockI18nKey(raw);
  if (!key) {
    return <span className={className}>{display}</span>;
  }
  return (
    <span
      className={`group inline-flex max-w-full min-w-0 items-center gap-1 ${className ?? ''}`}
    >
      <span className={`min-w-0 flex-1 ${textClassName ?? 'truncate'}`}>{display}</span>
      <button
        type="button"
        className="shrink-0 rounded p-0.5 text-gray-500 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-900 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
        aria-label={t('pages_editor_i18n_action')}
        title={t('pages_editor_i18n_action')}
        onClick={(e) => {
          if (stopLinkNavigation) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        <Languages className="h-3.5 w-3.5" aria-hidden />
      </button>
    </span>
  );
};

export default I18nHoverAction;
