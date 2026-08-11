import { useRouter } from 'next/router';

import { NextPageContext } from 'next';

import type { ComponentType } from 'react';

import PageNotFound from '../not-found';
import LegacyCitizenshipPage from './citizenship';
import LegacyEventsPage from './events';
import LegacyFundraiserPage from './fundraiser';
import LegacyStayPage from './stay';
import LegacySubscriptionsPage from './subscriptions';
import LegacyTokenPage from './token';
import LegacyVolunteerPage from './volunteer';

type LegacyPageComponent = ComponentType<any> & {
  getInitialProps?: (ctx: NextPageContext) => any;
};

const LEGACY_PAGES: Record<string, LegacyPageComponent> = {
  volunteer: LegacyVolunteerPage,
  stay: LegacyStayPage,
  token: LegacyTokenPage,
  subscriptions: LegacySubscriptionsPage,
  events: LegacyEventsPage,
  citizenship: LegacyCitizenshipPage,
  fundraiser: LegacyFundraiserPage,
};

const LegacyStandardPage = (props: Record<string, unknown>) => {
  const router = useRouter();
  const raw = router.query.page;
  const pageKey = Array.isArray(raw) ? raw[0] : raw;
  const Component = pageKey ? LEGACY_PAGES[String(pageKey)] : undefined;

  if (!Component) {
    return <PageNotFound />;
  }

  return <Component {...props} />;
};

LegacyStandardPage.getInitialProps = async (context: NextPageContext) => {
  const raw = context.query.page;
  const pageKey = Array.isArray(raw) ? raw[0] : raw;
  const Component = pageKey ? LEGACY_PAGES[String(pageKey)] : undefined;

  if (!Component) {
    if (context.res) context.res.statusCode = 404;
    return {};
  }

  if (typeof Component.getInitialProps === 'function') {
    return Component.getInitialProps(context);
  }

  return {};
};

export default LegacyStandardPage;
