import Head from 'next/head';
import { useRouter } from 'next/router';

import React from 'react';

import EditModel from '../../components/EditModel';
import Heading from '../../components/ui/Heading';

import models from '../../models';
import { __ } from '../../utils/helpers';

const CreateListing = () => {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>{__('listings_create_title')}</title>
      </Head>
      <div className="main-content intro w-full">
        <Heading level={2} className="mb-2">
          {__('listings_create_title')}
        </Heading>
        <EditModel
          endpoint={'/listing'}
          fields={models.listing}
          buttonText="Create Listing"
          onSave={(listing) => router.push(`/listings/${listing.slug}`)}
        />
      </div>
    </>
  );
};

export default CreateListing;
