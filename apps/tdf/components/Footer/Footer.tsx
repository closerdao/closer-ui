import Link from 'next/link';

import { FC } from 'react';

import { useConfig } from 'closer';
import { useTranslations } from 'next-intl';

export const Footer: FC = () => {
  const { INSTAGRAM_URL, TWITTER_URL } = useConfig();
  const t = useTranslations();
  return (
    <footer className="w-full mt-16 border-t border-gray-200 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">{t('footer_visit')}</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/stay" className="hover:text-gray-900">{t('footer_book_stay')}</Link></li>
              <li><Link href="/events" className="hover:text-gray-900">{t('footer_events')}</Link></li>
              <li><Link href="/volunteer" className="hover:text-gray-900">{t('footer_volunteer')}</Link></li>
              <li><Link href="/subscriptions" className="hover:text-gray-900">{t('footer_subscriptions')}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">{t('footer_community')}</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/members" className="hover:text-gray-900">{t('footer_members')}</Link></li>
              <li><Link href="/token" className="hover:text-gray-900">{t('footer_token')}</Link></li>
              <li><Link href="/airdrop" className="hover:text-gray-900">{t('footer_airdrop')}</Link></li>
              <li><Link href="/governance" className="hover:text-gray-900">{t('footer_governance')}</Link></li>
              <li><Link href="/citizenship" className="hover:text-gray-900">{t('footer_citizenship')}</Link></li>
              <li><Link href="/artists" className="hover:text-gray-900">{t('footer_artists')}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">{t('footer_land_project')}</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/pages/ecology" className="hover:text-gray-900">{t('footer_ecology')}</Link></li>
              <li><Link href="/cohousing" className="hover:text-gray-900">{t('footer_cohousing')}</Link></li>
              <li><Link href="/pages/regenerative-agriculture" className="hover:text-gray-900">{t('footer_regenerative_agriculture')}</Link></li>
              <li><Link href="/pages/restaurant" className="hover:text-gray-900">{t('footer_restaurant')}</Link></li>
              <li><Link href="/invest" className="hover:text-gray-900">{t('footer_invest')}</Link></li>
              <li><Link href="/impact-map" className="hover:text-gray-900">{t('footer_impact_map')}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">{t('footer_about')}</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/team" className="hover:text-gray-900">{t('footer_team')}</Link></li>
              <li><Link href="/roadmap" className="hover:text-gray-900">{t('footer_roadmap')}</Link></li>
              <li><Link href="/blog" className="hover:text-gray-900">{t('footer_blog')}</Link></li>
              <li><Link href="/press" className="hover:text-gray-900">{t('footer_press')}</Link></li>
              <li><Link href="/resources" className="hover:text-gray-900">{t('footer_resources')}</Link></li>
              <li><Link href="/learn-more" className="hover:text-gray-900">{t('footer_learn_more')}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">{t('footer_connect')}</h3>
            <div className="flex gap-3">
              <a
                href="https://t.me/traditionaldreamfactor"
                target="_blank"
                rel="noreferrer"
                className="p-2 text-gray-500 hover:text-pink-500 transition-colors"
                aria-label="Telegram"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" />
                  <path d="M15 10l-4 4l6 6l4 -16l-18 7l4 2l2 6l3 -4" />
                </svg>
              </a>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="p-2 text-gray-500 hover:text-pink-500 transition-colors"
                aria-label="Instagram"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" />
                  <rect x="4" y="4" width="16" height="16" rx="4" />
                  <circle cx="12" cy="12" r="3" />
                  <line x1="16.5" y1="7.5" x2="16.5" y2="7.501" />
                </svg>
              </a>
              <a
                href={TWITTER_URL}
                target="_blank"
                rel="noreferrer"
                className="p-2 text-gray-500 hover:text-pink-500 transition-colors"
                aria-label="X/Twitter"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 italic text-center md:text-left">
              {t('footer_tagline')}{' '}
              <a href="https://oasa.earth" target="_blank" rel="noreferrer" className="underline hover:text-gray-900">
                OASA
              </a>{' '}
              {t('footer_village')}
            </p>
            <div className="text-sm text-gray-500">
              <Link href="/privacy-policy" className="hover:text-gray-900">{t('footer_privacy_policy')}</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
