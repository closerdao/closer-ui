import Link from 'next/link';

import { Check } from 'lucide-react';

import { FundraisingPackage } from '../../types';
import { formatIsoFiatAmount } from '../../utils/currencyFormat';
import { logMetric } from '../../utils/metrics';

interface InvestRewardsProps {
  packages: FundraisingPackage[];
  formatPrice: (tokens: number) => string;
  creditPricePerUnit: number;
  loanPackageHref: string;
  t: (key: string) => string;
}

const InvestRewards = ({
  packages,
  formatPrice,
  creditPricePerUnit,
  loanPackageHref,
  t,
}: InvestRewardsProps) => {
  if (packages.length === 0) return null;

  const getPrice = (pkg: FundraisingPackage) => {
    const tokens = Number(pkg.tokens) || 0;
    const credits = Number(pkg.credits) || 0;
    if (pkg.type === 'tokens') return formatPrice(tokens);
    if (pkg.type === 'loan')
      return pkg.minAmount
        ? `${formatIsoFiatAmount(Number(pkg.minAmount), 'EUR')}+`
        : `${formatIsoFiatAmount(50000, 'EUR')}+`;
    if (pkg.type === 'credits' && credits)
      return formatIsoFiatAmount(credits * creditPricePerUnit, 'EUR');
    if (pkg.type === 'subscribe') return '';
    return '';
  };

  const getHref = (pkg: FundraisingPackage) => {
    const tokens = Number(pkg.tokens) || 0;
    const credits = Number(pkg.credits) || 0;
    if (pkg.ctaUrl && pkg.ctaUrl.trim() !== '') return pkg.ctaUrl;
    if (pkg.type === 'tokens')
      return `/token/before-you-begin?tokens=${tokens}`;
    if (pkg.type === 'loan') return loanPackageHref;
    if (pkg.type === 'credits' && credits)
      return `/credits/checkout?amount=${credits}`;
    if (pkg.type === 'subscribe')
      return pkg.subscribeUrl || '/subscriptions/checkout';
    return '#';
  };

  const getCtaLabel = (pkg: FundraisingPackage) => {
    if (pkg.type === 'loan') return t('invest_package_lender_cta_action');
    if (pkg.type === 'subscribe') return t('invest_way_subscribe_cta');
    return t('invest_package_cta_action');
  };

  const isPopular = (pkg: FundraisingPackage) =>
    pkg.type === 'tokens' && Number(pkg.tokens) === 30;

  const isExternal = (pkg: FundraisingPackage) =>
    pkg.type === 'loan' ||
    (pkg.ctaUrl && getHref(pkg).startsWith('http'));

  const getBenefits = (pkg: FundraisingPackage): string[] => {
    const benefits: string[] = [];
    if (pkg.type === 'tokens') {
      const tokens = Number(pkg.tokens) || 0;
      benefits.push(`${tokens} ${t('invest_reward_annual_nights')}`);
      if (tokens >= 30) benefits.push(t('invest_reward_citizenship'));
      benefits.push(t('invest_reward_dao_voting'));
      if (pkg.bonus) benefits.push(pkg.bonus);
    }
    return benefits;
  };

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
      <p className="text-xs uppercase tracking-widest text-accent font-semibold mb-3">
        {t('invest_packages_label')}
      </p>
      <h2 className="font-bold text-3xl text-gray-900 mb-3">
        {t('invest_ways_title')}
      </h2>
      <p className="text-base text-gray-600 max-w-xl mb-10">
        {t('invest_rewards_subtitle')}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {packages.map((pkg, idx) => {
          const popular = isPopular(pkg);
          const price = getPrice(pkg);
          const href = getHref(pkg);
          const benefits = getBenefits(pkg);

          return (
            <div
              key={`${pkg.type}-${idx}`}
              className={`relative rounded-2xl border p-6 flex flex-col transition-all hover:shadow-md ${
                popular
                  ? 'border-accent shadow-md'
                  : 'border-gray-200 hover:border-accent'
              }`}
            >
              {popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-[11px] font-bold uppercase tracking-wide px-3.5 py-1 rounded-full">
                  {t('invest_package_popular')}
                </span>
              )}

              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h3 className="text-lg font-bold text-gray-900">{pkg.title}</h3>
                {price && (
                  <span className="text-lg font-bold text-accent whitespace-nowrap">
                    {price}
                  </span>
                )}
              </div>

              {pkg.description && (
                <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                  {pkg.description}
                </p>
              )}

              {benefits.length > 0 && (
                <ul className="flex flex-col gap-1.5 mb-5 flex-1">
                  {benefits.map((benefit, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-gray-600"
                    >
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              )}

              <Link
                href={href}
                target={isExternal(pkg) ? '_blank' : undefined}
                rel={isExternal(pkg) ? 'noopener noreferrer' : undefined}
                onClick={() => {
                  void logMetric({
                    event: 'fundraiser-package-cta',
                    category: 'fundraiser',
                    value: `${pkg.type}-${idx}`,
                  });
                }}
                className={`block text-center py-3 rounded-xl text-sm font-semibold transition-all ${
                  popular
                    ? 'bg-accent text-white hover:bg-accent-dark'
                    : 'border border-accent text-accent hover:bg-accent hover:text-white'
                }`}
              >
                {getCtaLabel(pkg)}
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default InvestRewards;
