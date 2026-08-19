import React from 'react';

import { useTranslations } from 'next-intl';

const AiAssistantCallout: React.FC = () => {
  const t = useTranslations();

  return (
    <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-accent bg-accent-light px-3.5 py-2.5 text-xs text-accent-dark">
      <span className="flex-none text-sm">✦</span>
      <span>
        <b>{t('governance_weight_ai_callout_title')}</b>{' '}
        {t('governance_weight_ai_callout_body')}
      </span>
    </div>
  );
};

export default AiAssistantCallout;
