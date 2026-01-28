import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

import { Heading } from 'closer';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { ArrowRight } from 'lucide-react';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

interface Artist {
  slug: string;
  name: string;
  country: string;
  role: string;
  image: string;
  shortBio: string;
}

const artists: Artist[] = [
  {
    slug: 'braulio-amado',
    name: 'Bráulio Amado',
    country: 'PT',
    role: 'Graphic Designer & Illustrator',
    image: '/images/logo.png',
    shortBio: 'artist_braulio_short_bio',
  },
  {
    slug: 'katya-bezuma',
    name: 'Katya Bezuma',
    country: 'USA',
    role: 'Visual Artist',
    image: '/images/artists/katya-bezuma.jpg',
    shortBio: 'artist_katya_short_bio',
  },
  {
    slug: 'marcos-moccero',
    name: 'Marcos Moccero',
    country: 'AR',
    role: 'Multidisciplinary Artist',
    image: '/images/artists/marcos-moccero.jpg',
    shortBio: 'artist_marcos_short_bio',
  },
  {
    slug: 'ron-razon',
    name: 'Ron Razon',
    country: 'ISR',
    role: 'Multidisciplinary Artist',
    image: '/images/artists/ron-razon.jpg',
    shortBio: 'artist_ron_short_bio',
  },
  {
    slug: 'ivan-zema',
    name: 'Ivan Zema',
    country: 'UA',
    role: 'Sculptor & Land Artist',
    image: '/images/landing/art-faire.png',
    shortBio: 'artist_ivan_short_bio',
  },
];

const ArtistsPage = () => {
  const t = useTranslations();

  return (
    <>
      <Head>
        <title>{t('artists_page_title')}</title>
        <meta name="description" content={t('artists_page_description')} />
        <link
          rel="canonical"
          href="https://www.traditionaldreamfactory.com/artists"
          key="canonical"
        />
      </Head>

      <main>
        <section className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-24 md:py-36">
            <div className="max-w-4xl mx-auto text-center">
              <Heading
                className="mb-6 text-5xl md:text-6xl lg:text-7xl font-normal text-gray-900 tracking-tight leading-tight"
                display
                level={1}
              >
                {t('artists_hero_title')}
              </Heading>
              <p className="text-xl md:text-2xl text-gray-700 leading-relaxed max-w-3xl mx-auto font-light">
                {t('artists_hero_subtitle')}
              </p>
            </div>
          </div>
        </section>

        <section className="bg-gray-50 py-16 md:py-20 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {artists.map((artist) => (
                <Link
                  key={artist.slug}
                  href={`/artists/${artist.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300"
                >
                  <div className="relative h-64 overflow-hidden">
                    <Image
                      src={artist.image}
                      alt={artist.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <span className="inline-block bg-white/90 text-gray-800 text-xs px-2 py-1 rounded-full font-medium mb-2">
                        {artist.country}
                      </span>
                      <h3 className="text-2xl font-serif text-white">
                        {artist.name}
                      </h3>
                      <p className="text-white/80 text-sm">{artist.role}</p>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-600 line-clamp-2">
                      {t(artist.shortBio)}
                    </p>
                    <div className="mt-4 flex items-center text-accent-dark font-medium group-hover:gap-3 gap-2 transition-all">
                      {t('artists_view_profile')}
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center">
              <Heading level={2} className="text-3xl md:text-4xl font-normal text-gray-900 tracking-tight mb-6">
                {t('artists_residency_title')}
              </Heading>
              <p className="text-xl text-gray-700 mb-10 leading-relaxed font-light">
                {t('artists_residency_description')}
              </p>
              <Link
                href="/volunteer"
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                {t('artists_apply_residency')}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

ArtistsPage.getInitialProps = async (context: NextPageContext) => {
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

export default ArtistsPage;
