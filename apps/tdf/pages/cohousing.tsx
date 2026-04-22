import Head from 'next/head';
import Link from 'next/link';

import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

import Button from 'closer/components/ui/Button';
import LinkButton from 'closer/components/ui/LinkButton';

import { Heading, Card, usePlatform, Newsletter, useAuth } from 'closer';
import { useConfig } from 'closer/hooks/useConfig';
import { parseMessageFromError } from 'closer/utils/common';
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

import type { CohousingApplication } from 'closer/types/cohousingApplication';

interface PlatformContext {
  platform: {
    user: {
      getCount: (params: { where: Record<string, unknown> }) => Promise<{ results: number }>;
    };
    cohousingapplication: {
      get: (
        filter: { where?: Record<string, unknown>; limit?: number; sort_by?: string },
        opts?: { force?: boolean },
      ) => Promise<{ results?: { toJS?: () => unknown } & unknown }>;
      create: (data: Record<string, unknown>) => Promise<{ results?: unknown }>;
    };
  };
}

interface TokenHolder {
  TokenHolderAddress?: string;
  address?: string;
}

const COHOUSING_INTAKE_BACK = '/cohousing';

const getApplicationsFromGetResponse = (res: unknown): CohousingApplication[] => {
  if (res == null || typeof res !== 'object') {
    return [];
  }
  const r = res as { results?: { toJS?: () => unknown } & unknown };
  const results = r.results;
  if (results == null) {
    return [];
  }
  const raw =
    typeof results === 'object' &&
    results !== null &&
    'toJS' in results &&
    typeof (results as { toJS: () => unknown }).toJS === 'function'
      ? (results as { toJS: () => unknown }).toJS()
      : results;
  if (Array.isArray(raw)) {
    return raw.filter((a) => a && typeof a === 'object' && '_id' in a) as CohousingApplication[];
  }
  if (raw && typeof raw === 'object' && '_id' in (raw as object)) {
    return [raw as CohousingApplication];
  }
  return [];
};

const labelForUserCohousingApp = (
  app: CohousingApplication,
  ta: (key: string) => string,
) => {
  const intake = app.intake;
  if (intake && typeof intake === 'object' && 'fullName' in intake && intake.fullName) {
    return String(intake.fullName);
  }
  return app._id ? `${app._id.slice(-6)}` : ta('cohousing_cta_application_label');
};

