import Head from 'next/head';

import { useEffect, useRef, useState } from 'react';

import LinkButton from 'closer/components/ui/LinkButton';

import { Heading, Card, usePlatform, Newsletter } from 'closer';
import { useConfig } from 'closer/hooks/useConfig';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import {
  Check,
  Circle,
  Droplets,
  Flame,
  Home,
  Laptop,
  Leaf,
  Trees,
  TreePine,
  UtensilsCrossed,
  Vote,
  Waves,
  Wrench,
} from 'lucide-react';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

interface PlatformContext {
  platform: {
    user: {
      getCount: (params: { where: Record<string, unknown> }) => Promise<{ results: number }>;
    };
  };
}

interface TokenHolder {
  TokenHolderAddress?: string;
  address?: string;
}

const CohousingPage = () => {
  const t = useTranslations();
  const { platform } = usePlatform() as PlatformContext;
  const { BLOCKCHAIN_DAO_TOKEN } = useConfig() || {};

  const [citizenCount, setCitizenCount] = useState<number | null>(null);
  const [tokenHolders, setTokenHolders] = useState<number | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const hasFetchedStats = useRef(false);

  useEffect(() => {
    if (hasFetchedStats.current) return;
    hasFetchedStats.current = true;

    const fetchStats = async () => {
      setIsLoadingStats(true);
      try {
        const citizenFilter = {
          roles: {
            $in: ['member', 'citizen'],
          },
        };
        const response = await platform.user.getCount({ where: citizenFilter });
        setCitizenCount(response?.results || null);
      } catch (error) {
        console.error('Failed to fetch citizen count:', error);
      }

      if (BLOCKCHAIN_DAO_TOKEN?.address) {
        try {
          const contractAddress = BLOCKCHAIN_DAO_TOKEN.address.toLowerCase();
          const holderListUrl = `https://api.celoscan.io/api?module=token&action=tokenholderlist&contractaddress=${contractAddress}&page=1&offset=10000`;
          
          const response = await fetch(holderListUrl).catch(() => null);
          
          if (response?.ok) {
            const data = await response.json();
            if (data.status === '1' && Array.isArray(data.result) && data.result.length > 0) {
              const holderAddresses = data.result.map((holder: TokenHolder | string) => {
                if (typeof holder === 'string') return holder.toLowerCase();
                return (holder.TokenHolderAddress || holder.address || '').toLowerCase();
              }).filter(Boolean);
              setTokenHolders(new Set(holderAddresses).size);
            }
          }
        } catch (err) {
          console.error('Error fetching token holders:', err);
        }
      }
      setIsLoadingStats(false);
    };

    fetchStats();
  }, [platform, BLOCKCHAIN_DAO_TOKEN]);

  const displayCitizenCount = citizenCount !== null ? citizenCount : 45;
  const displayTokenHolders = tokenHolders !== null ? tokenHolders : 280;

  return (
    <>
      <Head>
        <title>{t('cohousing_page_title')}</title>
        <meta name="description" content={t('cohousing_page_description')} />
        <link
          rel="canonical"
          href="https://www.traditionaldreamfactory.com/cohousing"
          key="canonical"
        />
      </Head>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-accent-light to-accent-alt-light">
        <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-xs uppercase tracking-wider text-gray-600 mb-4 font-medium">
              {t('cohousing_hero_label')}
            </p>
            <Heading
              className="mb-4 text-4xl md:text-6xl"
              data-testid="page-title"
              display
              level={1}
            >
              {t('cohousing_hero_title')}
            </Heading>
            <p className="text-lg md:text-xl text-gray-700 mb-12 leading-relaxed max-w-3xl mx-auto font-light">
              {t('cohousing_hero_subtitle')}
            </p>

            <div className="max-w-xl mx-auto mb-6">
              <Newsletter placement="cohousing" showTitle={false} className="w-full pt-0 pb-0 sm:w-full" />
            </div>
            <p className="text-sm text-gray-600">
              {isLoadingStats ? '...' : t('cohousing_hero_members_note', { citizens: displayCitizenCount, holders: displayTokenHolders })}
            </p>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b border-gray-200 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-normal text-gray-900 mb-2 font-serif">25<span className="text-2xl">ha</span></div>
              <div className="text-sm text-gray-600 font-light">{t('cohousing_stat_land')}</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-normal text-gray-900 mb-2 font-serif">4,000+</div>
              <div className="text-sm text-gray-600 font-light">{t('cohousing_stat_trees')}</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-normal text-gray-900 mb-2 font-serif">23</div>
              <div className="text-sm text-gray-600 font-light">{t('cohousing_stat_homes')}</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-normal text-gray-900 mb-2 font-serif">2027</div>
              <div className="text-sm text-gray-600 font-light">{t('cohousing_stat_ready')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Two Neighborhoods */}
      <section className="bg-white py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <Heading display level={2} className="mb-4 text-3xl md:text-4xl font-normal text-gray-900 tracking-tight">
              {t('cohousing_neighborhoods_title')}
            </Heading>
            <p className="text-base text-gray-700 max-w-xl mx-auto leading-relaxed font-light">
              {t('cohousing_neighborhoods_subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Earthpods Card */}
            <Card className="p-8 md:p-10 border border-gray-200 rounded-xl bg-white hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-6">
                <TreePine className="w-7 h-7 text-accent" />
              </div>
              <Heading level={3} className="text-2xl font-semibold text-gray-900 mb-2">
                {t('cohousing_earthpods_title')}
              </Heading>
              <p className="text-gray-600 italic text-sm mb-4">
                {t('cohousing_earthpods_tagline')}
              </p>
              <p className="text-sm text-gray-700 mb-6 leading-relaxed">
                {t('cohousing_earthpods_description')}
              </p>

              <div className="flex flex-wrap gap-6 mb-8 pb-6 border-b border-gray-200">
                <div>
                  <div className="text-2xl font-semibold text-gray-900">10</div>
                  <div className="text-xs text-gray-600">{t('cohousing_homes')}</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-gray-900">50–90m²</div>
                  <div className="text-xs text-gray-600">{t('cohousing_size')}</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-gray-900">{t('cohousing_earthpods_tokens')}</div>
                  <div className="text-xs text-gray-600">{t('cohousing_tdf_lock')}</div>
                </div>
              </div>

              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-sm text-gray-700">
                  <span className="text-gray-400 mt-0.5">→</span>
                  {t('cohousing_earthpods_feature_1')}
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-700">
                  <span className="text-gray-400 mt-0.5">→</span>
                  {t('cohousing_earthpods_feature_2')}
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-700">
                  <span className="text-gray-400 mt-0.5">→</span>
                  {t('cohousing_earthpods_feature_3')}
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-700">
                  <span className="text-gray-400 mt-0.5">→</span>
                  {t('cohousing_earthpods_feature_4')}
                </li>
              </ul>
            </Card>

            {/* Townhouses Card */}
            <Card className="p-8 md:p-10 border border-gray-200 rounded-xl bg-white hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-6">
                <Home className="w-7 h-7 text-blue-600" />
              </div>
              <Heading level={3} className="text-2xl font-semibold text-gray-900 mb-2">
                {t('cohousing_townhouses_title')}
              </Heading>
              <p className="text-gray-600 italic text-sm mb-4">
                {t('cohousing_townhouses_tagline')}
              </p>
              <p className="text-sm text-gray-700 mb-6 leading-relaxed">
                {t('cohousing_townhouses_description')}
              </p>

              <div className="flex flex-wrap gap-6 mb-8 pb-6 border-b border-gray-200">
                <div>
                  <div className="text-2xl font-semibold text-gray-900">13</div>
                  <div className="text-xs text-gray-600">{t('cohousing_homes')}</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-gray-900">144m²</div>
                  <div className="text-xs text-gray-600">{t('cohousing_size')}</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-gray-900">{t('cohousing_townhouses_tokens')}</div>
                  <div className="text-xs text-gray-600">{t('cohousing_tdf_lock')}</div>
                </div>
              </div>

              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-sm text-gray-700">
                  <span className="text-gray-400 mt-0.5">→</span>
                  {t('cohousing_townhouses_feature_1')}
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-700">
                  <span className="text-gray-400 mt-0.5">→</span>
                  {t('cohousing_townhouses_feature_2')}
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-700">
                  <span className="text-gray-400 mt-0.5">→</span>
                  {t('cohousing_townhouses_feature_3')}
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-700">
                  <span className="text-gray-400 mt-0.5">→</span>
                  {t('cohousing_townhouses_feature_4')}
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Thriving Nature Section */}
      <section className="bg-gray-50 py-24 md:py-32 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <Heading display level={2} className="mb-4 text-3xl md:text-4xl font-normal text-gray-900 tracking-tight">
              {t('cohousing_nature_title')}
            </Heading>
            <p className="text-base text-gray-700 max-w-2xl mx-auto leading-relaxed font-light">
              {t('cohousing_nature_subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl border border-gray-200 text-center">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4 mx-auto">
                <Leaf className="w-7 h-7 text-green-600" />
              </div>
              <div className="text-3xl font-semibold text-gray-900 mb-2">12.5<span className="text-xl">ha</span></div>
              <Heading level={4} className="text-lg font-semibold text-gray-900 mb-2">
                {t('cohousing_nature_rewilded_title')}
              </Heading>
              <p className="text-sm text-gray-700 leading-relaxed font-light">
                {t('cohousing_nature_rewilded_desc')}
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-200 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4 mx-auto">
                <Trees className="w-7 h-7 text-emerald-600" />
              </div>
              <div className="text-3xl font-semibold text-gray-900 mb-2">7<span className="text-xl">ha</span></div>
              <Heading level={4} className="text-lg font-semibold text-gray-900 mb-2">
                {t('cohousing_nature_foodforest_title')}
              </Heading>
              <p className="text-sm text-gray-700 leading-relaxed font-light">
                {t('cohousing_nature_foodforest_desc')}
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-200 text-center">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-4 mx-auto">
                <Droplets className="w-7 h-7 text-blue-600" />
              </div>
              <div className="text-3xl font-semibold text-gray-900 mb-2">5</div>
              <Heading level={4} className="text-lg font-semibold text-gray-900 mb-2">
                {t('cohousing_nature_lakes_title')}
              </Heading>
              <p className="text-sm text-gray-700 leading-relaxed font-light">
                {t('cohousing_nature_lakes_desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="bg-white py-24 md:py-32 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <Heading display level={2} className="mb-4 text-3xl md:text-4xl font-normal text-gray-900 tracking-tight">
              {t('cohousing_amenities_title')}
            </Heading>
            <p className="text-base text-gray-700 max-w-xl mx-auto leading-relaxed font-light">
              {t('cohousing_amenities_subtitle')}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { Icon: UtensilsCrossed, color: 'bg-orange-100 text-orange-600', titleKey: 'cohousing_amenity_restaurant_title', descKey: 'cohousing_amenity_restaurant_desc' },
              { Icon: Waves, color: 'bg-cyan-100 text-cyan-600', titleKey: 'cohousing_amenity_pool_title', descKey: 'cohousing_amenity_pool_desc' },
              { Icon: Flame, color: 'bg-amber-100 text-amber-600', titleKey: 'cohousing_amenity_sauna_title', descKey: 'cohousing_amenity_sauna_desc' },
              { Icon: Laptop, color: 'bg-slate-100 text-slate-600', titleKey: 'cohousing_amenity_coworking_title', descKey: 'cohousing_amenity_coworking_desc' },
              { Icon: Wrench, color: 'bg-stone-100 text-stone-600', titleKey: 'cohousing_amenity_makerspace_title', descKey: 'cohousing_amenity_makerspace_desc' },
              { Icon: Vote, color: 'bg-violet-100 text-violet-600', titleKey: 'cohousing_amenity_governance_title', descKey: 'cohousing_amenity_governance_desc' },
            ].map((amenity, i) => (
              <div key={i} className="bg-gray-50 p-8 rounded-lg border border-gray-200">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${amenity.color.split(' ')[0]}`}>
                  <amenity.Icon className={`w-6 h-6 ${amenity.color.split(' ')[1]}`} />
                </div>
                <Heading level={4} className="text-lg font-semibold text-gray-900 mb-2">
                  {t(amenity.titleKey)}
                </Heading>
                <p className="text-sm text-gray-700 leading-relaxed font-light">
                  {t(amenity.descKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-gray-50 py-24 md:py-32 border-t border-gray-200">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <Heading display level={2} className="mb-4 text-3xl md:text-4xl font-normal text-gray-900 tracking-tight">
              {t('cohousing_timeline_title')}
            </Heading>
          </div>

          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-accent to-accent-light"></div>

            <div className="space-y-8">
              {[
                { date: '2020', titleKey: 'cohousing_timeline_2020', status: 'complete' },
                { date: 'Sep 2025', titleKey: 'cohousing_timeline_sep2025', status: 'complete' },
                { date: 'Jan 2026', titleKey: 'cohousing_timeline_jan2026', status: 'upcoming' },
                { date: 'Apr 2026', titleKey: 'cohousing_timeline_apr2026', status: 'upcoming' },
                { date: '2026', titleKey: 'cohousing_timeline_2026', status: 'upcoming' },
                { date: '2027', titleKey: 'cohousing_timeline_2027', status: 'upcoming' },
              ].map((item, i) => (
                <div key={i} className="flex gap-8 relative">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-4 border-gray-50 ${
                    item.status === 'complete' ? 'bg-accent text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {item.status === 'complete' ? <Check className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                  </div>
                  <div className="pt-3">
                    <div className="text-xs text-accent font-medium tracking-wider uppercase mb-1">
                      {item.date}
                    </div>
                    <div className="text-base text-gray-900">
                      {t(item.titleKey)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* The Deal */}
      <section className="bg-white py-24 md:py-32 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <Heading display level={2} className="mb-4 text-3xl md:text-4xl font-normal text-gray-900 tracking-tight">
              {t('cohousing_deal_title')}
            </Heading>
            <p className="text-base text-gray-700 max-w-2xl mx-auto leading-relaxed font-light">
              {t('cohousing_deal_subtitle')}
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 md:p-12">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-center">
              {[
                { valueKey: 'cohousing_deal_term_value', labelKey: 'cohousing_deal_term_label', subKey: 'cohousing_deal_term_sub' },
                { valueKey: 'cohousing_deal_presence_value', labelKey: 'cohousing_deal_presence_label', subKey: 'cohousing_deal_presence_sub' },
                { valueKey: 'cohousing_deal_work_value', labelKey: 'cohousing_deal_work_label', subKey: 'cohousing_deal_work_sub' },
                { valueKey: 'cohousing_deal_utilities_value', labelKey: 'cohousing_deal_utilities_label', subKey: 'cohousing_deal_utilities_sub' },
                { valueKey: 'cohousing_deal_sublet_value', labelKey: 'cohousing_deal_sublet_label', subKey: 'cohousing_deal_sublet_sub' },
              ].map((item, i) => (
                <div key={i} className="col-span-1">
                  <div className="text-2xl font-semibold text-accent mb-1">
                    {t(item.valueKey)}
                  </div>
                  <div className="text-sm text-gray-900 mb-1">
                    {t(item.labelKey)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {t(item.subKey)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gray-50 py-24 md:py-32 border-t border-gray-200">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <Heading display level={2} className="mb-4 text-3xl md:text-4xl font-normal text-gray-900 tracking-tight">
            {t('cohousing_cta_title')}
          </Heading>
          <p className="text-base text-gray-700 mb-10 leading-relaxed font-light">
            {t('cohousing_cta_subtitle')}
          </p>

          <div className="max-w-xl mx-auto">
            <Newsletter placement="cohousing" showTitle={false} className="w-full pt-0 pb-0 sm:w-full" />
          </div>
        </div>
      </section>

      {/* Links */}
      <section className="bg-white py-12 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-6">
            <LinkButton href="/stay" variant="secondary">
              {t('cohousing_link_stay')}
            </LinkButton>
            <LinkButton href="/citizenship" variant="secondary">
              {t('cohousing_link_citizenship')}
            </LinkButton>
            <LinkButton href="/dataroom" variant="secondary">
              {t('cohousing_link_dataroom')}
            </LinkButton>
          </div>
        </div>
      </section>
    </>
  );
};

export default CohousingPage;

export async function getStaticProps({ locale }: NextPageContext) {
  return {
    props: {
      messages: await loadLocaleData(locale, 'tdf'),
    },
  };
}
