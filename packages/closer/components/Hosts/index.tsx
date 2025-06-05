import Link from 'next/link';

import { useTranslations } from 'next-intl';

import { useConfig } from '../../hooks/useConfig';
import UserPreview from '../UserPreview';
import { Heading } from '../ui';

interface Props {
  hosts: any;
  email: string;
}

const Hosts = ({ hosts, email }: Props) => {
  const t = useTranslations();
  const { APP_NAME } = useConfig();

  // Move Agnes from Lios to the end of the space hosts list
  const sortedHosts =
    hosts &&
    hosts.sort((a: Record<string, any>, b: Record<string, any>) => {
      if (a.get('slug').includes('agnese')) return 1;
      if (b.get('slug').includes('agnese')) return -1;
      return 0;
    });

  return (
    <div className="mb-16">
      <div className="max-w-prose">
        <Heading level={2} className="text-2xl pb-2 my-8">
          {t('stay_meet_your_hosts')}
        </Heading>
        {APP_NAME !== 'tdf' && APP_NAME !== 'earthbound' && (
          <p className="mb-8">{t('stay_meet_your_hosts_description')}</p>
        )}
      </div>
      {hosts && hosts.count() > 0 && (
        <div className="grid md:grid-cols-3 gap-x-4 gap-y-4">
          {sortedHosts.map((host: any) => {
            return <UserPreview key={host.get('_id')} user={host} />;
          })}
        </div>
      )}
      <Link href={`mailto:${email}`} className="btn my-8">
        {t('stay_meet_your_hosts_link')}
      </Link>
    </div>
  );
};

export default Hosts;
