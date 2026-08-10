import { useCallback, useEffect, useState } from 'react';

import Modal from '../Modal';
import { Button, Spinner } from '../ui';

import { useTranslations } from 'next-intl';

import {
  EngagementOpportunity,
  EngagementSampleEmailResults,
} from '../../types/engagement';
import { copyProviderKey } from '../../utils/engagement.helpers';

interface EngagementSampleEmailModalProps {
  opportunity: EngagementOpportunity | null;
  isManager: boolean;
  onClose: () => void;
  onApply: (results: EngagementSampleEmailResults) => Promise<void>;
  sampleEmail: (payload: {
    email?: string;
    userId?: string;
    useAi?: boolean;
  }) => Promise<{ results?: EngagementSampleEmailResults }>;
}

const EngagementSampleEmailModal = ({
  opportunity,
  isManager,
  onClose,
  onApply,
  sampleEmail,
}: EngagementSampleEmailModalProps) => {
  const t = useTranslations();
  const [loading, setLoading] = useState(false);
  const [useAi, setUseAi] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<EngagementSampleEmailResults | null>(
    null,
  );
  const [applying, setApplying] = useState(false);

  const loadPreview = useCallback(
    async (withAi: boolean) => {
      if (!opportunity) return;
      const email = opportunity.email?.trim();
      const userId = opportunity.userId
        ? String(opportunity.userId)
        : undefined;
      if (!email && !userId) {
        setError(t('engagement_preview_error'));
        return;
      }
      setLoading(true);
      setError(null);
      setUseAi(withAi);
      try {
        const res = await sampleEmail({
          ...(email ? { email } : {}),
          ...(userId ? { userId } : {}),
          useAi: withAi,
        });
        setResults(res?.results ?? null);
        if (!res?.results) {
          setError(t('engagement_preview_error'));
        }
      } catch {
        setError(t('engagement_preview_error'));
        setResults(null);
      } finally {
        setLoading(false);
      }
    },
    [opportunity, sampleEmail, t],
  );

  useEffect(() => {
    if (!opportunity) {
      setResults(null);
      setError(null);
      setUseAi(false);
      return;
    }
    loadPreview(false);
  }, [loadPreview, opportunity]);

  if (!opportunity) return null;

  const provider = results?.aiMeta?.provider;

  return (
    <Modal
      closeModal={onClose}
      className="md:w-[720px] lg:w-[860px]"
    >
      <div className="flex flex-col gap-4 pr-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('engagement_preview_title')}
          </h2>
          {opportunity.email ? (
            <p className="text-sm text-gray-600 break-all">{opportunity.email}</p>
          ) : null}
        </div>

        {provider ? (
          <span className="inline-flex self-start text-xs font-medium uppercase tracking-wide rounded-full px-2.5 py-1 bg-gray-100 text-gray-700">
            {t(copyProviderKey(provider))}
          </span>
        ) : null}

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : results?.html ? (
          <iframe
            title={t('engagement_preview_title')}
            srcDoc={results.html}
            className="w-full h-[420px] border border-gray-200 rounded-md bg-white"
            sandbox=""
          />
        ) : !error ? (
          <p className="text-sm text-gray-600">{t('engagement_preview_loading')}</p>
        ) : null}

        {results?.aiMeta?.risks?.length ? (
          <ul className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-md px-3 py-2 list-disc list-inside flex flex-col gap-1">
            {results.aiMeta.risks.map((risk) => (
              <li key={risk}>{risk}</li>
            ))}
          </ul>
        ) : null}

        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            type="button"
            variant="primary"
            isFullWidth={false}
            isEnabled={Boolean(results) && !loading && !applying}
            isLoading={applying}
            onClick={async () => {
              if (!results) return;
              setApplying(true);
              try {
                await onApply(results);
                onClose();
              } finally {
                setApplying(false);
              }
            }}
          >
            {t('engagement_action_apply_draft')}
          </Button>
          {isManager ? (
            <Button
              type="button"
              variant="secondary"
              isFullWidth={false}
              isEnabled={!loading}
              isLoading={loading && useAi}
              onClick={() => loadPreview(true)}
            >
              {t('engagement_action_regenerate_ai')}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            isFullWidth={false}
            isEnabled={!loading}
            onClick={() => loadPreview(false)}
          >
            {t('engagement_action_preview_refresh')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EngagementSampleEmailModal;
