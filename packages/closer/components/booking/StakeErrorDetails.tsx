import { useTranslations } from 'next-intl';

export function StakeErrorDetails({ detail }: { detail: string }) {
  const t = useTranslations();
  if (!detail) return null;
  return (
    <details className="text-sm ph-no-capture" data-ph-mask>
      <summary>{t('stay_stake_error_details')}</summary>
      <pre className="whitespace-pre-wrap break-all my-2">{detail}</pre>
      <button
        type="button"
        onClick={() =>
          void navigator.clipboard?.writeText(detail).catch(() => {})
        }
      >
        {t('stay_stake_error_copy')}
      </button>
    </details>
  );
}
