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

  // Move Agnes from Lios to the end of the space hosts list
  const sortedHosts = hosts && hosts.sort((a: Record<string, any>, b: Record<string, any>) => {
    if (a.get('slug').includes('agnese')) return 1;
    if (b.get('slug').includes('agnese')) return -1;
    return 0;
  });

  console.log('sortedHosts=',sortedHosts);
  const { APP_NAME, VISITORS_GUIDE } = useConfig();
  return (
    <div className="mb-16">
      <div className="max-w-prose">
        <Heading level={2} className="text-2xl pb-2 my-8">
          {__('stay_meet_your_hosts', APP_NAME)}
        </Heading>
        {!__('stay_meet_your_hosts_description', APP_NAME).includes(
          'missing',
        ) && (
          <p className="mb-8">
            {__('stay_meet_your_hosts_description', APP_NAME)}
          </p>
        )}
      </div>
      {hosts && hosts.count() > 0 && (
        <div className="grid md:grid-cols-3 gap-x-4 gap-y-4">
          {(sortedHosts).map((host: any) => {
            return <UserPreview key={host.get('_id')} user={host} />;
          })}
        </div>
      )}
      <Link href={`mailto:${email}`} className="btn my-8">
        {__('stay_meet_your_hosts_link')}
      </Link>
    </div>
  );
};

export default Hosts;
