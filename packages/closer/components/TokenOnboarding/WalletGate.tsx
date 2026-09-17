import { useTranslations } from 'next-intl';

import { OnboardingGate } from '../../constants/tokenOnboardingQuests';
import { truncateHexAddress } from '../../utils/display.helpers';
import WalletActions from '../WalletActions';

export interface WalletGateStatus {
  isWalletConnected: boolean;
  isCorrectNetwork: boolean;
  /** The connected address is the one saved on the member's profile. */
  isLinkedToProfile: boolean;
  account?: string | null;
}

/** Every check the gate makes has to pass before the carrots can be claimed. */
export const isWalletGatePassed = (status: WalletGateStatus): boolean =>
  status.isWalletConnected &&
  status.isCorrectNetwork &&
  status.isLinkedToProfile;

const StatusRow = ({ label, isMet }: { label: string; isMet: boolean }) => (
  <li className="flex items-start gap-3 py-2 text-base">
    <span
      className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full border-2 text-xs font-bold ${
        isMet
          ? 'border-accent bg-accent text-accent-foreground'
          : 'border-line/40 text-disabled'
      }`}
      aria-hidden
    >
      {isMet ? '✓' : ''}
    </span>
    <span className={isMet ? '' : 'text-complimentary-light'}>
      {label}
      <span className="sr-only">{isMet ? ' — done' : ' — not yet'}</span>
    </span>
  </li>
);

interface WalletGateProps {
  gate: Extract<OnboardingGate, { type: 'wallet' }>;
  status: WalletGateStatus;
  /** Already paid out — never nag about a wallet the member has since unplugged. */
  isClaimed: boolean;
}

/**
 * The last quest is the one claim we can check ourselves, so we do: the member
 * never ticks a box saying the wallet is connected, the wallet says so.
 */
const WalletGate = ({ gate, status, isClaimed }: WalletGateProps) => {
  const t = useTranslations();
  const isPassed = isWalletGatePassed(status);
  // Connected to the right network but signed in as a different address —
  // WalletActions has no button for this, so the member needs the hint.
  const hasWrongAccount =
    status.isWalletConnected &&
    status.isCorrectNetwork &&
    !status.isLinkedToProfile;

  return (
    <div>
      <ul className="flex flex-col">
        <StatusRow
          label={gate.checks.connected}
          isMet={status.isWalletConnected}
        />
        <StatusRow
          label={gate.checks.network}
          isMet={status.isWalletConnected && status.isCorrectNetwork}
        />
        <StatusRow
          label={gate.checks.linked}
          isMet={status.isLinkedToProfile}
        />
      </ul>

      {isPassed && status.account && (
        <p className="mt-1 font-mono text-sm text-complimentary-light">
          {truncateHexAddress(status.account)}
        </p>
      )}

      {!isPassed && !isClaimed && (
        <>
          <p className="mt-3 text-base text-complimentary-light">
            {gate.waiting}
          </p>
          {hasWrongAccount && (
            <p className="mt-2 text-base font-bold text-failure">
              {t('wallet_different_saved_address')}
            </p>
          )}
          <WalletActions />
        </>
      )}
    </div>
  );
};

export default WalletGate;
