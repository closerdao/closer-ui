import dayjs from 'dayjs';

export const getRedirectUrl = ({
  back,
  source,
  start,
  end,
  adults,
  useTokens,
  eventId,
  volunteerId,
  hasSubscription,
}: {
  back: string | string[] | undefined;
  source: string | string[] | undefined;
  start: string | string[] | undefined;
  end: string | string[] | undefined;
  adults: string | string[] | undefined;
  useTokens: string | string[] | undefined;
  eventId: string | string[] | undefined;
  volunteerId: string | string[] | undefined;
  hasSubscription: boolean;
}) => {
  const dateFormat = 'YYYY-MM-DD';
  if (!source && !back) {
    return '/';
  }
  if (!source && back && start && end && adults) {
    return `${back}?start=${dayjs(start as string).format(
      dateFormat,
    )}&end=${dayjs(end as string).format(
      dateFormat,
    )}&adults=${adults}&useTokens=${useTokens}${
      volunteerId ? `&volunteerId=${volunteerId}` : ''
    }${eventId ? `&eventId=${eventId}` : ''}`;
  }
  if (!source && back) {
    return `${back}`;
  }

  if (hasSubscription && source) {
    return source as string;
  }
  if (!hasSubscription && source !== 'undefined') {
    const redirectUrl = back
      ? `${decodeURIComponent(back as string).replace('back=', '')}&source=${(
          source as string
        ).replace('&source=', '')}`
      : '/';
    return redirectUrl;
  }
  return '/';
};
