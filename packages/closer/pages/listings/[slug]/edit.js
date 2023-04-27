import Head from 'next/head';
import { useRouter } from 'next/router';

import React from 'react';

import EditModel from '../../../components/EditModel';
import Heading from '../../../components/ui/Heading';

import models from '../../../models';
import api from '../../../utils/api';
import { __ } from '../../../utils/helpers';

const EditListing = ({ listing }) => {
  const router = useRouter();
  const onUpdate = async (name, value, option, actionType) => {
    if (actionType === 'ADD' && name === 'visibleBy' && option._id) {
      await api.post(`/moderator/listing/${listing._id}/add`, option);
    }
  };
  if (!listing) {
    return <Heading>{__('listings_slug_edit_error')}</Heading>;
  }
  console.log('listing', listing.name);
  return (
    <>
      <Head>
        <title>
          {__('listings_slug_edit_title')} {listing.name}
        </title>
      </Head>
      <div className="w-full">
        <Heading level={2} className="mb-2">
          Edit Listing <i>{listing.name}</i>
        </Heading>
        <EditModel
          id={listing._id}
          endpoint={'/listing'}
          fields={models.listing}
          buttonText="Save"
          onSave={(listing) => router.push(`/listings/${listing.slug}`)}
          onUpdate={(name, value, option, actionType) =>
            onUpdate(name, value, option, actionType)
          }
          allowDelete
          deleteButton="Delete Listing"
          onDelete={() => router.push('/')}
        />
      </div>
    </>
  );
};

EditListing.getInitialProps = async ({ query }) => {
  try {
    if (!query.slug) {
      throw new Error('No listing');
    }
    const {
      data: { results: listing },
    } = await api.get(`/listing/${query.slug}`);

    return { listing };
  } catch (err) {
    return {
      error: err.message,
    };
  }
};

export default EditListing;
