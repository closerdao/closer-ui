import { FormEvent, useState } from 'react';

import { useTranslations } from 'next-intl';

import { FIELD_CONTROL_CLASS } from '../../constants/formStyles';
import { TX_HASH_PATTERN } from '../../types/booking';
import type { CryptoPaymentClaim } from '../../types/stay';
import { parseMessageFromError } from '../../utils/common';
import { submitCryptoPaymentClaim } from '../../utils/stays.api';
import { Button, Information } from '../ui';

interface Props {
  stayId: string;
  claims: CryptoPaymentClaim[];
  /** Only while the guest still owes something. */
  canSubmit: boolean;
  onSubmitted: () => void | Promise<void>;
}

const CryptoPaymentClaimForm = ({
  stayId,
  claims,
  canSubmit,
  onSubmitted,
}: Props) => {
  const t = useTranslations();
  const [txHash, setTxHash] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmed = txHash.trim();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!TX_HASH_PATTERN.test(trimmed)) {
      setError(t('crypto_claim_invalid_hash'));
      return;
    }
    try {
      setIsSaving(true);
      setError(null);
      await submitCryptoPaymentClaim(stayId, trimmed);
      setTxHash('');
      await onSubmitted();
    } catch (err) {
      setError(parseMessageFromError(err));
    } finally {
      setIsSaving(false);
    }
  };

  if (!canSubmit && claims.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 text-sm">
      {claims.length > 0 && (
        <ul className="flex flex-col gap-1">
          {claims.map((claim) => (
            <li key={claim.txHash} className="flex flex-col">
              <span className="break-all font-mono text-xs">
                {claim.txHash}
              </span>
              <span>
                {claim.status === 'rejected' && claim.reason
                  ? t('crypto_claim_status_rejected_reason', {
                      reason: claim.reason,
                    })
                  : t(`crypto_claim_status_${claim.status}`)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {canSubmit && (
        <form className="flex flex-col gap-2" onSubmit={submit} noValidate>
          <label className="font-medium" htmlFor="crypto-claim-hash">
            {t('crypto_claim_label')}
          </label>
          <input
            id="crypto-claim-hash"
            aria-describedby="crypto-claim-hint"
            placeholder="0x…"
            className={FIELD_CONTROL_CLASS}
            value={txHash}
            onChange={(event) => setTxHash(event.target.value)}
          />
          <p id="crypto-claim-hint" className="text-xs text-disabled">
            {t('crypto_claim_hint')}
          </p>
          {error && (
            <Information className="border-error/30 bg-error/10 text-foreground">
              {error}
            </Information>
          )}
          <Button
            type="submit"
            size="small"
            isFullWidth={false}
            isEnabled={Boolean(trimmed) && !isSaving}
          >
            {t('crypto_claim_submit')}
          </Button>
        </form>
      )}
    </div>
  );
};

export default CryptoPaymentClaimForm;
