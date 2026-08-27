import { useRouter } from 'next/router';

import { useEffect } from 'react';

import { NextPageContext } from 'next';

// The member directory moved to /community (nearby members, who's on site,
// citizens and friends). This page only survives as a redirect so old links
// keep working; individual profiles stay at /members/[slug].
const MembersPage = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace('/community');
  }, [router]);

  return null;
};

MembersPage.getInitialProps = async (context: NextPageContext) => {
  if (context.res) {
    context.res.writeHead(301, { Location: '/community' });
    context.res.end();
  }
  return {};
};

export default MembersPage;
