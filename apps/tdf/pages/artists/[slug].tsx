import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { Heading } from 'closer';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { ArrowLeft, ExternalLink, Instagram, Youtube } from 'lucide-react';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

interface ArtistWork {
  titleKey: string;
  descriptionKey: string;
}

interface ArtistData {
  slug: string;
  name: string;
  country: string;
  roleKey: string;
  bioKey: string;
  image: string;
  workImage?: string;
  works: ArtistWork[];
  testimonialKey?: string;
  contributionKey: string;
  instagram?: string;
  website?: string;
  youtube?: string;
  gradientFrom: string;
  gradientTo: string;
}

const artistsData: Record<string, ArtistData> = {
  'braulio-amado': {
    slug: 'braulio-amado',
    name: 'Bráulio Amado',
    country: 'Portugal',
    roleKey: 'artist_braulio_role',
    bioKey: 'artist_braulio_bio',
    image: '/images/logo.png',
    works: [
      { titleKey: 'artist_braulio_work_1_title', descriptionKey: 'artist_braulio_work_1_desc' },
    ],
    contributionKey: 'artist_braulio_contribution',
    instagram: 'https://www.instagram.com/braulioamado/',
    website: 'https://badbadbadbad.com/',
    gradientFrom: 'from-pink-100',
    gradientTo: 'to-blue-100',
  },
  'katya-bezuma': {
    slug: 'katya-bezuma',
    name: 'Katya Bezuma',
    country: 'USA',
    roleKey: 'artist_katya_role',
    bioKey: 'artist_katya_bio',
    image: '/images/artists/katya-bezuma.jpg',
    workImage: '/images/artists/katya-bezuma-work.jpg',
    works: [
      { titleKey: 'artist_katya_work_1_title', descriptionKey: 'artist_katya_work_1_desc' },
    ],
    testimonialKey: 'artist_katya_testimonial',
    contributionKey: 'artist_katya_contribution',
    gradientFrom: 'from-amber-100',
    gradientTo: 'to-rose-100',
  },
  'marcos-moccero': {
    slug: 'marcos-moccero',
    name: 'Marcos Moccero',
    country: 'Argentina',
    roleKey: 'artist_marcos_role',
    bioKey: 'artist_marcos_bio',
    image: '/images/artists/marcos-moccero.jpg',
    workImage: '/images/artists/marcos-moccero-work.jpg',
    works: [
      { titleKey: 'artist_marcos_work_1_title', descriptionKey: 'artist_marcos_work_1_desc' },
    ],
    testimonialKey: 'artist_marcos_testimonial',
    contributionKey: 'artist_marcos_contribution',
    youtube: 'https://youtu.be/B43ps6ESvTI?si=fdYzJ4fbl2VglWAJ',
    gradientFrom: 'from-emerald-100',
    gradientTo: 'to-teal-100',
  },
  'ron-razon': {
    slug: 'ron-razon',
    name: 'Ron Razon',
    country: 'Israel',
    roleKey: 'artist_ron_role',
    bioKey: 'artist_ron_bio',
    image: '/images/artists/ron-razon.jpg',
    workImage: '/images/artists/ron-razon-work.jpg',
    works: [
      { titleKey: 'artist_ron_work_1_title', descriptionKey: 'artist_ron_work_1_desc' },
      { titleKey: 'artist_ron_work_2_title', descriptionKey: 'artist_ron_work_2_desc' },
    ],
    testimonialKey: 'artist_ron_testimonial',
    contributionKey: 'artist_ron_contribution',
    instagram: 'https://www.instagram.com/ron.de.razon/',
    gradientFrom: 'from-violet-100',
    gradientTo: 'to-indigo-100',
  },
  'ivan-zema': {
    slug: 'ivan-zema',
    name: 'Ivan Zema',
    country: 'Ukraine',
    roleKey: 'artist_ivan_role',
    bioKey: 'artist_ivan_bio',
    image: '/images/landing/art-faire.png',
    workImage: '/images/landing/art-faire.png',
    works: [
      { titleKey: 'artist_ivan_work_1_title', descriptionKey: 'artist_ivan_work_1_desc' },
    ],
    contributionKey: 'artist_ivan_contribution',
    instagram: 'https://www.instagram.com/ivanzema/',
    gradientFrom: 'from-amber-100',
    gradientTo: 'to-orange-100',
  },
};

