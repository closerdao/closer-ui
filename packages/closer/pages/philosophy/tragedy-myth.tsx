import Head from 'next/head';
import Link from 'next/link';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import Heading from '../../components/ui/Heading';

import { loadLocaleData } from '../../utils/locale.helpers';

const SITE_URL = process.env.NEXT_PUBLIC_PLATFORM_URL || 'https://closer.earth';

const TragedyMythPage = () => {
  const t = useTranslations();

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'The Tragedy of the Commons Myth',
    description: 'Garrett Hardin\'s famous essay conflated unmanaged open access with governed commons. The historical record tells a different story.',
    author: {
      '@type': 'Organization',
      name: 'Closer',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Closer',
      url: SITE_URL,
    },
    mainEntityOfPage: `${SITE_URL}/philosophy/tragedy-myth`,
    keywords: 'tragedy of the commons, Garrett Hardin, commons myth, Elinor Ostrom, enclosure, commons history',
  };

  return (
    <>
      <Head>
        <title>The Tragedy of the Commons Myth | Closer Philosophy</title>
        <meta name="description" content="Garrett Hardin's famous essay conflated unmanaged open access with governed commons. The historical record of successful commons spanning centuries tells a different story." />
        <meta name="keywords" content="tragedy of the commons, Garrett Hardin, commons myth, Elinor Ostrom, enclosure, commons history, shared resources" />
        
        <meta property="og:title" content="The Tragedy of the Commons Myth" />
        <meta property="og:description" content="Garrett Hardin's famous essay conflated unmanaged open access with governed commons. The historical record tells a different story." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`${SITE_URL}/philosophy/tragedy-myth`} />
        <meta property="og:site_name" content="Closer" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="The Tragedy of the Commons Myth" />
        <meta name="twitter:description" content="Garrett Hardin's famous essay conflated unmanaged open access with governed commons." />
        
        <link rel="canonical" href={`${SITE_URL}/philosophy/tragedy-myth`} />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>
      <main className="w-full flex flex-col items-center gap-12 pb-20">
        <section className="flex flex-col items-center w-full max-w-[700px] gap-8 px-4">
          <Link
            href="/philosophy"
            className="self-start uppercase text-accent font-bold"
          >
            ◀️ {t('philosophy_back')}
          </Link>

          <Heading level={1} className="text-4xl text-center">
            {t('philosophy_tragedy_myth_title')}
          </Heading>

          <p className="text-lg text-center text-foreground/80">
            {t('philosophy_tragedy_myth_subtitle')}
          </p>
        </section>

        <section className="w-full max-w-[700px] px-4">
          <div className="rich-text">
            <Heading level={2} className="text-2xl mb-4">
              The Origin of a Misconception
            </Heading>
            <p className="text-lg leading-relaxed mb-6">
              Garrett Hardin&apos;s 1968 Science paper &ldquo;The Tragedy of the
              Commons&rdquo; became one of the most cited articles in
              environmental discourse. Yet its actual arguments are widely
              misunderstood. Hardin&apos;s primary focus was population control,
              not resource management. His opening thesis declared:
              &ldquo;The population problem has no technical solution; it
              requires a fundamental extension in morality.&rdquo;
            </p>

            <div className="bg-accent/10 border-l-4 border-accent p-6 my-8">
              <p className="text-lg italic">
                &ldquo;Picture a pasture open to all&rdquo;—Hardin described an
                open-access regime with no rules, boundaries, or governance. His
                herders added cattle without limit because nothing constrained
                them. But this scenario bears no resemblance to actual
                historical commons.
              </p>
            </div>

            <Heading level={2} className="text-2xl mb-4 mt-10">
              The Fundamental Error
            </Heading>
            <p className="text-lg leading-relaxed mb-6">
              Academic critics identified Hardin&apos;s conflation of
              &ldquo;open access&rdquo; with &ldquo;common property&rdquo; as his
              fundamental error. As economist Susan Jane Buck Cox documented in
              her 1985 study:
            </p>

            <div className="bg-complimentary/10 border-l-4 border-complimentary p-6 my-8">
              <p className="text-lg italic">
                &ldquo;What existed in fact was not a &apos;tragedy of the
                commons&apos; but rather a triumph: that for hundreds of
                years—and perhaps thousands—land was managed successfully by
                communities.&rdquo;
              </p>
              <p className="text-sm mt-2 text-foreground/60">
                — Susan Jane Buck Cox, &ldquo;No Tragedy on the Commons&rdquo;
                (1985)
              </p>
            </div>

            <p className="text-lg leading-relaxed mb-6">
              English commons were &ldquo;not available to the general public
              but rather only to certain individuals who inherited or were
              granted the right to use it.&rdquo; Communities established
              stints—numerical limits on livestock each commoner could
              graze—enforced through manorial courts.
            </p>

            <Heading level={2} className="text-2xl mb-4 mt-10">
              Hardin&apos;s Own Correction
            </Heading>
            <p className="text-lg leading-relaxed mb-6">
              Hardin himself acknowledged the error. In 1994, he wrote:
            </p>

            <div className="bg-accent/10 border-l-4 border-accent p-6 my-8">
              <p className="text-lg italic">
                &ldquo;The title of my 1968 paper should have been &apos;The
                Tragedy of the Unmanaged Commons.&apos;&rdquo;
              </p>
              <p className="text-sm mt-2 text-foreground/60">
                — Garrett Hardin, 1994
              </p>
            </div>

            <p className="text-lg leading-relaxed mb-6">
              This revision received far less attention than the original essay,
              which had already been appropriated to justify privatization
              policies by the World Bank, IMF, and development agencies
              worldwide.
            </p>

            <Heading level={2} className="text-2xl mb-4 mt-10">
              The Historical Reality
            </Heading>
            <p className="text-lg leading-relaxed mb-6">
              The historical record tells a different story entirely:
            </p>

            <ul className="space-y-4 mb-8">
              <li className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                <span>
                  <strong>Swiss alpine commons</strong> have operated
                  continuously for over 700 years
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                <span>
                  <strong>The Valencia Water Tribunal</strong> has governed
                  irrigation since approximately 960 CE—over 1,000 years
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                <span>
                  <strong>Japanese iriai forest commons</strong> numbered 59,209
                  community-based organizations managing customary forests as of
                  1990
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                <span>
                  <strong>The Balinese subak system</strong> has coordinated
                  rice cultivation through water temples since the 9th century
                  CE
                </span>
              </li>
            </ul>

            <Heading level={2} className="text-2xl mb-4 mt-10">
              Destruction, Not Failure
            </Heading>
            <p className="text-lg leading-relaxed mb-6">
              What history reveals is not commons failure but commons
              destruction. Between 1604 and 1914, Parliament passed over 5,200
              enclosure acts covering approximately 6.8-7 million acres—21% of
              England&apos;s total land area. The process was controlled by the
              landowning class, with commoners actively resisting.
            </p>

            <p className="text-lg leading-relaxed mb-6">
              Major uprisings included Kett&apos;s Rebellion (1549), the Midland
              Revolt (1607), and the Swing Riots (1830). As E.P. Thompson wrote:
              &ldquo;Enclosure was a plain enough case of class robbery, played
              according to fair rules of property and law laid down by a
              parliament of property-owners and lawyers.&rdquo;
            </p>

            <div className="bg-foreground/5 rounded-lg p-6 mt-10">
              <Heading level={3} className="text-xl mb-3">
                Why This Matters Today
              </Heading>
              <p className="text-lg leading-relaxed">
                The &ldquo;tragedy&rdquo; metaphor continues justifying
                privatization policies that the historical and empirical record
                does not support. Understanding what actually happened to
                commons—and why many continue thriving—provides essential
                evidence for how we govern shared resources in the digital age,
                from data to AI systems to land.
              </p>
            </div>
          </div>
        </section>

        <section className="w-full max-w-[700px] px-4 pt-8 border-t border-divider">
          <Heading level={2} className="text-2xl mb-6">
            {t('philosophy_explore_more')}
          </Heading>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/philosophy/commons-governance"
              className="btn-primary px-6 py-3"
            >
              {t('philosophy_commons_governance_title')}
            </Link>
            <Link
              href="/philosophy/commons-exclosure"
              className="btn-primary px-6 py-3"
            >
              {t('philosophy_commons_exclosure_title')}
            </Link>
          </div>
        </section>
      </main>
    </>
  );
};

export default TragedyMythPage;

TragedyMythPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const messages = await loadLocaleData(
      context?.locale,
      process.env.NEXT_PUBLIC_APP_NAME,
    );
    return { messages };
  } catch (err) {
    return { error: err, messages: null };
  }
};
