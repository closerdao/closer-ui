import { useState } from 'react';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import type { CryptoPaymentClaim, StayMoney } from '../../../types/stay';
import { parseMessageFromError } from '../../../utils/common';
import {
  decideCryptoPaymentClaim,
  formatStayMoney,
} from '../../../utils/stays.api';
import { getTransactionExplorerUrl } from '../../../utils/transactionExplorerUrl';
import { Button, Information } from '../../ui';
import { Textarea } from '../../ui/textarea';
import BookingSurface from '../bookingSurface';
import HostReasonModal from './hostReasonModal';

interface Props {
  stayId: string;
  claims: CryptoPaymentClaim[];
  /** What the stay still owes in fiat, in its own currency. */
  owed: StayMoney;
  onDone: () => void | Promise<void>;
}

const CryptoPaymentClaimsPanel = ({ stayId, claims, owed, onDone }: Props) => {
  const t = useTranslations();
  const [busyHash, setBusyHash] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const pending = claims.filter((claim) => claim.status === 'pending');
  if (pending.length === 0) return null;

  const approve = async (txHash: string) => {
    try {
      setBusyHash(txHash);
      setError(null);
      await decideCryptoPaymentClaim(stayId, 'approve', txHash);
      await onDone();
    } catch (err) {
      setError(parseMessageFromError(err));
    } finally {
      setBusyHash(null);
    }
  };

  return (
    <BookingSurface tone="banner" padding="md" className="flex flex-col gap-3">
      <p className="text-sm font-medium">{t('crypto_claim_host_title')}</p>
      {pending.map((claim) => (
        <div key={claim.txHash} className="flex flex-col gap-1 text-sm">
          <p>
            {t('crypto_claim_host_amounts', {
              received: formatStayMoney({
                val: claim.receivedAmount,
                cur: owed.cur,
              }),
              owed: formatStayMoney(owed),
            })}{' '}
            ·{' '}
            {t(
              claim.exactMatch
                ? 'crypto_claim_host_exact'
                : 'crypto_claim_host_not_exact',
            )}
          </p>
          <p className="break-all text-xs text-disabled">
            {t('crypto_claim_host_origin', {
              sender: claim.sender || '?',
              sent: claim.blockTime
                ? dayjs(claim.blockTime).format('DD/MM/YYYY HH:mm')
                : '?',
            })}
          </p>
          <a
            className="break-all text-xs underline"
            href={getTransactionExplorerUrl(claim.txHash)}
            target="_blank"
            rel="noreferrer"
          >
            {claim.txHash}
          </a>
          <div className="flex flex-wrap gap-2">
            <Button
              size="small"
              isFullWidth={false}
              isEnabled={busyHash === null}
              onClick={() => void approve(claim.txHash)}
            >
              {t('crypto_claim_host_approve')}
            </Button>
            <Button
              variant="secondary"
              size="small"
              isFullWidth={false}
              isEnabled={busyHash === null}
              onClick={() => {
                setRejectReason('');
                setRejecting(claim.txHash);
              }}
            >
              {t('crypto_claim_host_reject')}
            </Button>
          </div>
        </div>
      ))}
      {error && (
        <Information className="border-error/30 bg-error/10 text-foreground">
          {error}
        </Information>
      )}
      {rejecting && (
        <HostReasonModal
          title={t('crypto_claim_host_reject')}
          withReason={false}
          onClose={() => setRejecting(null)}
          onSubmit={async () => {
            await decideCryptoPaymentClaim(
              stayId,
              'reject',
              rejecting,
              rejectReason.trim() || undefined,
            );
            await onDone();
          }}
        >
          <label className="flex flex-col gap-1 text-sm" htmlFor="claim-reject">
            <span className="font-medium">
              {t('crypto_claim_host_reject_reason')}
            </span>
            <Textarea
              id="claim-reject"
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
            />
          </label>
        </HostReasonModal>
      )}
    </BookingSurface>
  );
};

export default CryptoPaymentClaimsPanel;
