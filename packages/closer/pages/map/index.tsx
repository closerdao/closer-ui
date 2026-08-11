import Head from 'next/head';
import Link from 'next/link';

import { useEffect, useMemo, useState } from 'react';

import CommunityMap from '../../components/CommunityMap';
import {
  Eyebrow,
  btnPrimary,
  btnSecondary,
  inputClass,
} from '../../components/VillageUI';

import { useTranslations } from 'next-intl';

import { AMBASSADOR_ROLE } from '../../constants/village.constants';
import { useAuth } from '../../contexts/auth';
import { VillageMapItem } from '../../types/village';
import { fetchVillages, villageToMapItem } from '../../utils/village.utils';

const MapPage = () => {
  const t = useTranslations();
  const { user, isAuthenticated } = useAuth();
  const [allVillages, setAllVillages] = useState<VillageMapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [country, setCountry] = useState('');
  const [closerOnly, setCloserOnly] = useState(false);

  const canAddVillage =
    isAuthenticated &&
    (Boolean(user?.affiliate) ||
      user?.roles?.includes(AMBASSADOR_ROLE) ||
      user?.roles?.includes('admin'));

  // Fetch once — filtering is local so typing never blanks the map.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const results = await fetchVillages({ limit: 200 });
      if (cancelled) return;
      const fromApi = results
        .map((village) => villageToMapItem(village))
        .filter((village): village is VillageMapItem => Boolean(village));
      setAllVillages(fromApi);
      setIsLoading(false);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const villages = useMemo(
    () =>
      allVillages.filter((village) => {
        const countryOk = country
          ? village.country?.toLowerCase().includes(country.toLowerCase())
          : true;
        const closerOk = closerOnly ? Boolean(village.closer) : true;
        return countryOk && closerOk;
      }),
    [allVillages, country, closerOnly],
  );

  const closerCount = allVillages.filter((village) => village.closer).length;

  return (
    <>
      <Head>
        <title>{t('map_page_title')}</title>
      </Head>

      <div className="bg-[#FCFDFB] text-[#10201A] min-h-screen">
        <section className="px-6 pt-14 pb-8 bg-[radial-gradient(circle_520px_at_50%_-180px,rgba(62,224,143,0.22),transparent)]">
          <div className="max-w-6xl mx-auto text-center">
            <Eyebrow>{t('map_page_eyebrow')}</Eyebrow>
            <h1 className="font-serif text-4xl md:text-6xl leading-[1.06] mt-3">
              {t('map_page_headline')}{' '}
              <em className="italic text-[#0FA968]">{t('map_page_accent')}</em>
            </h1>
            <p className="text-[17px] text-[#5C6E64] max-w-xl mx-auto mt-5 leading-relaxed">
              {t('map_page_intro')}
            </p>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-6 pb-20">
          {/* CONTROLS */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-5">
            <div className="flex-1 flex flex-col sm:flex-row gap-3">
              <label className="flex-1 max-w-xs">
                <span className="sr-only">{t('map_filter_country')}</span>
                <input
                  className={inputClass}
                  value={country}
                  onChange={(event) => setCountry(event.target.value)}
                  placeholder={t('map_filter_country_placeholder')}
                />
              </label>
              <button
                type="button"
                onClick={() => setCloserOnly(!closerOnly)}
                aria-pressed={closerOnly}
                className={`self-start inline-flex items-center gap-2 px-4 py-3 rounded-xl text-[14px] font-semibold border transition-colors ${
                  closerOnly
                    ? 'bg-[#0E1E16] border-[#0E1E16] text-[#8EF0BE]'
                    : 'bg-white border-[#DCE7E1] text-[#5C6E64] hover:border-[#0FA968]'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    closerOnly ? 'bg-[#3EE08F]' : 'bg-[#C2F0DA]'
                  }`}
                />
                {t('map_filter_closer_only')}
                <span className="opacity-60">({closerCount})</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={canAddVillage ? '/villages/create' : '/ambassadors'}
                className={btnPrimary}
              >
                {canAddVillage
                  ? t('map_add_village_cta')
                  : t('map_become_ambassador_cta')}
              </Link>
              <Link href="/villages" className={btnSecondary}>
                {t('map_browse_list_cta')}
              </Link>
            </div>
          </div>

          {/* MAP */}
          <div className="relative rounded-[22px] overflow-hidden border border-[#C2F0DA] shadow-[0_14px_40px_rgba(15,169,104,0.10)]">
            <div className="h-[68vh] min-h-[440px]">
              <CommunityMap projects={villages} />
            </div>

            {isLoading ? (
              <div className="absolute top-4 left-4 z-[2] flex items-center gap-2 rounded-full bg-white/95 border border-[#C2F0DA] px-4 py-2 text-[13px] font-medium text-[#5C6E64] shadow-sm">
                <span className="w-3 h-3 rounded-full border-2 border-[#C2F0DA] border-t-[#0FA968] animate-spin" />
                {t('map_loading')}
              </div>
            ) : null}

            {/* LEGEND */}
            <div className="absolute bottom-4 left-4 z-[2] rounded-2xl bg-white/95 border border-[#C2F0DA] px-4 py-3 shadow-sm">
              <p className="text-[11px] uppercase tracking-[0.14em] font-bold text-[#5C6E64] mb-2.5">
                {t('map_legend_title')}
              </p>
              <div className="flex flex-col gap-2 text-[13px] text-[#10201A]">
                <span className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#3EE08F] border-2 border-white shadow-[0_1px_4px_rgba(0,0,0,0.25)]" />
                  {t('map_legend_closer')}
                </span>
                <span className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 ml-0.5 mr-0.5 rounded-full bg-[#0B7A4C] border-2 border-white shadow-[0_1px_4px_rgba(0,0,0,0.25)]" />
                  {t('map_legend_village')}
                </span>
              </div>
            </div>
          </div>

          <p className="text-[13.5px] text-[#5C6E64] mt-4">
            {t('map_result_count', { count: villages.length })}
            {country || closerOnly ? (
              <button
                type="button"
                className="ml-3 font-semibold text-[#0B7A4C] underline underline-offset-[3px]"
                onClick={() => {
                  setCountry('');
                  setCloserOnly(false);
                }}
              >
                {t('map_clear_filters')}
              </button>
            ) : null}
          </p>
        </div>
      </div>
    </>
  );
};

export default MapPage;
