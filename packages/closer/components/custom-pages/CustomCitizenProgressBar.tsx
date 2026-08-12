import React, { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import { Heading } from '../ui';
import { usePlatform } from '../../contexts/platform';
import { resolveBlockText } from '../../utils/blockI18n';

const CITIZEN_TARGET = 300;

const citizenFilter = {
  roles: {
    $in: ['member', 'citizen'],
  },
};

interface Props {
  settings?: {
    citizenTarget?: number;
  };
  content?: {
    title?: string;
  };
}

const CustomCitizenProgressBar = ({ settings, content }: Props) => {
  const t = useTranslations();
  const { platform }: { platform?: any } = usePlatform() as {
    platform?: any;
  };
  const [citizenCurrent, setCitizenCurrent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const citizenTarget = settings?.citizenTarget || CITIZEN_TARGET;

  useEffect(() => {
    const fetchMemberCount = async () => {
      if (!platform?.user?.getCount) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const response = await platform.user.getCount({ where: citizenFilter });
        setCitizenCurrent(response?.results || 0);
      } catch (error) {
        console.error('Failed to fetch citizen count:', error);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchMemberCount();
  }, [platform]);

  const pick = (raw: string | undefined, fallback: string) =>
    raw != null && String(raw).trim() !== ''
      ? resolveBlockText(raw, t)
      : fallback;

  const title = pick(content?.title, t('citizenship_citizens_joined'));
  const progress = Math.min(
    100,
    Math.round((citizenCurrent / citizenTarget) * 100),
  );

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-xl mx-auto px-4 sm:px-6 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <Heading level={3} className="text-base font-normal text-gray-900">
            {title}
          </Heading>
          <span className="text-sm text-gray-600 whitespace-nowrap">
            {isLoading ? '...' : citizenCurrent} / {citizenTarget}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-accent transition-all duration-300 ease-in-out"
            style={{ width: `${isLoading ? 0 : progress}%` }}
          />
        </div>
      </div>
    </section>
  );
};

export default CustomCitizenProgressBar;
