import { NextPageContext } from 'next';

import {
  getInvestPageInitialProps,
  InvestPage as CloserInvestPage,
  type InvestPageProps,
} from 'closer';

const TDF_INVEST_OPTIONS = {
  canonicalUrl: 'https://www.traditionaldreamfactory.com/invest',
  shareUrl: 'https://www.traditionaldreamfactory.com/invest',
  ogImageUrl: 'https://cdn.oasa.co/tdf/tdf-invest-og.jpg',
  dataroomHref: '/dataroom',
  scheduleCallHref: '#webinar',
  loanPackageHref: '/dataroom',
};

function InvestPage(props: InvestPageProps) {
  return <CloserInvestPage {...props} />;
}

InvestPage.getInitialProps = async (context: NextPageContext) => {
  const base = await getInvestPageInitialProps(context);
  return {
    ...base,
    investPageOptions: TDF_INVEST_OPTIONS,
  };
};

export default InvestPage;