const CohousingPage = () => {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();
  const { platform } = usePlatform() as PlatformContext;
  const { BLOCKCHAIN_DAO_TOKEN } = useConfig() || {};

  const [myApplications, setMyApplications] = useState<CohousingApplication[]>([]);
  const [isCheckingApplication, setIsCheckingApplication] = useState(false);
  const [intakeName, setIntakeName] = useState('');
  const [intakeEmail, setIntakeEmail] = useState('');
  const [intakeNeighborhood, setIntakeNeighborhood] = useState('');
  const [intakeHousehold, setIntakeHousehold] = useState('');
  const [intakeMotivation, setIntakeMotivation] = useState('');
  const [intakeSubmitting, setIntakeSubmitting] = useState(false);
  const [intakeError, setIntakeError] = useState<string | null>(null);

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

  const currentUserId = user?._id;

  useEffect(() => {
    if (!currentUserId) {
      setMyApplications([]);
      setIsCheckingApplication(false);
      return;
    }
    setIsCheckingApplication(true);
    let cancelled = false;
    const loadMine = async () => {
      try {
        const res = await platform.cohousingapplication.get({
          where: { createdBy: currentUserId },
          limit: 50,
          sort_by: '-created',
        });
        if (!cancelled) {
          setMyApplications(getApplicationsFromGetResponse(res));
        }
      } catch {
        if (!cancelled) {
          setMyApplications([]);
        }
      } finally {
        if (!cancelled) {
          setIsCheckingApplication(false);
        }
      }
    };
    void loadMine();
    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!user) {
      setIntakeName('');
      setIntakeEmail('');
      return;
    }
    const legalName = user.kycData?.legalName?.trim();
    const name =
      legalName ||
      user.screenname?.trim() ||
      '';
    setIntakeName(name);
    setIntakeEmail(user.email?.trim() || '');
  }, [user]);

  const displayCitizenCount = citizenCount !== null ? citizenCount : 45;
  const displayTokenHolders = tokenHolders !== null ? tokenHolders : 280;

  const hasMyApplications = myApplications.length > 0;
  const showIntakeForm = !isCheckingApplication && (!user || !hasMyApplications);

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

              <div className="flex flex-wrap gap-6 mb-6 pb-6 border-b border-gray-200">
                <div>
                  <div className="text-2xl font-semibold text-gray-900">10</div>
                  <div className="text-xs text-gray-600">{t('cohousing_homes')}</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {t('cohousing_earthpods_bedrooms_value')}
                  </div>
                  <div className="text-xs text-gray-600">{t('cohousing_typology_bedrooms')}</div>
                </div>
                <div>
                  <div className="text-sm sm:text-base font-semibold text-gray-900 leading-snug max-w-[14rem]">
                    {t('cohousing_earthpods_storeys_value')}
                  </div>
                  <div className="text-xs text-gray-600">{t('cohousing_typology_storeys')}</div>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                {t('cohousing_earthpods_more')}
              </p>
              <ul className="space-y-2 mb-6 text-sm text-gray-600">
                <li className="flex gap-2">
                  <span className="text-accent shrink-0">·</span>
                  {t('cohousing_earthpods_detail_1')}
                </li>
                <li className="flex gap-2">
                  <span className="text-accent shrink-0">·</span>
                  {t('cohousing_earthpods_detail_2')}
                </li>
                <li className="flex gap-2">
                  <span className="text-accent shrink-0">·</span>
                  {t('cohousing_earthpods_detail_3')}
                </li>
              </ul>

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

              <div className="flex flex-wrap gap-6 mb-6 pb-6 border-b border-gray-200">
                <div>
                  <div className="text-2xl font-semibold text-gray-900">13</div>
                  <div className="text-xs text-gray-600">{t('cohousing_homes')}</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-gray-900">144m²</div>
                  <div className="text-xs text-gray-600">{t('cohousing_size')}</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {t('cohousing_townhouses_storeys_value')}
                  </div>
                  <div className="text-xs text-gray-600">{t('cohousing_typology_storeys')}</div>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                {t('cohousing_townhouses_more')}
              </p>
              <ul className="space-y-2 mb-6 text-sm text-gray-600">
                <li className="flex gap-2">
                  <span className="text-blue-600 shrink-0">·</span>
                  {t('cohousing_townhouses_detail_1')}
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600 shrink-0">·</span>
                  {t('cohousing_townhouses_detail_2')}
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600 shrink-0">·</span>
                  {t('cohousing_townhouses_detail_3')}
                </li>
              </ul>

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
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <Heading display level={2} className="mb-4 text-3xl md:text-4xl font-normal text-gray-900 tracking-tight">
              {t('cohousing_timeline_title')}
            </Heading>
          </div>

          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-accent to-accent-light"></div>

            <div className="space-y-8">
              {[
                {
                  date: '2020',
                  titleKey: 'cohousing_timeline_2020',
                  detailKey: 'cohousing_timeline_2020_detail',
                  status: 'complete',
                },
                {
                  date: 'Sep 2025',
                  titleKey: 'cohousing_timeline_sep2025',
                  detailKey: 'cohousing_timeline_sep2025_detail',
                  status: 'complete',
                },
                {
                  date: 'Apr 2026',
                  titleKey: 'cohousing_timeline_pip_received',
                  detailKey: 'cohousing_timeline_pip_received_detail',
                  status: 'upcoming',
                },
                {
                  date: '2026',
                  titleKey: 'cohousing_timeline_land_closing',
                  detailKey: 'cohousing_timeline_land_closing_detail',
                  status: 'upcoming',
                },
                {
                  date: '2026–2027',
                  titleKey: 'cohousing_timeline_infra',
                  detailKey: 'cohousing_timeline_infra_detail',
                  status: 'upcoming',
                },
                {
                  date: '~ Feb 2027',
                  titleKey: 'cohousing_timeline_design_lock',
                  detailKey: 'cohousing_timeline_design_lock_detail',
                  status: 'upcoming',
                },
                {
                  date: '2027–2028',
                  titleKey: 'cohousing_timeline_construction',
                  detailKey: 'cohousing_timeline_construction_detail',
                  status: 'upcoming',
                },
                {
                  date: '~ 2028–2029',
                  titleKey: 'cohousing_timeline_keys',
                  detailKey: 'cohousing_timeline_keys_detail',
                  status: 'upcoming',
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-8 relative">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-4 border-gray-50 ${
                    item.status === 'complete' ? 'bg-accent text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {item.status === 'complete' ? <Check className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                  </div>
                  <div className="pt-3 pb-2 max-w-lg">
                    <div className="text-xs text-accent font-medium tracking-wider uppercase mb-1">
                      {item.date}
                    </div>
                    <div className="text-base text-gray-900 font-medium">
                      {t(item.titleKey)}
                    </div>
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                      {t(item.detailKey)}
                    </p>
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

      {/* Honesty Note */}
      <section className="bg-white py-16 md:py-20 border-t border-gray-200">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <Heading level={3} className="mb-4 text-xl md:text-2xl font-normal text-gray-700 tracking-tight">
            {t('cohousing_honesty_title')}
          </Heading>
          <p className="text-base text-gray-600 leading-relaxed font-light">
            {t('cohousing_honesty_text')}
          </p>
        </div>
      </section>

      {/* Final CTA — waitlist / application */}
      <section className="bg-gray-50 py-24 md:py-32 border-t border-gray-200">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <Heading display level={2} className="mb-4 text-3xl md:text-4xl font-normal text-gray-900 tracking-tight">
            {t('cohousing_cta_title')}
          </Heading>
          {user && hasMyApplications ? (
            <p className="text-base text-gray-700 mb-8 leading-relaxed font-light">
              {t('cohousing_intake_existing_subtitle')}
            </p>
          ) : (
            <>
              <p className="text-base text-gray-700 mb-3 leading-relaxed font-light">
                {t('cohousing_cta_subtitle')}
              </p>
              {!isCheckingApplication && (
                <p className="text-sm text-gray-600 mb-8 font-light">
                  {t('cohousing_intake_subtitle')}
                </p>
              )}
            </>
          )}

          {!user && !isCheckingApplication && (
            <p className="text-center text-sm text-gray-600 mb-6">
              <Link
                href={`/login?back=${encodeURIComponent(COHOUSING_INTAKE_BACK)}`}
                className="text-accent underline font-medium"
              >
                {t('cohousing_intake_sign_in')}
              </Link>
              <span className="mx-2 text-gray-400">·</span>
              <Link
                href={`/signup?back=${encodeURIComponent(COHOUSING_INTAKE_BACK)}`}
                className="text-accent underline font-medium"
              >
                {t('cohousing_intake_create_account')}
              </Link>
            </p>
          )}
          {user && isCheckingApplication && (
            <p className="text-center text-sm text-gray-500 mb-6">{t('cohousing_intake_checking')}</p>
          )}
          {user && hasMyApplications && !isCheckingApplication && (
            <div className="flex flex-col items-stretch sm:items-center gap-3 mb-10 max-w-md mx-auto">
              {myApplications.map((app) => (
                <LinkButton
                  key={app._id}
                  href={`/cohousing/application/${app._id}`}
                  variant="primary"
                  isFullWidth
                  className="max-w-sm"
                >
                  {myApplications.length > 1
                    ? `${t('cohousing_banner_cta')} · ${labelForUserCohousingApp(app, t)}`
                    : t('cohousing_banner_cta')}
                </LinkButton>
              ))}
            </div>
          )}
          {showIntakeForm && (
            <form
              className="flex flex-col gap-4 max-w-xl mx-auto text-left mb-12"
              onSubmit={async (e) => {
                e.preventDefault();
                setIntakeError(null);
                if (!user) {
                  await router.push(
                    `/login?back=${encodeURIComponent(COHOUSING_INTAKE_BACK)}`,
                  );
                  return;
                }
                if (!intakeName.trim()) {
                  setIntakeError(t('cohousing_intake_error_name_required'));
                  return;
                }
                const emailForIntake = user.email?.trim();
                if (!emailForIntake) {
                  setIntakeError(t('cohousing_intake_error_generic'));
                  return;
                }
                setIntakeSubmitting(true);
                try {
                  const out = await platform.cohousingapplication.create({
                    isDraft: true,
                    status: 'waitlist',
                    source: 'cohousing-page',
                    intake: {
                      fullName: intakeName.trim(),
                      email: emailForIntake,
                      preferredNeighborhood: intakeNeighborhood.trim(),
                      householdSize: intakeHousehold.trim(),
                      motivation: intakeMotivation.trim(),
                    },
                  });
                  const doc = (out as { results?: { _id?: string; toJS?: () => { _id: string } } })
                    .results;
                  const plain = doc && typeof (doc as { toJS?: () => unknown }).toJS === 'function'
                    ? (doc as { toJS: () => { _id: string } }).toJS()
                    : doc;
                  const newId = plain && typeof plain === 'object' && '_id' in plain
                    ? (plain as { _id: string })._id
                    : '';
                  if (newId) {
                    await router.push(`/cohousing/application/${newId}`);
                  }
                } catch (err: unknown) {
                  const parsed = parseMessageFromError(err);
                  const ax = err as {
                    response?: { status?: number };
                  };
                  const status = ax.response?.status;
                  const fallbackish =
                    parsed === 'Something went wrong' || /^\{/.test(parsed);
                  if (!fallbackish && parsed.trim()) {
                    setIntakeError(parsed);
                  } else if (status === 403) {
                    setIntakeError(t('cohousing_intake_error_forbidden'));
                  } else if (status === 409) {
                    setIntakeError(t('cohousing_intake_error_duplicate'));
                  } else if (
                    typeof navigator !== 'undefined' &&
                    !navigator.onLine
                  ) {
                    setIntakeError(t('cohousing_intake_error_network'));
                  } else {
                    setIntakeError(t('cohousing_intake_error_generic'));
                  }
                } finally {
                  setIntakeSubmitting(false);
                }
              }}
            >
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-gray-500 block mb-1">
                  {t('cohousing_intake_name')}
                </label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                  value={intakeName}
                  onChange={(e) => setIntakeName(e.target.value)}
                  required={Boolean(user)}
                />
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-gray-500 block mb-1">
                  {t('cohousing_intake_email')}
                </label>
                <input
                  type="email"
                  className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm ${
                    user ? 'bg-gray-50 text-gray-700 cursor-not-allowed' : 'bg-white'
                  }`}
                  value={intakeEmail}
                  onChange={(e) => setIntakeEmail(e.target.value)}
                  readOnly={Boolean(user)}
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-gray-500 block mb-1">
                  {t('cohousing_intake_neighborhood')}
                </label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                  value={intakeNeighborhood}
                  onChange={(e) => setIntakeNeighborhood(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-gray-500 block mb-1">
                  {t('cohousing_intake_household')}
                </label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                  value={intakeHousehold}
                  onChange={(e) => setIntakeHousehold(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-gray-500 block mb-1">
                  {t('cohousing_intake_motivation')}
                </label>
                <textarea
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm min-h-[100px] bg-white"
                  value={intakeMotivation}
                  onChange={(e) => setIntakeMotivation(e.target.value)}
                />
              </div>
              {intakeError && (
                <p className="text-sm text-red-600">{intakeError}</p>
              )}
              <Button
                type="submit"
                isFullWidth={false}
                isLoading={intakeSubmitting}
                isEnabled={!intakeSubmitting}
              >
                {t('cohousing_intake_submit')}
              </Button>
            </form>
          )}

          <div className="max-w-xl mx-auto pt-4 border-t border-gray-200">
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
