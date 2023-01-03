import Head from 'next/head';

import React from 'react';

import EditModel from '../../components/EditModel';
import Layout from '../../components/Layout';

import { useAuth } from '../../contexts/auth';
import models from '../../models';
import { __ } from '../../utils/helpers';

const Settings = () => {
  const { user } = useAuth();

  return (
    <Layout protect>
      <Head>
        <title>{__('settings_title')}</title>
      </Head>
      <div className="main-content">
        {user && (
          <EditModel
            id={user._id}
            initialData={user}
            endpoint={'/user'}
            fields={models.user}
            buttonText="Save"
          />
        )}
      </div>
    </Layout>
  );
};

export default Settings;