const ArtistPage = () => {
  const t = useTranslations();
  const router = useRouter();
  const { slug } = router.query;

  const artist = slug ? artistsData[slug as string] : null;

  if (!artist) {
    return (
      <main className="py-24">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <Heading level={1} className="text-2xl mb-4">
            {t('artists_not_found')}
          </Heading>
          <Link href="/artists" className="text-accent-dark hover:underline">
            {t('artists_back_to_list')}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>{`${artist.name} | ${t('artists_page_title_suffix')}`}</title>
        <meta name="description" content={t(artist.bioKey)} />
        <link
          rel="canonical"
          href={`https://www.traditionaldreamfactory.com/artists/${artist.slug}`}
          key="canonical"
        />
      </Head>

      <main>
        <section className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <Link
              href="/artists"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('artists_back_to_list')}
            </Link>
          </div>
        </section>

        <section className={`bg-gradient-to-br ${artist.gradientFrom} via-purple-50 ${artist.gradientTo}`}>
          <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="relative w-32 h-32 md:w-48 md:h-48 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg">
                  <Image
                    src={artist.image}
                    alt={artist.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <span className="inline-block bg-white/80 text-gray-700 text-sm px-3 py-1 rounded-full font-medium mb-4">
                    {artist.country}
                  </span>
                  <Heading
                    className="text-4xl md:text-5xl lg:text-6xl font-normal text-gray-900 tracking-tight leading-tight"
                    display
                    level={1}
                  >
                    {artist.name}
                  </Heading>
                  <p className="text-xl md:text-2xl text-gray-700 mt-3 font-light">
                    {t(artist.roleKey)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-16 md:py-20 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <p className="text-xl text-gray-700 leading-relaxed font-light">
                {t(artist.bioKey)}
              </p>
            </div>
          </div>
        </section>

        {artist.works.length > 0 && (
          <section className="bg-gray-50 py-16 md:py-20 border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-6">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-normal text-gray-900 tracking-tight mb-8">
                  {t('artists_works_at_tdf')}
                </h2>
                {artist.workImage && (
                  <div className="relative h-64 md:h-96 rounded-lg overflow-hidden mb-8">
                    <Image
                      src={artist.workImage}
                      alt={`${artist.name} work`}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="space-y-4">
                  {artist.works.map((work, index) => (
                    <div key={index} className="bg-white rounded-lg p-6 border border-gray-200">
                      <h3 className="font-medium text-gray-900 text-lg">
                        {t(work.titleKey)}
                      </h3>
                      <p className="text-gray-600 mt-2 leading-relaxed">
                        {t(work.descriptionKey)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {artist.testimonialKey && (
          <section className="bg-white py-16 md:py-20 border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-6">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-normal text-gray-900 tracking-tight mb-8">
                  {t('artists_testimonial')}
                </h2>
                <blockquote className="bg-gray-50 rounded-lg p-8 text-xl text-gray-700 italic border-l-4 border-accent leading-relaxed">
                  &ldquo;{t(artist.testimonialKey)}&rdquo;
                </blockquote>
              </div>
            </div>
          </section>
        )}

        {(artist.instagram || artist.website || artist.youtube) && (
          <section className="bg-gray-50 py-16 md:py-20 border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-6">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-normal text-gray-900 tracking-tight mb-8">
                  {t('artists_connect')}
                </h2>
                <div className="flex flex-wrap gap-4">
                  {artist.website && (
                    <a
                      href={artist.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {t('artists_view_portfolio')}
                    </a>
                  )}
                  {artist.instagram && (
                    <a
                      href={artist.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-colors"
                    >
                      <Instagram className="w-4 h-4" />
                      Instagram
                    </a>
                  )}
                  {artist.youtube && (
                    <a
                      href={artist.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
                    >
                      <Youtube className="w-4 h-4" />
                      {t('artists_watch_documentary')}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="bg-accent/20 py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center">
              <p className="text-xl text-gray-700 italic leading-relaxed">
                {t(artist.contributionKey)}
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

ArtistPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const messages = await loadLocaleData(
      context?.locale,
      process.env.NEXT_PUBLIC_APP_NAME,
    );
    return {
      messages,
    };
  } catch (err: unknown) {
    return {
      messages: null,
    };
  }
};

export default ArtistPage;
