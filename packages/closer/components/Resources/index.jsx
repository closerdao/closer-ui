import Link from 'next/link';

import { useEffect, useState } from 'react';

import { usePlatform } from '../../contexts/platform';
import { Heading } from '../ui';

const Resources = () => {
  const { platform } = usePlatform();
  const RESOURCES_KEY = { sort_by: 'created' };

  const [loadedResources, setLoadedResources] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoadedResources(true);
      await platform.resource.get(RESOURCES_KEY);
    };

    if (!loadedResources) {
      loadData();
    }
  }, [platform]);

  return (
    <ul className="flex flex-wrap text-center divide-x-0 sm:divide sm:divide-x justify-center">
      {platform.resource.find(RESOURCES_KEY) &&
        platform.resource.find(RESOURCES_KEY).map((resource) => (
          <li
            key={resource.get('_id')}
            className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 mb-4 p-4 flex flex-col justify-between"
          >
            <Heading display level={4} className="mb-4">
              {resource.get('title')}
            </Heading>
            <p className="mb-4 text-sm">{resource.get('content')}</p>
            <Link href={resource.get('url')} className="btn-primary">
              {resource.get('ctaText')}
            </Link>
          </li>
        ))}
    </ul>
  );
};

export default Resources;
