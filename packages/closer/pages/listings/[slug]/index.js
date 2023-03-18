import Head from 'next/head';
import Link from 'next/link';

import React from 'react';
import Linkify from 'react-linkify';

import PostList from '../../../components/PostList';
import Slider from '../../../components/Slider';

import PageNotFound from '../../404';
import api, { cdn } from '../../../utils/api';
import { __ } from '../../../utils/helpers';

const Listing = ({ listing, error }) => {
  const photo = listing && listing.photos && listing.photos[0];

  if (!listing) {
    return <PageNotFound />;
  }

  return (
    <>
      <Head>
        <title>{listing.name}</title>
        <meta name="description" content={listing.description} />
        <meta property="og:type" content="listing" />
        {photo && (
          <meta
            key="og:image"
            property="og:image"
            content={`${cdn}${photo}-place-lg.jpg`}
          />
        )}
        {photo && (
          <meta
            key="twitter:image"
            name="twitter:image"
            content={`${cdn}${photo}-place-lg.jpg`}
          />
        )}
      </Head>
      <main className="main-content">
        <div>
          {listing.photos && listing.photos.length > 0 && (
            <Slider
              slides={listing.photos.map((id) => ({
                image: `${cdn}${id}-max-lg.jpg`,
              }))}
            />
          )}
          {/* <div className="relative bg-gray-200 md:h-80 mb-4">
            <div className="justify-self-center absolute top-0 left-0 right-0 flex justify-center items-center h-full">
              { photo && <img
                className="object-cover md:h-full md:w-full"
                src={ `${cdn}${photo}-max-lg.jpg` }
                alt={ listing.name }
              /> }
            </div>
          </div> */}
          <div>
            <h1>{listing.name}</h1>
            {error && <div className="validation-error">{error}</div>}
            <section>
              <p>
                <Linkify
                  componentDecorator={(decoratedHref, decoratedText, key) => (
                    <a
                      target="_blank"
                      rel="nofollow noreferrer"
                      href={decoratedHref}
                      key={key}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {decoratedText}
                    </a>
                  )}
                >
                  {listing.description}
                </Linkify>
              </p>
            </section>
            <section className="my-4">
              <Link
                href={`/listings/book?listing=${listing.slug}`}
                className="text-lg btn-primary"
              >
                {__('listings_slug_link')}
              </Link>
            </section>
            <section>
              <PostList
                visibility="public"
                parentId={listing._id}
                parentType="listing"
                channel={listing.category}
              />
            </section>
          </div>
        </div>
      </main>
    </>
  );
};
Listing.getInitialProps = async ({ query }) => {
  try {
    const {
      data: { results: listing },
    } = await api.get(`/listing/${query.slug}`);
    return { listing };
  } catch (err) {
    console.log('Error', err.message);

    return {
      error: err.message,
    };
  }
};

export default Listing;
