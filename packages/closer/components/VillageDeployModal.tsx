import { FormEvent, useState } from 'react';

import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Village } from '../types/village';
import {
  CLOSER_DEPLOY_DOMAIN,
  deployVillageToCloser,
  isValidVillageSubdomain,
  isVillageSubdomainTaken,
  sanitizeVillageSubdomainInput,
  suggestVillageSubdomain,
} from '../utils/village.utils';
import { ErrorMessage } from './ui';
import { btnPrimary, btnSmall, inputClass, labelClass } from './VillageUI';

type VillageDeployModalProps = {
  village: Village;
  onClose: () => void;
  /** Fired with the PATCHed village once the deploy request is filed. */
  onDeployed: (village: Village) => void;
};

/**
 * Picks the address a village will live at — `<subdomain>.closer.earth` — and
 * files the deploy request. Opened from the village page by a manager with an
 * active subscription.
 */
const VillageDeployModal = ({
  village,
  onClose,
  onDeployed,
}: VillageDeployModalProps) => {
  const t = useTranslations();
  const [subdomain, setSubdomain] = useState(() =>
    suggestVillageSubdomain(village),
  );
  const [error, setError] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!isValidVillageSubdomain(subdomain)) {
      setError(t('villages_deploy_modal_error_invalid'));
      return;
    }

    try {
      setIsDeploying(true);
      if (await isVillageSubdomainTaken(subdomain, village._id)) {
        setError(t('villages_deploy_modal_error_taken'));
        return;
      }
      const updated = await deployVillageToCloser(village._id, subdomain);
      onDeployed(updated);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('villages_action_error'),
      );
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="fixed bg-black/60 backdrop-blur-sm inset-0 z-[100] flex items-start sm:items-center justify-center overflow-y-auto p-4 sm:p-6">
      <div className="relative bg-white text-[#10201A] z-[101] rounded-[22px] border border-[#C2F0DA] shadow-2xl max-w-md w-full my-auto">
        <button
          type="button"
          onClick={onClose}
          aria-label={t('villages_deploy_modal_close')}
          className="absolute right-4 top-4 w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#E2FAEE] transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <form onSubmit={handleSubmit} className="px-7 py-9 flex flex-col gap-5">
          <div>
            <h2 className="font-serif text-2xl">
              {t('villages_deploy_modal_title')}
            </h2>
            <p className="text-[14.5px] text-[#5C6E64] mt-2 leading-relaxed">
              {t('villages_deploy_modal_body')}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="village-subdomain">
              {t('villages_deploy_modal_slug_label')}
            </label>
            <div className="flex items-center gap-2">
              <input
                id="village-subdomain"
                className={inputClass}
                value={subdomain}
                autoFocus
                onChange={(event) => {
                  setSubdomain(sanitizeVillageSubdomainInput(event.target.value));
                  setError(null);
                }}
                placeholder={t('villages_deploy_modal_slug_placeholder')}
              />
              <span className="text-[14.5px] text-[#5C6E64] flex-none">
                .{CLOSER_DEPLOY_DOMAIN}
              </span>
            </div>
            <p className="text-[13px] text-[#5C6E64]">
              {t('villages_deploy_modal_preview_hint')}{' '}
              <span className="font-semibold text-[#0B7A4C]">
                {subdomain ||
                  t('villages_deploy_modal_slug_placeholder')}
                .{CLOSER_DEPLOY_DOMAIN}
              </span>
            </p>
          </div>

          {error ? <ErrorMessage error={error} /> : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className={btnPrimary}
              disabled={isDeploying || !subdomain}
            >
              {isDeploying
                ? t('villages_deploy_modal_submitting')
                : t('villages_deploy_modal_submit')}
            </button>
            <button
              type="button"
              className={btnSmall}
              onClick={onClose}
              disabled={isDeploying}
            >
              {t('villages_deploy_modal_cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VillageDeployModal;
