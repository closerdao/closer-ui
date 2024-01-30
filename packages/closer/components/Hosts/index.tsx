import Link from 'next/link';

import React from 'react';

import { useConfig } from '../../hooks/useConfig';
import { __ } from '../../utils/helpers';
import UserPreview from '../UserPreview';
import { Heading } from '../ui';

interface Props {
  hosts: any;
  email: string;
}

const Hosts = ({ hosts, email }: Props) => {
  const { APP_NAME } = useConfig();
  return (
    <div className="mb-16">
      <div className="max-w-prose">
        <Heading level={2} className="text-2xl pb-2 mt-8">
          {__('stay_meet_your_hosts', APP_NAME)}
        </Heading>
        <p className="mb-8">
          {__('stay_meet_your_hosts_description', APP_NAME)}
        </p>
      </div>
      {hosts && hosts.count() > 0 && (
        <div className="grid md:grid-cols-3 gap-x-4 gap-y-4">
          {hosts.map((host: any) => {
            return <UserPreview key={host.get('_id')} user={host} />;
          })}
        </div>
      )}
      <Link href={`mailto:${email}`} className="btn my-4">
        {__('stay_meet_your_hosts_link')}
      </Link>
    </div>
  );
};

export default Hosts;
