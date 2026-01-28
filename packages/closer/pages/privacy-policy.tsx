import Head from 'next/head';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import Heading from '../components/ui/Heading';
import { useConfig } from '../hooks/useConfig';
import api from '../utils/api';

import { loadLocaleData } from '../utils/locale.helpers';

const SITE_URL = process.env.NEXT_PUBLIC_PLATFORM_URL || 'https://closer.earth';

interface AccountingEntity {
  legalName: string;
  taxNumber: string;
  address: string;
  products: string[];
}

interface PrivacyPolicyPageProps {
  accountingEntities?: AccountingEntity[];
}

const PRODUCT_TYPE_KEYS: Record<string, string> = {
  accommodations: 'privacy_policy_product_accommodations',
  events: 'privacy_policy_product_events',
  subscriptions: 'privacy_policy_product_subscriptions',
  tokens: 'privacy_policy_product_tokens',
  food: 'privacy_policy_product_food',
  products: 'privacy_policy_product_products',
};

const PrivacyPolicyPage = ({ accountingEntities }: PrivacyPolicyPageProps) => {
  const t = useTranslations();
  const config = useConfig();

  const {
    PLATFORM_NAME,
    LEGAL_ENTITY_NAME,
    LEGAL_STREET_ADDRESS,
    LEGAL_ADDRESS_LINE2,
    LEGAL_POSTAL_CODE,
    LEGAL_CITY,
    LEGAL_COUNTRY,
    TEAM_EMAIL,
    SEMANTIC_URL,
  } = config || {};

  const platformName = PLATFORM_NAME || 'Closer';
  const legalEntityName = LEGAL_ENTITY_NAME || '';
  const legalStreetAddress = LEGAL_STREET_ADDRESS || '';
  const legalAddressLine2 = LEGAL_ADDRESS_LINE2 || '';
  const legalPostalCode = LEGAL_POSTAL_CODE || '';
  const legalCity = LEGAL_CITY || '';
  const legalCountry = LEGAL_COUNTRY || '';
  const teamEmail = TEAM_EMAIL || '';
  const websiteUrl = SEMANTIC_URL || '';
  const websiteDisplay = websiteUrl.replace(/^https?:\/\//, '');
  const hasLegalAddress = legalEntityName && legalStreetAddress && legalCity && legalCountry;
  const hasAccountingEntities = accountingEntities && accountingEntities.length > 0 && accountingEntities.some(e => e.legalName);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${t('privacy_policy_title')} — ${platformName}`,
    description: t('privacy_policy_meta', { platformName }),
    url: `${SITE_URL}/privacy-policy`,
    publisher: {
      '@type': 'Organization',
      name: legalEntityName,
      address: {
        '@type': 'PostalAddress',
        streetAddress: legalAddressLine2 ? `${legalStreetAddress}, ${legalAddressLine2}` : legalStreetAddress,
        addressLocality: legalCity,
        postalCode: legalPostalCode,
        addressCountry: legalCountry,
      },
    },
    dateModified: '2026-01-23',
  };

  const getProductsDescription = (products: string[]) => {
    if (!products || products.length === 0) return '';
    const translatedProducts = products.map(p => t(PRODUCT_TYPE_KEYS[p] || p));
    if (translatedProducts.length === 1) return translatedProducts[0];
    const last = translatedProducts.pop();
    return `${translatedProducts.join(', ')} ${t('privacy_policy_and')} ${last}`;
  };

  return (
    <>
      <Head>
        <title>{t('privacy_policy_title')} — {platformName}</title>
        <meta name="description" content={t('privacy_policy_meta', { platformName })} />
        <meta name="robots" content="noindex, follow" />
        
        <meta property="og:title" content={`${t('privacy_policy_title')} — ${platformName}`} />
        <meta property="og:description" content={t('privacy_policy_meta', { platformName })} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${SITE_URL}/privacy-policy`} />
        
        <link rel="canonical" href={`${SITE_URL}/privacy-policy`} />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>
      <main className="w-full flex flex-col items-center gap-8 pb-20">
        <section className="w-full max-w-[800px] px-4 py-12">
          <Heading level={1} className="text-4xl mb-4">
            {t('privacy_policy_title')}
          </Heading>
          <p className="text-foreground/60 mb-12">
            {t('privacy_policy_last_updated', { date: 'January 2026' })}
          </p>

          <div className="prose prose-lg max-w-none">
            <section className="mb-10">
              <Heading level={2} className="text-2xl mb-4">
                {t('privacy_policy_section_1_title')}
              </Heading>
              <p className="text-foreground/80 leading-relaxed mb-4">
                {t('privacy_policy_section_1_intro', { platformName, legalEntityName, legalCity, legalCountry })}
              </p>
              <p className="text-foreground/80 leading-relaxed">
                {t('privacy_policy_section_1_agreement', { platformName })}
              </p>
            </section>

            <section className="mb-10">
              <Heading level={2} className="text-2xl mb-4">
                {t('privacy_policy_section_2_title')}
              </Heading>
              
              <Heading level={3} className="text-xl mb-3 mt-6">
                {t('privacy_policy_section_2_1_title')}
              </Heading>
              <p className="text-foreground/80 leading-relaxed mb-4">
                {t('privacy_policy_section_2_1_intro')}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80 mb-4">
                <li>{t('privacy_policy_section_2_1_item_1')}</li>
                <li>{t('privacy_policy_section_2_1_item_2')}</li>
                <li>{t('privacy_policy_section_2_1_item_3')}</li>
                <li>{t('privacy_policy_section_2_1_item_4')}</li>
                <li>{t('privacy_policy_section_2_1_item_5')}</li>
                <li>{t('privacy_policy_section_2_1_item_6')}</li>
                <li>{t('privacy_policy_section_2_1_item_7')}</li>
              </ul>

              <Heading level={3} className="text-xl mb-3 mt-6">
                {t('privacy_policy_section_2_2_title')}
              </Heading>
              <p className="text-foreground/80 leading-relaxed mb-4">
                {t('privacy_policy_section_2_2_intro')}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80 mb-4">
                <li>{t('privacy_policy_section_2_2_item_1')}</li>
                <li>{t('privacy_policy_section_2_2_item_2')}</li>
                <li>{t('privacy_policy_section_2_2_item_3')}</li>
                <li>{t('privacy_policy_section_2_2_item_4')}</li>
                <li>{t('privacy_policy_section_2_2_item_5')}</li>
                <li>{t('privacy_policy_section_2_2_item_6')}</li>
              </ul>

              <Heading level={3} className="text-xl mb-3 mt-6">
                {t('privacy_policy_section_2_3_title')}
              </Heading>
              <p className="text-foreground/80 leading-relaxed mb-4">
                {t('privacy_policy_section_2_3_intro')}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                <li>{t('privacy_policy_section_2_3_item_1')}</li>
                <li>{t('privacy_policy_section_2_3_item_2')}</li>
                <li>{t('privacy_policy_section_2_3_item_3')}</li>
                <li>{t('privacy_policy_section_2_3_item_4')}</li>
              </ul>
            </section>

            <section className="mb-10">
              <Heading level={2} className="text-2xl mb-4">
                {t('privacy_policy_section_3_title')}
              </Heading>
              <p className="text-foreground/80 leading-relaxed mb-4">
                {t('privacy_policy_section_3_intro')}
              </p>
              
              <Heading level={3} className="text-xl mb-3 mt-6">
                {t('privacy_policy_section_3_1_title')}
              </Heading>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80 mb-4">
                <li>{t('privacy_policy_section_3_1_item_1')}</li>
                <li>{t('privacy_policy_section_3_1_item_2')}</li>
                <li>{t('privacy_policy_section_3_1_item_3')}</li>
                <li>{t('privacy_policy_section_3_1_item_4')}</li>
                <li>{t('privacy_policy_section_3_1_item_5')}</li>
              </ul>

              <Heading level={3} className="text-xl mb-3 mt-6">
                {t('privacy_policy_section_3_2_title')}
              </Heading>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80 mb-4">
                <li>{t('privacy_policy_section_3_2_item_1')}</li>
                <li>{t('privacy_policy_section_3_2_item_2')}</li>
                <li>{t('privacy_policy_section_3_2_item_3')}</li>
                <li>{t('privacy_policy_section_3_2_item_4')}</li>
              </ul>

              <Heading level={3} className="text-xl mb-3 mt-6">
                {t('privacy_policy_section_3_3_title')}
              </Heading>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                <li>{t('privacy_policy_section_3_3_item_1')}</li>
                <li>{t('privacy_policy_section_3_3_item_2')}</li>
                <li>{t('privacy_policy_section_3_3_item_3')}</li>
                <li>{t('privacy_policy_section_3_3_item_4')}</li>
              </ul>
            </section>

            <section className="mb-10">
              <Heading level={2} className="text-2xl mb-4">
                {t('privacy_policy_section_4_title')}
              </Heading>
              <p className="text-foreground/80 leading-relaxed mb-4">
                {t('privacy_policy_section_4_intro')}
              </p>

              <Heading level={3} className="text-xl mb-3 mt-6">
                {t('privacy_policy_section_4_1_title')}
              </Heading>
              <p className="text-foreground/80 leading-relaxed mb-4">
                {t('privacy_policy_section_4_1_text', { platformName })}
              </p>

              <Heading level={3} className="text-xl mb-3 mt-6">
                {t('privacy_policy_section_4_2_title')}
              </Heading>
              <p className="text-foreground/80 leading-relaxed mb-4">
                {t('privacy_policy_section_4_2_intro')}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80 mb-4">
                <li>{t('privacy_policy_section_4_2_item_1')}</li>
                <li>{t('privacy_policy_section_4_2_item_2')}</li>
                <li>{t('privacy_policy_section_4_2_item_3')}</li>
                <li>{t('privacy_policy_section_4_2_item_4')}</li>
                <li>{t('privacy_policy_section_4_2_item_5')}</li>
              </ul>

              <Heading level={3} className="text-xl mb-3 mt-6">
                {t('privacy_policy_section_4_3_title')}
              </Heading>
              <p className="text-foreground/80 leading-relaxed mb-4">
                {t('privacy_policy_section_4_3_text')}
              </p>

              <Heading level={3} className="text-xl mb-3 mt-6">
                {t('privacy_policy_section_4_4_title')}
              </Heading>
              <p className="text-foreground/80 leading-relaxed">
                {t('privacy_policy_section_4_4_text')}
              </p>
            </section>

            <section className="mb-10">
              <Heading level={2} className="text-2xl mb-4">
                {t('privacy_policy_section_5_title')}
              </Heading>
              <p className="text-foreground/80 leading-relaxed mb-4">
                {t('privacy_policy_section_5_intro')}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80 mb-4">
                <li>{t('privacy_policy_section_5_item_1')}</li>
                <li>{t('privacy_policy_section_5_item_2')}</li>
                <li>{t('privacy_policy_section_5_item_3')}</li>
                <li>{t('privacy_policy_section_5_item_4')}</li>
              </ul>
              <p className="text-foreground/80 leading-relaxed">
                {t('privacy_policy_section_5_text')}
              </p>
            </section>

            <section className="mb-10">
              <Heading level={2} className="text-2xl mb-4">
                {t('privacy_policy_section_6_title')}
              </Heading>
              <p className="text-foreground/80 leading-relaxed mb-4">
                {t('privacy_policy_section_6_intro')}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80 mb-4">
                <li><strong>{t('privacy_policy_section_6_access')}</strong> {t('privacy_policy_section_6_access_text')}</li>
                <li><strong>{t('privacy_policy_section_6_correction')}</strong> {t('privacy_policy_section_6_correction_text')}</li>
                <li><strong>{t('privacy_policy_section_6_deletion')}</strong> {t('privacy_policy_section_6_deletion_text')}</li>
                <li><strong>{t('privacy_policy_section_6_portability')}</strong> {t('privacy_policy_section_6_portability_text')}</li>
                <li><strong>{t('privacy_policy_section_6_objection')}</strong> {t('privacy_policy_section_6_objection_text')}</li>
                <li><strong>{t('privacy_policy_section_6_withdraw')}</strong> {t('privacy_policy_section_6_withdraw_text')}</li>
              </ul>
              <p className="text-foreground/80 leading-relaxed">
                {t('privacy_policy_section_6_text', { teamEmail })}
              </p>
            </section>

            <section className="mb-10">
              <Heading level={2} className="text-2xl mb-4">
                {t('privacy_policy_section_7_title')}
              </Heading>
              <p className="text-foreground/80 leading-relaxed mb-4">
                {t('privacy_policy_section_7_intro')}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/80 mb-4">
                <li>{t('privacy_policy_section_7_item_1')}</li>
                <li>{t('privacy_policy_section_7_item_2')}</li>
                <li>{t('privacy_policy_section_7_item_3')}</li>
                <li>{t('privacy_policy_section_7_item_4')}</li>
              </ul>
              <p className="text-foreground/80 leading-relaxed">
                {t('privacy_policy_section_7_text')}
              </p>
            </section>

            <section className="mb-10">
              <Heading level={2} className="text-2xl mb-4">
                {t('privacy_policy_section_8_title')}
              </Heading>
              <p className="text-foreground/80 leading-relaxed">
                {t('privacy_policy_section_8_text')}
              </p>
            </section>

            <section className="mb-10">
              <Heading level={2} className="text-2xl mb-4">
                {t('privacy_policy_section_9_title')}
              </Heading>
              <p className="text-foreground/80 leading-relaxed mb-4">
                {t('privacy_policy_section_9_text_1')}
              </p>
              <p className="text-foreground/80 leading-relaxed">
                {t('privacy_policy_section_9_text_2', { platformName })}
              </p>
            </section>

            <section className="mb-10">
              <Heading level={2} className="text-2xl mb-4">
                {t('privacy_policy_section_10_title')}
              </Heading>
              <p className="text-foreground/80 leading-relaxed">
                {t('privacy_policy_section_10_text')}
              </p>
            </section>

            <section className="mb-10">
              <Heading level={2} className="text-2xl mb-4">
                {t('privacy_policy_section_11_title')}
              </Heading>
              <p className="text-foreground/80 leading-relaxed">
                {t('privacy_policy_section_11_text')}
              </p>
            </section>

            <section className="mb-10">
              <Heading level={2} className="text-2xl mb-4">
                {t('privacy_policy_section_12_title')}
              </Heading>
              <p className="text-foreground/80 leading-relaxed mb-4">
                {t('privacy_policy_section_12_intro')}
              </p>

              {hasLegalAddress && (
                <div className="bg-foreground/5 rounded-lg p-6 mb-6">
                  <p className="text-foreground/80 mb-4">
                    <strong>{legalEntityName}</strong><br />
                    {legalStreetAddress}<br />
                    {legalAddressLine2 && <>{legalAddressLine2}<br /></>}
                    {legalPostalCode} {legalCity}, {legalCountry}
                  </p>
                  {teamEmail && (
                    <p className="text-foreground/80 mb-2">
                      <strong>{t('privacy_policy_section_12_email')}</strong>{' '}
                      <a href={`mailto:${teamEmail}`} className="text-accent hover:underline">
                        {teamEmail}
                      </a>
                    </p>
                  )}
                  {websiteUrl && (
                    <p className="text-foreground/80">
                      <strong>{t('privacy_policy_section_12_website')}</strong>{' '}
                      <a href={websiteUrl} className="text-accent hover:underline">
                        {websiteDisplay}
                      </a>
                    </p>
                  )}
                </div>
              )}

              {hasAccountingEntities && (
                <div className="bg-foreground/5 rounded-lg p-6 mb-6">
                  <p className="text-foreground/80 mb-4">
                    {t('privacy_policy_accounting_entities_intro', { platformName })}
                  </p>
                  <ul className="space-y-4">
                    {accountingEntities?.filter(e => e.legalName).map((entity, index) => (
                      <li key={index} className="text-foreground/80">
                        <strong>{entity.legalName}</strong>
                        {entity.taxNumber && <> ({t('privacy_policy_tax_number')}: {entity.taxNumber})</>}
                        {entity.address && <><br />{entity.address}</>}
                        {entity.products && entity.products.length > 0 && (
                          <><br /><span className="text-foreground/60">{t('privacy_policy_handles')}: {getProductsDescription(entity.products)}</span></>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-foreground/5 rounded-lg p-6">
                <p className="text-foreground/80 mb-4">
                  {t('privacy_policy_section_12_platform_info')}{' '}
                  <a href="https://oasa.earth" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                    OASA
                  </a>.
                </p>
                <p className="text-foreground/80">
                  <strong>{t('privacy_policy_section_12_technical_support')}</strong>{' '}
                  <a href="mailto:team@closer.earth" className="text-accent hover:underline">
                    team@closer.earth
                  </a>
                </p>
              </div>
            </section>

            <section className="border-t border-divider pt-8 mt-12">
              <p className="text-foreground/60 text-sm">
                {t('privacy_policy_footer', { platformName })}
              </p>
            </section>
          </div>
        </section>
      </main>
    </>
  );
};

export default PrivacyPolicyPage;

PrivacyPolicyPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [messages, accountingEntitiesRes] = await Promise.all([
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
      api.get('/config/accounting-entities').catch(() => null),
    ]);

    const accountingEntities = accountingEntitiesRes?.data?.results?.value?.elements || [];

    return { 
      messages,
      accountingEntities,
    };
  } catch (err) {
    return { error: err, messages: null, accountingEntities: [] };
  }
};
