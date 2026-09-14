import { useFormatter, useTranslations } from 'next-intl';

import { useVotingPowerSupply } from '../../hooks/useVotingPowerSupply';

/**
 * How much voting power exists platform-wide and how it splits between the
 * tokens that carry a vote - summed from the member balances the API has
 * snapshotted, which is the same population a proposal's quorum is cut from.
 */
const PlatformVotingPower = () => {
  const t = useTranslations();
  const format = useFormatter();
  const { breakdown, total } = useVotingPowerSupply();

  // Supplies run into the thousands, so they are grouped for the page's locale.
  const formatVotes = (value: number): string =>
    format.number(value, { maximumFractionDigits: 2 });

  if (!total) {
    return null;
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="text-lg font-semibold mb-4">
        {t('governance_platform_voting_power')}
      </h3>

      <div className="space-y-4">
        {breakdown.map((token) => {
          const share = Math.round((token.votes / total) * 100);

          return (
            <div key={token.key}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-800">
                  {token.multiplier > 1
                    ? `${token.label} × ${token.multiplier}`
                    : token.label}
                </span>
                <span className="text-sm text-gray-600">
                  {formatVotes(token.votes)} ({share}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-gray-600 transition-all duration-300"
                  style={{ width: `${share}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between text-sm">
        <span className="text-gray-600">
          {t('governance_platform_total_votes')}
        </span>
        <span className="font-medium">{formatVotes(total)}</span>
      </div>
    </div>
  );
};

export default PlatformVotingPower;
