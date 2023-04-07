import Head from 'next/head';
import Link from 'next/link';

import React, { useEffect } from 'react';

import { useAuth } from 'closer';
// import { NextPage } from 'next';
import { event } from 'nextjs-google-analytics';

import { usePlatform } from 'closer';

// interface Resource {
//   title: string;
//   slug: string;
//   url: string;
//   _id: string;
//   created: Date;
//   id: number;
// };
// : NextPage
const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const { platform } = usePlatform();

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        platform.resource.get()
      ]);
    };

    loadData();
  }, [platform]);

  return (
    <div>
      <Head>
        <title>
          Traditional Dream Factory | Regenerative Playground in Alentejo, Portugal
        </title>
      </Head>
      <section className="text-right -ml-6 -mr-6 pt-20 pb-12 -mt-6 min-h-100 p-6 bg-cover bg-[url('/images/landing/sheep-min.png')]">
        <div className="max-w-6xl mx-auto">
          <h1
            className="md:mt-20 mb-6 md:mb-12 text-3xl md:text-8xl text-white ml-8"
            data-testid="page-title"
          >
            A life of soils and souls regenerating together.
          </h1>
          <p
            className="md:mt-20 mb-6 md:mb-12 text-xs md:text-4xl text-white ml-8"
          >
            Traditional Dream Factory is the first web3-powered
            regenerative village, on a mission to re-root a better way of living.
          </p>

          {!isAuthenticated && (
            <>
              <Link
                href="/signup"
                type="submit"
                onClick={() =>
                  event('click', { category: 'HomePage', label: 'Apply' })
                }
                className="btn-primary"
              >
                JOIN THE DREAM
              </Link>
            </>
          )}
        </div>
      </section>
      <section className="max-w-6xl mx-auto">
        <h3 className="text-center py-12 px-4">
          A prototype for a future of beautiful,
          connected  regenerative living
        </h3>
        <ul className="flex flex-wrap text-center divide-x">
          { platform.resource.find() && platform.resource.find().map((resource) => (
            <li
              key={ resource.slug }
              className="w-1/2 md:w-1/3 lg:w-1/4 mb-4 p-3"
            >
              <h4 className="mb-4">{resource.get('title')}</h4>
              <p className="mb-4 text-xs">{resource.get('content')}</p>
              <Link
                href={resource.get('url')}
                className="btn-primary"
              >
                {resource.get('ctaText')}
              </Link>
            </li>
          )) }
        </ul>
      </section>
    </div>
  );
};

export default HomePage;
